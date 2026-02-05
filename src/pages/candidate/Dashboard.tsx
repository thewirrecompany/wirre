import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Terminal, Clock, CheckCircle, ArrowRight, User, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import CandidateRounds from './Rounds';
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

// Removed placeholder lists — keep profile settings and minimal status

interface CandidateDashboardProps {
  candidateUserId?: string | null;
}

export default function CandidateDashboard({ candidateUserId }: CandidateDashboardProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    github_username: "",
    linkedin_url: "",
  });

  useEffect(() => {
    const loadProfileData = async () => {
      const targetId = candidateUserId || profile?.id;
      if (!targetId) return;

      try {
        // Fetch profile row for target user (contains email)
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('full_name,email')
          .eq('id', targetId)
          .single();

        if (profileErr) {
          console.error('Error loading profile row:', profileErr);
        }

        // Get candidate profile data
        const { data: candidateRow, error: candidateError } = await supabase
          .from('candidates')
          .select('full_name, github_username, linkedin_url')
          .eq('user_id', targetId)
          .single();

        if (candidateError) {
          console.error('Error loading candidate data:', candidateError);
        }

        setProfileData({
          full_name: (candidateRow && candidateRow.full_name) || (profileRow && profileRow.full_name) || "",
          email: (profileRow && profileRow.email) || "",
          github_username: candidateRow?.github_username || "",
          linkedin_url: candidateRow?.linkedin_url || "",
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [profile?.id]);

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: profileData.full_name,
          github_username: profileData.github_username,
          linkedin_url: profileData.linkedin_url,
        })
        .eq('user_id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    const ok = window.confirm('Delete your account and all personal data? This cannot be undone.');
    if (!ok) return;

    try {
      // Delete profile row; cascading FKs will remove candidate/company/registrations
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;

      // sign out
      await supabase.auth.signOut();

      toast({ title: 'Account deleted', description: 'Your account and personal data have been removed.' });
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast({ title: 'Delete failed', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <OnboardingModal />
      <div className="py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold font-mono tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Your assessments and capability reports
            </p>
          </div>

          {/* Profile Settings */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </h2>
            <div className="border border-border p-6">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="full_name" className="font-mono text-sm">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="font-mono"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-mono text-sm">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="font-mono bg-muted"
                  />
                  <p className="text-xs text-muted-foreground font-mono">Email cannot be changed</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="github_username" className="font-mono text-sm">GitHub Username</Label>
                  <Input
                    id="github_username"
                    value={profileData.github_username}
                    onChange={(e) => setProfileData({ ...profileData, github_username: e.target.value })}
                    placeholder="octocat"
                    className="font-mono"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="linkedin_url" className="font-mono text-sm">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={profileData.linkedin_url}
                    onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="font-mono"
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="font-mono"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </section>

          {/* Candidate rounds (show when admin 'view as' or user wants to see rounds) */}
          {candidateUserId && (
            <section className="mb-12">
              <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2">Registered Rounds</h2>
              {/* lazy load rounds component to show registered/upcoming/finished */}
              {/* import dynamically to avoid circular imports */}
              <div>
                <CandidateRounds userId={candidateUserId} embedded />
              </div>
            </section>
          )}
          {/* Account deletion */}
          <section>
            <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </h2>
            <div className="border border-border p-6">
              <div className="mb-8 pb-8 border-b border-border">
                <h3 className="font-mono font-bold mb-2 uppercase text-sm">Security</h3>
                <p className="text-sm text-muted-foreground mb-4 font-mono">Reset your password.</p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const email = profile?.email;
                    if (!email) return;
                    try {
                      const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                          shouldCreateUser: false,
                        }
                      });
                      if (error) throw error;

                      toast({
                        title: 'Verification Code Sent',
                        description: `A code has been sent to ${email}`
                      });
                      navigate(`/set-password?email=${encodeURIComponent(email)}`);
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.message,
                        variant: 'destructive'
                      });
                    }
                  }}
                  className="font-mono uppercase text-xs tracking-widest"
                >
                  Reset Password
                </Button>
              </div>

              <h3 className="font-mono font-bold mb-2 uppercase text-sm text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4 font-mono">Delete your account and all personal data. This will remove your profile, candidate/company record and any registrations you made.</p>
              <Button variant="destructive" onClick={handleDeleteAccount} className="font-mono uppercase text-xs tracking-widest">Delete Account</Button>
            </div>
          </section>

          {/* Removed placeholder lists and prototype notices — profile settings remain */}
        </div>
      </div>
    </Layout>
  );
}
