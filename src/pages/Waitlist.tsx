import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Waitlist() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'candidate' | 'company' | 'contributor'>('candidate');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([
                    {
                        email,
                        role,
                    },
                ]);

            if (error) {
                // Duplicate email might cause a unique constraint error
                if (error.code === '23505') {
                    toast({
                        title: 'Already on the waitlist',
                        description: "You're already signed up! We'll notify you when we launch.",
                    });
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: 'Welcome to the waitlist!',
                    description: "We'll notify you as soon as Wirre launches.",
                });
                setEmail('');
            }
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
                        <h1 className="font-mono text-4xl font-bold mb-2">Join the Waitlist</h1>
                        <p className="text-muted-foreground">
                            Wirre is in private beta. Sign up to get early access when we launch!
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

                        <div className="space-y-3">
                            <Label className="font-mono">I want to join as:</Label>
                            <RadioGroup value={role} onValueChange={(value: 'candidate' | 'company' | 'contributor') => setRole(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="candidate" id="candidate" />
                                    <Label htmlFor="candidate" className="font-mono cursor-pointer">
                                        Candidate
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="company" id="company" />
                                    <Label htmlFor="company" className="font-mono cursor-pointer">
                                        Organiser
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="contributor" id="contributor" />
                                    <Label htmlFor="contributor" className="font-mono cursor-pointer">
                                        Contributor
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-mono uppercase"
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Join Waitlist'}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                            By joining, you agree to our{' '}
                            <a href="/tnc" className="underline hover:text-foreground">
                                Terms & Conditions
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
