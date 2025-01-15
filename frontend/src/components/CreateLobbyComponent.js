// LobbyComponent.js
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const CreateLobbyComponent = () => {
  const { lobbies } = useContext(AuthContext);
  const [lobbyTitle, setLobbyTitle] = useState("");
  const [lobbyDesc, setLobbyDesc] = useState("");
  const [startTime, setStartTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert local datetime string -> JS Date -> ISO string
    const localDate = new Date(startTime); 
    const isoString = localDate.toISOString();
    // if (lobbyTitle.trim() && socket) {
    //   socket.emit("createLobby", {
    //     lobbyTitle,
    //     lobbyDesc,
    //     startTime,
    //     authorId: user.uid,
    //     authorName: user.displayName,
    //   });
    // }
    console.log("It worked! " + lobbyTitle + " " + lobbyDesc + " " + isoString)
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
