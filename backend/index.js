// index.js
require("dotenv").config();

const admin = require("firebase-admin");
const serviceAccount = require("./ServiceAccountKey.json");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Import Socket.IO and configure CORS
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000", // Allow your frontend's origin
    methods: ["GET", "POST"],
  },
});

const cors = require("cors");

const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

// Use CORS middleware for Express routes
app.use(cors());

const PORT = process.env.PORT || 5050;

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

let pendingQuestions = [];
let approvedQuestions = [];

io.on("connection", async (socket) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.warn(`Connection attempt without token from ${socket.id}`);
    socket.disconnect();
    return;
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log(`Client connected: ${socket.id}, User ID: ${userId}`);

    // Fetch user role from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data();
    const userRole = userData.role;

    // Store user info in socket object
    socket.userId = userId;
    socket.userRole = userRole;

    // Create a speech recognition stream
    const request = {
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 48000, // Match this to the sample rate of the audio data
        languageCode: "en-US",
      },
      interimResults: true,
    };

    const recognizeStream = client
      .streamingRecognize(request)
      .on("error", (error) => {
        console.error("Error in recognizeStream:", error);
        recognizeStream.destroy();
      })
      .on("data", (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcription = data.results[0].alternatives[0].transcript;
          const isFinal = data.results[0].isFinal;
          console.log(`Transcription: ${transcription} (isFinal: ${isFinal})`);
          // Emit transcription to clients
          io.emit("transcriptData", { transcription, isFinal });
        }
      });

    socket.on("audioChunk", (audioData) => {
      if (socket.userRole !== "speaker") {
        console.error("Unauthorized audioChunk event from", socket.userId);
        return;
      }
      // Convert ArrayBuffer to Buffer
      const bufferData = Buffer.from(audioData);
      // Write audio data to the recognition stream
      recognizeStream.write(bufferData);
    });

    socket.on("submitQuestion", (data) => {
      if (socket.userRole !== "listener") {
        console.error("Unauthorized submitQuestion event from", socket.userId);
        return;
      }

      const question = {
        id: uuidv4(),
        text: data.question,
        authorId: socket.userId,
        authorName: data.authorName,
      };
      pendingQuestions.push(question);

      // Notify moderators
      io.to("moderators").emit("newPendingQuestion", question);
    });

    socket.on("joinModeratorRoom", () => {
      if (socket.userRole !== "moderator") {
        console.error("Unauthorized joinModeratorRoom from", socket.userId);
        return;
      }
      socket.join("moderators");
      socket.emit("pendingQuestionsList", pendingQuestions);
    });

    socket.on("leaveModeratorRoom", () => {
      socket.leave("moderators");
    });

    socket.on("approveQuestion", (data) => {
      if (socket.userRole !== "moderator") {
        console.error("Unauthorized approveQuestion from", socket.userId);
        return;
      }

      //Find index of approved question
      const questionIndex = pendingQuestions.findIndex(
        (q) => q.id === data.questionId
      );
      if (questionIndex !== -1) {
        //Remove question for pending questions and push it to approved questions
        const [question] = pendingQuestions.splice(questionIndex, 1);
        approvedQuestions.push(question);

        // Notify all clients
        io.emit("questionApproved", question);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      recognizeStream.destroy();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    socket.disconnect(); // Disconnect unauthorized clients
  }
});
