// ModeratorPanelComponent.js
import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const ModeratorPanelComponent = () => {
  const socket = useContext(SocketContext);
  const [pendingQuestions, setPendingQuestions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewPendingQuestion = (question) => {
      setPendingQuestions((prev) => [...prev, question]);
    };

    const handlePendingQuestionsList = (questions) => {
      setPendingQuestions(questions);
    };

    socket.on("newPendingQuestion", handleNewPendingQuestion);
    socket.on("pendingQuestionsList", handlePendingQuestionsList);
    socket.emit("joinModeratorRoom");

    // Cleanup on unmount
    return () => {
      socket.off("newPendingQuestion", handleNewPendingQuestion);
      socket.off("pendingQuestionsList", handlePendingQuestionsList);
      socket.emit("leaveModeratorRoom");
    };
  }, [socket]);

  const approveQuestion = (questionId) => {
    if (socket) {
      socket.emit("approveQuestion", { questionId });
      setPendingQuestions((prev) => prev.filter((q) => q.id !== questionId));
    }
  };

  return (
    <div>
      <h2>Moderator Panel</h2>
      <ul>
        {pendingQuestions.map((q) => (
          <li key={q.id}>
            {q.text} by {q.authorName}
            <button onClick={() => approveQuestion(q.id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ModeratorPanelComponent;
