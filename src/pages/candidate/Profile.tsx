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
import { Github, Linkedin, CheckCircle } from "lucide-react";

export default function CandidateProfile() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [githubUsername, setGithubUsername] = useState("");
    const [initialGithubUsername, setInitialGithubUsername] = useState("");

    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    const [hasActiveRounds, setHasActiveRounds] = useState(false);
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            // Load candidate profile
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setFullName(data.full_name || '');
                setGithubUsername(data.github_username || '');
                setInitialGithubUsername(data.github_username || '');
                console.log('Loaded profile, initial Github:', data.github_username);
                setLinkedinUrl(data.linkedin_url || '');
                setDateOfBirth(data.date_of_birth || '');

                // Check if profile is complete
                const complete = !!(data.full_name && data.github_username && data.linkedin_url && data.date_of_birth);
                setIsComplete(complete);
            }

            // Check for active rounds
            const { data: currentRegs } = await supabase
                .from('assessment_registrations')
                .select('assessment_id, assessments(start_at, duration_minutes)')
                .eq('user_id', user.id);

            if (currentRegs) {
                const now = Date.now();
                console.log('DEBUG: Checking active rounds at', new Date(now).toISOString());
                console.log('DEBUG: Registrations found:', currentRegs.length, currentRegs);

                const active = currentRegs.some((reg: any) => {
                    const assessment = reg.assessments;
                    if (!assessment || !assessment.start_at) return false;

                    const start = new Date(assessment.start_at).getTime();
                    const end = start + (assessment.duration_minutes * 60 * 1000);

                    console.log(`DEBUG: Assessment ${assessment.id}`);
                    console.log(`DEBUG: Start: ${new Date(start).toISOString()} (${start})`);
                    console.log(`DEBUG: End:   ${new Date(end).toISOString()} (${end})`);
                    console.log(`DEBUG: Now:   ${new Date(now).toISOString()} (${now})`);

                    const isActive = now >= start && now <= end;
                    console.log(`DEBUG: Result: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
                    return isActive;
                });
                console.log('DEBUG: Final hasActiveRounds:', active);
                setHasActiveRounds(active);
            }

        } catch (error: any) {
            console.error('Error loading profile:', error);
        }
    };

    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If user is trying to change GitHub username AND has active rounds, show warning
        if (initialGithubUsername && githubUsername !== initialGithubUsername && hasActiveRounds) {
            setShowWarningDialog(true);
        } else {
            submitProfile();
        }
    };

    const submitProfile = async () => {
        setShowWarningDialog(false);
        setLoading(true);

        try {
            if (!fullName || !githubUsername || !linkedinUrl) {
                throw new Error('All fields are required');
            }

            // Validate GitHub username format
            if (!/^[a-zA-Z0-9-]+$/.test(githubUsername)) {
                throw new Error('Invalid GitHub username format');
            }

            // Validate LinkedIn URL
            if (!linkedinUrl.includes('linkedin.com/in/')) {
                throw new Error('Please enter a valid LinkedIn profile URL');
            }

            console.log('Checking for GitHub access update:', { initialGithubUsername, githubUsername });

            let oldUsername = initialGithubUsername;
            if (!oldUsername) {
                // Fallback: fetch from DB to ensure we have the "before" state
                const { data: dbData } = await supabase.from('candidates').select('github_username').eq('user_id', user!.id).single();
                if (dbData?.github_username) {
                    oldUsername = dbData.github_username;
                    console.log('Fetched fallback username from DB:', oldUsername);
                }
            }

            // If GitHub username changed, update access on active repositories
            if (oldUsername && oldUsername !== githubUsername) {
                console.log('Invoking update-github-access function...');
                const { error: fnError } = await supabase.functions.invoke('update-github-access', {
                    body: {
                        userId: user!.id,
                        oldUsername: oldUsername,
                        newUsername: githubUsername
                    }
                });

                if (fnError) {
                    console.error('Failed to update GitHub access:', fnError);
                    // We warn but allow proceed? Or block? 
                    // Logic: If this fails, the user will have a new username in DB but old permissions on GitHub.
                    // Blocking is safer.
                    throw new Error(`Failed to update GitHub permissions. Old access could not be revoked.`);
                }
            }

            const { error } = await supabase
                .from('candidates')
                .update({
                    full_name: fullName,
                    github_username: githubUsername,
                    linkedin_url: linkedinUrl,
                    date_of_birth: dateOfBirth || null,
                })
                .eq('user_id', user!.id);

            if (error) throw error;

            // Also update github_username in all assessment_registrations for this user
            const { error: regError } = await supabase
                .from('assessment_registrations')
                .update({ github_username: githubUsername })
                .eq('user_id', user!.id);

            if (regError) {
                console.error('Error updating assessment registrations:', regError);
                // Don't fail the whole operation if this fails
            }

            // Update initial state to new value
            setInitialGithubUsername(githubUsername);

            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated",
            });

            setIsComplete(true);

            // Redirect to opportunities page after 1 second
            setTimeout(() => {
                navigate('/candidate/opportunities');
            }, 1000);
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
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
                            <CardTitle className="font-mono text-2xl">Complete Your Profile</CardTitle>
                            <CardDescription className="font-mono">
                                Add your GitHub and LinkedIn to participate in assessment rounds
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isComplete && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="font-mono text-sm font-semibold text-green-500">Profile Complete</p>
                                        <p className="font-mono text-xs text-muted-foreground">
                                            You can now register for assessment rounds
                                        </p>
                                    </div>
                                </div>
                            )}

                            {hasActiveRounds && (
                                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md flex items-start gap-3">
                                    <div className="h-5 w-5 mt-0.5 text-yellow-500 flex-shrink-0">⚠️</div>
                                    <div>
                                        <p className="font-mono text-sm font-semibold text-yellow-500">Active Assessment Warning</p>
                                        <p className="font-mono text-xs text-muted-foreground mt-1">
                                            You are currently registered for an ongoing assessment. Changing your GitHub username now
                                            may briefly disrupt your access to the repository. It is recommended to change it only
                                            if strictly necessary, or wait until the round ends.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleInitialSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="font-mono text-sm">
                                        Full Name
                                    </Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Jane Doe"
                                        className="font-mono"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="github" className="font-mono text-sm flex items-center gap-2">
                                        <Github className="h-4 w-4" />
                                        GitHub Username
                                    </Label>
                                    <div className="flex items-center">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-muted-foreground text-sm font-mono">
                                            github.com/
                                        </span>
                                        <Input
                                            id="github"
                                            type="text"
                                            value={githubUsername}
                                            onChange={(e) => setGithubUsername(e.target.value)}
                                            placeholder="janedoe"
                                            className="font-mono rounded-l-none"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        Your GitHub username (e.g., "janedoe" from github.com/janedoe)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin" className="font-mono text-sm flex items-center gap-2">
                                        <Linkedin className="h-4 w-4" />
                                        LinkedIn Profile URL
                                    </Label>
                                    <Input
                                        id="linkedin"
                                        type="url"
                                        value={linkedinUrl}
                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                        placeholder="https://linkedin.com/in/janedoe"
                                        className="font-mono"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground font-mono">
                                        Your full LinkedIn profile URL
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dob" className="font-mono text-sm">
                                        Date of Birth
                                    </Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="font-mono"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground font-mono">
                                        Must be 18+ to participate in paid assessments
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" disabled={loading} className="flex-1">
                                        {loading ? "Saving..." : isComplete ? "Update Profile" : "Complete Profile"}
                                    </Button>
                                    {isComplete && (
                                        <Button type="button" variant="outline" onClick={() => navigate('/candidate/opportunities')}>
                                            Browse Opportunities
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </section>

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
                            <Button variant="destructive" onClick={submitProfile}>
                                Yes, Update Anyway
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
