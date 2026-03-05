import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Terminal, Clock, File, Folder, Download, ArrowLeft } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { PeerReviewPanel } from '@/components/assessment/PeerReviewPanel';

export default function Assessment() {
    const { id } = useParams();
    const { profile } = useAuth();
    const [assessment, setAssessment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [companyData, setCompanyData] = useState<{ name: string, domain?: string } | null>(null);
    const [privateRepoUrl, setPrivateRepoUrl] = useState<string>('');
    const [accessGranted, setAccessGranted] = useState(false);
    const [userDob, setUserDob] = useState<string | null>(null);
    const [githubUsername, setGithubUsername] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [isProvisioning, setIsProvisioning] = useState(false);
    
    // Peer Review State
    const [peerReviewRepoUrl, setPeerReviewRepoUrl] = useState<string | null>(null);
    const [assignedPeerRegistrationId, setAssignedPeerRegistrationId] = useState<string | null>(null);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [registrationCreatedAt, setRegistrationCreatedAt] = useState<string | null>(null);
    const [registrationStartedAt, setRegistrationStartedAt] = useState<string | null>(null);

    const isPeerReviewPhase = assessment?.start_at && assessment.duration_minutes && 
        (new Date().getTime() > new Date(assessment.start_at).getTime() + assessment.duration_minutes * 60000);


    // File viewer state
    const [anonymousId, setAnonymousId] = useState<string | null>(null);
    const [fileViewerPath, setFileViewerPath] = useState('');
    const [fileViewerContents, setFileViewerContents] = useState<any[]>([]);
    const [currentFileContent, setCurrentFileContent] = useState<any>(null);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [downloadingZip, setDownloadingZip] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        (async () => {
            setLoading(true);

            // Auto-complete expired assessments
            try {
                await supabase.rpc('auto_complete_expired_assessments');
            } catch (e) {
                console.debug('Auto-complete check failed', e);
            }

            const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
            if (error) console.error('Error loading assessment:', error);
            if (mounted) setAssessment(data || null);

            // fetch organizer name (try common keys: companies.user_id, companies.id)
            if (data?.company_user_id) {
                try {
                    // primary: companies.user_id = company_user_id
                    let compRes = await supabase.from('companies').select('name, domain').eq('user_id', data.company_user_id).maybeSingle();
                    let cData = compRes.data;

                    if (!cData) {
                        // fallback: companies.id = company_user_id
                        compRes = await supabase.from('companies').select('name, domain').eq('id', data.company_user_id).maybeSingle();
                        cData = compRes.data;
                    }
                    if (mounted) setCompanyData(cData || null);
                } catch (e) {
                    console.debug('Company lookup failed', e);
                }
            }

            setLoading(false);
        })();
        return () => { mounted = false; };
    }, [id]);

    // Peer Review Assignment Hook
    useEffect(() => {
        if (!id || !isRegistered || !assessment) return;

        const checkPeerReview = async () => {
            const startAt = new Date(assessment.start_at).getTime();
            const durationMs = (assessment.duration_minutes || 0) * 60000;
            const now = new Date().getTime();
            const isPeerReviewPhase = now > (startAt + durationMs);

            if (isPeerReviewPhase && !peerReviewRepoUrl) {
                // Try to trigger assignment if missing
                const { error: rpcError } = await supabase.rpc('assign_peer_reviews', { target_assessment_id: id });
                if (rpcError) {
                    console.error('Peer review assignment RPC failed:', rpcError.message);
                }

                // Refresh local state regardless (assignment may have been done by another client)
                const { data } = await supabase
                    .from('assessment_registrations')
                    .select('peer_review_repo_url, assigned_peer_registration_id')
                    .eq('assessment_id', id)
                    .eq('user_id', profile?.id)
                    .single();

                if (data?.peer_review_repo_url) {
                    setPeerReviewRepoUrl(data.peer_review_repo_url);
                    setAssignedPeerRegistrationId(data.assigned_peer_registration_id);
                }
            }
        };

        // Check initially and periodically if in peer review phase
        checkPeerReview();
        const interval = setInterval(checkPeerReview, 15000);
        return () => clearInterval(interval);
    }, [id, isRegistered, assessment, peerReviewRepoUrl, profile?.id]);

    // check registration (if table exists) so we only reveal classroom/repo when allowed
    useEffect(() => {
        if (!id || !profile?.id) return;
        let mounted = true;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('assessment_registrations')
                    .select('id, private_repo_url, access_granted, anonymous_id, peer_review_repo_url, assigned_peer_registration_id, created_at, started_at')
                    .eq('assessment_id', id)
                    .eq('user_id', profile.id)
                    .single();
                if (!error && data && mounted) {
                    setIsRegistered(true);
                    setRegistrationId(data.id);
                    setRegistrationCreatedAt(data.created_at);
                    setRegistrationStartedAt(data.started_at);
                    setPrivateRepoUrl(data.private_repo_url || '');
                    setAccessGranted(data.access_granted || false);
                    setAnonymousId(data.anonymous_id);
                    setPeerReviewRepoUrl(data.peer_review_repo_url);
                    setAssignedPeerRegistrationId(data.assigned_peer_registration_id);
                }

                // fetch user DOB and GitHub username for validation
                if (mounted) {
                    const { data: userData } = await supabase.from('candidates').select('date_of_birth, github_username, username').eq('user_id', profile.id).single();
                    if (userData) {
                        setUserDob(userData.date_of_birth);
                        setGithubUsername(userData.github_username);
                        setUsername(userData.username);
                    }
                }

            } catch (err) {
                // If the registrations table doesn't exist or another error occurs,
                // we fail-safe by not marking the user as registered.
                console.debug('registration check failed or not present', err);
            }
        })();
        return () => { mounted = false; };
    }, [id, profile?.id]);

    // Continuous access verification: poll every 30 seconds to ensure access is correct (sync)
    useEffect(() => {
        if (!id || !isRegistered || !privateRepoUrl) return;

        const checkAccess = () => {
            if (assessment?.is_sample) {
                // For sample rounds, start time is when they clicked Start Now (provisioned repo)
                if (registrationStartedAt || registrationCreatedAt) {
                     // Prefer started_at, fallback to created_at if old registration
                    const startTime = new Date(registrationStartedAt || registrationCreatedAt).getTime();
                    const now = Date.now();
                    const duration = (assessment.duration_minutes || 0) * 60000;
                    const endTime = startTime + duration;

                    if (now > endTime) {
                        if (accessGranted) {
                            console.log('Sample assessment time ended, revoking access...');
                            supabase.functions.invoke('revoke-assessment-access', {
                                body: {
                                    assessmentId: id,
                                    candidateUserId: profile?.id,
                                }
                            }).then(({ error }) => {
                                if (!error) setAccessGranted(false);
                            });
                        }
                        return;
                    }

                    // Otherwise, ensure they have access (if repo url exists)
                    if (privateRepoUrl) {
                        console.log('Syncing sample round access...');
                        supabase.functions.invoke('grant-assessment-access', {
                            body: {
                                assessmentId: id,
                                candidateUserId: profile?.id,
                            }
                        }).then(({ error }) => {
                            if (!error) setAccessGranted(true);
                        });
                    }
                }
                return;
            }

            // Only try if assessment is started or close to starting (1 hour)
            if (assessment?.start_at) {
                const startTime = new Date(assessment.start_at).getTime();
                const now = Date.now();
                const duration = (assessment.duration_minutes || 0) * 60000;
                const endTime = startTime + duration;

                // Stop giving access if time is over
                if (now > endTime) {
                    if (accessGranted) {
                        console.log('Assessment ended, revoking access...');
                        supabase.functions.invoke('revoke-assessment-access', {
                            body: {
                                assessmentId: id,
                                candidateUserId: profile?.id,
                            }
                        }).then(({ error }) => {
                            if (!error) setAccessGranted(false);
                        });
                    }
                    return;
                }

                // If now is past start time OR within 1 hour before
                if (now >= startTime - 60 * 60 * 1000) {
                    console.log('Running scheduled access verification...');
                    supabase.functions.invoke('grant-assessment-access', {
                        body: {
                            assessmentId: id,
                            candidateUserId: profile?.id,
                        }
                    }).then(({ error }) => {
                        if (!error) {
                            console.log('Access verification/sync successful');
                            setAccessGranted(true);
                        } else {
                            console.error('Access verification sync failed', error);
                        }
                    });
                }
            }
        };

        // Run immediately
        checkAccess();

        // Poll every 30s
        const interval = setInterval(checkAccess, 30000);
        return () => clearInterval(interval);
    }, [id, isRegistered, privateRepoUrl, assessment, accessGranted]);

    // Age check helper
    const isUnderage = (() => {
        if (!userDob) return true; // Treat missing DOB as underage/incomplete
        const dob = new Date(userDob);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970) < 18;
    })();

    const canRegister = (() => {
        if (!assessment) return false;

        // ALL assessments require GitHub username and WIRRE username
        if (!githubUsername || !username) return false;

        // Paid assessments also require DOB and age check
        if (assessment.is_paid) {
            if (!userDob) return false;
            return !isUnderage;
        }

        // Unpaid assessments only need GitHub username (already checked above)
        return true;
    })();

    // --- File Viewer Logic ---

    useEffect(() => {
        if (isRegistered && accessGranted && anonymousId && !loading) {
            // Load initial files if we are in the "preview" window
            const hasStarted = assessment?.start_at && new Date() >= new Date(assessment.start_at);
            const isWithinOneHour = assessment?.start_at ? new Date() >= new Date(new Date(assessment.start_at).getTime() - 60 * 60 * 1000) : false;

            if (!hasStarted && isWithinOneHour) {
                loadFileContents(fileViewerPath);
            }
        }
    }, [fileViewerPath, isRegistered, accessGranted, anonymousId, assessment, loading]);

    const loadFileContents = async (path: string = '') => {
        if (!id || !anonymousId) return;
        setLoadingFiles(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-submission-code', {
                body: {
                    assessmentId: id,
                    anonymousId: anonymousId,
                    path: path
                }
            });

            if (error) throw error;

            if (data.type === 'file') {
                setCurrentFileContent(data);
                setFileViewerContents([]);
            } else {
                setFileViewerContents(Array.isArray(data) ? data : []);
                setCurrentFileContent(null);
            }
        } catch (error: any) {
            console.error('Error loading code:', error);
            // Don't toast on initial load to avoid spam if folder empty or error
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleNavigatePath = (path: string, type: string) => {
        setFileViewerPath(path);
    };

    const handleGoBackDir = () => {
        if (!fileViewerPath) return;
        const parts = fileViewerPath.split('/');
        parts.pop();
        setFileViewerPath(parts.join('/'));
    };

    const handleDownloadZip = async () => {
        if (!id || !anonymousId) return;
        setDownloadingZip(true);
        try {
            const { data, error } = await supabase.functions.invoke('download-submission-zip', {
                body: { assessmentId: id, anonymousId }
            });

            if (error) throw error;

            const blob = new Blob([Uint8Array.from(atob(data.zipData), c => c.charCodeAt(0))], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${assessment.title.replace(/\s+/g, '-').toLowerCase()}-source.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: 'Downloaded', description: 'Source code downloaded successfully' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Download failed', variant: 'destructive' });
        } finally {
            setDownloadingZip(false);
        }
    };

    const handleStartNow = async () => {
        if (!id || !profile?.id || !githubUsername) return;
        setIsProvisioning(true);
        try {
            const provisionResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-candidate-repo`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    },
                    body: JSON.stringify({
                        assessmentId: id,
                        candidateUserId: profile.id,
                        candidateGithubUsername: githubUsername,
                    }),
                }
            );

            if (!provisionResponse.ok) {
                const errorData = await provisionResponse.json();
                console.error('Failed to provision repository:', errorData);
                toast({
                    title: "Provisioning failed",
                    description: errorData.error || "Could not set up your repository. Please try again or contact support.",
                    variant: "destructive",
                });
            } else {
                const result = await provisionResponse.json();
                toast({
                    title: "All set!",
                    description: `Repository created. You now have access.`,
                });
                if (result.repoUrl) setPrivateRepoUrl(result.repoUrl);

                // 1. Manually verify access immediately via the edge function to avoid polling delay
                try {
                    const { error: verifyError } = await supabase.functions.invoke('grant-assessment-access', {
                        body: {
                            assessmentId: id,
                            candidateUserId: profile.id,
                        }
                    });
                    if (!verifyError) setAccessGranted(true);
                } catch (e) {
                    console.debug('Manual access verification after provisioning failed', e);
                }

                // 2. Refresh registration data from DB
                const { data: regData } = await supabase
                    .from('assessment_registrations')
                    .select('private_repo_url, access_granted, anonymous_id')
                    .eq('assessment_id', id)
                    .eq('user_id', profile.id)
                    .single();

                if (regData) {
                    setPrivateRepoUrl(regData.private_repo_url || result.repoUrl || '');
                    setAccessGranted(regData.access_granted || true); // Default to true if provision was successful
                    setAnonymousId(regData.anonymous_id);

                    // 3. Immediately load file contents for the preview
                    if (regData.anonymous_id || result.anonymousId) {
                        loadFileContents('');
                    }
                }
            }
        } catch (err: any) {
            console.error('Start Now failed', err);
            toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
        } finally {
            setIsProvisioning(false);
        }
    };

    if (loading) {

        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-muted-foreground">Loading assessment...</p>
                </div>
            </Layout>
        );
    }

    if (!assessment) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Assessment not found</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const classroomUrl = assessment.github_classroom_url || '';
    const repoUrl = ''; // intentionally never expose original organizer repo to candidates
    const description = assessment.description || '';

    return (
        <Layout>
            <div className="py-8 md:py-12">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 md:gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <div className="mb-8 md:mb-12 text-center md:text-left">
                                <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] mb-3">Assessment Round</p>
                                <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight uppercase">{assessment.title}</h1>
                                {companyData && (
                                    companyData.domain ? (
                                        <a
                                            href={companyData.domain.startsWith('http') ? companyData.domain : `https://${companyData.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary font-mono mt-2 text-sm md:text-base tracking-widest hover:underline"
                                        >
                                            {companyData.name}
                                        </a>
                                    ) : (
                                        <p className="text-primary font-mono mt-2 text-sm md:text-base tracking-widest">{companyData.name}</p>
                                    )
                                )}
                            </div>

                            {/* Repository URL (moved above description) */}
                            <div className="border border-border p-4 md:p-8 mb-8 md:mb-12 bg-card/30 rounded-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <GitBranch className="h-5 w-5 text-primary" />
                                    <h2 className="font-mono font-bold uppercase text-sm tracking-wider">Your Working Repository</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {(() => {
                                        if (isPeerReviewPhase) {
                                            const peerReviewEndTime = new Date(assessment.start_at).getTime() + (assessment.duration_minutes * 60000) + (60 * 60 * 1000); // +1 hour
                                            const isPeerReviewExpired = Date.now() > peerReviewEndTime;

                                            if (isPeerReviewExpired) {
                                                return (
                                                    <div className="text-center p-8 bg-black/20 rounded-md border border-dashed border-red-500/30">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <Clock className="h-8 w-8 text-red-500/50" />
                                                            <h3 className="font-mono text-sm uppercase tracking-wider text-red-400">Peer Review Ended</h3>
                                                            <p className="font-mono text-xs text-muted-foreground">The 1-hour peer review window has closed.</p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (peerReviewRepoUrl && registrationId && id) {
                                                return <PeerReviewPanel 
                                                    assessmentId={String(id)} 
                                                    registrationId={String(registrationId)}
                                                    peerRepoUrl={peerReviewRepoUrl}
                                                    assignedPeerRegistrationId={assignedPeerRegistrationId || undefined} 
                                                    isSelfReview={peerReviewRepoUrl === privateRepoUrl}
                                                />;
                                            }
                                            return (
                                                <div className="text-center p-8 bg-black/20 rounded-md border border-dashed border-indigo-500/30">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"/>
                                                        <h3 className="font-mono text-sm uppercase tracking-wider text-indigo-400">Peer Review Phase</h3>
                                                        <p className="font-mono text-xs text-muted-foreground">Transitioning to peer review... Assigning repository.</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const hasStarted = assessment?.is_sample ? true : (assessment?.start_at ? new Date() >= new Date(assessment.start_at) : false);
                                        const isWithinOneHour = assessment?.is_sample ? true : (assessment?.start_at ? new Date() >= new Date(new Date(assessment.start_at).getTime() - 60 * 60 * 1000) : false);

                                        const canViewRepoLink = isRegistered && privateRepoUrl && accessGranted && hasStarted;
                                        const canViewFiles = isRegistered && privateRepoUrl && accessGranted && isWithinOneHour && !hasStarted;

                                        if (canViewRepoLink) {
                                            return (
                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <code className="flex-1 p-3 bg-background border border-border font-mono text-xs md:text-sm break-all rounded-sm">
                                                            {privateRepoUrl}
                                                        </code>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" className="font-mono text-xs flex-1 sm:flex-none h-11 sm:h-auto" onClick={() => {
                                                                navigator.clipboard.writeText(privateRepoUrl);
                                                                toast({ title: 'Copied!', description: 'Repository URL copied' });
                                                            }}>Copy</Button>
                                                            <Button
                                                                size="sm"
                                                                className="font-mono text-xs flex-1 sm:flex-none h-11 sm:h-auto"
                                                                onClick={() => window.open(privateRepoUrl, '_blank')}
                                                            >
                                                                Open
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground font-mono italic">
                                                        Access is granted through your GitHub username. Ensure it matches your profile.
                                                    </p>
                                                </div>
                                            );
                                        } else if (canViewFiles) {
                                            return (
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm mb-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 border border-primary/20 bg-primary/10 rounded-full shrink-0">
                                                                <Terminal className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-primary font-mono font-bold text-sm uppercase tracking-wide mb-1">Preview Access Granted</h3>
                                                                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                                                                    You have early access to view the codebase. The submission repository link will be available at start time ({new Date(assessment.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Card className="p-0 overflow-hidden bg-card/40 border-white/10">
                                                        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                {fileViewerPath && (
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleGoBackDir}>
                                                                        <ArrowLeft className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <span className="font-mono text-xs text-muted-foreground truncate direction-rtl">
                                                                    root/{fileViewerPath}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-[10px] font-mono uppercase tracking-widest gap-2"
                                                                onClick={handleDownloadZip}
                                                                disabled={downloadingZip}
                                                            >
                                                                <Download className="h-3 w-3" />
                                                                {downloadingZip ? '...' : 'Download Zip'}
                                                            </Button>
                                                        </div>

                                                        <div className="min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                                                            {loadingFiles ? (
                                                                <div className="flex items-center justify-center h-40">
                                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                                </div>
                                                            ) : currentFileContent ? (
                                                                <div className="p-2">
                                                                    <div className="mb-2 flex items-center gap-2 text-primary/70">
                                                                        <File className="h-3 w-3" />
                                                                        <span className="font-mono text-xs">{currentFileContent.name}</span>
                                                                    </div>
                                                                    <pre className="bg-black/30 p-4 rounded-sm overflow-x-auto text-[10px] sm:text-xs font-mono border border-white/5">
                                                                        <code>{currentFileContent.decoded_content || currentFileContent.content || 'Unable to load content'}</code>
                                                                    </pre>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {fileViewerContents.length === 0 ? (
                                                                        <p className="text-center text-muted-foreground text-xs py-8 font-mono">Empty directory</p>
                                                                    ) : (
                                                                        fileViewerContents.map((item) => (
                                                                            <button
                                                                                key={item.path}
                                                                                onClick={() => handleNavigatePath(item.path, item.type)}
                                                                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-sm transition-colors text-left group"
                                                                            >
                                                                                {item.type === 'dir' ? (
                                                                                    <Folder className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
                                                                                ) : (
                                                                                    <File className="h-4 w-4 text-muted-foreground group-hover:text-white" />
                                                                                )}
                                                                                <span className="font-mono text-xs text-muted-foreground group-hover:text-white transition-colors">{item.name}</span>
                                                                            </button>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                </div>
                                            );
                                        } else if (isRegistered && privateRepoUrl) {
                                            // Registered and repo exists, but not within 1 hour OR access not granted
                                            if (isWithinOneHour && !accessGranted) {
                                                return (
                                                    <div className="p-4 bg-muted/20 border border-primary/20 font-mono text-xs md:text-sm text-primary/80 leading-relaxed animate-pulse rounded-sm">
                                                        Preparing your working environment... Access will be granted momentarily.
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 font-mono text-xs md:text-sm text-yellow-500/80 leading-relaxed rounded-sm">
                                                    Access will be granted 1 hour before the assessment starts. Please wait for the scheduled time.
                                                </div>
                                            );
                                        } else if (isRegistered) {
                                            // Registered but no private_repo_url (not created yet)
                                            if (assessment?.is_sample) {
                                                if (isProvisioning) {
                                                    return (
                                                        <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground animate-pulse rounded-sm">
                                                            Initializing your private repository... this usually takes a few minutes.
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="p-4 bg-primary/5 border border-primary/20 font-mono text-xs md:text-sm text-primary/80 leading-relaxed rounded-sm flex flex-col gap-4 items-center text-center">
                                                        <span>Setup your environment by clicking <span className="text-primary font-bold">Start Now</span> below.</span>
                                                        <Button 
                                                            className="w-full sm:w-auto" 
                                                            onClick={handleStartNow}
                                                        >
                                                            Start Now
                                                        </Button>
                                                    </div>
                                                );
                                            }

                                            const startAt = assessment?.start_at ? new Date(assessment.start_at).getTime() : 0;
                                            const now = Date.now();
                                            const isWithinOneHour = now >= startAt - 60 * 60 * 1000;

                                            if (isProvisioning) {
                                                return (
                                                    <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground animate-pulse rounded-sm">
                                                        Initializing your private repository... this usually takes a few minutes.
                                                    </div>
                                                );
                                            }

                                            if (isWithinOneHour) {
                                                return (
                                                    <div className="p-4 bg-primary/5 border border-primary/20 font-mono text-xs md:text-sm text-primary/80 leading-relaxed rounded-sm flex flex-col gap-4 items-center text-center">
                                                        <span>Setup your environment by clicking <span className="text-primary font-bold">Start Now</span> below.</span>
                                                        <Button 
                                                            className="w-full sm:w-auto" 
                                                            onClick={handleStartNow}
                                                        >
                                                            Start Now
                                                        </Button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground rounded-sm">
                                                    Repository will be available 1 hour before start.
                                                </div>
                                            );
                                        } else {
                                            // Not registered
                                            return (
                                                <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground rounded-sm">
                                                    Register to get your unique private repository and instructions.
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* Problem Description (only show if present) */}
                            {description && description.trim() ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Terminal className="h-5 w-5 text-primary" />
                                        <h2 className="font-mono font-bold uppercase text-sm tracking-wider">Instructions & Details</h2>
                                    </div>
                                    <div className="border border-border p-4 md:p-8 bg-card/20 rounded-sm">
                                        <div className="prose prose-invert max-w-none">
                                            <div className="font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed md:leading-loose">
                                                {description.split('\n').map((line: string, i: number) => {
                                                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl md:text-2xl font-bold mt-10 mb-6 first:mt-0 uppercase tracking-tighter text-primary">{line.replace('## ', '')}</h2>;
                                                    if (line.startsWith('### ')) return <h3 key={i} className="text-lg md:text-xl font-bold mt-8 mb-4 uppercase tracking-tight">{line.replace('### ', '')}</h3>;
                                                    if (line.startsWith('- **')) {
                                                        const [label, ...rest] = line.replace('- **', '').split('**:');
                                                        return <div key={i} className="my-3 flex gap-2"><strong className="text-foreground shrink-0">{label}:</strong><span className="text-muted-foreground">{rest.join('')}</span></div>;
                                                    }
                                                    if (line.match(/^\d+\./)) return <div key={i} className="my-2 ml-4 md:ml-6 pl-2 border-l border-border/50 text-muted-foreground">{line}</div>;
                                                    return <p key={i} className={line ? 'my-3 text-muted-foreground' : 'my-4'}>{line}</p>;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6 md:space-y-8">
                            {/* Status Panel */}
                            <div className="border border-border p-6 bg-card/30 rounded-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    <h2 className="font-mono font-bold uppercase text-xs tracking-wider text-muted-foreground">Status</h2>
                                </div>
                                <div className="space-y-3 font-mono">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Current</span>
                                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest px-2 py-0 h-6">
                                            {assessment.start_at && new Date(assessment.start_at) > new Date() ? 'UPCOMING' : (assessment.status || '').toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="border border-border p-6 bg-card/30 rounded-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <h2 className="font-mono font-bold uppercase text-xs tracking-wider text-muted-foreground">Logistics</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Start Time</p>
                                        <p className="font-mono text-sm">{assessment.start_at ? new Date(assessment.start_at).toLocaleString() : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Duration</p>
                                        <p className="font-mono text-sm">{assessment.duration_minutes ? `${assessment.duration_minutes} minutes` : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Available Positions</p>
                                        <p className="font-mono text-sm">{assessment.positions || 1}</p>
                                    </div>
                                    {assessment.is_paid && assessment.min_salary && assessment.max_salary && (
                                        <div>
                                            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Compensation Range</p>
                                            <p className="font-mono text-sm text-green-500 font-bold">
                                                ₹{assessment.min_salary.toLocaleString('en-IN')} - ₹{assessment.max_salary.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Technologies */}
                            {Array.isArray(assessment.technologies) && assessment.technologies.length ? (
                                <div className="border border-border p-6 bg-card/30 rounded-sm">
                                    <h2 className="font-mono font-bold uppercase text-xs tracking-wider text-muted-foreground mb-4">Technologies</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {assessment.technologies.map((tech: string) => (
                                            <Badge key={tech} variant="secondary" className="font-mono text-[10px] uppercase">{tech}</Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Actions */}
                            <div className="space-y-4 pt-4">
                                {(!isRegistered) ? (
                                    // Not registered -> show Register button
                                    <Button
                                        className="w-full font-mono text-sm h-12 uppercase tracking-widest"
                                        size="lg"
                                        disabled={!canRegister}
                                        onClick={async () => {
                                            if (!canRegister) return;
                                            if (!id || !profile?.id) return;
                                            try {
                                                // 1. Insert registration
                                                const { error } = await supabase.from('assessment_registrations').insert([{ assessment_id: id, user_id: profile.id }]);
                                                if (error) throw error;

                                                setIsRegistered(true);
                                                toast({ title: 'Registered', description: "You've successfully registered for this assessment." });
                                            } catch (err: any) {
                                                console.error('Register failed', err);
                                                toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                            }

                                        }}
                                    >
                                        {!username || !githubUsername ? "Profile Incomplete" : (!userDob && assessment.is_paid ? "DOB Required" : (isUnderage && assessment.is_paid ? "Age 18+ Required" : "Register Now"))}
                                    </Button>
                                ) : (
                                    // Registered
                                    <div className="space-y-4">
                                        {privateRepoUrl ? (
                                            // Has repo -> show Finish Assignment button (only if started)
                                            (() => {
                                                const hasStarted = assessment.is_sample || (assessment.start_at && new Date() >= new Date(assessment.start_at));
                                                return hasStarted ? (
                                                    <div className="space-y-3">
                                                        <Button
                                                            className="w-full font-mono text-sm h-12 uppercase tracking-widest"
                                                            size="lg"
                                                            onClick={async () => {
                                                                if (!id) return;
                                                                const ok = window.confirm('Finish this assessment? Your GitHub repository access will be revoked and your work will be submitted for review.');
                                                                if (!ok) return;
                                                                try {
                                                                    // Call RPC function to finish assessment and revoke access
                                                                    const { data, error: finishError } = await supabase.rpc('candidate_finish_assessment', {
                                                                        p_assessment_id: id
                                                                    });
                                                                    if (finishError) throw finishError;

                                                                    // Also call the revoke edge function to remove GitHub collaborator access
                                                                    const { error: revokeError } = await supabase.functions.invoke('revoke-assessment-access', {
                                                                        body: {
                                                                            assessmentId: id,
                                                                            candidateUserId: profile?.id
                                                                        }
                                                                    });
                                                                    if (revokeError) {
                                                                        console.error('GitHub revoke failed:', revokeError);
                                                                    }

                                                                    setAccessGranted(false);
                                                                    toast({
                                                                        title: 'Round Finished',
                                                                        description: 'Your submission has been finalized.'
                                                                    });

                                                                    // Redirect to status page after a moment
                                                                    setTimeout(() => {
                                                                        window.location.href = `/candidate/assessment/${id}/status`;
                                                                    }, 1500);
                                                                } catch (err: any) {
                                                                    console.error('Finish failed', err);
                                                                    toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                                                }
                                                            }}
                                                        >
                                                            Finish & Submit
                                                        </Button>
                                                        <p className="text-[10px] text-muted-foreground text-center font-mono leading-relaxed">
                                                            Submitting will immediately revoke your write access to the repository.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 border border-border bg-muted/20 text-center rounded-sm">
                                                        <p className="font-mono text-sm text-muted-foreground mb-4">Assessment starts in {getStatusBadgeText(assessment.start_at)}</p>
                                                        {assessment.start_at && (new Date(assessment.start_at).getTime() - new Date().getTime() > 3 * 24 * 60 * 60 * 1000) && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="w-full font-mono text-xs h-10"
                                                                onClick={async () => {
                                                                    if (!id || !profile?.id) return;
                                                                    const ok = window.confirm('Unregister from this assessment? You will lose your reserved slot.');
                                                                    if (!ok) return;
                                                                    try {
                                                                        const { error } = await supabase
                                                                            .from('assessment_registrations')
                                                                            .delete()
                                                                            .eq('assessment_id', id)
                                                                            .eq('user_id', profile.id);
                                                                        if (error) throw error;

                                                                        setIsRegistered(false);
                                                                        setPrivateRepoUrl('');
                                                                        setAccessGranted(false);
                                                                        toast({ title: 'Unregistered', description: 'You have been unregistered.' });
                                                                    } catch (err: any) {
                                                                        console.error('Unregister failed', err);
                                                                        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                                                    }
                                                                }}
                                                            >
                                                                Unregister Round
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            // No repo yet -> show Start Now button if within 1 hour
                                            (() => {
                                                const startAt = new Date(assessment.start_at).getTime();
                                                const now = new Date().getTime();
                                                const isWithinOneHour = now >= startAt - 60 * 60 * 1000;
                                                const isBeforeEnd = assessment.duration_minutes ? now <= startAt + (assessment.duration_minutes * 60 * 1000) : true;

                                                if (isWithinOneHour && isBeforeEnd) {
                                                    return (
                                                        <Button
                                                            className="w-full font-mono text-sm h-12 uppercase tracking-widest"
                                                            size="lg"
                                                            onClick={handleStartNow}
                                                            disabled={isProvisioning}
                                                        >
                                                            {isProvisioning ? "Initializing..." : "Start Now"}
                                                        </Button>
                                                    );
                                                } else if (!isBeforeEnd) {
                                                    return (
                                                        <div className="p-4 bg-muted/30 border border-border text-center rounded-sm">
                                                            <p className="font-mono text-xs text-muted-foreground italic">Registration has ended.</p>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="space-y-4">
                                                            <div className="p-4 bg-muted/30 border border-border text-center rounded-sm">
                                                                <p className="font-mono text-xs text-muted-foreground italic">Repository will be available 1 hour before start.</p>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full font-mono text-xs h-11"
                                                                onClick={async () => {
                                                                    if (!id || !profile?.id) return;
                                                                    const ok = window.confirm('Unregister from this round?');
                                                                    if (!ok) return;
                                                                    try {
                                                                        const { error } = await supabase
                                                                            .from('assessment_registrations')
                                                                            .delete()
                                                                            .eq('assessment_id', id)
                                                                            .eq('user_id', profile.id);
                                                                        if (error) throw error;
                                                                        setIsRegistered(false);
                                                                        toast({ title: 'Unregistered', description: 'You have been unregistered.' });
                                                                    } catch (err: any) {
                                                                        console.error('Unregister failed', err);
                                                                        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                                                    }
                                                                }}
                                                            >
                                                                Unregister
                                                            </Button>
                                                        </div>
                                                    );
                                                }
                                            })()
                                        )}
                                    </div>

                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function getStatusBadgeText(start_at: string) {
    try {
        const diff = new Date(start_at).getTime() - new Date().getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)} days`;
        return `${hours}h ${mins}m`;
    } catch (e) { return '...'; }
}
