import { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
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

  const displayedTechnologies = [...topTechnologies, ...additionalTechs];

  // --- REPO VERIFICATION STATES ---
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasRepoAccess, setHasRepoAccess] = useState(false);
  const [hasPaymentConfirmed, setHasPaymentConfirmed] = useState(false);
  const [repoInstallUrl, setRepoInstallUrl] = useState<string | null>(null);
  const [repoVerifyError, setRepoVerifyError] = useState<string | null>(null);

  const finalRole = customRole.trim() || selectedRole;
  const maxSalaryNum = parseFloat(maxSalary) || 0;
  const minSalaryNum = parseFloat(minSalary) || 0;
  const platformFee = positions * 0.20 * maxSalaryNum;
  
  const repoProvided = githubRepo.trim().includes('/');
  const salaryValid = (minSalaryNum > 0) && (minSalaryNum < maxSalaryNum) && (maxSalaryNum <= 10000000);
  const allFieldsFilled = Boolean(
    finalRole &&
    selectedLevel &&
    (assignmentMode === 'wirre' || repoProvided) &&
    salaryValid &&
    selectedTechs.length >= 1 &&
    selectedTechs.length <= 10 &&
    durationMinutes > 0 &&
    startDate !== '' &&
    startTime !== ''
  );
  const canPublish = allFieldsFilled && hasCheckedStatus && (assignmentMode === 'wirre' || hasRepoAccess);

  // --- MISSING ITEMS CHECKLIST (for Verify button) ---
  const getMissingItems = () => {
    const items: string[] = [];
    if (!finalRole) items.push('Role name');
    if (!selectedLevel) items.push('Level');
    if (assignmentMode === 'repo' && !repoProvided) items.push('Repository (owner/name)');
    if (!salaryValid) items.push('Valid salary range (min < max)');
    if (selectedTechs.length < 1) items.push('At least 1 technology');
    if (selectedTechs.length > 10) items.push('No more than 10 technologies');
    if (durationMinutes <= 0) items.push('Duration (minutes)');
    // Simplified checks: require both date and time strings to be present
    if (!startDate) items.push('Start date');
    if (!startTime) items.push('Start time');
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
              const localDate = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
              const localTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
              setStartDate(localDate);
              setStartTime(localTime);
            } else {
              setStartDate('');
              setStartTime('');
            }
        setMinSalary(String(data.min_salary || ''));
        setMaxSalary(String(data.max_salary || ''));
        setHasRepoAccess(data.github_repo_verified || false);
        setHasCheckedStatus(true);
        setHasPaymentConfirmed(true);
      } catch (err) {
        toast({ title: 'Load failed', description: String(err), variant: 'destructive' });
      }
    })();
  }, [id]);

  // --- NEW VERIFICATION LOGIC ---
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setRepoInstallUrl(null);
    setRepoVerifyError(null);
    
    try {
      const parts = githubRepo.trim().split('/');
      if (parts.length !== 2) throw new Error('Repository must be owner/name');
      const [owner, repo] = parts;

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
        setHasRepoAccess(true);
        setHasCheckedStatus(true);
        setHasPaymentConfirmed(true);
        toast({ title: 'Access Granted', description: `WIRRE verified access to ${githubRepo}` });
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

      const { data, error } = id 
        ? await supabase.from('assessments').update(insertPayload).eq('id', id).select().single()
        : await supabase.from('assessments').insert([insertPayload]).select().single();

      if (error) throw error;

      toast({ title: id ? "Updated" : "Published", description: "Assessment is being provisioned." });
      navigate('/company/dashboard');
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold font-mono tracking-tight mb-2">Hire</h1>
          <p className="text-muted-foreground font-mono text-sm mb-12">Configure assessment round for candidates</p>

          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">Select Role</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {predefinedRoles.map((role) => (
                <button key={role} onClick={() => { setSelectedRole(role); setCustomRole(""); setSelectedLevel(""); }}
                  className={`p-3 border font-mono text-xs text-left transition-colors ${selectedRole === role && !customRole ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>{role}</button>
              ))}
            </div>
            <Input placeholder="Enter custom role name..." value={customRole} onChange={(e) => { setCustomRole(e.target.value); setSelectedRole(""); }} className="font-mono" />
          </section>

          {finalRole && (
            <section className="mb-6">
              <Label className="font-mono text-sm uppercase tracking-wider mb-2 block">Level</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {levels.map((lvl) => (
                  <button key={lvl} type="button" onClick={() => setSelectedLevel(lvl)}
                    className={`p-2 border font-mono text-xs text-left transition-colors ${selectedLevel === lvl ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>{lvl}</button>
                ))}
              </div>
            </section>
          )}

          <section className="mb-6">
            <Label className="font-mono text-sm uppercase tracking-wider mb-2 block">Technologies (select 1–10)</Label>
            <div className="mb-3 flex gap-2">
              <Input placeholder="Add custom tech..." value={customTechInput} onChange={(e) => setCustomTechInput(e.target.value)} className="font-mono flex-1" />
              <Button onClick={() => { if(customTechInput) { setAdditionalTechs(p => [customTechInput, ...p]); setCustomTechInput(''); }}}>Add</Button>
            </div>
            <div className="border border-border p-3 max-h-48 overflow-auto grid grid-cols-2 gap-2">
              {displayedTechnologies.map((tech) => (
                <label key={tech} className="flex items-center gap-2 text-sm font-mono">
                  <input type="checkbox" checked={selectedTechs.includes(tech)} onChange={(e) => e.target.checked ? (selectedTechs.length < 10 && setSelectedTechs(p => [...p, tech])) : setSelectedTechs(p => p.filter(t => t !== tech))} />
                  {tech}
                </label>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <Label className="font-mono text-sm uppercase tracking-wider mb-2 block">Description</Label>
            <Textarea placeholder="Markdown supported..." value={description} onChange={(e) => setDescription(e.target.value)} className="font-mono w-full" rows={6} />
          </section>

          <section className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <Label className="font-mono text-sm mb-2 block">Duration (mins)</Label>
              <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} className="font-mono" />
            </div>
              <div>
                <Label className="font-mono text-sm mb-2 block">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="font-mono" />
              </div>
              <div>
                <Label className="font-mono text-sm mb-2 block">Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="font-mono" />
                <div className="mt-2 text-xs font-mono text-muted-foreground">Raw value: {startDate && startTime ? `${startDate}T${startTime}` : '<empty>'}</div>
              </div>
          </section>

          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">Salary Range (USD)</Label>
            <div className="flex gap-4 items-center">
              <Input type="number" placeholder="Min" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} className="font-mono" />
              <span className="text-muted-foreground">—</span>
              <Input type="number" placeholder="Max" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} className="font-mono" />
            </div>
            {maxSalaryNum > 0 && (
              <div className="mt-4 p-4 border border-border bg-secondary/30 flex justify-between items-center font-mono">
                <span className="text-sm">Platform Fee (20%)</span>
                <span className="text-lg font-bold">${platformFee.toLocaleString()}</span>
              </div>
            )}
          </section>

          <section className="mb-6">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">Assessment Source</Label>
            <div className="flex gap-6 mb-3 font-mono text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={assignmentMode === 'repo'} onChange={() => setAssignmentMode('repo')} /> Provide my GitHub repo</label>
              <label className="flex items-center gap-2"><input type="radio" checked={assignmentMode === 'wirre'} onChange={() => setAssignmentMode('wirre')} /> Make assignment for me</label>
            </div>
            {assignmentMode === 'repo' && (
              <Input placeholder="owner/repository" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} className="font-mono" />
            )}
          </section>

          <div className="flex gap-4 border-t pt-8">
            <div className="flex-1">
              {!hasCheckedStatus && assignmentMode === 'repo' ? (
                <div>
                  <Button size="lg" onClick={handleCheckStatus} disabled={!allFieldsFilled || checkingStatus}>
                    {checkingStatus ? "Verifying..." : "Verify Repository Access"}
                  </Button>

                  <div className="mt-3 p-3 border border-border bg-secondary/5 font-mono text-sm">
                    <div className="uppercase tracking-wider text-xs mb-2">Requirements to verify</div>
                    <div className="mb-2 text-[11px] text-red-400 font-mono">
                      DEBUG: role:{String(!!finalRole)} level:{String(!!selectedLevel)} repo:{String(repoProvided)} salary:{String(salaryValid)} tech:{selectedTechs.length} date:{String(!!startDate)} time:{String(!!startTime)}
                    </div>
                    <ul className="space-y-1">
                      {missingItems.length === 0 ? (
                        <li className="text-green-500">✅ All required fields filled — ready to verify</li>
                      ) : (
                        missingItems.map((it) => (
                          <li key={it} className="text-orange-400">❌ {it}</li>
                        ))
                      )}
                    </ul>
                    <div className="mt-2 text-xs text-muted-foreground">Button will be enabled once all items are satisfied.</div>
                  </div>
                </div>
              ) : (
                <Button size="lg" onClick={handlePublish} disabled={!canPublish}>
                  {id ? 'Save Changes' : 'Publish Role'}
                </Button>
              )}
            </div>
            <Button variant="outline" size="lg" onClick={() => navigate('/company/dashboard')}>Cancel</Button>
          </div>

          {/* --- ENHANCED VERIFICATION UI --- */}
          {hasCheckedStatus && assignmentMode === 'repo' && (
            <div className="mt-6 space-y-3 font-mono text-sm">
              <div className={`p-4 border flex justify-between items-center ${hasRepoAccess ? 'border-green-500 bg-green-500/10' : 'border-orange-500 bg-orange-500/10'}`}>
                <span>{hasRepoAccess ? '✅ Access Verified' : '❌ Access Required'} ({githubRepo})</span>
                {!hasRepoAccess && repoInstallUrl && (
                  <Button variant="outline" size="sm" onClick={() => window.open(repoInstallUrl, '_blank')}>Grant Access</Button>
                )}
              </div>
              {!hasRepoAccess && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={handleCheckStatus} disabled={checkingStatus}>
                  {checkingStatus ? "Checking..." : "Try again after installing"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}