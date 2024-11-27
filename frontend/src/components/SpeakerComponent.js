import React, { useEffect, useState, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const SpeakerComponent = () => {
  const socket = useContext(SocketContext);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!socket) return;

    let audioContext;
    let mediaStream;
    let source;
    let processor;

    const startAudio = async () => {
      try {
        // Create AudioContext after user interaction
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume AudioContext if it's suspended
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        console.log("AudioContext state:", audioContext.state);

        // Update the path to your processor.js file in the public folder
        await audioContext.audioWorklet.addModule("/processor.js");

        // Request microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        source = audioContext.createMediaStreamSource(mediaStream);

        processor = new AudioWorkletNode(audioContext, "audio-processor");

        processor.port.onmessage = (event) => {
          const inputData16 = event.data;
          socket.emit("audioChunk", inputData16);
        };

        source.connect(processor);
        // processor.connect(audioContext.destination); // If you need to hear the audio

        console.log("AudioContext sample rate:", audioContext.sampleRate);
      } catch (err) {
        console.error(
          "Error accessing microphone or setting up audio processing:",
          err
        );
      }
    };

    if (isStarted) {
      startAudio();
    }

    // Cleanup on unmount or when isStarted changes
    return () => {
      if (processor) processor.disconnect();
      if (source) source.disconnect();
      if (audioContext) audioContext.close();
      if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
    };
  }, [isStarted, socket]);

  const handleStart = () => {
    setIsStarted(true);
  };

  return (
    <div>
      <h2>Speaker Component</h2>
      {!isStarted && <button onClick={handleStart}>Start</button>}
    </div>
  );
};

export default SpeakerComponent;
