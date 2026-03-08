import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function RateUs() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRatings, setFetchingRatings] = useState(true);

  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  // Fetch aggregate rating + current user's rating
  useEffect(() => {
    async function load() {
      setFetchingRatings(true);
      try {
        const { data, error } = await supabase
          .from("ratings")
          .select("id, user_id, rating");

        if (error) throw error;

        if (data && data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
          setTotalCount(data.length);

          if (user) {
            const mine = data.find((r) => r.user_id === user.id);
            if (mine) {
              setSelected(mine.rating);
              setExistingId(mine.id);
            }
          }
        }
      } catch {
        // silently ignore — ratings table may not exist yet
      } finally {
        setFetchingRatings(false);
      }
    }
    load();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || selected === 0) return;
    setLoading(true);
    try {
      if (existingId) {
        const { error } = await supabase
          .from("ratings")
          .update({ rating: selected, updated_at: new Date().toISOString() })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ratings")
          .insert({ user_id: user.id, rating: selected })
          .select("id")
          .single();
        if (error) throw error;
        setExistingId(data.id);
      }

      // Recalculate local aggregate
      const { data: all, error: fetchErr } = await supabase
        .from("ratings")
        .select("rating");
      if (!fetchErr && all) {
        const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalCount(all.length);
      }

      toast({
        title: existingId ? "Rating Updated!" : "Thanks for rating us!",
        description: "Your feedback means a lot to us.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayStars = hovered || selected;

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
        <div className="container max-w-md py-12">
          <h1 className="text-3xl font-bold font-mono text-center mb-2 uppercase tracking-tighter">
            Rate Us
          </h1>
          <p className="text-muted-foreground font-mono text-xs text-center mb-8 uppercase">
            How has your experience been with WIRRE?
          </p>

          {/* Cumulative Rating */}
          {!fetchingRatings && totalCount > 0 && (
            <div className="border border-border p-6 mb-8 text-center">
              <p className="text-xs font-mono text-muted-foreground uppercase mb-2">
                Overall Rating
              </p>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-5 h-5 ${
                      n <= Math.round(averageRating)
                        ? "fill-foreground text-foreground"
                        : "fill-none text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-2xl font-mono font-bold">
                {averageRating.toFixed(1)}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {totalCount} {totalCount === 1 ? "rating" : "ratings"}
              </p>
            </div>
          )}

          {/* Star Input */}
          {user ? (
            <div className="border border-border p-8 flex flex-col items-center gap-6">
              <p className="text-xs font-mono text-muted-foreground uppercase">
                {existingId ? "Update your rating" : "Tap a star to rate"}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setSelected(n)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        n <= displayStars
                          ? "fill-foreground text-foreground"
                          : "fill-none text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {selected > 0 && (
                <p className="text-xs font-mono text-muted-foreground">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][selected]}
                </p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={selected === 0 || loading}
                className="font-mono uppercase text-xs tracking-widest w-full rounded-none"
              >
                {loading
                  ? "Submitting..."
                  : existingId
                  ? "Update Rating"
                  : "Submit Rating"}
              </Button>
            </div>
          ) : (
            <div className="border border-border p-8 flex flex-col items-center gap-4 text-center">
              <div className="flex gap-2 opacity-30 pointer-events-none select-none">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="w-10 h-10 fill-none text-muted-foreground" />
                ))}
              </div>
              <p className="text-sm font-mono text-muted-foreground">
                You need to be logged in to leave a rating.
              </p>
              <div className="flex gap-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="font-mono uppercase text-xs tracking-widest rounded-none"
                >
                  <Link to="/login?redirect=/rateus">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="font-mono uppercase text-xs tracking-widest rounded-none"
                >
                  <Link to="/signup?redirect=/rateus">Sign Up</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
