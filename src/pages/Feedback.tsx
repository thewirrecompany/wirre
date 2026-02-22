import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Feedback() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase.from("feedback").insert({
                user_id: user?.id || null,
                email: user?.email || (guestEmail.trim() || null),
                message: message.trim(),
            });

            if (error) throw error;

            toast({
                title: "Feedback Sent!",
                description: "Thank you for your feedback. We appreciate it.",
            });
            setMessage("");
            setGuestEmail("");

            // Optionally redirect back to home or dashboard after submitting
            navigate(-1);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send feedback.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <section className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
                <div className="container max-w-md py-12">
                    <h1 className="text-3xl font-bold font-mono text-center mb-2 uppercase tracking-tighter">Feedback</h1>
                    <p className="text-muted-foreground font-mono text-xs text-center mb-8 uppercase">
                        Have a suggestion or found a bug? Let us know!
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                placeholder="Type your feedback here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="font-mono rounded-none border-foreground resize-none h-40"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full rounded-none uppercase font-mono tracking-widest" size="lg" disabled={loading || !message.trim()}>
                            {loading ? "Sending..." : "Send Feedback"}
                            {!loading && <Send className="w-4 h-4 ml-2" />}
                        </Button>
                    </form>
                </div>
            </section>
        </Layout>
    );
}
