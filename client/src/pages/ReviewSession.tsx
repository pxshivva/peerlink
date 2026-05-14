import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRoute } from "wouter";

export default function ReviewSession() {
  const { user } = useAuth();
  const [match, params] = useRoute("/review/:sessionId");
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null;

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Queries
  const sessionQuery = trpc.sessions.list.useQuery();

  // Mutations
  const createReviewMutation = trpc.reviews.create.useMutation();

  const sessions = sessionQuery.data || [];
  const session = sessions.find(s => s.id === sessionId);

  if (!sessionId || !session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Session not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine who is being reviewed
    const revieweeId = session.requesterId === user?.id ? session.providerId : session.requesterId;
    
    if (!revieweeId) {
      toast.error("Cannot identify session participant");
      return;
    }

    setLoading(true);

    try {
      await createReviewMutation.mutateAsync({
        sessionId: session.id,
        revieweeId,
        rating,
        reviewText,
      });

      toast.success("Review submitted! Thank you for your feedback.");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">How was your session?</h1>
          <p className="text-muted-foreground">
            Share your feedback to help build a trustworthy community.
          </p>
        </div>

        {/* Session Info */}
        <Card className="p-6 bg-muted/30">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Session Details</p>
            <h3 className="text-lg font-semibold">{session.skillName}</h3>
            <p className="text-sm text-muted-foreground">
              {session.hoursScheduled} hours • Completed
            </p>
          </div>
        </Card>

        {/* Review Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmitReview} className="space-y-8">
            {/* Rating */}
            <div className="space-y-4">
              <label className="text-lg font-semibold block">Your Rating</label>
              <div className="flex gap-4 justify-center py-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {rating === 5 && "Excellent!"}
                {rating === 4 && "Very Good"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </p>
            </div>

            {/* Review Text */}
            <div className="space-y-4">
              <label className="text-lg font-semibold block">Your Review (Optional)</label>
              <Textarea
                placeholder="Share your experience... What did you learn? How was the teaching?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {reviewText.length}/500 characters
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-8 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = "/dashboard"}
              >
                Skip
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Review
              </Button>
            </div>
          </form>
        </Card>

        {/* Info */}
        <Card className="p-6 bg-secondary/10 border-secondary/20">
          <p className="text-sm text-muted-foreground">
            <strong>💡 Tip:</strong> Honest reviews help the community identify great teachers and learners. Be constructive and fair in your feedback.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
