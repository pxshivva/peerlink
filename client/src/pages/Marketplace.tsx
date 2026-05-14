import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Marketplace() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [requestingSkillId, setRequestingSkillId] = useState<number | null>(null);
  const [hoursRequested, setHoursRequested] = useState("1.00");

  // Queries
  const skillsQuery = trpc.skills.list.useQuery();
  const skillsWantedQuery = trpc.skillsWanted.list.useQuery();

  // Mutations
  const createRequestMutation = trpc.requests.create.useMutation();

  const skills = skillsQuery.data || [];
  const skillsWanted = skillsWantedQuery.data || [];

  // Get unique categories
  const categories = Array.from(
    new Set(skills.map((s) => s.category).filter(Boolean))
  );

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    const notOwnSkill = skill.userId !== user?.id;
    return matchesSearch && matchesCategory && notOwnSkill;
  });

  const handleRequestSkill = async (skillId: number, providerId: number, skillName: string) => {
    try {
      await createRequestMutation.mutateAsync({
        providerId,
        skillId,
        skillName,
        hoursRequested,
      });
      toast.success("Request sent! Waiting for acceptance...");
      setRequestingSkillId(null);
      setHoursRequested("1.00");
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Skill Marketplace</h1>
          <p className="text-muted-foreground">
            Browse available skills and request sessions from peers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All Skills
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No skills found matching your search.</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or check back later for new skills.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <Card key={skill.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{skill.skillName}</h3>
                  {skill.category && (
                    <p className="text-sm text-muted-foreground">{skill.category}</p>
                  )}
                </div>

                {skill.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {skill.description}
                  </p>
                )}

                <div className="flex items-center justify-between py-2 border-t border-b border-border">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="font-medium text-sm">View Profile</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-sm">4.8</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setRequestingSkillId(skill.id)}
                >
                  Request Session
                </Button>

                {/* Request Modal */}
                {requestingSkillId === skill.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-sm p-6 space-y-4">
                      <h3 className="text-lg font-semibold">Request {skill.skillName}</h3>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hours Requested</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={hoursRequested}
                            onChange={(e) => setHoursRequested(e.target.value)}
                          />
                          <span className="text-sm text-muted-foreground pt-2">hours</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You will need {parseFloat(hoursRequested).toFixed(1)} credits for this session.
                        </p>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setRequestingSkillId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() =>
                            handleRequestSkill(skill.id, skill.userId, skill.skillName)
                          }
                          disabled={createRequestMutation.isPending}
                        >
                          {createRequestMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Send Request
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Your Skills Wanted */}
        {skillsWanted.length > 0 && (
          <div className="space-y-4 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold">Skills You Want to Learn</h3>
            <div className="flex flex-wrap gap-2">
              {skillsWanted.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill.skillName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
