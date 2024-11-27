// LoginComponent.js
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const LoginComponent = () => {
  const { login } = useContext(AuthContext);

  return (
    <div>
      <h2>Welcome to Empowered Listening</h2>
      <button onClick={login}>Sign in with Google</button>
    </div>
  );
};

export default LoginComponent;
