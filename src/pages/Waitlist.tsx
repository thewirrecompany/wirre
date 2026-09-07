import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            toast({
                title: 'Please accept our policies',
                description: 'You must agree to the Terms & Conditions and Privacy Policy to sign up.',
                variant: 'destructive',
            });
            return;
        }
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

                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="agree-terms"
                                checked={agreed}
                                onCheckedChange={(checked) => setAgreed(checked === true)}
                                className="mt-0.5"
                            />
                            <Label htmlFor="agree-terms" className="text-xs font-normal text-muted-foreground leading-snug cursor-pointer">
                                I agree to the{' '}
                                <a href="/tnc" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                                    Terms &amp; Conditions
                                </a>{' '}
                                and{' '}
                                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                                    Privacy Policy
                                </a>
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-mono uppercase"
                            disabled={loading || !agreed}
                        >
                            {loading ? 'Sending...' : 'Sign Up'}
                        </Button>

                        <div className="space-y-2">
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
