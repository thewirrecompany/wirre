import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [signupType, setSignupType] = useState<"company" | "candidate">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass 'role' and 'name' as metadata. 
      // The DB Trigger will catch these and create your profiles/companies automatically.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: signupType,
            name: name,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });

      navigate('/login');
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
      <section className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
        <div className="container max-w-md py-12">
          <h1 className="text-3xl font-bold font-mono text-center mb-8 uppercase tracking-tighter">Sign Up</h1>

          <div className="flex border border-foreground mb-8">
            <button
              onClick={() => setSignupType("company")}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest transition-all ${
                signupType === "company" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Company
            </button>
            <button
              onClick={() => setSignupType("candidate")}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest border-l border-foreground transition-all ${
                signupType === "candidate" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Candidate
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase text-muted-foreground">
                {signupType === "company" ? "Company Name" : "Full Name"}
              </Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="font-mono rounded-none border-foreground" />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase text-muted-foreground">
                Email <span className="text-red-500 normal-case text-[10px]">[email cannot be changed]</span>
              </Label>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono rounded-none border-foreground" />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase text-muted-foreground">Password</Label>
              <div className="relative">
                <Input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono rounded-none border-foreground pr-10" />
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
              {loading ? "Processing..." : `Join as ${signupType}`}
            </Button>
          </form>

          <p className="mt-8 text-xs font-mono text-center uppercase text-muted-foreground">
            Already have an account? <Link to="/login" className="text-foreground underline">Login</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}