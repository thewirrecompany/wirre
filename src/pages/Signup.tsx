import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupType = "company" | "candidate";

export default function Signup() {
  const [signupType, setSignupType] = useState<SignupType>("company");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI only - no functionality
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] flex items-center">
        <div className="container max-w-md py-24">
          <h1 className="text-3xl font-bold font-mono tracking-tight mb-2">
            Request Access
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-8">
            Join WIRRE to evaluate real engineering work
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

            <Button type="submit" className="w-full" size="lg">
              Request Access as {signupType === "company" ? "Company" : "Candidate"}
            </Button>
          </form>

          <div className="mt-8 p-4 border border-border bg-secondary/50">
            <p className="text-xs text-muted-foreground font-mono">
              Account creation not yet active. This is a frontend prototype only.
            </p>
          </div>

          <p className="mt-8 text-sm text-muted-foreground font-mono text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
