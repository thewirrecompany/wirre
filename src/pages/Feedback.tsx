import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Send, Star } from "lucide-react";

const RATING_LS_KEY = "wirre_guest_rated";

export default function Feedback() {
    const { user } = useAuth();
    const { toast } = useToast();

    // --- Rating state ---
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [fetchingRatings, setFetchingRatings] = useState(true);

    // --- Feedback state ---
    const [message, setMessage] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);

    // Load aggregate + user's existing rating
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
                            setExistingRatingId(mine.id);
                            setRatingSubmitted(true);
                        }
                    }
                }
            } catch {
                // silently ignore
            } finally {
                setFetchingRatings(false);
            }
            // Check if guest already rated this browser
            if (!user && localStorage.getItem(RATING_LS_KEY)) {
                setRatingSubmitted(true);
            }
        }
        load();
    }, [user]);

    const refreshAggregate = async () => {
        const { data } = await supabase.from("ratings").select("rating");
        if (data && data.length > 0) {
            const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
            setAverageRating(Math.round(avg * 10) / 10);
            setTotalCount(data.length);
        }
    };

    const handleRatingSubmit = async () => {
        if (selected === 0) return;
        setRatingLoading(true);
        try {
            if (user) {
                if (existingRatingId) {
                    const { error } = await supabase
                        .from("ratings")
                        .update({ rating: selected, updated_at: new Date().toISOString() })
                        .eq("id", existingRatingId);
                    if (error) throw error;
                } else {
                    const { data, error } = await supabase
                        .from("ratings")
                        .insert({ user_id: user.id, rating: selected })
                        .select("id")
                        .single();
                    if (error) throw error;
                    setExistingRatingId(data.id);
                }
            } else {
                // Guest rating — user_id is null
                const { error } = await supabase
                    .from("ratings")
                    .insert({ user_id: null, rating: selected });
                if (error) throw error;
                localStorage.setItem(RATING_LS_KEY, "1");
            }
            await refreshAggregate();
            setRatingSubmitted(true);
            toast({ title: existingRatingId ? "Rating Updated!" : "Thanks for rating us!", description: "Your rating means a lot to us." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to submit rating.", variant: "destructive" });
        } finally {
            setRatingLoading(false);
        }
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setFeedbackLoading(true);
        try {
            const { error } = await supabase.from("feedback").insert({
                user_id: user?.id || null,
                email: user?.email || (guestEmail.trim() || null),
                message: message.trim(),
            });
            if (error) throw error;
            toast({ title: "Feedback Sent!", description: "Thank you for your feedback. We appreciate it." });
            setMessage("");
            setGuestEmail("");
            setFeedbackSent(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to send feedback.", variant: "destructive" });
        } finally {
            setFeedbackLoading(false);
        }
    };

    const displayStars = hovered || selected;

    return (
        <Layout>
            <section className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
                <div className="container max-w-md py-12 space-y-12">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold font-mono mb-2 uppercase tracking-tighter">Feedback</h1>
                        <p className="text-muted-foreground font-mono text-xs uppercase">
                            Rate your experience and share your thoughts.
                        </p>
                    </div>

                    {/* --- Rating Section --- */}
                    <div className="space-y-4">
                        <p className="font-mono text-xs uppercase text-muted-foreground tracking-widest">Rate Us</p>

                        {/* Cumulative */}
                        {!fetchingRatings && totalCount > 0 && (
                            <div className="border border-border p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                            key={n}
                                            className={`w-4 h-4 ${
                                                n <= Math.round(averageRating)
                                                    ? "fill-foreground text-foreground"
                                                    : "fill-none text-muted-foreground"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="font-mono text-sm font-bold">{averageRating.toFixed(1)}</span>
                                <span className="font-mono text-xs text-muted-foreground">{totalCount} {totalCount === 1 ? "rating" : "ratings"}</span>
                            </div>
                        )}

                        {/* Star picker */}
                        {ratingSubmitted && !user ? (
                            <p className="font-mono text-xs text-muted-foreground text-center py-4">
                                Thanks for your rating!
                            </p>
                        ) : (
                            <div className="border border-border p-6 flex flex-col items-center gap-4">
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
                                                className={`w-9 h-9 transition-colors ${
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
                                    onClick={handleRatingSubmit}
                                    disabled={selected === 0 || ratingLoading}
                                    className="font-mono uppercase text-xs tracking-widest w-full rounded-none"
                                >
                                    {ratingLoading ? "Submitting..." : existingRatingId ? "Update Rating" : "Submit Rating"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* --- Feedback Section --- */}
                    <div className="space-y-4">
                        <p className="font-mono text-xs uppercase text-muted-foreground tracking-widest">Leave a Message</p>

                        {feedbackSent ? (
                            <div className="border border-border p-6 text-center">
                                <p className="font-mono text-sm">Thanks for your message!</p>
                                <button
                                    className="mt-3 font-mono text-xs uppercase text-muted-foreground underline hover:text-foreground"
                                    onClick={() => setFeedbackSent(false)}
                                >
                                    Send another
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-mono text-xs uppercase text-muted-foreground">
                                        Email {!user && "(Optional)"}
                                    </Label>
                                    {user ? (
                                        <Input
                                            id="email"
                                            value={user.email || ""}
                                            disabled
                                            className="font-mono rounded-none border-foreground bg-muted text-muted-foreground"
                                        />
                                    ) : (
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                            className="font-mono rounded-none border-foreground"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="font-mono text-xs uppercase text-muted-foreground">
                                        Message
                                    </Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Have a suggestion or found a bug? Let us know!"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="font-mono rounded-none border-foreground resize-none h-36"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full rounded-none uppercase font-mono tracking-widest"
                                    size="lg"
                                    disabled={feedbackLoading || !message.trim()}
                                >
                                    {feedbackLoading ? "Sending..." : "Send Feedback"}
                                    {!feedbackLoading && <Send className="w-4 h-4 ml-2" />}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
