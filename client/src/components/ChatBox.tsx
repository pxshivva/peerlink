import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatBoxProps {
  conversationId: number;
  otherUserName?: string;
}

export default function ChatBox({ conversationId, otherUserName }: ChatBoxProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebSocket - pass conversationId as parameter
  const {
    joinConversation,
    leaveConversation,
    sendMessage: sendWebSocketMessage,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
    sendTyping,
    sendStopTyping,
  } = useWebSocket() || {};

  // Queries
  const messagesQuery = trpc.messages.getMessages.useQuery(
    { conversationId },
    { refetchInterval: 0 } // Disable polling, use WebSocket instead
  );

  // Mutations
  const sendMutation = trpc.messages.send.useMutation();

  // Join conversation on mount
  useEffect(() => {
    if (joinConversation && leaveConversation) {
      joinConversation(conversationId);
      return () => {
        leaveConversation(conversationId);
      };
    }
  }, [conversationId, joinConversation, leaveConversation]);

  // Load initial messages
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!onNewMessage) return;
    onNewMessage((data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            conversationId: data.conversationId,
            senderId: data.senderId,
            content: data.content,
            isRead: false,
            createdAt: data.timestamp,
          },
        ]);
      }
    });
  }, [conversationId, onNewMessage]);

  // Listen for typing indicators
  useEffect(() => {
    if (!onUserTyping || !onUserStopTyping) return;
    onUserTyping((data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsTyping(true);
      }
    });

    onUserStopTyping((data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsTyping(false);
      }
    });
  }, [conversationId, user?.id, onUserTyping, onUserStopTyping, onUserStopTyping]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setLoading(true);
    const messageContent = message.trim();
    setMessage("");
    if (sendStopTyping) sendStopTyping(conversationId);

    try {
      // Send via tRPC to persist to database
      await sendMutation.mutateAsync({
        conversationId,
        content: messageContent,
      });

      // Also broadcast via WebSocket for real-time delivery
      if (sendWebSocketMessage) sendWebSocketMessage(conversationId, messageContent);
    } catch (error) {
      toast.error("Failed to send message");
      setMessage(messageContent); // Restore message on error
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Send typing indicator
    if (sendTyping) sendTyping(conversationId);

    // Clear previous timeout
    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (sendStopTyping) sendStopTyping(conversationId);
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold">{otherUserName || "Conversation"}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === user?.id
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
            disabled={loading}
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={loading || !message.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
