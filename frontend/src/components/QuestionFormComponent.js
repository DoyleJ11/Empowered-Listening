import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

const QuestionFormComponent = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [question, setQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && socket) {
      socket.emit("submitQuestion", {
        question,
        authorId: user.uid,
        authorName: user.displayName,
      });
      setQuestion("");
    }
  };

  return (
    <div>
      <h2>Submit a Question</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question"
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default QuestionFormComponent;
