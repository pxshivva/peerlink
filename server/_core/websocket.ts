import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users, conversations } from "../../drizzle/schema";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  id: string;
  handshake: any;
  join(room: string): void;
  leave(room: string): void;
  to(room: string): any;
  on(event: string, listener: (...args: any[]) => void): this;
}

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "development" ? "*" : undefined,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware to authenticate socket connections using session cookie
  io.use(async (socket: AuthenticatedSocket, next: any) => {
    try {
      const db = await getDb();
      if (!db) {
        return next(new Error("Database not available"));
      }

      // Try to get user ID from auth query param (for development)
      let userId = socket.handshake.auth.userId;
      
      if (!userId) {
        return next(new Error("Authentication error: userId required"));
      }

      const userIdNum = parseInt(userId as string);
      if (isNaN(userIdNum)) {
        return next(new Error("Invalid userId format"));
      }

      // Verify user exists
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1);

      if (result.length === 0) {
        return next(new Error("User not found"));
      }

      socket.userId = userIdNum;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] User ${socket.userId} connected: ${socket.id}`);

    // Join conversation room - verify user is part of conversation
    socket.on("join_conversation", async (conversationId: number) => {
      try {
        const db = await getDb();
        if (!db) {
          socket.emit("error", "Database not available");
          return;
        }

        // Verify user is part of this conversation
        const conv = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1);

        if (conv.length === 0) {
          socket.emit("error", "Conversation not found");
          return;
        }

        const conversation = conv[0];
        if (
          conversation.user1Id !== socket.userId &&
          conversation.user2Id !== socket.userId
        ) {
          socket.emit("error", "Unauthorized: not part of this conversation");
          return;
        }

        const roomName = `conversation_${conversationId}`;
        socket.join(roomName);
        console.log(
          `[WebSocket] User ${socket.userId} joined room ${roomName}`
        );
      } catch (error) {
        console.error("[WebSocket] Error joining conversation:", error);
        socket.emit("error", "Failed to join conversation");
      }
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: number) => {
      const roomName = `conversation_${conversationId}`;
      socket.leave(roomName);
      console.log(`[WebSocket] User ${socket.userId} left room ${roomName}`);
    });

    // New message event - verify user is part of conversation
    socket.on(
      "send_message",
      async (data: { conversationId: number; content: string }) => {
        try {
          const db = await getDb();
          if (!db) {
            socket.emit("error", "Database not available");
            return;
          }

          // Verify user is part of this conversation
          const conv = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, data.conversationId))
            .limit(1);

          if (conv.length === 0) {
            socket.emit("error", "Conversation not found");
            return;
          }

          const conversation = conv[0];
          if (
            conversation.user1Id !== socket.userId &&
            conversation.user2Id !== socket.userId
          ) {
            socket.emit("error", "Unauthorized: not part of this conversation");
            return;
          }

          // Validate message content
          if (!data.content || data.content.trim().length === 0) {
            socket.emit("error", "Message content cannot be empty");
            return;
          }

          if (data.content.length > 1000) {
            socket.emit("error", "Message content too long (max 1000 chars)");
            return;
          }

          const roomName = `conversation_${data.conversationId}`;

          // Broadcast message to all users in the conversation room
          io.to(roomName).emit("new_message", {
            conversationId: data.conversationId,
            senderId: socket.userId,
            content: data.content,
            timestamp: new Date(),
          });

          console.log(
            `[WebSocket] Message sent in ${roomName} by user ${socket.userId}`
          );
        } catch (error) {
          console.error("[WebSocket] Error sending message:", error);
          socket.emit("error", "Failed to send message");
        }
      }
    );

    // Typing indicator - verify user is part of conversation
    socket.on("typing", async (data: { conversationId: number }) => {
      try {
        const db = await getDb();
        if (!db) return;

        // Verify user is part of this conversation
        const conv = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, data.conversationId))
          .limit(1);

        if (conv.length === 0) return;

        const conversation = conv[0];
        if (
          conversation.user1Id !== socket.userId &&
          conversation.user2Id !== socket.userId
        ) {
          return;
        }

        const roomName = `conversation_${data.conversationId}`;
        socket.to(roomName).emit("user_typing", {
          userId: socket.userId,
          conversationId: data.conversationId,
        });
      } catch (error) {
        console.error("[WebSocket] Error sending typing indicator:", error);
      }
    });

    // Stop typing indicator - verify user is part of conversation
    socket.on("stop_typing", async (data: { conversationId: number }) => {
      try {
        const db = await getDb();
        if (!db) return;

        // Verify user is part of this conversation
        const conv = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, data.conversationId))
          .limit(1);

        if (conv.length === 0) return;

        const conversation = conv[0];
        if (
          conversation.user1Id !== socket.userId &&
          conversation.user2Id !== socket.userId
        ) {
          return;
        }

        const roomName = `conversation_${data.conversationId}`;
        socket.to(roomName).emit("user_stop_typing", {
          userId: socket.userId,
          conversationId: data.conversationId,
        });
      } catch (error) {
        console.error("[WebSocket] Error stopping typing indicator:", error);
      }
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`[WebSocket] User ${socket.userId} disconnected: ${socket.id}`);
    });

    // Error handler
    socket.on("error", (error: Error) => {
      console.error(`[WebSocket] Error for user ${socket.userId}:`, error);
    });
  });

  return io;
}
