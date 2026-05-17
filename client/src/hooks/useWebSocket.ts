import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const socket = io(window.location.origin, {
      auth: {
        userId: user.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected");
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    socket.on("error", (error: any) => {
      console.error("[WebSocket] Error:", error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const joinConversation = useCallback((conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("join_conversation", conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("leave_conversation", conversationId);
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId: number, content: string) => {
      if (socketRef.current) {
        socketRef.current.emit("send_message", { conversationId, content });
      }
    },
    []
  );

  const onNewMessage = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("new_message", callback);
      }
    },
    []
  );

  const onUserTyping = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("user_typing", callback);
      }
    },
    []
  );

  const onUserStopTyping = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("user_stop_typing", callback);
      }
    },
    []
  );

  const sendTyping = useCallback((conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { conversationId });
    }
  }, []);

  const sendStopTyping = useCallback((conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("stop_typing", { conversationId });
    }
  }, []);

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
    sendTyping,
    sendStopTyping,
  };
}
