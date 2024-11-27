// App.js
import React, { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import SpeakerComponent from "./components/SpeakerComponent";
import TranscriptComponent from "./components/TranscriptComponent";
import LoginComponent from "./components/LoginComponent";
import QuestionFormComponent from "./components/QuestionFormComponent";
import ModeratorPanelComponent from "./components/ModeratorPanelComponent";
import QuestionListComponent from "./components/QuestionListComponent";

function App() {
  const { user, loading, logout } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginComponent />;
  }

  return (
    <div className="App">
      <button onClick={logout}>Logout</button>
      {user.role === "speaker" && <SpeakerComponent />}
      {user.role === "moderator" && <ModeratorPanelComponent />}
      {user.role === "listener" && <QuestionFormComponent />}
      <TranscriptComponent />
      <QuestionListComponent />
    </div>
  );
}

export default App;
