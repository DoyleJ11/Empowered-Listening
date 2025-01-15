// LobbyComponent.js
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const LobbyComponent = () => {
  const { lobbies } = useContext(AuthContext);


  //Map lobbies object recieved from server into cards. When a lobby card is clicked on, redirect user to the corresponding lobby
  return (
    <div>
      <h2>Welcome to Empowered Listening - Lobbies</h2>
      
    </div>
  );
};

export default LobbyComponent;
