// LobbyComponent.js
import React, { useContext, useState, useEffect } from "react";
import { SocketContext } from "../context/SocketContext";

const LobbyComponent = () => {
    const socket = useContext(SocketContext);
    const [lobbies, setLobbies] = useState([]);
    
    useEffect(() => {
      if (!socket) return;
    
      socket.on("lobbiesUpdated", (newLobbies) => {
        setLobbies(newLobbies);
      });
    
      return () => {
        socket.off("lobbiesUpdated");
      };
    }, [socket]);

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
            {lobby.title} 
            {lobby.desc}
            <button onClick={() => handleJoinLobby(lobby.id)}>Join</button>
            </li>
        ))}
        </ul>
  </div>
  );
};

export default LobbyComponent;
