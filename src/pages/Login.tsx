import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type LoginType = "company" | "candidate";

export default function Login() {
  const [loginType, setLoginType] = useState<LoginType>("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user's role matches selected login type
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== loginType) {
        await supabase.auth.signOut();
        throw new Error(`This account is not registered as a ${loginType}`);
      }

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });

      // Navigate to appropriate dashboard
      if (profile.role === 'company') {
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
          <p className="text-muted-foreground font-mono text-sm mb-8">
            Access your WIRRE dashboard
          </p>

          {/* Login Type Tabs */}
          <div className="flex border border-border mb-8">
            <button
              onClick={() => setLoginType("company")}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                loginType === "company"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Company
            </button>
            <button
              onClick={() => setLoginType("candidate")}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors border-l border-border ${
                loginType === "candidate"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Candidate
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="font-mono"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Logging in..." : `Login as ${loginType === "company" ? "Company" : "Candidate"}`}
            </Button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground font-mono text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-foreground hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
