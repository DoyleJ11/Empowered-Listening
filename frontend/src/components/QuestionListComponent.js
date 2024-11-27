import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const QuestionListComponent = () => {
  const socket = useContext(SocketContext);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleQuestionApproved = (question) => {
      setQuestions((prev) => [...prev, question]);
    };

    socket.on("questionApproved", handleQuestionApproved);

    // Cleanup on unmount
    return () => {
      socket.off("questionApproved", handleQuestionApproved);
    };
  }, [socket]);

  return (
    <div>
      <h2>Approved Questions</h2>
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            {q.text} by {q.authorName}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionListComponent;
