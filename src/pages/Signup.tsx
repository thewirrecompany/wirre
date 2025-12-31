import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type SignupType = "company" | "candidate";

export default function Signup() {
  const [signupType, setSignupType] = useState<SignupType>("company");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Complete signup with role-specific data using RPC functions
      if (signupType === 'company') {
        const { error: companyError } = await supabase.rpc('complete_company_signup', {
          p_user_id: authData.user.id,
          p_email: email,
          p_name: name,
        });

        if (companyError) throw companyError;
      } else {
        const { error: candidateError } = await supabase.rpc('complete_candidate_signup', {
          p_user_id: authData.user.id,
          p_email: email,
          p_full_name: name,
        });

        if (candidateError) throw candidateError;
      }

      toast({
        title: "Account created successfully",
        description: "You can now login with your credentials.",
      });

      navigate('/waitlist');
    } catch (error: any) {
      toast({
        title: "Signup failed",
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
            Sign Up
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-8">
            Create your WIRRE account
          </p>

          {/* Signup Type Tabs */}
          <div className="flex border border-border mb-8">
            <button
              onClick={() => setSignupType("company")}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                signupType === "company"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Company
            </button>
            <button
              onClick={() => setSignupType("candidate")}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors border-l border-border ${
                signupType === "candidate"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Candidate
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-sm">
                {signupType === "company" ? "Company Name" : "Full Name"}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={signupType === "company" ? "Acme Inc." : "Jane Doe"}
                className="font-mono"
              />
            </div>

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
              {loading ? "Creating account..." : `Sign Up as ${signupType === "company" ? "Company" : "Candidate"}`}
            </Button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground font-mono text-center">
            Already have an account?{" "}
            <Link to="/waitlist" className="text-foreground hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
