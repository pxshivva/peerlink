import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, TrendingUp, Clock, CheckCircle, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "requests" | "sessions">("overview");

  // Queries
  const profileQuery = trpc.profile.get.useQuery();
  const skillsQuery = trpc.skills.list.useQuery({ userId: user?.id });
  const incomingRequestsQuery = trpc.requests.incoming.useQuery();
  const outgoingRequestsQuery = trpc.requests.outgoing.useQuery();
  const sessionsQuery = trpc.sessions.list.useQuery();

  // Mutations
  const acceptRequestMutation = trpc.requests.accept.useMutation();
  const declineRequestMutation = trpc.requests.decline.useMutation();
  const completeSessionMutation = trpc.sessions.complete.useMutation();

  const profile = profileQuery.data;
  const skills = skillsQuery.data || [];
  const incomingRequests = incomingRequestsQuery.data || [];
  const outgoingRequests = outgoingRequestsQuery.data || [];
  const sessions = sessionsQuery.data || [];

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptRequestMutation.mutateAsync({ requestId });
      toast.success("Request accepted!");
      incomingRequestsQuery.refetch();
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await declineRequestMutation.mutateAsync({ requestId });
      toast.success("Request declined");
      incomingRequestsQuery.refetch();
    } catch (error) {
      toast.error("Failed to decline request");
    }
  };

  const handleCompleteSession = async (sessionId: number) => {
    try {
      await completeSessionMutation.mutateAsync({ sessionId });
      toast.success("Session completed! Credits transferred.");
      sessionsQuery.refetch();
    } catch (error) {
      toast.error("Failed to complete session");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "skills", label: "My Skills" },
    { id: "requests", label: "Requests" },
    { id: "sessions", label: "Sessions" },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Credit Balance Card */}
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Credit Balance</p>
                  <p className="text-5xl font-bold text-primary">
                    {profile ? parseFloat(profile.creditBalance.toString()).toFixed(1) : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    1 credit = 1 hour of learning or teaching
                  </p>
                </div>
                <TrendingUp className="w-16 h-16 text-primary/20" />
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-3xl font-bold">{profile?.totalSessions || 0}</p>
              </Card>

              <Card className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-3xl font-bold">
                  {profile ? parseFloat(profile.averageRating.toString()).toFixed(1) : "—"}
                </p>
              </Card>

              <Card className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Active Requests</p>
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">{incomingRequests.length + outgoingRequests.length}</p>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {sessions.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>No active sessions yet. Start by offering a skill or requesting help!</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 3).map((session) => (
                    <Card key={session.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{session.skillName}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.hoursScheduled} hours scheduled
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Skills You Offer</h3>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            </div>

            {skills.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No skills added yet. Add your first skill to get started!</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {skills.map((skill) => (
                  <Card key={skill.id} className="p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg">{skill.skillName}</h4>
                      {skill.category && (
                        <p className="text-sm text-muted-foreground">{skill.category}</p>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                    )}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button size="sm" variant="outline" className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Deactivate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-8">
            {/* Incoming Requests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Incoming Requests</h3>
              {incomingRequests.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>No incoming requests yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{request.skillName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {request.hoursRequested} hours requested
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={acceptRequestMutation.isPending}
                          >
                            {acceptRequestMutation.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={declineRequestMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Outgoing Requests</h3>
              {outgoingRequests.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>No outgoing requests yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{request.skillName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Status: <span className="capitalize">{request.status}</span>
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            {sessions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No active sessions. Accept a request to start a session!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{session.skillName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.hoursScheduled} hours • Scheduled
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCompleteSession(session.id)}
                        disabled={completeSessionMutation.isPending}
                      >
                        {completeSessionMutation.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Mark Complete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
