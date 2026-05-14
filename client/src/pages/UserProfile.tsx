import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Star, Mail, School, BookOpen } from "lucide-react";
import { useRoute } from "wouter";

export default function UserProfile() {
  const { user: currentUser } = useAuth();
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId ? parseInt(params.userId) : null;

  // Queries
  const profileQuery = trpc.profile.getPublic.useQuery(
    { userId: userId ?? 0 },
    { enabled: !!userId }
  );
  const skillsQuery = trpc.skills.list.useQuery({ userId: userId ?? undefined });
  const reviewsQuery = trpc.reviews.getForUser.useQuery(
    { userId: userId ?? 0 },
    { enabled: !!userId }
  );

  if (!userId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const profile = profileQuery.data;
  const skills = skillsQuery.data || [];
  const reviews = reviewsQuery.data || [];

  const averageRating = profile ? parseFloat(profile.averageRating.toString()) : 0;
  const isReliable = (profile?.totalSessions || 0) >= 3;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Card */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {profile?.userId}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold">User Profile</h1>

                <div className="space-y-2">
                  {profile?.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {profile?.school && (
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        <span>{profile.school}</span>
                      </div>
                    )}
                    {profile?.grade && (
                      <span className="text-muted-foreground">Grade {profile.grade}</span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>

                {/* Badges */}
                <div className="flex gap-2 pt-2">
                  {isReliable && (
                    <div className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Reliable
                    </div>
                  )}
                  <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {profile?.totalSessions || 0} sessions completed
                  </div>
                </div>
              </div>
            </div>

            {currentUser?.id !== userId && (
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Request Session
              </Button>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Credit Balance</p>
            <p className="text-3xl font-bold text-primary">
              {profile ? parseFloat(profile.creditBalance.toString()).toFixed(1) : "—"}
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Sessions Completed</p>
            <p className="text-3xl font-bold">{profile?.totalSessions || 0}</p>
          </Card>

          <Card className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <p className="text-3xl font-bold">{averageRating.toFixed(1)}/5.0</p>
          </Card>
        </div>

        {/* Skills Offered */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Skills Offered
          </h2>

          {skills.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No skills listed yet.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card key={skill.id} className="p-4 space-y-2">
                  <h3 className="font-semibold">{skill.skillName}</h3>
                  {skill.category && (
                    <p className="text-sm text-muted-foreground">{skill.category}</p>
                  )}
                  {skill.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {skill.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No reviews yet. Be the first to review this student!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.reviewText && (
                    <p className="text-muted-foreground">{review.reviewText}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
