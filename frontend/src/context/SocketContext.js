// context/SocketContext.js
import React, { createContext, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext"; // Import your AuthContext

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { firebaseUser, loading } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) return;

    const initializeSocket = async () => {
      try {
        const token = await firebaseUser.getIdToken();

        // Initialize socket with autoConnect: false
        socketRef.current = io("http://localhost:5050", {
          autoConnect: false,
          auth: { token },
        });

        // Connect the socket
        socketRef.current.connect();
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [firebaseUser, loading]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
