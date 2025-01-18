// App.js
import React, { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Our components
import LobbyComponent from "./components/LobbyComponent";
import CreateLobbyComponent from "./components/CreateLobbyComponent";
import LoginComponent from "./components/LoginComponent";
import SpeakerComponent from "./components/SpeakerComponent";
import ModeratorPanelComponent from "./components/ModeratorPanelComponent";
import QuestionFormComponent from "./components/QuestionFormComponent";
import TranscriptComponent from "./components/TranscriptComponent";
import QuestionListComponent from "./components/QuestionListComponent";
import LobbyRoomPage from "./pages/LobbyRoomPage";

function App() {
  const { user, loading, logout } = useContext(AuthContext);

  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginComponent />;
  }


  return (
      <div className="App">
        <button onClick={logout}>Logout</button>

        {user.role === "moderator" && (
    <button onClick={() => navigate("/create-lobby")}>
      Go to Create Lobby
    </button>
  )}

        <Routes>
          {/* List of lobbies */}
          <Route path="/lobbies" element={<LobbyComponent />} />

          {/* Create a new lobby (moderators only, but let's not block it for now) */}
          <Route path="/create-lobby" element={<CreateLobbyComponent />} />

          {/* The actual lobby room: /lobby/:lobbyId */}
          <Route path="/lobby/:lobbyId" element={<LobbyRoomPage />} />

          {/* If we go to "/", redirect to "/lobbies" */}
          <Route path="/" element={<Navigate to="/lobbies" replace />} />
        </Routes>
      </div>
  );
}

export default App;
