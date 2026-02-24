//lgiin

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Send } from "lucide-react";

type LoginType = "company" | "candidate";

export default function Login() {
  const [loginType, setLoginType] = useState<LoginType>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to receive an OTP.",
        variant: "destructive",
      });
      return;
    }

    setSendingOtp(true);
    try {
      // Proceed to send the OTP. Email existence check removed due to RLS limitations 
      // for unauthenticated users and to prevent email enumeration.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/set-password`,
        }
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: `A verification code/link has been sent to ${email}`,
      });

      navigate(`/set-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error('OTP error:', error);

      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. If you are logging in for the first time, please use the OTP flow below.");
        }
        throw error;
      }

      // Check if user's role matches selected login type
      let profile: any = null
      const { data: profData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      profile = profData;

      if (!profile || !profile.role) throw new Error('Profile not found or missing role');

      // Allow admins and superadmins to login from any tab
      if (profile.role === 'superadmin') {
        navigate('/superadmin/dashboard');
        toast({
          title: 'Login successful',
          description: 'Welcome, Superadmin!'
        });
        return;
      }
      if (profile.role !== 'admin' && profile.role !== loginType) {
        await supabase.auth.signOut();
        throw new Error(`This account is not registered as a ${loginType}`);
      }

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });

      // Navigate to appropriate dashboard
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (profile.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] flex items-center">
        <div className="container max-w-md py-24">
          <h1 className="text-3xl font-bold font-mono tracking-tight mb-2">
            Login
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-8 uppercase">
            Access your WIRRE dashboard
          </p>

          <div className="flex border border-foreground mb-8">
            <button
              onClick={() => setLoginType("company")}
              className={`flex-1 py-3 px-4 font-mono text-xs uppercase tracking-widest transition-all ${loginType === "company"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Organiser
            </button>
            <button
              onClick={() => setLoginType("candidate")}
              className={`flex-1 py-3 px-4 font-mono text-xs uppercase tracking-widest border-l border-foreground transition-all ${loginType === "candidate"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Candidate
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="font-mono rounded-none border-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="font-mono text-xs uppercase">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono rounded-none border-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-none uppercase font-mono tracking-widest" size="lg" disabled={loading}>
              {loading ? "Logging in..." : `Login as ${loginType}`}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-dashed border-muted-foreground">
            <p className="text-xs font-mono text-muted-foreground uppercase text-center mb-4">
              First-time login or forgot password?
            </p>
            <Button
              variant="outline"
              className="w-full rounded-none uppercase font-mono tracking-widest border-foreground hover:bg-foreground hover:text-background"
              onClick={handleSendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? "Sending..." : "Send Verification Code"}
              {!sendingOtp && <Send className="ml-2 h-3 w-3" />}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
