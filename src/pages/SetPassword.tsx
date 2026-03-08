import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function SetPassword() {
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const rawRedirect = params.get("redirect");
    const redirectTo = rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : null;

    useEffect(() => {
        if (!email) {
            toast({
                title: "Error",
                description: "Email is missing. Please try logging in again.",
                variant: "destructive",
            });
            navigate("/login");
        }
    }, [email, navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // 1. Verify the OTP with Supabase Auth
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                email: email!,
                token: otp,
                type: 'email',
            });

            if (verifyError) throw verifyError;

            // 2. Once verified, we have a session. Update the password.
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) throw updateError;

            toast({
                title: "Success",
                description: "Password set successfully. You are now logged in.",
            });

            // Redirect to dashboard based on role
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', verifyData.user?.id)
                .single();

            const role = profileData?.role || 'candidate';
            navigate(redirectTo ?? `/${role}/dashboard`);
        } catch (error: any) {
            console.error('Set password error:', error);
            toast({
                title: "Failed to set password",
                description: error.message,
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
                    <h1 className="text-3xl font-bold font-mono text-center mb-2 uppercase tracking-tighter">Set Password</h1>
                    <p className="text-muted-foreground font-mono text-xs text-center mb-8 uppercase">
                        Enter the OTP sent to {email} and set your password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground">OTP Code</Label>
                            <Input
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                className="font-mono rounded-none border-foreground text-center text-2xl tracking-[0.5em] text-foreground bg-background"
                                maxLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground">New Password</Label>
                            <div className="relative">
                                <Input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="font-mono rounded-none border-foreground pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    required
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="font-mono rounded-none border-foreground pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full rounded-none uppercase font-mono tracking-widest" size="lg" disabled={loading}>
                            {loading ? "Processing..." : "Set Password"}
                        </Button>
                    </form>
                </div>
            </section>
        </Layout>
    );
}
