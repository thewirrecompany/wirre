import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Terminal, Clock, File, Folder, Download, ArrowLeft, TimerOff, CheckCircle, XCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PeerReviewPanel, usePeerReview, PeerReviewHeader, PeerReviewIdeWorkspace, PeerReviewReporter } from '@/components/assessment/PeerReviewPanel';
import { SubmissionSuccessModal } from '@/components/assessment/SubmissionSuccessModal';
import { IdeSandbox } from '@/components/assessment/IdeSandbox';

export default function Assessment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [assessment, setAssessment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [companyData, setCompanyData] = useState<{ name: string, domain?: string } | null>(null);
    const [privateRepoUrl, setPrivateRepoUrl] = useState<string>('');
    const [accessGranted, setAccessGranted] = useState(false);
    const accessGrantedRef = useRef(false);
    const [userDob, setUserDob] = useState<string | null>(null);
    const [githubUsername, setGithubUsername] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [isProvisioning, setIsProvisioning] = useState(false);

    // Security State
    const [isMobileView, setIsMobileView] = useState(false);
    const [concurrencyError, setConcurrencyError] = useState(false);
    const sessionTabId = useRef(Math.random().toString(36).substring(7));
    const [logoutCountdown, setLogoutCountdown] = useState(5);

    // Peer Review State
    const [peerReviewRepoUrl, setPeerReviewRepoUrl] = useState<string | null>(null);
    const [assignedPeerRegistrationId, setAssignedPeerRegistrationId] = useState<string | null>(null);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [anonymousIdState, setAnonymousIdState] = useState<string | null>(null);
    const [registrationCreatedAt, setRegistrationCreatedAt] = useState<string | null>(null);
    const [codingStartedAt, setCodingStartedAt] = useState<string | null>(null);
    const [peerReviewAssignedAt, setPeerReviewAssignedAt] = useState<string | null>(null);

    const [isFinished, setIsFinished] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [skippedPeerReview, setSkippedPeerReview] = useState(false);
    const [submittedPeerReview, setSubmittedPeerReview] = useState(false);

    // Countdown state
    const [showTimeExpiredDialog, setShowTimeExpiredDialog] = useState(false);
    const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
    const [serverTimeOffset, setServerTimeOffset] = useState(0);
    const codingEndMsRef = useRef<number | null>(null);

    // For scheduled rounds: use assessment.start_at.
    // For sample/per-candidate rounds (start_at is null): use the candidate's own coding_started_at.
    const _codingStartMs = assessment?.is_sample
        ? (codingStartedAt ? new Date(codingStartedAt).getTime() : null)
        : (assessment?.start_at ? new Date(assessment.start_at).getTime() : null);
    const _durationMs = (assessment?.duration_minutes || 0) * 60000;
    const _codingEndMs = _codingStartMs !== null
        ? _codingStartMs + _durationMs
        : null;
    // Keep ref up-to-date for use inside polling closures without stale captures
    codingEndMsRef.current = _codingEndMs;
    accessGrantedRef.current = accessGranted;
    // For sample rounds: peer review timer starts when competitor is assigned, not when coding ends.
    // If no competitor assigned yet, _peerReviewEndMs is null (timer hasn't started).
    const _peerReviewEndMs = assessment?.is_sample
        ? (peerReviewAssignedAt ? new Date(peerReviewAssignedAt).getTime() + 60 * 60 * 1000 : null)
        : (_codingEndMs !== null ? _codingEndMs + 60 * 60 * 1000 : null);
    const isPeerReviewPhase = _codingEndMs !== null && new Date().getTime() > _codingEndMs;
    const isPeerReviewExpiredCalc = _peerReviewEndMs !== null && new Date().getTime() > _peerReviewEndMs;

    // Sandbox IDE state
    const [explorerFiles, setExplorerFiles] = useState<any[]>([]);
    const [activeFileNode, setActiveFileNode] = useState<any | null>(null);
    const [isLoadingExplorer, setIsLoadingExplorer] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [isSyncingFile, setIsSyncingFile] = useState(false);
    const fetchLock = useRef(false);

    // Security: Mobile Access Detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobileView(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Security: Concurrency Detection (LocalStorage + Realtime Broadcast)
    useEffect(() => {
        if (!id || !profile?.id || isFinished) return;

        // 1. LocalStorage Sync (Instant for same-browser tabs)
        const storageKey = `wirre-assessment-active-${id}-${profile.id}`;
        
        const announcePresenceLocal = () => {
            localStorage.setItem(storageKey, JSON.stringify({
                tabId: sessionTabId.current,
                timestamp: Date.now()
            }));
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue) {
                const data = JSON.parse(e.newValue);
                if (data.tabId !== sessionTabId.current) {
                    console.warn('Multiple tabs detected via StorageEvent');
                    setConcurrencyError(true);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        announcePresenceLocal();

        // 2. Supabase Realtime Broadcast (For cross-device detection)
        const channel = supabase.channel(`security-${id}-${profile.id}`, {
            config: { broadcast: { self: false } }
        });

        console.log('Security Channel Joining:', `security-${id}-${profile.id}`);

        channel
            .on('broadcast', { event: 'ping' }, ({ payload }) => {
                console.log('Received security ping from:', payload.tabId, 'My Tab ID:', sessionTabId.current);
                if (payload.tabId !== sessionTabId.current) {
                    console.warn('Multiple sessions detected via Realtime');
                    setConcurrencyError(true);
                }
            })
            .subscribe((status) => {
                console.log('Security Channel Status:', status);
                if (status === 'SUBSCRIBED') {
                    channel.send({
                        type: 'broadcast',
                        event: 'ping',
                        payload: { tabId: sessionTabId.current }
                    });
                }
            });

        const interval = setInterval(() => {
            // Heartbeat both channels
            announcePresenceLocal();
            channel.send({
                type: 'broadcast',
                event: 'ping',
                payload: { tabId: sessionTabId.current }
            });
        }, 5000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            channel.unsubscribe();
            clearInterval(interval);
        };
    }, [id, profile?.id, isFinished]);

    // Security: Force Logout on Concurrency Error
    const { signOut } = useAuth();
    useEffect(() => {
        if (concurrencyError) {
            const timer = setInterval(() => {
                setLogoutCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        signOut().then(() => navigate('/login'));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [concurrencyError, signOut, navigate]);

    // Lock body scroll when initialization overlay OR security overlays are active
    useEffect(() => {
        const isLocked = isPrefetching || isMobileView || concurrencyError;
        if (isLocked) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        };
    }, [isPrefetching, isMobileView, concurrencyError]);

    // Peer Review Logic
    const prState = usePeerReview(
        String(id || ''),
        String(registrationId || ''),
        assignedPeerRegistrationId || undefined
    );

    // Fetch initial file tree - ATOMIC LOCK
    useEffect(() => {
        if (!id || !profile?.id || fetchLock.current || isLoadingExplorer) return;

        const canLaunch = isRegistered && privateRepoUrl && accessGranted &&
            (assessment?.is_sample || (assessment?.start_at && new Date() >= new Date(assessment.start_at)));

        if (canLaunch) {
            fetchLock.current = true; // Block any further attempts immediately
            fetchFileTree("", true).then(tree => {
                if (tree) prefetchBackgroundFiles(tree);
            });
        }
    }, [id, isRegistered, privateRepoUrl, accessGranted, assessment?.start_at, profile?.id]);

    const fetchFileTree = async (path = "", isInitial = false, isBackground = false) => {
        if (!id || !profile?.id) return;
        if (!isBackground) setIsLoadingExplorer(true);
        try {
            // Greedy fetch: if isInitial, we get the WHOLE structure recursively
            const { data, error } = await supabase.functions.invoke('get-submission-code', {
                body: {
                    assessmentId: id,
                    anonymousId: anonymousIdState || profile.id,
                    path,
                    recursive: isInitial
                }
            });
            if (error) throw error;

            if (isInitial && data.tree) {
                // transform flat tree to nested structure
                const nested = transformFlatTree(data.tree);
                setExplorerFiles(nested);
                return nested;
            } else if (data.type === 'file') {
                const updatedFile = { ...data, decoded_content: data.decoded_content || data.content };
                // ONLY set active file if This was NOT a background pre-fetch
                if (!isBackground) setActiveFileNode(updatedFile);
                setExplorerFiles(prev => updateFileInTree(prev, path, updatedFile));
            } else if (!path) {
                setExplorerFiles(Array.isArray(data) ? data : [data]);
            }
            return data;
        } catch (err: any) {
            console.error('Failed to fetch files:', err);
        } finally {
            if (!isBackground) setIsLoadingExplorer(false);
        }
    };

    const transformFlatTree = (tree: any[]): FileNode[] => {
        const result: FileNode[] = [];
        const level: any = { result };

        tree.forEach(item => {
            if (item.path.startsWith('.')) return; // skip hidden files like .git

            item.path.split('/').reduce((acc: any, name: string, i: number, arr: any[]) => {
                if (!acc[name]) {
                    acc[name] = { result: [] };
                    const node: FileNode = {
                        name,
                        path: item.path,
                        type: item.type === 'tree' ? 'dir' : 'file',
                        sha: item.sha,
                    };
                    if (i === arr.length - 1 && item.type === 'blob') {
                        // it's a file
                    } else {
                        node.children = acc[name].result;
                    }
                    acc.result.push(node);
                }
                return acc[name];
            }, level);
        });

        // Sort: directories first
        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'dir' ? -1 : 1;
            });
            nodes.forEach(n => { if (n.children) sortNodes(n.children); });
        };
        sortNodes(result);
        return result;
    };

    const prefetchBackgroundFiles = async (tree: FileNode[]) => {
        const paths: string[] = [];
        const walk = (nodes: FileNode[]) => {
            nodes.forEach(n => {
                if (n.type === 'file' && !n.decoded_content) paths.push(n.path);
                if (n.children) walk(n.children);
            });
        };
        walk(tree);

        if (paths.length > 0) setIsPrefetching(true);

        // Fetch each file with a small delay to avoid rate limits
        try {
            for (const path of paths) {
                // Small pause between requests
                await new Promise(resolve => setTimeout(resolve, 300));
                // Only fetch if it hasn't been loaded in the meantime
                await fetchFileTree(path, false, true);
            }
        } finally {
            setIsPrefetching(false);
        }
    };

    const updateFileInTree = (nodes: FileNode[], path: string, updates: Partial<FileNode>): FileNode[] => {
        return nodes.map(node => {
            if (node.path === path) return { ...node, ...updates };
            if (node.children) return { ...node, children: updateFileInTree(node.children, path, updates) };
            return node;
        });
    };

    const handleFileSelect = async (file: any) => {
        if (file.type === 'dir') return;
        if (!file.decoded_content) {
            setIsFetchingContent(true);
            try {
                const { data, error } = await supabase.functions.invoke('get-submission-code', {
                    body: { assessmentId: id, anonymousId: profile?.id, path: file.path }
                });
                if (error) throw error;
                const updatedFile = { ...file, decoded_content: data.decoded_content, sha: data.sha };
                setActiveFileNode(updatedFile);
                setExplorerFiles(prev => updateFileInTree(prev, file.path, updatedFile));
            } catch (err) {
                toast({ title: 'Error', description: 'Failed to load file content.', variant: 'destructive' });
            } finally {
                setIsFetchingContent(false);
            }
        } else {
            setActiveFileNode(file);
        }
    };

    const handleSaveFile = async (file: any, newContent: string) => {
        if (!id) return;
        setIsSyncingFile(true);
        try {
            const { data, error } = await supabase.functions.invoke('sync-sandbox-file', {
                body: { assessmentId: id, path: file.path, content: newContent, sha: file.sha }
            });
            if (error) throw error;
            toast({ title: 'Saved', description: `${file.name} synchronized to GitHub.` });
            const updatedFile = { ...file, decoded_content: newContent, sha: data.sha };
            setActiveFileNode(updatedFile);
            setExplorerFiles(prev => updateFileInTree(prev, file.path, updatedFile));
        } catch (err) {
            toast({ title: 'Sync Error', description: 'Changes could not be pushed.', variant: 'destructive' });
        } finally {
            setIsSyncingFile(false);
        }
    };


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

    // Auto-submit when coding time expires, and auto-finalize when peer review hour ends
    useEffect(() => {
        if (!id || !isRegistered || !privateRepoUrl || _codingEndMs === null) return;

        const checkPhaseTransitions = async () => {
            const now = Date.now();

            // Coding phase just ended -> mark as finished, revoke GitHub access if still held, then record in DB.
            // NOTE: accessGranted is intentionally NOT in the condition — if checkAccess already revoked
            // access (setting accessGranted=false), we still need to call candidate_finish_assessment so
            // finished_at gets set. Without that, isFinished stays false and admin re-grants cause a loop.
            if (now > _codingEndMs && !isFinished) {
                // Set finished immediately — prevents any future loop trigger, even if async calls below fail.
                setIsFinished(true);
                // Only revoke GitHub access if the candidate currently has it
                if (accessGrantedRef.current) {
                    setAccessGranted(false);
                    try {
                        await supabase.functions.invoke('revoke-assessment-access', {
                            body: { assessmentId: id, candidateUserId: profile?.id }
                        });
                    } catch (e) {
                        console.error('Failed to revoke access on time expiry:', e);
                    }
                    toast({ title: 'Time\'s up!', description: 'Coding phase ended. Your sandbox environment has been locked.' });
                }
                // Formally mark coding done in DB (idempotent — safe to call even if already finished)
                try {
                    await supabase.rpc('candidate_finish_assessment', { p_assessment_id: id });
                } catch (e) {
                    console.error('Failed to auto-finish coding phase:', e);
                }
            }

            // Peer review hour ended -> auto-finalize and redirect
            if (_peerReviewEndMs !== null && now > _peerReviewEndMs) {
                console.log('Peer review window ended, finalizing...');
                try {
                    await supabase.rpc('auto_complete_expired_assessments');
                } catch (e) {
                    console.debug('auto_complete_expired_assessments failed', e);
                }
                toast({ title: 'Round Complete', description: 'The peer review window has closed. Your submission is finalized.' });
                setTimeout(() => {
                    window.location.href = `/candidate/assessment/${id}/status`;
                }, 2000);
            }
        };

        checkPhaseTransitions();
        const interval = setInterval(checkPhaseTransitions, 15000);
        return () => clearInterval(interval);
        // NOTE: accessGranted intentionally excluded from dep array — we use accessGrantedRef.current
        // so that admin re-granting access doesn't cause this effect to re-instantiate and
        // immediately re-revoke (which would create an infinite revocation loop).
    }, [id, isRegistered, privateRepoUrl, _codingEndMs, _peerReviewEndMs, isFinished, profile?.id]);

    // Peer Review Assignment Hook
    useEffect(() => {
        if (!id || !isRegistered || !assessment) return;

        const checkPeerReview = async () => {
            const now = new Date().getTime();
            const isPeerReviewPhase = _codingEndMs !== null && now > _codingEndMs;
            // For sample rounds, also trigger assignment when the candidate has finished early
            const shouldTryAssign = isPeerReviewPhase || (assessment?.is_sample && isFinished);

            if (shouldTryAssign && !peerReviewRepoUrl) {
                // Try to trigger assignment if missing
                const { error: rpcError } = await supabase.rpc('assign_peer_reviews', { target_assessment_id: id });
                if (rpcError) {
                    console.error('Peer review assignment RPC failed:', rpcError.message);
                }

                // Refresh local state regardless (assignment may have been done by another client)
                const { data } = await supabase
                    .from('assessment_registrations')
                    .select('peer_review_repo_url, assigned_peer_registration_id, peer_review_assigned_at')
                    .eq('assessment_id', id)
                    .eq('user_id', profile?.id)
                    .single();

                if (data?.peer_review_repo_url) {
                    setPeerReviewRepoUrl(data.peer_review_repo_url);
                    setAssignedPeerRegistrationId(data.assigned_peer_registration_id);
                    setPeerReviewAssignedAt(data.peer_review_assigned_at);
                }
            }
        };

        // Check initially and periodically if in peer review phase
        checkPeerReview();
        const interval = setInterval(checkPeerReview, 15000);
        return () => clearInterval(interval);
    }, [id, isRegistered, assessment, peerReviewRepoUrl, profile?.id, isFinished]);

    // check registration (if table exists) so we only reveal classroom/repo when allowed
    useEffect(() => {
        if (!id || !profile?.id) return;
        let mounted = true;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('assessment_registrations')
                    .select('id, private_repo_url, access_granted, anonymous_id, peer_review_repo_url, assigned_peer_registration_id, created_at, coding_started_at, coding_finished_at, peer_review_assigned_at, peer_review_skipped')
                    .eq('assessment_id', id)
                    .eq('user_id', profile.id)
                    .single();
                if (!error && data && mounted) {
                    setIsRegistered(true);
                    setRegistrationId(data.id);
                    setAnonymousIdState(data.anonymous_id);
                    setRegistrationCreatedAt(data.created_at);
                    setCodingStartedAt(data.coding_started_at);
                    setPrivateRepoUrl(data.private_repo_url || '');
                    setAccessGranted(data.access_granted || false);
                    setPeerReviewRepoUrl(data.peer_review_repo_url);
                    setAssignedPeerRegistrationId(data.assigned_peer_registration_id);
                    setPeerReviewAssignedAt(data.peer_review_assigned_at);
                    setIsFinished(!!data.coding_finished_at || !!data.peer_review_skipped);
                    if (data.peer_review_skipped) setSkippedPeerReview(true);
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

                // Calculate server clock skew
                try {
                    const clientSendTime = Date.now();
                    const { data: serverTimeStr } = await supabase.rpc('get_server_time');
                    if (serverTimeStr) {
                        const serverTime = new Date(serverTimeStr).getTime();
                        // Offset = ServerTime - ClientTime (middle of roundtrip ideally but simple is fine)
                        const offset = serverTime - clientSendTime;
                        setServerTimeOffset(offset);
                        console.log(`Server time offset calculated: ${offset}ms`);
                    }
                } catch (e) {
                    console.debug('Failed to get server time offset', e);
                }

            } catch (err) {
                // If the registrations table doesn't exist or another error occurs,
                // we fail-safe by not marking the user as registered.
                console.debug('registration check failed or not present', err);
            }
        })();
        return () => { mounted = false; };
    }, [id, profile?.id]);


    // Continuous access verification: polls DB every 30s to sync state
    useEffect(() => {
        if (!id || !isRegistered || !privateRepoUrl || isFinished) return;
        let mounted = true;

        const checkAccess = async () => {
            const { data: regCheck } = await supabase
                .from('assessment_registrations')
                .select('access_granted, coding_finished_at, coding_started_at, peer_review_assigned_at, peer_review_skipped')
                .eq('assessment_id', id)
                .eq('user_id', profile?.id)
                .single();

            if (!mounted) return;

            if (regCheck) {
                if (regCheck.coding_started_at) setCodingStartedAt(regCheck.coding_started_at);
                if (regCheck.peer_review_assigned_at) setPeerReviewAssignedAt(regCheck.peer_review_assigned_at);
                // If DB marks as finished, update local state and stop polling
                if (regCheck.coding_finished_at || regCheck.peer_review_skipped) {
                    setIsFinished(true);
                    if (regCheck.peer_review_skipped) setSkippedPeerReview(true);
                    return;
                }
                // Sync access state directly from DB (single source of truth)
                setAccessGranted(regCheck.access_granted ?? false);
            }

            // Also refresh assessment data to catch emergency_abandoned or status changes
            const { data: assesData } = await supabase
                .from('assessments')
                .select('*')
                .eq('id', id)
                .single();
            if (assesData && mounted) {
                setAssessment(assesData);
                if (assesData.emergency_abandoned) {
                    setIsFinished(true);
                    setAccessGranted(false);
                    return;
                }
            }

            // Time expiry safety net (belt-and-suspenders alongside checkPhaseTransitions)
            const now = Date.now() + serverTimeOffset;
            const endTime = codingEndMsRef.current;
            if (endTime !== null && now > (endTime + 30000)) {
                setAccessGranted(false);
                setIsFinished(true);
                return;
            }
        };

        // Run immediately
        checkAccess();

        // Poll every 30s
        const interval = setInterval(() => {
            supabase.rpc('get_server_time').then(({ data }) => {
                if (data) setServerTimeOffset(new Date(data).getTime() - Date.now());
            });
            checkAccess();
        }, 30000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
        // NOTE: accessGranted intentionally excluded — syncing FROM db, not re-triggering on local state changes
    }, [id, isRegistered, privateRepoUrl, isFinished, profile?.id]);

    // Countdown timer — updates every second
    useEffect(() => {
        if (_codingEndMs === null || !isRegistered || isPeerReviewPhase || isFinished) return;

        const update = () => {
            const now = Date.now() + serverTimeOffset;
            const remaining = _codingEndMs - now;

            setTimeRemainingMs(remaining > 0 ? remaining : 0);

            if (remaining <= 0 && !isFinished) {
                setShowTimeExpiredDialog(true);
            }
        };

        update();
        const iv = setInterval(update, 1000);
        return () => clearInterval(iv);
    }, [_codingEndMs, isRegistered, isPeerReviewPhase, isFinished, assessment?.is_sample]);

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
                    title: "Status: Locked In",
                    description: `Sandbox initialized. Your environment is ready.`,
                });
                if (result.repoUrl) setPrivateRepoUrl(result.repoUrl);

                // 1. Manually verify access immediately via the edge function to avoid polling delay
                try {
                    await supabase.functions.invoke('grant-assessment-access', {
                        body: {
                            assessmentId: id,
                            candidateUserId: profile.id,
                        }
                    });
                    setAccessGranted(true);

                    // 1b. Mark as started in registration table for precise timer tracking (especially sample rounds)
                    await supabase.rpc('candidate_start_assessment', { p_assessment_id: id });
                } catch (e) {
                    console.debug('Manual access verification or start RPC failed', e);
                }

                // 2. Refresh registration data from DB
                const { data: regData } = await supabase
                    .from('assessment_registrations')
                    .select('private_repo_url, access_granted, anonymous_id, coding_started_at')
                    .eq('assessment_id', id)
                    .eq('user_id', profile.id)
                    .single();

                if (regData) {
                    if (regData.coding_started_at) setCodingStartedAt(regData.coding_started_at);
                    setPrivateRepoUrl(regData.private_repo_url || result.repoUrl || '');
                    setAccessGranted(regData.access_granted || true); // Default to true if provision was successful

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

    const description = assessment.description || '';

    return (
        <Layout>
            <div className="py-8 md:py-12">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6">
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 md:gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-9">
                            <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="text-center md:text-left">
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
                                {isPeerReviewPhase && (
                                    <div className="animate-in fade-in zoom-in-95 duration-700 bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-sm max-w-md shrink-0 self-start">
                                        <PeerReviewHeader />
                                    </div>
                                )}
                            </div>

                            {/* Repository URL (moved above description) */}
                            <div className="border border-border p-4 md:p-8 mb-8 md:mb-12 bg-card/30 rounded-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Terminal className="h-5 w-5 text-primary" />
                                    <h2 className="font-mono font-bold uppercase text-sm tracking-wider">Development Sandbox</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {(() => {
                                        if (isPeerReviewPhase) {
                                            const isPeerReviewExpired = isPeerReviewExpiredCalc;

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
                                                return <PeerReviewIdeWorkspace
                                                    {...prState}
                                                    peerRepoUrl={peerReviewRepoUrl}
                                                />;
                                            }
                                            return (
                                                <div className="text-center p-8 bg-black/20 rounded-md border border-dashed border-indigo-500/30">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                                        <h3 className="font-mono text-sm uppercase tracking-wider text-indigo-400">Peer Review Phase</h3>
                                                        <p className="font-mono text-xs text-muted-foreground">Waiting for a competitor to finish... peer-review round will be available soon</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (isFinished) {
                                            if (assessment?.emergency_abandoned) {
                                                return (
                                                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-red-500/20 bg-red-500/5 rounded-sm animate-in fade-in zoom-in-95">
                                                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                                            <XCircle className="h-6 w-6 text-red-500" />
                                                        </div>
                                                        <h3 className="text-sm font-mono font-bold text-red-400 uppercase tracking-widest mb-3 italic">
                                                            Round Emergency Abandoned
                                                        </h3>
                                                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight leading-relaxed max-w-[240px]">
                                                            This assessment has been formally abandoned by the administrator. Access is permanently revoked.
                                                        </p>
                                                    </div>
                                                );
                                            } else if (peerReviewRepoUrl && registrationId && id) {
                                                // Peer has been assigned — show the review panel even if coding timer hasn't expired yet
                                                return <PeerReviewIdeWorkspace
                                                    {...prState}
                                                    peerRepoUrl={peerReviewRepoUrl}
                                                />;
                                            } else {
                                                return (
                                                    <div className="text-center p-8 bg-black/20 rounded-md border border-dashed border-indigo-500/30">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                                            <h3 className="font-mono text-sm uppercase tracking-wider text-indigo-400">Coding Submitted</h3>
                                                            <p className="font-mono text-xs text-muted-foreground">Waiting for a competitor to finish... peer review will be assigned shortly.</p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }

                                        const hasStarted = assessment?.is_sample ? true : (assessment?.start_at ? new Date() >= new Date(assessment.start_at) : false);
                                        const isWithinOneHour = assessment?.is_sample ? true : (assessment?.start_at ? new Date() >= new Date(new Date(assessment.start_at).getTime() - 60 * 60 * 1000) : false);

                                        const canViewRepoLink = isRegistered && privateRepoUrl && accessGranted && hasStarted;
                                        const canViewFiles = isRegistered && privateRepoUrl && accessGranted && isWithinOneHour && !hasStarted;

                                        if (canViewRepoLink) {
                                            return (
                                                <div className="space-y-4">
                                                    <IdeSandbox
                                                        assessmentTitle={assessment.title}
                                                        files={explorerFiles}
                                                        activeFile={activeFileNode}
                                                        onFileSelect={handleFileSelect}
                                                        onSave={handleSaveFile}
                                                        isLoading={isLoadingExplorer}
                                                        isSaving={isSyncingFile}
                                                        isFetchingContent={isFetchingContent}
                                                        isPrefetching={isPrefetching}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground font-mono italic">
                                                        This is a locked-down, browser-only environment. Terminal execution and code running are currently in development — for now, please focus on identifying bugs and logic improvements through code analysis.
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
                                                                    You have early access to view the codebase. The interactive sandbox will be available at start time ({new Date(assessment.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-50 pointer-events-none grayscale">
                                                        <IdeSandbox
                                                            assessmentTitle={assessment.title}
                                                            files={[]}
                                                            activeFile={null}
                                                            onFileSelect={() => { }}
                                                            onSave={async () => { }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        } else if (isRegistered && privateRepoUrl) {
                                            // Registered and repo exists, but not within 1 hour OR access not granted
                                            if (isWithinOneHour && !accessGranted) {
                                                return (
                                                    <div className="p-4 bg-muted/20 border border-primary/20 font-mono text-xs md:text-sm text-primary/80 leading-relaxed animate-pulse rounded-sm">
                                                        Preparing your sandboxed environment... Access will be granted momentarily.
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 font-mono text-xs md:text-sm text-yellow-500/80 leading-relaxed rounded-sm">
                                                    Sandbox will be granted 1 hour before the assessment starts. Please wait for the scheduled time.
                                                </div>
                                            );
                                        } else if (isRegistered) {
                                            // Registered but no private_repo_url (not created yet)
                                            if (assessment?.is_sample) {
                                                if (isProvisioning) {
                                                    return (
                                                        <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground animate-pulse rounded-sm">
                                                            Initializing your secure sandbox... this usually takes a few seconds.
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="p-4 bg-primary/5 border border-primary/20 font-mono text-xs md:text-sm text-primary/80 leading-relaxed rounded-sm flex flex-col gap-4 items-center text-center">
                                                        <span>Initialize your environment by clicking <span className="text-primary font-bold">Launch Sandbox</span> below.</span>
                                                        <Button
                                                            className="w-full sm:w-auto uppercase tracking-widest font-mono font-bold"
                                                            onClick={handleStartNow}
                                                        >
                                                            Launch Sandbox
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
                                                        Initializing your sandbox... this usually takes a few seconds.
                                                    </div>
                                                );
                                            }

                                            if (isWithinOneHour) {
                                                return (
                                                    <div className="p-4 bg-primary/5 border border-primary/20 font-mono text-xs md:text-sm text-primary/80 leading-relaxed rounded-sm flex flex-col gap-4 items-center text-center">
                                                        <span>Setup your environment by clicking <span className="text-primary font-bold">Launch Sandbox</span> below.</span>
                                                        <Button
                                                            className="w-full sm:w-auto uppercase tracking-widest font-mono font-bold"
                                                            onClick={handleStartNow}
                                                        >
                                                            Launch Sandbox
                                                        </Button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground rounded-sm">
                                                    Sandbox will be available 1 hour before start.
                                                </div>
                                            );
                                        } else {
                                            // Not registered
                                            return (
                                                <div className="p-4 bg-muted/30 border border-border border-dashed font-mono text-xs md:text-sm text-muted-foreground rounded-sm">
                                                    Register to get access to your secure sandbox and instructions.
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
                        <div className="lg:col-span-3 space-y-6 md:space-y-8">
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
                                        <p className="font-mono text-sm">{(assessment?.is_sample) ? (codingStartedAt ? new Date(codingStartedAt).toLocaleString() : '—') : (assessment?.start_at ? new Date(assessment.start_at).toLocaleString() : '—')}</p>
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
                                    {/* Live countdown timer — visible once the candidate is registered */}
                                    {isRegistered && !isPeerReviewPhase && !isFinished && _codingEndMs !== null && (
                                        <div className="border-t pt-4 mt-2 border-border">
                                            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Time Remaining</p>
                                            <p className={`font-mono text-xl font-bold tabular-nums ${timeRemainingMs !== null && timeRemainingMs < 5 * 60 * 1000
                                                    ? 'text-red-400 animate-pulse'
                                                    : 'text-primary'
                                                }`}>
                                                {timeRemainingMs !== null ? formatTimeRemaining(timeRemainingMs) : '—'}
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

                            {/* Peer Review Reporter (Moved to Sidebar) */}
                            {isPeerReviewPhase && peerReviewRepoUrl && (
                                <div className="mt-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
                                    <PeerReviewReporter {...prState} />
                                </div>
                            )}

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
                                                // Shared handler: finish only the coding phase (sets finished_at, revokes GitHub access)
                                                const handleFinishCodingRound = async () => {
                                                    if (!id) return;
                                                    const ok = window.confirm('Finish coding round? Your sandbox access will be locked and you will enter the peer review phase.');
                                                    if (!ok) return;
                                                    try {
                                                        const { error: finishError } = await supabase.rpc('candidate_finish_assessment', { p_assessment_id: id });
                                                        if (finishError) throw finishError;
                                                        const { error: revokeError } = await supabase.functions.invoke('revoke-assessment-access', { body: { assessmentId: id, candidateUserId: profile?.id } });
                                                        if (revokeError) console.error('GitHub revoke failed:', revokeError);
                                                        setAccessGranted(false);
                                                        setIsFinished(true);
                                                        setShowSuccessModal(true);
                                                        toast({ title: 'Coding Round Finished', description: 'Waiting for peer review to be assigned.' });
                                                    } catch (err: any) {
                                                        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                                    }
                                                };
                                                // Handler: submit peer review findings and finalize
                                                const handleSubmitPeerReview = async () => {
                                                    if (!id) return;
                                                    const ok = window.confirm('Finalize and submit your peer review?\n\nOnce submitted, you cannot add more findings.');
                                                    if (!ok) return;
                                                    try {
                                                        const { error } = await supabase.rpc('candidate_skip_peer_review', { p_assessment_id: id });
                                                        if (error) throw error;
                                                        setIsFinished(true);
                                                        setSubmittedPeerReview(true);
                                                        setShowSuccessModal(true);
                                                        toast({ title: 'Peer Review Submitted', description: 'Your findings have been submitted.' });
                                                    } catch (err: any) {
                                                        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                                    }
                                                };
                                                // Handler: skip peer review entirely (no opponent assigned)
                                                const handleFinalizAndSkipPeerReview = async () => {
                                                    if (!id) return;
                                                    const ok = window.confirm('Finalize and skip peer review?\n\nYou will receive 0 points for the peer review component. This cannot be undone.');
                                                    if (!ok) return;
                                                    try {
                                                        const { error } = await supabase.rpc('candidate_skip_peer_review', { p_assessment_id: id });
                                                        if (error) throw error;
                                                        setIsFinished(true);
                                                        setSkippedPeerReview(true);
                                                        setShowSuccessModal(true);
                                                        toast({ title: 'Peer Review Skipped', description: 'Your submission has been fully finalized.' });
                                                    } catch (err: any) {
                                                        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                                                    }
                                                };

                                                if (isFinished) {
                                                    const hasPeer = !!peerReviewRepoUrl;
                                                    return (
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm text-center">
                                                                {assessment?.emergency_abandoned ? (
                                                                    <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                                                        <XCircle className="h-3 w-3" /> Round Abandoned
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <CheckCircle className="h-3 w-3" /> Phase 2: {hasPeer ? 'Review Active' : skippedPeerReview ? 'Skipped' : 'Waiting for Opponent'}
                                                                    </p>
                                                                )}
                                                                <p className="text-[9px] font-mono text-white/50 uppercase leading-relaxed mt-1">
                                                                    {assessment?.emergency_abandoned
                                                                        ? 'This round was emergency abandoned by the administrator.'
                                                                        : hasPeer
                                                                            ? 'Coding ended. You have been assigned a peer review task.'
                                                                            : skippedPeerReview
                                                                                ? 'You skipped peer review. Submission fully finalized.'
                                                                                : 'Coding ended. Waiting for a competitor to finish...'
                                                                    }
                                                                </p>
                                                            </div>
                                                            {/* Finalize & Submit Peer Review — shown when peer is assigned and reviewing */}
                                                            {hasPeer && !assessment?.emergency_abandoned && !skippedPeerReview && (
                                                                <>
                                                                    <Button
                                                                        className="w-full font-mono text-xs h-10 uppercase tracking-widest bg-green-600 hover:bg-green-500 text-white"
                                                                        onClick={handleSubmitPeerReview}
                                                                    >
                                                                        Finalize & Submit Peer Review
                                                                    </Button>
                                                                    <p className="text-[9px] text-muted-foreground text-center font-mono leading-relaxed">
                                                                        Submit your findings and fully finalize your submission.
                                                                    </p>
                                                                </>
                                                            )}
                                                            {/* Skip peer review (no opponent yet) */}
                                                            {!hasPeer && !assessment?.emergency_abandoned && !skippedPeerReview && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="w-full font-mono text-xs h-10 uppercase tracking-widest text-red-400 border-red-400/30 hover:bg-red-400/5"
                                                                        onClick={handleFinalizAndSkipPeerReview}
                                                                    >
                                                                        Finalize & Submit (Skip Peer Review)
                                                                    </Button>
                                                                    <p className="text-[9px] text-muted-foreground text-center font-mono leading-relaxed">
                                                                        Permanently skips peer review. You will receive 0 points for that component.
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return hasStarted ? (
                                                    <div className="space-y-3">
                                                        {isPeerReviewPhase ? (
                                                            // Coding time expired but candidate hasn't formally submitted yet
                                                            <>
                                                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-sm text-center">
                                                                    <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <CheckCircle className="h-3 w-3" /> Phase 2: Waiting for Opponent
                                                                    </p>
                                                                    <p className="text-[9px] font-mono text-white/50 uppercase leading-relaxed mt-1">
                                                                        Coding time ended. Submit your work to enter peer review.
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    className="w-full font-mono text-sm h-12 uppercase tracking-widest"
                                                                    size="lg"
                                                                    onClick={handleFinishCodingRound}
                                                                >
                                                                    Finish Coding Round
                                                                </Button>
                                                                <p className="text-[10px] text-muted-foreground text-center font-mono leading-relaxed">
                                                                    Submits your code and waits for peer review to be assigned.
                                                                </p>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full font-mono text-xs h-10 uppercase tracking-widest text-red-400 border-red-400/30 hover:bg-red-400/5"
                                                                    onClick={handleFinalizAndSkipPeerReview}
                                                                >
                                                                    Finalize & Submit (Skip Peer Review)
                                                                </Button>
                                                                <p className="text-[9px] text-muted-foreground text-center font-mono leading-relaxed">
                                                                    Permanently skips peer review. You will receive 0 points for that component.
                                                                </p>
                                                            </>
                                                        ) : (
                                                            // Active coding phase
                                                            <>
                                                                <Button
                                                                    className="w-full font-mono text-sm h-12 uppercase tracking-widest"
                                                                    size="lg"
                                                                    onClick={handleFinishCodingRound}
                                                                >
                                                                    Finish Coding Round
                                                                </Button>
                                                                <p className="text-[10px] text-muted-foreground text-center font-mono leading-relaxed">
                                                                    Locks the sandbox and waits for peer review phase.
                                                                </p>
                                                            </>
                                                        )}
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
                                                            {isProvisioning ? "Initializing Sandbox..." : "Launch Sandbox"}
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
            <SubmissionSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onGoToDashboard={() => window.location.href = '/candidate/rounds'}
                isSampleRound={assessment?.is_sample}
                isPeerReviewSkip={skippedPeerReview}
                isPeerReviewSubmit={submittedPeerReview}
            />

            {/* Security Overlay: Mobile Lockout */}
            {isMobileView && !concurrencyError && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-8 max-w-sm text-center p-8">
                        <div className="relative">
                            <div className="h-24 w-24 border-2 border-red-500/20 rounded-full animate-ping absolute inset-0" />
                            <div className="h-24 w-24 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center relative">
                                <TimerOff className="h-10 w-10 text-red-500" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="font-mono text-xl font-bold text-red-500 uppercase tracking-widest leading-tight">
                                Desktop Access Required
                            </h2>
                            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                                This assessment environment is strictly limited to desktop browsers. Please switch to a laptop or computer to continue.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Overlay: Concurrency Lockout */}
            {concurrencyError && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-red-950/90 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex flex-col items-center gap-10 max-w-md text-center p-10 border border-red-500/30 bg-black/40 rounded-sm shadow-2xl">
                        <div className="relative">
                            <div className="h-28 w-28 border-2 border-red-500/20 rounded-full animate-ping absolute inset-0" />
                            <div className="h-28 w-28 bg-red-500/10 border border-red-500/40 rounded-full flex items-center justify-center relative">
                                <XCircle className="h-12 w-12 text-red-500" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h2 className="font-mono text-2xl font-bold text-red-500 uppercase tracking-tighter">
                                Multiple Sessions Detected
                            </h2>
                            <p className="text-sm text-red-200/60 font-mono leading-relaxed">
                                Our security engine has detected another active session for this account. To maintain integrity, you are being automatically logged out of all devices.
                            </p>
                            <div className="pt-4">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-500 text-black font-bold uppercase tracking-widest text-xs animate-pulse">
                                    Logging out in {logoutCountdown}s...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Time Expired Dialog */}
            <Dialog open={showTimeExpiredDialog} onOpenChange={() => { }}>
                <DialogContent
                    className="sm:max-w-md bg-background border-border font-mono"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="flex flex-col items-center gap-4 py-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <TimerOff className="h-10 w-10 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-bold uppercase tracking-widest text-center">
                            Time's Up!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pb-4 px-2">
                        <p className="text-sm text-muted-foreground text-center font-mono leading-relaxed">
                            Your coding time has ended. Please wait for the{' '}
                            <span className="text-primary font-bold">peer review round</span>{' '}
                            to begin.
                        </p>
                        <p className="text-xs text-muted-foreground text-center font-mono">
                            You'll be notified here once a peer reviewer is assigned.
                        </p>
                    </div>
                    <div className="flex justify-center pb-4">
                        <Button
                            onClick={() => setShowTimeExpiredDialog(false)}
                            className="font-mono uppercase tracking-widest text-xs"
                        >
                            Got It
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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

function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
