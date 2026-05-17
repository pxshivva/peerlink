import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import ChatBox from "@/components/ChatBox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Search, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Messages() {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");

  // Queries
  const conversationsQuery = trpc.messages.getConversations.useQuery(
    undefined,
    { refetchInterval: 5000 } // Poll every 5 seconds
  );

  // Mutations
  const startConvMutation = trpc.messages.startConversation.useMutation();

  const conversations = conversationsQuery.data || [];
  const selectedConversation = conversations.find((c) => c.id === selectedConvId);

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.otherUserId.toString().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  const handleStartConversation = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    try {
      const otherUserId = parseInt(newUserEmail);
      if (isNaN(otherUserId)) {
        toast.error("Invalid user ID");
        return;
      }

      const conv = await startConvMutation.mutateAsync({
        otherUserId,
      });

      setSelectedConvId(conv.id);
      setNewUserEmail("");
      setShowNewConversation(false);
      await conversationsQuery.refetch();
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8" />
            Messages
          </h1>
          <Button onClick={() => setShowNewConversation(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>
        </div>

        {/* New Conversation Dialog */}
        {showNewConversation && (
          <Card className="p-6 bg-muted/30 space-y-4">
            <h3 className="font-semibold">Start a Conversation</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter user ID"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleStartConversation();
                }}
              />
              <Button onClick={handleStartConversation}>Start</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewConversation(false);
                  setNewUserEmail("");
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="md:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[500px]">
              {filteredConversations.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                </Card>
              ) : (
                filteredConversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedConvId === conv.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedConvId(conv.id)}
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">User {conv.otherUserId}</p>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {conv.lastMessage}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Chat Box */}
          <div className="md:col-span-2">
            {selectedConversation ? (
              <ChatBox
                conversationId={selectedConversation.id}
                otherUserName={`User ${selectedConversation.otherUserId}`}
              />
            ) : (
              <Card className="h-full flex items-center justify-center bg-muted/30 text-muted-foreground">
                <div className="text-center space-y-2">
                  <MessageCircle className="w-12 h-12 mx-auto opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
