import { useState, useEffect } from "react";
import { useParams, useSearchParams } from 'react-router-dom';

import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const predefinedRoles = [
  'Accessibility Engineer', 'Android Engineer', 'Backend Engineer', 'Build/Release Engineer',
  'Cloud Engineer', 'Computer Vision Engineer', 'Data Engineer', 'Database Engineer',
  'Developer Advocate', 'DevOps Engineer', 'Embedded Systems Engineer', 'Frontend Engineer',
  'Full Stack Engineer', 'Game Developer', 'Graphics Engineer', 'Infrastructure Engineer',
  'iOS Engineer', 'Machine Learning Engineer', 'Mobile Engineer', 'Network Engineer',
  'Performance Engineer', 'Platform Architect', 'QA Engineer', 'Security Engineer',
  'Site Reliability Engineer', 'Test Automation Engineer'
];

export default function AssessmentBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { id } = useParams();

  // Check URL parameter for paid/unpaid
  const [searchParams] = useSearchParams();
  const isPaidParam = searchParams.get('paid');

  // Initialize state directly from URL to avoid effect delay/race conditions
  const [isPaid, setIsPaid] = useState(() => {
    if (isPaidParam !== null) return isPaidParam !== 'false';
    // Default for edit mode (where param might be missing but loaded from DB later)
    return true;
  });

  // Round 2 creation params
  const parentAssessmentId = searchParams.get('from');
  const selectedCandidateIds = searchParams.get('selected')?.split(',') || [];
  const isRound2 = Boolean(parentAssessmentId);

  const [isLoaded, setIsLoaded] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);

  // Super-organizer powers (only for thewirrecompany@gmail.com)
  const isSuperOrganizer = profile?.email === 'thewirrecompany@gmail.com';
  const [isSampleRound, setIsSampleRound] = useState(false);

  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [positions, setPositions] = useState(1);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [customTechInput, setCustomTechInput] = useState("");
  const [additionalTechs, setAdditionalTechs] = useState<string[]>([]);
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'repo' | 'wirre'>('repo');
  const [selectedLevel, setSelectedLevel] = useState("");

  const levels = ['Intern', 'New Grad', 'Level 1', 'Level 2', 'Level 3', 'Junior', 'Mid', 'Senior', 'Staff', 'Principal', 'Lead'];
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  const topTechnologies = [
    'Ansible', 'Angular', 'AWS', 'Azure', 'C', 'C#', 'C++', 'CSS', 'Django', 'Docker',
    'Docker Compose', 'Dotnet', 'ElasticSearch', 'Elixir', 'Electron', 'Express',
    'FastAPI', 'Flask', 'Flutter', 'GCP', 'Grafana', 'GraphQL', 'gRPC', 'Go',
    'Hadoop', 'HTML', 'InfluxDB', 'Jest', 'Java', 'JavaScript', 'Kafka', 'Kotlin',
    'Kubernetes', 'Laravel', 'MariaDB', 'MongoDB', 'MySQL', 'NestJS', 'Neo4j',
    'Next.js', 'Node.js', 'NumPy', 'Pandas', 'PHP', 'Playwright', 'PostCSS',
    'PostgreSQL', 'Prometheus', 'PyTorch', 'Python', 'React', 'React Native',
    'Redux', 'Redis', 'REST', 'Rollup', 'Ruby', 'Rails', 'RxJS', 'Rust', 'SASS',
    'Scala', 'Scikit-learn', 'Svelte', 'SolidJS', 'Spark', 'Spring', 'Storybook',
    'SQL', 'Swift', 'Tailwind CSS', 'TensorFlow', 'TypeScript', 'Vite', 'Vitest',
    'Vue', 'Webpack'
  ];

  const allTechnologies = [...topTechnologies, ...additionalTechs];
  const displayedTechnologies = techSearchQuery
    ? allTechnologies.filter(tech => tech.toLowerCase().includes(techSearchQuery.toLowerCase()))
    : allTechnologies;

  // --- REPO VERIFICATION STATES ---
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasRepoAccess, setHasRepoAccess] = useState(false);
  const [hasPaymentConfirmed, setHasPaymentConfirmed] = useState(false);
  const [localAssessmentId, setLocalAssessmentId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [repoInstallUrl, setRepoInstallUrl] = useState<string | null>(null);
  const [repoVerifyError, setRepoVerifyError] = useState<string | null>(null);

  // Store original max salary for edit comparison
  const [originalMaxSalary, setOriginalMaxSalary] = useState<number>(0);

  const finalRole = customRole.trim() || selectedRole;
  const maxSalaryNum = parseFloat(maxSalary) || 0;
  const minSalaryNum = parseFloat(minSalary) || 0;
  const platformFee = positions * 0.20 * maxSalaryNum;

  const repoProvided = githubRepo.trim().includes('/');
  const salaryValid = (minSalaryNum > 0) && (minSalaryNum < maxSalaryNum) && (maxSalaryNum <= 10000000);

  // Sample rounds (super-organizer only): no date required
  const dateRequired = !isSampleRound;

  // Different validation for paid vs unpaid
  const allFieldsFilled = isPaid ? Boolean(
    finalRole &&
    selectedLevel &&
    (assignmentMode === 'wirre' || repoProvided) &&
    salaryValid &&
    selectedTechs.length >= 1 &&
    selectedTechs.length <= 10 &&
    durationMinutes > 0 &&
    (!dateRequired || (startDate !== '' && startTime !== ''))
  ) : Boolean(
    // Unpaid: no role, level, salary, or positions required
    (assignmentMode === 'wirre' || repoProvided) &&
    selectedTechs.length >= 1 &&
    selectedTechs.length <= 10 &&
    durationMinutes > 0 &&
    (!dateRequired || (startDate !== '' && startTime !== ''))
  );

  const canPublish = allFieldsFilled && hasCheckedStatus && (assignmentMode === 'wirre' || hasRepoAccess);

  // --- MISSING ITEMS CHECKLIST (for Verify button) ---
  const getMissingItems = () => {
    const items: string[] = [];
    if (isPaid) {
      if (!finalRole) items.push('Role name');
      if (!selectedLevel) items.push('Level');
      if (!salaryValid) items.push('Valid salary range (min < max)');
    }
    if (assignmentMode === 'repo' && !repoProvided) items.push('Repository (owner/name)');
    if (selectedTechs.length < 1) items.push('At least 1 technology');
    if (selectedTechs.length > 10) items.push('No more than 10 technologies');
    if (durationMinutes <= 0) items.push('Duration (minutes)');
    // Date/time only required when not a sample round
    if (dateRequired && !startDate) items.push('Start date');
    if (dateRequired && !startTime) items.push('Start time');
    return items;
  };

  const missingItems = getMissingItems();

  const [descriptionColumnExists, setDescriptionColumnExists] = useState(false);
  const [salaryColumnsExist, setSalaryColumnsExist] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) return;
        setIsPaid(data.is_paid); // Correctly set paid status from DB
        setIsSampleRound(data.is_sample || false); // Load sample round flag
        setCustomRole(data.title || '');
        setGithubRepo(data.github_repo_owner ? `${data.github_repo_owner}/${data.github_repo_name}` : '');
        setPositions(data.positions || 1);
        setSelectedTechs(data.technologies || []);
        setDescription(data.description || '');
        setAssignmentMode(data.github_repo_owner ? 'repo' : 'wirre');
        setSelectedLevel(data.assignment_level || '');
        setDurationMinutes(data.duration_minutes || 180);
        if (data.start_at) {
          const d = new Date(data.start_at);
          const pad = (n: number) => String(n).padStart(2, '0');
          const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          const localTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setStartDate(localDate);
          setStartTime(localTime);
        } else {
          setStartDate('');
          setStartTime('');
        }
        setMinSalary(String(data.min_salary || ''));
        setMaxSalary(String(data.max_salary || ''));
        setOriginalMaxSalary(data.max_salary || 0);
        setHasRepoAccess(data.github_repo_verified || false);
        setHasCheckedStatus(true);
        setHasPaymentConfirmed(Boolean(data.payment_confirmed));
      } catch (err) {
        toast({ title: 'Load failed', description: String(err), variant: 'destructive' });
      }
    })();
  }, [id]);

  // --- ROUND 2 CREATION: Load parent assessment data ---
  useEffect(() => {
    if (!parentAssessmentId || id) return; // Only run for new Round 2 creation
    (async () => {
      try {
        const { data, error } = await supabase.from('assessments').select('*').eq('id', parentAssessmentId).single();
        if (error) throw error;
        if (!data) return;

        // Pre-populate from parent assessment
        setIsPaid(data.is_paid);
        setCustomRole(data.title ? `${data.title} - Round 2` : 'Round 2');
        setGithubRepo(data.github_repo_owner ? `${data.github_repo_owner}/${data.github_repo_name}` : '');
        setPositions(data.positions || 1);
        setSelectedTechs(data.technologies || []);
        setDescription(data.description || '');
        setAssignmentMode(data.github_repo_owner ? 'repo' : 'wirre');
        setSelectedLevel(data.assignment_level || '');
        setDurationMinutes(data.duration_minutes || 180);
        setMinSalary(String(data.min_salary || ''));
        setMaxSalary(String(data.max_salary || ''));
        setOriginalMaxSalary(data.max_salary || 0);
        // Don't copy start date/time - user needs to set new ones
        setStartDate('');
        setStartTime('');
        // Set round number
        setRoundNumber((data.round_number || 1) + 1);
        setIsLoaded(true);

        toast({
          title: 'Round 2 Template Loaded',
          description: `Creating Round ${(data.round_number || 1) + 1} with ${selectedCandidateIds.length} selected candidates.`
        });
      } catch (err) {
        console.error('Failed to load parent assessment:', err);
        toast({ title: 'Load failed', description: String(err), variant: 'destructive' });
      }
    })();
  }, [parentAssessmentId, id]);

  // --- LOCAL STORAGE PERSISTENCE ---
  const STORAGE_KEY = isPaid ? 'wirre_assessment_builder_draft_paid' : 'wirre_assessment_builder_draft_unpaid';

  // Load from local storage on mount (only if creating new)
  useEffect(() => {
    if (id) return; // Don't load draft if editing existing

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.isPaid !== undefined && id) setIsPaid(data.isPaid);

        if (data.selectedRole) setSelectedRole(data.selectedRole);
        if (data.customRole) setCustomRole(data.customRole);
        if (data.selectedLevel) setSelectedLevel(data.selectedLevel);
        if (data.githubRepo) setGithubRepo(data.githubRepo);
        if (data.positions) setPositions(data.positions);
        if (data.selectedTechs) setSelectedTechs(data.selectedTechs);
        if (data.additionalTechs) setAdditionalTechs(data.additionalTechs);
        if (data.description) setDescription(data.description);
        if (data.durationMinutes) setDurationMinutes(data.durationMinutes);
        if (data.startDate) setStartDate(data.startDate);
        if (data.startTime) setStartTime(data.startTime);
        if (data.assignmentMode) setAssignmentMode(data.assignmentMode);
        if (data.minSalary) setMinSalary(data.minSalary);
        if (data.maxSalary) setMaxSalary(data.maxSalary);
      } else {
        // RESET fields if no draft found (prevents bleeding from other mode during switch)
        setSelectedRole("");
        setCustomRole("");
        setSelectedLevel("");
        setGithubRepo("");
        setPositions(1);
        setSelectedTechs([]);
        setAdditionalTechs([]);
        setDescription("");
        setDurationMinutes(180);
        setStartDate("");
        setStartTime("");
        setAssignmentMode('repo');
        setMinSalary("");
        setMaxSalary("");
      }
      setIsLoaded(true); // Mark as loaded
    } catch (e) {
      console.error("Failed to load draft assessment", e);
      setIsLoaded(true); // Proceed anyway
    }
  }, [id, isPaid, isPaidParam]);

  // Save to local storage whenever fields change (only if creating new)
  useEffect(() => {
    if (id) return; // Don't save as draft if editing existing
    if (!isLoaded) return; // Don't save if we haven't finished loading/resetting for this mode

    const dataToSave = {
      // isPaid, // Don't save isPaid
      selectedRole,
      customRole,
      selectedLevel,
      githubRepo,
      positions,
      selectedTechs,
      additionalTechs,
      description,
      durationMinutes,
      startDate,
      startTime,
      assignmentMode,
      minSalary,
      maxSalary
    };

    // Debounce slightly or just save on every change (local storage is fast enough for this amount of data)
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    id, isPaid, isLoaded, selectedRole, customRole, selectedLevel, githubRepo,
    positions, selectedTechs, additionalTechs, description,
    durationMinutes, startDate, startTime, assignmentMode, minSalary, maxSalary
  ]);

  // --- NEW VERIFICATION LOGIC ---
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setRepoInstallUrl(null);
    setRepoVerifyError(null);

    try {
      const parts = githubRepo.trim().split('/');
      if (parts.length !== 2) throw new Error('Repository must be owner/name');
      const [owner, repo] = parts;

      // Check if this repository is already used in another assessment
      const { data: existingAssessments, error: checkError } = await supabase
        .from('assessments')
        .select('id, title')
        .eq('github_repo_owner', owner)
        .eq('github_repo_name', repo);

      if (checkError) throw checkError;

      // Filter out current assessment if editing
      const duplicates = existingAssessments?.filter((a: any) => a.id !== id) || [];

      if (duplicates.length > 0) {
        const duplicateTitle = duplicates[0].title;
        throw new Error(`This repository is already used in "${duplicateTitle}". Please use a different repository.`);
      }

      const res = await fetch('https://iaqzckrdoovxtmjinxal.supabase.co/functions/v1/verify-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ owner, repo })
      });

      const data = await res.json();

      if (data.ok) {
        // Template repo verified and accessible by WIRRE
        setHasRepoAccess(true);
        setHasCheckedStatus(true);
        toast({ title: 'Template Verified', description: `WIRRE can access ${githubRepo} as assessment template` });
      } else {
        setHasRepoAccess(false);
        setHasCheckedStatus(true);
        if (data.install_url) setRepoInstallUrl(data.install_url);
        setRepoVerifyError(data.error || 'Verification failed');
        toast({ title: 'Access Denied', description: 'Please install the GitHub App.', variant: 'destructive' });
      }
    } catch (err: any) {
      setRepoVerifyError(err.message);
      toast({ title: 'Verification error', description: err.message, variant: 'destructive' });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePublish = async () => {
    try {
      // Skip payment checks for unpaid assessments
      if (!isPaid) {
        // Validation before publishing unpaid assessment
        // Skip date/time validation entirely for sample rounds
        if (!isSampleRound && startDate && startTime) {
          const now = new Date();
          const scheduledTime = new Date(`${startDate}T${startTime}`);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const schedDate = new Date(scheduledTime.getFullYear(), scheduledTime.getMonth(), scheduledTime.getDate());

          if (schedDate < today) {
            toast({ title: 'Validation Error', description: 'Start date cannot be in the past', variant: 'destructive' });
            return;
          }
          if (scheduledTime <= now) {
            toast({ title: 'Validation Error', description: 'Start time must be in the future', variant: 'destructive' });
            return;
          }
        }

        const finalDescription = isSampleRound
          ? `${description}\n\n---\n**NOTE:** This is a sample round meant only to demonstrate the platform's workflow. No submissions will be evaluated, and there are no results for this round.`
          : description;

        // Directly publish unpaid assessment
        const parts = assignmentMode === 'repo' ? githubRepo.split('/') : [];
        const insertPayload: any = {
          company_user_id: profile?.id,
          title: customRole || 'Practice Round',
          github_repo_owner: assignmentMode === 'repo' ? parts[0] : null,
          github_repo_name: assignmentMode === 'repo' ? parts[1] : null,
          github_repo_verified: assignmentMode === 'repo' ? hasRepoAccess : null,
          assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
          assignment_level: null,
          status: 'awaiting_classroom_setup',
          positions: 1,
          technologies: selectedTechs,
          duration_minutes: durationMinutes,
          start_at: isSampleRound ? null : ((startDate && startTime) ? (isNaN(new Date(`${startDate}T${startTime}`).getTime()) ? null : new Date(`${startDate}T${startTime}`).toISOString()) : null),
          min_salary: 0,
          max_salary: 0,
          description: finalDescription,
          is_paid: false,
          is_sample: isSampleRound,
          round_number: isRound2 ? roundNumber : 1,
          parent_assessment_id: isRound2 ? parentAssessmentId : null
        };

        const targetId = id || localAssessmentId;
        const { data, error } = targetId
          ? await supabase.from('assessments').update(insertPayload).eq('id', targetId).select().single()
          : await supabase.from('assessments').insert([insertPayload]).select().single();

        if (error) throw error;

        // If this is Round 2, automatically register selected candidates
        if (isRound2 && selectedCandidateIds.length > 0 && data?.id) {
          try {
            const { data: parentRegs, error: parentRegsError } = await supabase
              .from('assessment_registrations')
              .select('user_id, anonymous_id')
              .eq('assessment_id', parentAssessmentId)
              .in('anonymous_id', selectedCandidateIds);

            if (parentRegsError) throw parentRegsError;

            if (parentRegs && parentRegs.length > 0) {
              const registrations = parentRegs.map((reg: any) => ({
                assessment_id: data.id,
                user_id: reg.user_id,
                anonymous_id: reg.anonymous_id,
              }));

              const { error: regError } = await supabase
                .from('assessment_registrations')
                .insert(registrations);

              if (regError) {
                console.error('Failed to register candidates for Round 2:', regError);
              } else {
                console.log(`Successfully registered ${registrations.length} candidates for Round 2`);
              }
            }
          } catch (regErr) {
            console.error('Error registering Round 2 candidates:', regErr);
          }
        }

        toast({ title: id ? "Updated" : "Published", description: "Practice assessment created." });
        if (id) {
          navigate(`/company/assessments/${id}`);
        } else {
          localStorage.removeItem(STORAGE_KEY); // Clear draft
          navigate('/company/dashboard');
        }
        return;
      }

      // Paid assessment logic follows
      // Check if this is an edit and salary changed
      if (id && originalMaxSalary > 0) {
        // Check if salary decreased
        if (maxSalaryNum < originalMaxSalary) {
          toast({
            title: 'Cannot decrease salary',
            description: 'Please contact customer service to reduce the salary range.',
            variant: 'destructive'
          });
          return;
        }

        // Check if salary increased - requires payment of difference
        if (maxSalaryNum > originalMaxSalary) {
          const salaryDifference = maxSalaryNum - originalMaxSalary;
          const additionalFee = positions * 0.20 * salaryDifference;

          const confirmed = window.confirm(
            `Salary increased by ₹${salaryDifference.toLocaleString('en-IN')}.\n` +
            `Additional payment required: ₹${additionalFee.toFixed(2)}\n\n` +
            `Continue to payment?`
          );

          if (!confirmed) return;

          // Trigger payment for the difference
          await handleMakePaymentForDifference(additionalFee);
          return;
        }
      }

      // No salary change or new assessment - proceed with save
      const parts = assignmentMode === 'repo' ? githubRepo.split('/') : [];
      const insertPayload: any = {
        company_user_id: profile?.id,
        title: finalRole,
        github_repo_owner: assignmentMode === 'repo' ? parts[0] : null,
        github_repo_name: assignmentMode === 'repo' ? parts[1] : null,
        github_repo_verified: assignmentMode === 'repo' ? hasRepoAccess : null,
        assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
        assignment_level: selectedLevel || null,
        status: 'awaiting_classroom_setup',
        positions,
        technologies: selectedTechs,
        duration_minutes: durationMinutes,
        start_at: (startDate && startTime) ? (isNaN(new Date(`${startDate}T${startTime}`).getTime()) ? null : new Date(`${startDate}T${startTime}`).toISOString()) : null,
        min_salary: parseFloat(minSalary),
        max_salary: parseFloat(maxSalary),
        description,
        is_paid: true,
        round_number: isRound2 ? roundNumber : 1,
        parent_assessment_id: isRound2 ? parentAssessmentId : null
      };

      const targetId = id || localAssessmentId;
      const { data, error } = targetId
        ? await supabase.from('assessments').update(insertPayload).eq('id', targetId).select().single()
        : await supabase.from('assessments').insert([insertPayload]).select().single();

      if (error) throw error;

      // If this is Round 2, automatically register selected candidates
      if (isRound2 && selectedCandidateIds.length > 0 && data?.id) {
        try {
          // Get user_ids from parent assessment registrations using anonymous_ids
          const { data: parentRegs, error: parentRegsError } = await supabase
            .from('assessment_registrations')
            .select('user_id, anonymous_id')
            .eq('assessment_id', parentAssessmentId)
            .in('anonymous_id', selectedCandidateIds);

          if (parentRegsError) throw parentRegsError;

          if (parentRegs && parentRegs.length > 0) {
            // Create registrations for Round 2
            const registrations = parentRegs.map((reg: any) => ({
              assessment_id: data.id,
              user_id: reg.user_id,
              anonymous_id: reg.anonymous_id, // Keep same anonymous ID across rounds
            }));

            const { error: regError } = await supabase
              .from('assessment_registrations')
              .insert(registrations);

            if (regError) {
              console.error('Failed to register candidates for Round 2:', regError);
              toast({
                title: 'Warning',
                description: 'Assessment created but failed to register some candidates. Please contact support.',
                variant: 'destructive'
              });
            } else {
              console.log(`Successfully registered ${registrations.length} candidates for Round 2`);
            }
          }
        } catch (regErr) {
          console.error('Error registering Round 2 candidates:', regErr);
        }
      }

      toast({ title: id ? "Updated" : "Published", description: "Assessment is being provisioned." });
      if (id) {
        navigate(`/company/assessments/${id}`);
      } else {
        localStorage.removeItem(STORAGE_KEY); // Clear draft
        navigate('/company/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleMakePayment = async () => {
    setPaymentProcessing(true);
    setRepoVerifyError(null);
    try {
      // Validation before payment
      if (!finalRole) {
        toast({ title: 'Validation Error', description: 'Role name is required', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (!selectedLevel) {
        toast({ title: 'Validation Error', description: 'Level is required', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (assignmentMode === 'repo' && !githubRepo.trim().includes('/')) {
        toast({ title: 'Validation Error', description: 'Repository must be in owner/name format', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (!salaryValid) {
        toast({ title: 'Validation Error', description: 'Valid salary range required (min < max, max ≤ ₹1Cr)', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (selectedTechs.length < 1 || selectedTechs.length > 10) {
        toast({ title: 'Validation Error', description: 'Select between 1 and 10 technologies', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (durationMinutes <= 0) {
        toast({ title: 'Validation Error', description: 'Duration must be greater than 0', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (!startDate || !startTime) {
        toast({ title: 'Validation Error', description: 'Start date and time are required', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }

      const now = new Date();
      const scheduledTime = new Date(`${startDate}T${startTime}`);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const schedDate = new Date(scheduledTime.getFullYear(), scheduledTime.getMonth(), scheduledTime.getDate());

      if (schedDate < today) {
        toast({ title: 'Validation Error', description: 'Start date cannot be in the past', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }
      if (scheduledTime <= now) {
        toast({ title: 'Validation Error', description: 'Start time must be in the future', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }

      if (!profile?.id) {
        toast({ title: 'Validation Error', description: 'User profile not loaded. Please refresh.', variant: 'destructive' });
        setPaymentProcessing(false);
        return;
      }

      const amount = Math.round(platformFee * 100) / 100;

      // If we already have an assessment id (editing existing), tell the confirm-payment function to mark it paid
      const targetId = id || localAssessmentId;

      // If no existing assessment, prepare payload to create a draft assessment server-side
      let payload: any = undefined;
      if (!targetId) {
        const parts = githubRepo.split('/');
        payload = {
          company_user_id: profile?.id,
          title: finalRole,
          github_repo_owner: assignmentMode === 'repo' ? (parts[0] || null) : null,
          github_repo_name: assignmentMode === 'repo' ? (parts[1] || null) : null,
          github_repo_verified: hasRepoAccess,
          assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
          assignment_level: selectedLevel || null,
          status: 'awaiting_classroom_setup',
          positions,
          technologies: selectedTechs,
          duration_minutes: durationMinutes,
          start_at: (startDate && startTime) ? (isNaN(new Date(`${startDate}T${startTime}`).getTime()) ? null : new Date(`${startDate}T${startTime}`).toISOString()) : null,
          min_salary: parseFloat(minSalary) || null,
          max_salary: parseFloat(maxSalary) || null,
          description,
          is_paid: true
        };
        console.log('Sending payload:', payload);
      }

      // Create Razorpay order (this will create a draft assessment if needed)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ amount, assessment_id: targetId, payload })
      });

      const json = await res.json();
      if (!json.ok) {
        console.error('Payment creation failed:', json);
        const dbError = json.details?.message || json.details?.error || JSON.stringify(json.details);
        throw new Error((json.error || 'Failed to create payment order') + (dbError ? `: ${dbError}` : ''));
      }

      // if the function returned an assessment_id (created draft), keep local copy
      if (json.assessment_id) setLocalAssessmentId(json.assessment_id);

      // Load Razorpay script if not present
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
          document.head.appendChild(s)
        })
      }

      const options: any = {
        key: json.key,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'WIRRE',
        order_id: json.order_id,
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay via UPI/RuPay',
                instruments: [
                  { method: 'upi' },
                  { method: 'card', networks: ['RuPay'] }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: { show_default_blocks: false }
          }
        },
        handler: async function (resp: any) {
          // Payment succeeded client-side
          console.log('Payment response:', resp);

          // Manually confirm payment in database (fallback in case webhook fails)
          try {
            const confirmId = id || localAssessmentId || json.assessment_id;
            if (confirmId) {
              const { error: updateError } = await supabase
                .from('assessments')
                .update({
                  payment_confirmed: true,
                  payment_amount: amount,
                  payment_confirmed_at: new Date().toISOString()
                })
                .eq('id', confirmId);

              if (updateError) {
                console.error('Failed to confirm payment in DB:', updateError);
              } else {
                console.log('Payment confirmed in database');
              }
            }
          } catch (dbError) {
            console.error('Error confirming payment:', dbError);
          }

          setHasPaymentConfirmed(true);
          toast({ title: 'Payment successful', description: 'Payment confirmed!' });
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setRepoVerifyError(err.message);
      toast({ title: 'Payment error', description: err.message, variant: 'destructive' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleMakePaymentForDifference = async (amount: number) => {
    setPaymentProcessing(true);
    setRepoVerifyError(null);
    try {
      // Create Razorpay order for the salary difference
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ amount, assessment_id: id })
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to create payment order');

      // Load Razorpay script if not present
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
          document.head.appendChild(s)
        })
      }

      const options: any = {
        key: json.key,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'WIRRE - Salary Increase',
        description: 'Additional payment for salary increase',
        order_id: json.order_id,
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay via UPI/RuPay',
                instruments: [
                  { method: 'upi' },
                  { method: 'card', networks: ['RuPay'] }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: { show_default_blocks: false }
          }
        },
        handler: async (resp: any) => {
          // Payment succeeded - now save the changes
          console.log('Difference payment response:', resp);
          toast({ title: 'Payment successful', description: 'Updating assessment...' });

          // First, update payment confirmation
          try {
            const { error: paymentError } = await supabase
              .from('assessments')
              .update({
                payment_confirmed: true,
                payment_amount: (originalMaxSalary * positions * 0.20) + amount, // Total amount paid
                payment_confirmed_at: new Date().toISOString()
              })
              .eq('id', id);

            if (paymentError) {
              console.error('Failed to confirm payment:', paymentError);
            }
          } catch (err) {
            console.error('Error updating payment:', err);
          }

          // Update the assessment with new values
          const parts = githubRepo.split('/');
          const insertPayload: any = {
            company_user_id: profile?.id,
            title: finalRole,
            github_repo_owner: assignmentMode === 'repo' ? parts[0] : null,
            github_repo_name: assignmentMode === 'repo' ? parts[1] : null,
            github_repo_verified: hasRepoAccess,
            assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
            assignment_level: selectedLevel || null,
            status: 'awaiting_classroom_setup',
            positions,
            technologies: selectedTechs,
            duration_minutes: durationMinutes,
            start_at: (startDate && startTime) ? (isNaN(new Date(`${startDate}T${startTime}`).getTime()) ? null : new Date(`${startDate}T${startTime}`).toISOString()) : null,
            min_salary: parseFloat(minSalary),
            max_salary: parseFloat(maxSalary),
            description
          };

          const { error } = await supabase.from('assessments').update(insertPayload).eq('id', id).select().single();

          if (error) {
            toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
          } else {
            toast({ title: 'Updated', description: 'Assessment updated successfully.' });
            navigate(`/company/assessments/${id}`);
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setRepoVerifyError(err.message);
      toast({ title: 'Payment error', description: err.message, variant: 'destructive' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container px-4 md:px-6 max-w-4xl">
          <div className="text-center md:text-left mb-8 md:mb-12">
            <h1 className="text-2xl md:text-4xl font-bold font-mono tracking-tight uppercase mb-2">Configure Round</h1>
            <p className="text-muted-foreground font-mono text-xs md:text-sm tracking-widest">
              Setup {isPaid ? 'paid recruitment' : 'public practice'} assessment
            </p>
          </div>

          {isPaid && (
            <>
              <section className="mb-10 md:mb-12">
                <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-4 block text-muted-foreground">01. Select Role Profile</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                  {predefinedRoles.map((role) => (
                    <button key={role} onClick={() => { setSelectedRole(role); setCustomRole(""); setSelectedLevel(""); }}
                      className={`p-3 border font-mono text-[10px] md:text-xs text-left transition-all ${selectedRole === role && !customRole ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>{role}</button>
                  ))}
                </div>
                <div className="mt-4">
                  <Label className="font-mono text-[10px] uppercase tracking-wider mb-2 block text-muted-foreground/60 italic">Or enter custom role name</Label>
                  <Input placeholder="Engineering Manager, Senior Dev, etc." value={customRole} onChange={(e) => { setCustomRole(e.target.value); setSelectedRole(""); }} className="font-mono h-11" />
                </div>
              </section>

              {finalRole && (
                <section className="mb-8 md:mb-10">
                  <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-4 block text-muted-foreground">02. Experience Level</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-2">
                    {levels.map((lvl) => (
                      <button key={lvl} type="button" onClick={() => setSelectedLevel(lvl)}
                        className={`p-2 border font-mono text-[10px] md:text-xs text-center transition-all ${selectedLevel === lvl ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>{lvl}</button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {!isPaid && (
            <section className="mb-10 md:mb-12">
              <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-4 block text-muted-foreground">Practice Round Title</Label>
              <Input
                placeholder="e.g., JavaScript Fundamentals, React Performance Challenge"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="font-mono h-12"
              />
            </section>
          )}

          <section className="mb-10 md:mb-12">
            <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-4 block text-muted-foreground">03. Target Technologies (1–10)</Label>

            {/* Selected Technologies Display */}
            {selectedTechs.length > 0 && (
              <div className="mb-4 p-4 border border-border bg-secondary/10 rounded-sm">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-3 text-muted-foreground">
                  Selected ({selectedTechs.length}/10)
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTechs.map((tech) => (
                    <span key={tech} className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-black text-[10px] md:text-xs font-mono rounded-sm font-bold">
                      {tech}
                      <button
                        type="button"
                        onClick={() => setSelectedTechs(p => p.filter(t => t !== tech))}
                        className="hover:opacity-70 ml-1 text-lg leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unified Tech Search & Add */}
            <div className="relative mb-3">
              <Input
                placeholder="Type to search or add technology..."
                value={techSearchQuery}
                onChange={(e) => setTechSearchQuery(e.target.value)}
                onFocus={() => setCustomTechInput('focused')}
                onBlur={() => setTimeout(() => setCustomTechInput(''), 150)}
                className="font-mono h-11"
              />
              {/* Dropdown */}
              {customTechInput === 'focused' && techSearchQuery && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border bg-card rounded-sm shadow-lg max-h-52 overflow-auto">
                  {/* Add custom option if not in list */}
                  {techSearchQuery.trim() && !allTechnologies.map(t => t.toLowerCase()).includes(techSearchQuery.trim().toLowerCase()) && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-primary/10 text-primary border-b border-border/50 flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (selectedTechs.length < 10) {
                          setAdditionalTechs(p => [techSearchQuery.trim(), ...p]);
                          setSelectedTechs(p => [...p, techSearchQuery.trim()]);
                          setTechSearchQuery('');
                        }
                      }}
                    >
                      <span className="text-xs">+</span> Add "{techSearchQuery.trim()}"
                    </button>
                  )}
                  {/* Filtered options */}
                  {displayedTechnologies.filter(t => !selectedTechs.includes(t)).slice(0, 12).map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-accent/50 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (selectedTechs.length < 10) {
                          setSelectedTechs(p => [...p, tech]);
                          setTechSearchQuery('');
                        }
                      }}
                    >
                      {tech}
                    </button>
                  ))}
                  {displayedTechnologies.filter(t => !selectedTechs.includes(t)).length === 0 && !techSearchQuery.trim() && (
                    <div className="px-3 py-2 text-sm text-muted-foreground font-mono">No matching technologies</div>
                  )}
                </div>
              )}
            </div>
            {/* Checkbox grid for quick selection */}
            <div className="border border-border p-4 max-h-48 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-3 bg-card/10 rounded-sm">
              {displayedTechnologies.map((tech) => (
                <label key={tech} className="flex items-center gap-3 text-xs font-mono cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" checked={selectedTechs.includes(tech)} onChange={(e) => e.target.checked ? (selectedTechs.length < 10 && setSelectedTechs(p => [...p, tech])) : setSelectedTechs(p => p.filter(t => t !== tech))} />
                  {tech}
                </label>
              ))}
            </div>
          </section>

          <section className="mb-10 md:mb-12">
            <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-4 block text-muted-foreground">04. Detailed Description</Label>
            <Textarea placeholder="Explain the role, requirements, and assessment tasks. Markdown supported..." value={description} onChange={(e) => setDescription(e.target.value)} className="font-mono w-full min-h-[200px]" />
          </section>

          <section className="mb-10 md:mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {isPaid && (
                <div>
                  <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-3 block text-muted-foreground">Available Positions</Label>
                  <Input
                    type="number"
                    min="1"
                    value={positions}
                    onChange={(e) => setPositions(parseInt(e.target.value) || 0)}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (val < 1) setPositions(1);
                    }}
                    className="font-mono h-11"
                  />
                </div>
              )}
              <div>
                <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-3 block text-muted-foreground">Duration (Minutes)</Label>
                <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} className="font-mono h-11" />
              </div>
            </div>
            <div className="space-y-6">
              {isSuperOrganizer && (
                <div className="p-4 border border-primary/30 bg-primary/5 rounded-sm">
                  <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-3 block text-primary">
                    ★ Sample Round (Super Organizer)
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSampleRound(p => !p)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isSampleRound ? 'bg-primary' : 'bg-muted'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSampleRound ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                    <span className="font-mono text-xs text-muted-foreground">
                      {isSampleRound ? 'Enabled — always open, no expiration' : 'Off — normal scheduled round'}
                    </span>
                  </div>
                </div>
              )}
              {!isSampleRound && (
                <>
                  <div>
                    <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-3 block text-muted-foreground">Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="font-mono h-11" />
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-3 block text-muted-foreground">Start Time</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="font-mono h-11" />
                    <p className="mt-2 text-[10px] font-mono text-muted-foreground/60">Scheduled for: {startDate && startTime ? `${startDate} @ ${startTime}` : 'TBD'}</p>
                  </div>
                </>
              )}
              {isSampleRound && (
                <p className="font-mono text-[10px] text-primary/70 italic">
                  ★ This round will remain open forever — candidates can register at any time.
                </p>
              )}
            </div>
          </section>

          {isPaid && (
            <section className="mb-10 md:mb-12">
              <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] mb-4 block text-muted-foreground">05. Compensation Range (Annual INR)</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Input type="number" placeholder="Min Salary" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} className="font-mono h-11" />
                <span className="text-muted-foreground hidden sm:block">TO</span>
                <Input type="number" placeholder="Max Salary" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} className="font-mono h-11" />
              </div>
              {maxSalaryNum > 0 && (
                <div className="mt-6 p-6 border border-primary/20 bg-primary/5 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono rounded-sm">
                  <div className="text-center sm:text-left">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Total Platform Fee (20% of Max)</span>
                    <span className="text-[10px] text-muted-foreground italic">Positions ({positions}) × ₹{(0.2 * maxSalaryNum).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-primary">₹{platformFee.toLocaleString('en-IN')}</span>
                </div>
              )}
            </section>
          )}

          <section className="mb-10 md:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <Label className="font-mono text-[10px] md:text-sm uppercase tracking-[0.2em] text-muted-foreground">06. Assessment Repo Source</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const instructionsDiv = document.getElementById('repo-access-instructions');
                  if (instructionsDiv) {
                    instructionsDiv.classList.toggle('hidden');
                  }
                }}
                className="font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5 h-8 px-4"
              >
                Setup Instructions
              </Button>
            </div>
            <div id="repo-access-instructions" className="hidden mb-6 p-6 border border-border bg-card/20 rounded-sm">
              <div className="space-y-4 text-xs md:text-sm font-mono leading-loose">
                <p className="font-bold text-primary uppercase">Integration Steps:</p>
                <ol className="list-decimal list-outside ml-4 space-y-3 text-muted-foreground">
                  <li>Navigate to your GitHub repository.</li>
                  <li>Enable "Template repository" in Repo Settings.</li>
                  <li>Install the <a href="https://github.com/apps/wirre-repo-verifier/installations/select_target" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">WIRRE App</a> and grant access to this repo.</li>
                  <li>WIRRE will automatically provision private working environments for each candidate.</li>
                  <li className="text-primary font-bold">CRITICAL: Make the repository PUBLIC (READ-ONLY) exactly 2 hours before the round starts.</li>
                </ol>
                <p className="text-[10px] text-muted-foreground italic mt-4 leading-relaxed">
                  Reason: At WIRRE, we appreciate the open source community. By making the source public once the round begins, we allow the community to learn from the challenges, and candidates can discuss the problem and their approaches together after their rounds are complete.
                </p>
              </div>
            </div>
            <Input
              placeholder="owner/repository (e.g., acme-org/frontend-test)"
              value={githubRepo}
              onChange={(e) => {
                setGithubRepo(e.target.value);
                setHasCheckedStatus(false);
                setHasRepoAccess(false);
              }}
              className="font-mono h-12 text-center md:text-left"
            />
          </section>

          <div className="flex flex-col gap-6 border-t border-border/50 pt-10">
            <div className="w-full">
              {!hasCheckedStatus && assignmentMode === 'repo' ? (
                <div className="space-y-6">
                  <Button size="lg" className="w-full h-14 font-mono uppercase tracking-widest" onClick={handleCheckStatus} disabled={!allFieldsFilled || checkingStatus}>
                    {checkingStatus ? "Verifying Access..." : "Verify Repository Access"}
                  </Button>

                  {missingItems.length > 0 && (
                    <div className="p-6 border border-orange-500/20 bg-orange-500/5 font-mono">
                      <div className="uppercase tracking-[0.2em] text-[10px] mb-4 text-orange-500">Remaining Steps</div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-[11px] text-muted-foreground">
                        {missingItems.map((it) => (
                          <li key={it} className="flex items-center gap-2">
                            <span className="h-1 w-1 bg-orange-500/50 rounded-full" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // After verification: require payment only for PAID and NEW assessments
                (assignmentMode === 'repo' && hasRepoAccess && !hasPaymentConfirmed && !id && isPaid) ? (
                  <div className="space-y-4 text-center">
                    <Button size="lg" className="w-full h-14 font-mono uppercase tracking-widest" onClick={handleMakePayment} disabled={paymentProcessing}>
                      {paymentProcessing ? 'Initializing Transfer...' : `Authorize Fee (₹${platformFee.toLocaleString('en-IN')})`}
                    </Button>
                    <p className="text-[10px] text-muted-foreground font-mono italic">
                      Transactions are secured by Razorpay. This fee covers automated provisioning for {positions} candidates.
                    </p>
                  </div>
                ) : (
                  <Button size="lg" className="w-full h-14 font-mono uppercase tracking-widest" onClick={handlePublish} disabled={!canPublish}>
                    {id ? (maxSalaryNum === originalMaxSalary ? 'Update Round' : 'Save & Adjust Payment') : (isPaid ? 'Launch Hiring Round' : 'Publish Practice Round')}
                  </Button>
                )
              )}
            </div>

            <Button variant="outline" size="lg" className="w-full h-12 font-mono uppercase tracking-widest text-[10px] opacity-60 hover:opacity-100" onClick={() => {
              if (id) {
                navigate(`/company/assessments/${id}`);
              } else {
                navigate('/company/dashboard');
              }
            }}>Discard Changes</Button>
          </div>

          {/* --- ENHANCED VERIFICATION UI --- */}
          {hasCheckedStatus && assignmentMode === 'repo' && (
            <div className="mt-8 space-y-3 font-mono">
              <div className={`p-6 border-l-2 flex flex-col sm:flex-row justify-between items-center gap-6 ${hasRepoAccess ? 'border-green-500 bg-green-500/5' : 'border-orange-500 bg-orange-500/5'}`}>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Source Repository Status</p>
                  <p className={`text-sm font-bold ${hasRepoAccess ? 'text-green-500' : 'text-orange-500'}`}>
                    {hasRepoAccess ? '✓ SYSTEM ACCESS GRANTED' : '⚠️ SYSTEM ACCESS PENDING'}
                  </p>
                </div>
                {!hasRepoAccess && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {repoInstallUrl && (
                      <Button variant="default" size="sm" className="h-10 px-6 font-mono text-[10px] uppercase" onClick={() => window.open(repoInstallUrl, '_blank')}>Grant Permissions</Button>
                    )}
                    <Button variant="outline" size="sm" className="h-10 px-6 font-mono text-[10px] uppercase" onClick={handleCheckStatus} disabled={checkingStatus}>
                      {checkingStatus ? "Syncing..." : "Re-Verify"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}