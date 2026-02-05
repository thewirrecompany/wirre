import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus } from "lucide-react";

interface FeedbackModalProps {
    trigger?: React.ReactNode;
}

export function FeedbackModal({ trigger }: FeedbackModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [loading, setLoading] = useState(false);

    // Function to handle form submission
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
            setOpen(false);
            setMessage("");
            setGuestEmail("");
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                        <MessageSquarePlus className="h-4 w-4" />
                        Give Feedback
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send Feedback</DialogTitle>
                    <DialogDescription>
                        Have a suggestion or found a bug? Let us know!
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">
                            Email {!user && <span className="text-muted-foreground">(Optional)</span>}
                        </Label>
                        {user ? (
                            <Input
                                id="email"
                                value={user.email || ""}
                                disabled
                                className="bg-muted text-muted-foreground"
                            />
                        ) : (
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                            />
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your feedback here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="resize-none h-32"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !message.trim()}>
                            {loading ? "Sending..." : "Send Feedback"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
