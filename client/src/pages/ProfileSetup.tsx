import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<string[]>([]);
  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");

  const setupMutation = trpc.profile.setup.useMutation();

  const handleAddSkillOffered = () => {
    if (newSkillOffered.trim()) {
      setSkillsOffered([...skillsOffered, newSkillOffered.trim()]);
      setNewSkillOffered("");
    }
  };

  const handleRemoveSkillOffered = (index: number) => {
    setSkillsOffered(skillsOffered.filter((_, i) => i !== index));
  };

  const handleAddSkillWanted = () => {
    if (newSkillWanted.trim()) {
      setSkillsWanted([...skillsWanted, newSkillWanted.trim()]);
      setNewSkillWanted("");
    }
  };

  const handleRemoveSkillWanted = (index: number) => {
    setSkillsWanted(skillsWanted.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!school.trim() || !grade.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (skillsOffered.length === 0) {
      toast.error("Please add at least one skill you can offer");
      return;
    }

    if (skillsWanted.length === 0) {
      toast.error("Please add at least one skill you want to learn");
      return;
    }

    setLoading(true);

    try {
      await setupMutation.mutateAsync({
        bio,
        school,
        grade,
        skillsOffered,
        skillsWanted,
      });

      toast.success("Profile setup complete!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Failed to setup profile. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container max-w-2xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Complete Your Profile</h1>
            <p className="text-lg text-muted-foreground">
              Tell us about yourself so we can match you with the right peers.
            </p>
          </div>

          {/* Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold block mb-2">Name</label>
                  <Input
                    value={user?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">Bio</label>
                  <Textarea
                    placeholder="Tell us a bit about yourself... (optional)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bio.length}/200 characters
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      School *
                    </label>
                    <Input
                      placeholder="e.g., Central High School"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      Grade *
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">Select grade</option>
                      <option value="9">9th Grade</option>
                      <option value="10">10th Grade</option>
                      <option value="11">11th Grade</option>
                      <option value="12">12th Grade</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills Offered */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skills You Can Offer *</h3>
                <p className="text-sm text-muted-foreground">
                  What can you teach other students?
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Algebra, Python, Essay Writing"
                    value={newSkillOffered}
                    onChange={(e) => setNewSkillOffered(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkillOffered();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkillOffered}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skillsOffered.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillOffered(index)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Wanted */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skills You Want to Learn *</h3>
                <p className="text-sm text-muted-foreground">
                  What do you want to learn from other students?
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Spanish, Video Editing, Chemistry"
                    value={newSkillWanted}
                    onChange={(e) => setNewSkillWanted(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkillWanted();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkillWanted}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skillsWanted.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillWanted(index)}
                        className="hover:text-secondary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-8 border-t border-border">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Complete Setup
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can update your profile anytime after setup.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
