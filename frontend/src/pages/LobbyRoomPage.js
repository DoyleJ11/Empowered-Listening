// pages/LobbyRoomPage.js
import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

import SpeakerComponent from "../components/SpeakerComponent";
import ModeratorPanelComponent from "../components/ModeratorPanelComponent";
import QuestionFormComponent from "../components/QuestionFormComponent";
import TranscriptComponent from "../components/TranscriptComponent";
import QuestionListComponent from "../components/QuestionListComponent";

const LobbyRoomPage = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const { lobbyId } = useParams();
  const navigate = useNavigate();

  const [joinedLobby, setJoinedLobby] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // If for some reason we get here but haven't joined yet,
    // we can do a quick check or attempt to re-join

    // Listen for "lobbyLeft"
    const handleLobbyLeft = ({ lobbyId }) => {
      // Navigate back to the /lobbies list
      navigate("/lobbies");
    };

    socket.on("lobbyLeft", handleLobbyLeft);

    return () => {
      socket.off("lobbyLeft", handleLobbyLeft);
    };
  }, [socket, navigate]);

  const handleLeaveLobby = () => {
    if (socket) {
      socket.emit("leaveLobby");
    }
  };

  // Show different UIs based on role
  // If the user is a speaker => show <SpeakerComponent/>
  // If moderator => show <ModeratorPanelComponent/>
  // If listener => show <QuestionFormComponent/>
  // We always show transcript + question list

  return (
    <div>
      <h2>Lobby: {lobbyId}</h2>
      <button onClick={handleLeaveLobby}>Leave Lobby</button>

      {user.role === "speaker" && <SpeakerComponent />}
      {user.role === "moderator" && <ModeratorPanelComponent />}
      {user.role === "listener" && <QuestionFormComponent />}

      <TranscriptComponent />
      <QuestionListComponent />
    </div>
  );
};

export default LobbyRoomPage;
