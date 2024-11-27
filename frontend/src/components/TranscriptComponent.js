// components/TranscriptComponent.js
import React, { useEffect, useState, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const TranscriptComponent = () => {
  const socket = useContext(SocketContext);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleTranscriptData = (data) => {
      const { transcription, isFinal } = data;

      if (isFinal) {
        // Append the final transcription to the transcript
        setTranscript((prev) => prev + " " + transcription);
        // Clear the interim transcript
        setInterimTranscript("");
      } else {
        // Update the interim transcript
        setInterimTranscript(transcription);
      }
    };

    socket.on("transcriptData", handleTranscriptData);

    // Cleanup on unmount
    return () => {
      socket.off("transcriptData", handleTranscriptData);
    };
  }, [socket]);

  return (
    <div>
      <h2>Live Transcript</h2>
      <p>
        {transcript} <span style={{ color: "gray" }}>{interimTranscript}</span>
      </p>
    </div>
  );
};

export default TranscriptComponent;
