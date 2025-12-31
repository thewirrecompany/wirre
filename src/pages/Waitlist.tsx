import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"candidate" | "company">("candidate");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast({ title: "Email required" });
    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert([{ email, role }]);
      if (error) {
        toast({ title: "Error", description: error.message });
      } else {
        toast({ title: "Thanks!", description: "You've been added to the waitlist." });
        setEmail("");
      }
    } catch (err: any) {
      toast({ title: "Error", description: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center">
        <div className="container py-24 max-w-2xl">
          <h1 className="text-4xl font-bold font-mono mb-4">Join the waitlist</h1>
          <p className="text-muted-foreground mb-6">Sign up to be notified when we open access.</p>

          <form onSubmit={submit} className="grid gap-4">
            <label className="font-mono text-sm">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" />

            <label className="font-mono text-sm">I'm a</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="bg-input border border-border p-2 rounded">
              <option value="candidate">Candidate</option>
              <option value="company">Company</option>
            </select>

            <div>
              <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Join waitlist"}</Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
