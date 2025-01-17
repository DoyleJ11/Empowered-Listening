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

let lobbies = []; // e.g. [{id: "fa24hj", title: "Climate Change Discussion", desc: "A friendly discussion about the effects of climate change!", moderatorId: "h9esl6",}, {}]

let pendingQuestions = [];
let approvedQuestions = [];

io.on("connection", async (socket) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.warn(`Connection attempt without token from ${socket.id}`);
    socket.disconnect();
    return;
  }

  let userId;
  let userRole;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    userId = decodedToken.uid;

    // Fetch user role from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data();
    userRole = userData.role;

    // Store user info in socket object
    socket.userId = userId;
    socket.userRole = userRole;

    console.log(
      `Client connected: ${socket.id}, User ID: ${userId}, Role: ${userRole}`
    );
  } catch (error) {
    console.error("Authentication error:", error);
    socket.disconnect(); // Disconnect unauthorized clients
  }

  // _           _     _                      _____                         __  __                                                   _
  // | |         | |   | |             ___    |  __ \                       |  \/  |                                                 | |
  // | |     ___ | |__ | |__  _   _   ( _ )   | |__) |___   ___  _ __ ___   | \  / | __ _ _ __   __ _  __ _  ___ _ __ ___   ___ _ __ | |_
  // | |    / _ \| '_ \| '_ \| | | |  / _ \/\ |  _  // _ \ / _ \| '_ ` _ \  | |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '_ ` _ \ / _ \ '_ \| __|
  // | |___| (_) | |_) | |_) | |_| | | (_>  < | | \ \ (_) | (_) | | | | | | | |  | | (_| | | | | (_| | (_| |  __/ | | | | |  __/ | | | |_
  // |______\___/|_.__/|_.__/ \__, |  \___/\/ |_|  \_\___/ \___/|_| |_| |_| |_|  |_|\__,_|_| |_|\__,_|\__, |\___|_| |_| |_|\___|_| |_|\__|
  //                           __/ |                                                                   __/ |
  //                          |___/                                                                   |___/

  socket.emit("lobbiesUpdated", lobbies);

  // Moderator creating a new lobby
  socket.on("createLobby", async (data) => {
    if (socket.userRole !== "moderator") {
      console.error("Unauthorized createLobby event from", socket.userId);
      return;
    }

    const newLobby = {
      id: uuidv4(),
      title: data.title || "New Lobby",
      desc: data.desc || "",
      startTime: data.startTime,
      moderatorId: socket.userId,
    };

    // Store in memory for now
    // When we switch to Firestore:
    // await admin.firestore().collection("lobbies").doc(newLobby.id).set(newLobby);

    lobbies.push(newLobby);

    // Tell the creator they successfully created the lobby
    socket.emit("lobbyCreated", newLobby);

    // Broadcast the updated lobby list to everyone
    io.emit("lobbiesUpdated", lobbies);
  });

  // A user (speaker/listener) wants to join a lobby
  socket.on("joinLobby", async (data) => {
    const { lobbyId } = data;
    const lobbyExists = lobbies.find((l) => l.id === lobbyId);
    if (!lobbyExists) {
      socket.emit("joinError", { error: "Lobby does not exist." });
      return;
    }

    // If the user was already in a lobby, leave it first
    if (socket.lobbyId) {
      socket.leave(socket.lobbyId);
    }

    // Join the requested lobby
    socket.join(lobbyId);
    socket.lobbyId = lobbyId;

    console.log(
      `User ${socket.userId} joined lobby ${lobbyId} (Role: ${socket.userRole})`
    );

    socket.emit("lobbyJoined", { lobbyId });
  });

  socket.on("leaveLobby", () => {
    if (socket.lobbyId) {
      socket.leave(socket.lobbyId);
      socket.emit("lobbyLeft", { lobbyId: socket.lobbyId });
      socket.lobbyId = null;
    }
  });

  //
  //   _____                      _       _____                            _ _   _                _____      _
  //   / ____|                    | |     |  __ \                          (_) | (_)              / ____|    | |
  //  | (___  _ __   ___  ___  ___| |__   | |__) |___  ___ ___   __ _ _ __  _| |_ _  ___  _ __   | (___   ___| |_ _   _ _ __
  //   \___ \| '_ \ / _ \/ _ \/ __| '_ \  |  _  // _ \/ __/ _ \ / _` | '_ \| | __| |/ _ \| '_ \   \___ \ / _ \ __| | | | '_ \
  //   ____) | |_) |  __/  __/ (__| | | | | | \ \  __/ (_| (_) | (_| | | | | | |_| | (_) | | | |  ____) |  __/ |_| |_| | |_) |
  //  |_____/| .__/ \___|\___|\___|_| |_| |_|  \_\___|\___\___/ \__, |_| |_|_|\__|_|\___/|_| |_| |_____/ \___|\__|\__,_| .__/
  //         | |                                                 __/ |                                                 | |
  //         |_|                                                |___/                                                  |_|
  //

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

        // Emit transcription to the current lobby room
        if (socket.lobbyId) {
          io.to(socket.lobbyId).emit("transcriptData", {
            transcription,
            isFinal,
          });
        }
      }
    });

  socket.on("audioChunk", (audioData) => {
    if (socket.userRole !== "speaker") {
      console.error("Unauthorized audioChunk event from", socket.userId);
      return;
    }
    if (!socket.lobbyId) {
      console.error("User is not in a lobby. Discarding audioChunk.");
      return;
    }
    // Convert ArrayBuffer to Buffer
    const bufferData = Buffer.from(audioData);
    // Write audio data to the recognition stream
    recognizeStream.write(bufferData);
  });

  //
  //   ____                  _   _                _____       _               _         _                                                                 _
  //   / __ \                | | (_)              / ____|     | |             (_)       (_)               ___        /\                                   | |
  //  | |  | |_   _  ___  ___| |_ _  ___  _ __   | (___  _   _| |__  _ __ ___  _ ___ ___ _  ___  _ __    ( _ )      /  \   _ __  _ __  _ __ _____   ____ _| |
  //  | |  | | | | |/ _ \/ __| __| |/ _ \| '_ \   \___ \| | | | '_ \| '_ ` _ \| / __/ __| |/ _ \| '_ \   / _ \/\   / /\ \ | '_ \| '_ \| '__/ _ \ \ / / _` | |
  //  | |__| | |_| |  __/\__ \ |_| | (_) | | | |  ____) | |_| | |_) | | | | | | \__ \__ \ | (_) | | | | | (_>  <  / ____ \| |_) | |_) | | | (_) \ V / (_| | |
  //   \___\_\\__,_|\___||___/\__|_|\___/|_| |_| |_____/ \__,_|_.__/|_| |_| |_|_|___/___/_|\___/|_| |_|  \___/\/ /_/    \_\ .__/| .__/|_|  \___/ \_/ \__,_|_|
  //                                                                                                                      | |   | |
  //                                                                                                                      |_|   |_|

  socket.on("submitQuestion", (data) => {
    if (socket.userRole !== "listener") {
      console.error("Unauthorized submitQuestion event from", socket.userId);
      return;
    }
    if (!socket.lobbyId) {
      console.error("User is not in a lobby. Discarding question.");
      return;
    }

    const question = {
      id: uuidv4(),
      text: data.question,
      authorId: socket.userId,
      authorName: data.authorName,
      lobbyId: socket.lobbyId,
    };
    pendingQuestions.push(question);

    io.to(socket.lobbyId).emit("newPendingQuestion", question);
  });

  socket.on("approveQuestion", (data) => {
    if (socket.userRole !== "moderator") {
      console.error("Unauthorized approveQuestion from", socket.userId);
      return;
    }
    if (!socket.lobbyId) {
      console.error("User is not in a lobby. Discarding approval.");
      return;
    }

    const questionIndex = pendingQuestions.findIndex(
      (q) => q.id === data.questionId && q.lobbyId === socket.lobbyId
    );
    if (questionIndex !== -1) {
      const [question] = pendingQuestions.splice(questionIndex, 1);
      approvedQuestions.push(question);
      // Notify all clients in the same lobby
      io.to(socket.lobbyId).emit("questionApproved", question);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    recognizeStream.destroy();
  });
});
