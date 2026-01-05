import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminProfile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    // populate immediately from auth `profile` so the form isn't empty
    if (profile) {
      setFullName(profile.full_name || profile.name || '');
      setGithubUsername(profile.github_username || '');
      setLinkedinUrl(profile.linkedin_url || '');
    }
    loadProfile();
  }, [profile]);

  async function loadProfile() {
    if (!profile) return;
    try {
      // Load role-specific details: candidates and companies store extra fields.
      if (profile.role === 'candidate') {
        const { data, error } = await supabase.from('candidates').select('*').eq('user_id', profile.id).single();
        if (error) throw error;
        setFullName(data?.full_name || profile.full_name || profile.name || '');
        setGithubUsername(data?.github_username || '');
        setLinkedinUrl(data?.linkedin_url || '');
        return;
      }

      if (profile.role === 'company') {
        const { data, error } = await supabase.from('companies').select('*').eq('user_id', profile.id).single();
        if (error) throw error;
        setFullName(data?.name || profile.full_name || profile.name || '');
        setGithubUsername('');
        setLinkedinUrl(data?.linkedin_url || '');
        return;
      }

      // Admin / superadmin: use auth user metadata if available, otherwise fall back to profile/email
      const userMeta = (user as any)?.user_metadata || (user as any)?.user?.user_metadata || {};
      setFullName(userMeta.full_name || profile.full_name || profile.name || (profile.email ? profile.email.split('@')[0] : ''));
      setGithubUsername(userMeta.github_username || '');
      setLinkedinUrl(userMeta.linkedin_url || '');
    } catch (err) {
      console.error('Error loading admin profile:', err);
      // fallback to whatever we have in auth profile/user metadata
      const userMeta = (user as any)?.user_metadata || (user as any)?.user?.user_metadata || {};
      setFullName(userMeta.full_name || profile.full_name || profile.name || (profile.email ? profile.email.split('@')[0] : ''));
      setGithubUsername(userMeta.github_username || '');
      setLinkedinUrl(userMeta.linkedin_url || '');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      if (profile.role === 'candidate') {
        const { error } = await supabase.from('candidates').update({ full_name: fullName, github_username: githubUsername, linkedin_url: linkedinUrl }).eq('user_id', profile.id);
        if (error) throw error;
      } else if (profile.role === 'company') {
        const { error } = await supabase.from('companies').update({ name: fullName, linkedin_url: linkedinUrl }).eq('user_id', profile.id);
        if (error) throw error;
      } else {
        // Admin/superadmin: store in auth user metadata (client-side update for current user)
        const { error } = await supabase.auth.updateUser({ data: { full_name: fullName, github_username: githubUsername, linkedin_url: linkedinUrl } });
        if (error) throw error;
      }

      toast({ title: 'Profile updated', description: 'Your profile has been updated' });
      // refresh local view then navigate back
      await loadProfile();
      setTimeout(() => navigate(profile.role === 'admin' ? '/admin/dashboard' : '/'), 600);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      toast({ title: 'Update failed', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] flex items-center py-24">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-2xl">Your Profile</CardTitle>
              <CardDescription className="font-mono">View and update your admin profile (email cannot be changed)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-sm">Email</Label>
                  <Input id="email" type="email" value={profile?.email || ''} disabled className="font-mono" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-mono text-sm">Full Name</Label>
                  <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Admin" className="font-mono" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github" className="font-mono text-sm">GitHub Username</Label>
                  <Input id="github" type="text" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="janedoe" className="font-mono" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="font-mono text-sm">LinkedIn Profile URL</Label>
                  <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/janedoe" className="font-mono" />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving...' : 'Save'}</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>Back</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
