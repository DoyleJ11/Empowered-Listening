// LobbyComponent.js
import React, { useContext, useState, useEffect } from "react";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const LobbyComponent = () => {
  const socket = useContext(SocketContext);
  const [lobbies, setLobbies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    socket.emit("getLobbies");

    socket.on("lobbiesUpdated", (newLobbies) => {
      console.log("[LobbyComponent] got lobbiesUpdated:", newLobbies);
      setLobbies(newLobbies);
    });

    // When the server confirms you joined a lobby
    socket.on("lobbyJoined", ({ lobbyId }) => {
      // Navigate to the new route
      navigate(`/lobby/${lobbyId}`);
    });

    return () => {
      socket.off("lobbiesUpdated");
      socket.off("lobbyJoined");
    };
  }, [socket, navigate]);

  function handleJoinLobby(lobbyId) {
    if (!socket) return;
    socket.emit("joinLobby", { lobbyId });
  }

  return (
    <div>
      <h2>Available Lobbies</h2>
      <ul>
        {lobbies.map((lobby) => (
          <li key={lobby.id}>
            <strong>{lobby.title}</strong> - {lobby.desc}
            <button onClick={() => handleJoinLobby(lobby.id)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LobbyComponent;
