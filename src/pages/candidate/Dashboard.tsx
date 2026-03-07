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
        username: "",
        is_public: false,
        email: "",
        github_username: "",
        linkedin_url: "",
        date_of_birth: "",
    });
    const [initialUsername, setInitialUsername] = useState("");
    const [dobSet, setDobSet] = useState(false);

    const [initialGithubUsername, setInitialGithubUsername] = useState("");
    const [hasActiveRounds, setHasActiveRounds] = useState(false);
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    useEffect(() => {
        const loadProfileData = async () => {
            const targetId = candidateUserId || profile?.id;
            if (!targetId) return;

            try {
                // Fetch profile row for target user (contains email)
                const { data: profileRow } = await supabase.from('profiles').select('email').eq('id', targetId).single();

                // Get candidate profile data
                const { data: candidateRow } = await supabase
                    .from('candidates')
                    .select('full_name, username, is_public, github_username, linkedin_url, date_of_birth')
                    .eq('user_id', targetId)
                    .single();

                setProfileData({
                    full_name: candidateRow?.full_name || "",
                    username: candidateRow?.username || "",
                    is_public: candidateRow?.is_public ?? false,
                    email: profileRow?.email || "",
                    github_username: candidateRow?.github_username || "",
                    linkedin_url: candidateRow?.linkedin_url || "",
                    date_of_birth: candidateRow?.date_of_birth || "",
                });

                if (candidateRow?.username) {
                    setInitialUsername(candidateRow.username);
                }

                if (candidateRow?.github_username) {
                    setInitialGithubUsername(candidateRow.github_username);
                }

                if (candidateRow?.date_of_birth) {
                    setDobSet(true);
                }

                // Check for active rounds (for warning logic)
                const { data: currentRegs } = await supabase
                    .from('assessment_registrations')
                    .select('assessment_id, finished_at, assessments(start_at, duration_minutes, emergency_abandoned, is_sample)')
                    .eq('user_id', targetId);

                if (currentRegs) {
                    const now = Date.now();
                    const active = currentRegs.some((reg: any) => {
                        if (reg.finished_at) return false;
                        const assessment = reg.assessments;
                        if (!assessment) return false;
                        if (assessment.emergency_abandoned) return false;
                        // Sample rounds: active if repo is provisioned (no fixed start_at)
                        if (assessment.is_sample) return false; // sample rounds don't affect GitHub username warning
                        if (!assessment.start_at) return false;
                        const start = new Date(assessment.start_at).getTime();
                        const end = start + (assessment.duration_minutes * 60 * 1000);
                        return now >= start && now <= end;
                    });
                    setHasActiveRounds(active);
                }

            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [profile?.id, candidateUserId]);

    const handleSaveAttempt = async () => {
        // Check if github username changed AND active rounds exist
        if (initialGithubUsername && profileData.github_username !== initialGithubUsername && hasActiveRounds) {
            setShowWarningDialog(true);
        } else {
            handleSave();
        }
    };

    const handleSave = async () => {
        if (!profile?.id) return;

        setSaving(true);
        setShowWarningDialog(false);

        try {

            // Sync Logic: If GitHub username changed, update access on active repositories
            if (initialGithubUsername && initialGithubUsername !== profileData.github_username) {
                console.log('Detected username change, syncing access...');
                const { error: fnError } = await supabase.functions.invoke('update-github-access', {
                    body: {
                        userId: profile.id,
                        oldUsername: initialGithubUsername,
                        newUsername: profileData.github_username
                    }
                });
                if (fnError) {
                    console.error('Failed to sync GitHub access:', fnError);
                    throw new Error('Failed to synchronize GitHub permissions. Please try again.');
                }
            }

            // Check if username is taken
            if (profileData.username !== initialUsername) {
                // Validate Username formatting (optional alphanumeric constraints)
                if (!/^[a-zA-Z0-9_.-]+$/.test(profileData.username)) {
                    throw new Error('Username can only contain letters, numbers, underscores, dots, and hyphens');
                }

                const { data: existingUser, error: checkError } = await supabase
                    .from('candidates')
                    .select('id')
                    .eq('username', profileData.username)
                    .neq('user_id', profile.id)
                    .single();

                if (existingUser && !checkError) {
                    throw new Error('Username is already taken. Please choose another one.');
                }
            }

            const { error } = await supabase
                .from('candidates')
                .update({
                    full_name: profileData.full_name,
                    username: profileData.username,
                    is_public: profileData.is_public,
                    github_username: profileData.github_username,
                    linkedin_url: profileData.linkedin_url,
                    date_of_birth: profileData.date_of_birth || null,
                })
                .eq('user_id', profile.id);

            if (error) throw error;

            // Also update github_username in all assessment_registrations for this user
            const { error: regError } = await supabase
                .from('assessment_registrations')
                .update({ github_username: profileData.github_username })
                .eq('user_id', profile.id);

            if (regError) {
                console.error('Error updating assessment registrations:', regError);
            }

            setInitialGithubUsername(profileData.github_username);
            setInitialUsername(profileData.username);

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
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
            <div className="py-8 md:py-12">
                <div className="container px-4 md:px-6 max-w-4xl">
                    {/* Header */}
                    <div className="mb-8 md:mb-12 text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground font-mono text-xs md:text-sm mt-1">
                            Your assessments and capability reports
                        </p>
                    </div>

                    {/* Profile Settings */}
                    <section className="mb-12">
                        <h2 className="text-lg md:text-xl font-bold font-mono mb-6 flex items-center gap-2 justify-center md:justify-start">
                            <User className="h-5 w-5" />
                            Profile Settings
                        </h2>
                        <div className="border border-border p-4 md:p-8 bg-card/30 rounded-sm">
                            {hasActiveRounds && (
                                <div className="mb-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-sm flex items-start gap-4">
                                    <div className="h-5 w-5 mt-0.5 text-yellow-500 flex-shrink-0">⚠️</div>
                                    <div>
                                        <p className="font-mono text-xs md:text-sm font-semibold text-yellow-500 uppercase tracking-wider">Active Assessment Warning</p>
                                        <p className="font-mono text-[10px] md:text-xs text-muted-foreground mt-2 leading-relaxed">
                                            You have an active assessment in progress. Changing your GitHub username now
                                            may temporarily disrupt repository access.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name" className="font-mono text-xs md:text-sm uppercase text-muted-foreground">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        className="font-mono h-10 md:h-11"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="username" className="font-mono text-xs md:text-sm uppercase text-muted-foreground">Username</Label>
                                    <Input
                                        id="username"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value.toLowerCase() })}
                                        className="font-mono h-10 md:h-11"
                                        disabled={loading || !!initialUsername}
                                        placeholder="johndoe123"
                                    />
                                    {initialUsername ? (
                                        <p className="text-[10px] text-muted-foreground font-mono">Username is permanently set and cannot be changed.</p>
                                    ) : (
                                        <p className="text-[10px] text-red-500 font-mono font-medium">Once set, your username cannot be changed.</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="font-mono text-xs md:text-sm uppercase text-muted-foreground">Email</Label>
                                    <Input
                                        id="email"
                                        value={profileData.email}
                                        disabled
                                        className="font-mono h-10 md:h-11 bg-muted/50 border-dashed"
                                    />
                                    <p className="text-[10px] text-muted-foreground font-mono italic">Email cannot be changed</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="github_username" className="font-mono text-xs md:text-sm uppercase text-muted-foreground">GitHub Username</Label>
                                    <Input
                                        id="github_username"
                                        value={profileData.github_username}
                                        onChange={(e) => setProfileData({ ...profileData, github_username: e.target.value })}
                                        placeholder="octocat"
                                        className="font-mono h-10 md:h-11"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="linkedin_url" className="font-mono text-xs md:text-sm uppercase text-muted-foreground">LinkedIn URL</Label>
                                    <Input
                                        id="linkedin_url"
                                        value={profileData.linkedin_url}
                                        onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        className="font-mono h-10 md:h-11"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="dob" className="font-mono text-xs md:text-sm uppercase text-muted-foreground">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={profileData.date_of_birth}
                                        onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                                        className="font-mono h-10 md:h-11"
                                        disabled={loading || dobSet}
                                    />
                                    {dobSet && <p className="text-[10px] text-muted-foreground font-mono">Date of birth is permanently set and cannot be changed.</p>}
                                    {!dobSet && <p className="text-[10px] text-muted-foreground font-mono">You can only set this once. Please ensure it is correct.</p>}
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="isPublic"
                                            checked={profileData.is_public}
                                            onChange={(e) => setProfileData({ ...profileData, is_public: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-transparent"
                                        />
                                        <Label htmlFor="isPublic" className="font-mono text-xs md:text-sm uppercase tracking-wider">
                                            Public Profile
                                        </Label>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-muted-foreground font-mono leading-relaxed pl-6">
                                        If active, your GitHub username, LinkedIn account, and full name will be visible on the leaderboard. If private, only your username will be displayed.
                                    </p>
                                </div>

                                <Button
                                    onClick={handleSaveAttempt}
                                    disabled={loading || saving}
                                    className="font-mono w-full md:w-auto h-11 px-8"
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
                            <h2 className="text-lg md:text-xl font-bold font-mono mb-6 flex items-center gap-2 justify-center md:justify-start">Registered Rounds</h2>
                            {/* lazy load rounds component to show registered/upcoming/finished */}
                            {/* import dynamically to avoid circular imports */}
                            <div className="border border-border p-4 bg-card/30 rounded-sm">
                                <CandidateRounds userId={candidateUserId} embedded />
                            </div>
                        </section>
                    )}
                    {/* Account deletion */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold font-mono mb-6 flex items-center gap-2 justify-center md:justify-start">
                            <User className="h-5 w-5" />
                            Account
                        </h2>
                        <div className="border border-border p-4 md:p-8 bg-destructive/5 border-destructive/20 rounded-sm">
                            <p className="text-xs md:text-sm text-muted-foreground mb-6 leading-relaxed">
                                Delete your account and all personal data. This will irreversibly remove your profile,
                                candidate/company record and any registrations you made.
                            </p>
                            <Button variant="destructive" onClick={handleDeleteAccount} className="font-mono w-full md:w-auto h-11">
                                Delete Account
                            </Button>
                        </div>
                    </section>

                    {/* Removed placeholder lists and prototype notices — profile settings remain */}
                </div>
            </div>

            {/* Warning Dialog */}
            {showWarningDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="bg-card border p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-2 text-destructive">Wait! Active Assessment In Progress</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            You are currently part of an active round. Changing your GitHub username now <strong>will temporarily revoke your repository access</strong> until the system re-syncs.
                            <br /><br />
                            This could interfere with your submission if you are pushing code right now. Are you sure you want to proceed?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleSave}>
                                Yes, Update Anyway
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
