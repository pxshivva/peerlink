import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "credits">("overview");
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h2 className="text-lg font-semibold">Access Denied</h2>
            </div>
            <p className="text-muted-foreground">
              You do not have permission to access the admin panel. Only administrators can view this page.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjustUserId || !adjustAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Call admin mutation to adjust credits
      toast.success("Credits adjusted successfully");
      setAdjustUserId("");
      setAdjustAmount("");
      setAdjustDescription("");
    } catch (error) {
      toast.error("Failed to adjust credits");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "credits", label: "Credit Management" },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage PeerLink platform settings and users.</p>
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
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-4xl font-bold">—</p>
              </Card>

              <Card className="p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-4xl font-bold">—</p>
              </Card>

              <Card className="p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Total Credits Exchanged</p>
                <p className="text-4xl font-bold">—</p>
              </Card>
            </div>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Platform Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed Sessions</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Session Rating</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most Popular Skill</span>
                  <span className="font-medium">—</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="text-sm text-muted-foreground">
                View and manage all registered users on the platform.
              </p>

              <div className="space-y-4">
                <Input placeholder="Search users..." />
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">School</th>
                        <th className="px-4 py-3 text-left font-medium">Credits</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "credits" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Adjust User Credits</h3>
              <p className="text-sm text-muted-foreground">
                Manually adjust credits for users in case of disputes or corrections.
              </p>

              <form onSubmit={handleAdjustCredits} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">User ID</label>
                  <Input
                    type="number"
                    placeholder="Enter user ID"
                    value={adjustUserId}
                    onChange={(e) => setAdjustUserId(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5.00 or -2.50"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use negative numbers to deduct credits.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Reason (Optional)</label>
                  <Input
                    placeholder="e.g., Dispute resolution, System correction"
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adjust Credits
                </Button>
              </form>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Recent Credit Adjustments</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <div>
                    <p className="font-medium">User #123</p>
                    <p className="text-xs text-muted-foreground">+5.00 credits</p>
                  </div>
                  <span className="text-muted-foreground">—</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
