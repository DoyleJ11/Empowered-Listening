//CreateLobbyComponent.js
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const CreateLobbyComponent = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [lobbyTitle, setLobbyTitle] = useState("");
  const [lobbyDesc, setLobbyDesc] = useState("");
  const [startTime, setStartTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // When the server confirms the lobby was created
    const handleLobbyCreated = (newLobby) => {
      // Immediately join it
      socket.emit("joinLobby", { lobbyId: newLobby.id });
    };

    const handleLobbyJoined = ({ lobbyId }) => {
        navigate(`/lobby/${lobbyId}`);
      };

    socket.on("lobbyCreated", handleLobbyCreated);
    socket.on("lobbyJoined", handleLobbyJoined);

    return () => {
      socket.off("lobbyCreated", handleLobbyCreated);
      socket.off("lobbyJoined", handleLobbyJoined);
    };
  }, [socket, navigate]);


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("handleSubmit called. socket:", socket);

    const localDate = new Date(startTime);
    const isoString = localDate.toISOString();

    if (lobbyTitle.trim() && socket) {
      socket.emit("createLobby", {
        title: lobbyTitle,
        desc: lobbyDesc,
        startTime: isoString,
      });
    }
  };

  return (
    <div>
      <h2>Create a Lobby</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={lobbyTitle}
          onChange={(e) => setLobbyTitle(e.target.value)}
          placeholder="Title"
        />
        <input
          type="text"
          value={lobbyDesc}
          onChange={(e) => setLobbyDesc(e.target.value)}
          placeholder="Description"
        />
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="Start time"
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default CreateLobbyComponent;
