import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
            });

            if (error) throw error;

            toast({
                title: 'Check your email!',
                description: 'We sent you a 6-digit code. Enter it on the next page.',
            });

            navigate(`/set-password?email=${encodeURIComponent(email)}`);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h1 className="font-mono text-4xl font-bold mb-2">Sign Up</h1>
                        <p className="text-muted-foreground">
                            Join WIRRE as a candidate and start competing in commits!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-lg p-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-mono">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="font-mono"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-mono uppercase"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Sign Up'}
                        </Button>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground text-center">
                                By signing up, you agree to our{' '}
                                <a href="/tnc" className="underline hover:text-foreground">
                                    Terms & Conditions
                                </a>
                            </p>

                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground text-center">
                                    Want to organize assessments?{' '}
                                    <a
                                        href="mailto:thewirrecompany@gmail.com?subject=Beta Access Request - Organizer"
                                        className="underline hover:text-foreground font-semibold"
                                    >
                                        Email us for beta access
                                    </a>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
