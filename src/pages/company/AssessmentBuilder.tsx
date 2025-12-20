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
  'Accessibility Engineer',
  'Android Engineer',
  'Backend Engineer',
  'Build/Release Engineer',
  'Cloud Engineer',
  'Computer Vision Engineer',
  'Data Engineer',
  'Database Engineer',
  'Developer Advocate',
  'DevOps Engineer',
  'Embedded Systems Engineer',
  'Frontend Engineer',
  'Full Stack Engineer',
  'Game Developer',
  'Graphics Engineer',
  'Infrastructure Engineer',
  'iOS Engineer',
  'Machine Learning Engineer',
  'Mobile Engineer',
  'Network Engineer',
  'Performance Engineer',
  'Platform Architect',
  'QA Engineer',
  'Security Engineer',
  'Site Reliability Engineer',
  'Test Automation Engineer'
];


// Removed template/fault placeholder lists — only core inputs remain

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
  const [durationMinutes, setDurationMinutes] = useState(180); // default 180 minutes
  const [customTechInput, setCustomTechInput] = useState("");
  const [additionalTechs, setAdditionalTechs] = useState<string[]>([]);
  const [startAt, setStartAt] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'repo' | 'wirre'>('repo');
  const [selectedLevel, setSelectedLevel] = useState("");

  const levels = [
    'Intern',
    'New Grad',
    'Level 1',
    'Level 2',
    'Level 3',
    'Junior',
    'Mid',
    'Senior',
    'Staff',
    'Principal',
    'Lead'
  ];
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [selectedFaults, setSelectedFaults] = useState<string[]>([]);
  
  // removed scoring weight placeholders

  const topTechnologies = [
    'Ansible',
    'Angular',
    'AWS',
    'Azure',
    'C',
    'C#',
    'C++',
    'CSS',
    'Django',
    'Docker',
    'Docker Compose',
    'Dotnet',
    'ElasticSearch',
    'Elixir',
    'Electron',
    'Express',
    'FastAPI',
    'Flask',
    'Flutter',
    'GCP',
    'Grafana',
    'GraphQL',
    'gRPC',
    'Go',
    'Hadoop',
    'HTML',
    'InfluxDB',
    'Jest',
    'Java',
    'JavaScript',
    'Kafka',
    'Kotlin',
    'Kubernetes',
    'Laravel',
    'MariaDB',
    'MongoDB',
    'MySQL',
    'NestJS',
    'Neo4j',
    'Next.js',
    'Node.js',
    'NumPy',
    'Pandas',
    'PHP',
    'Playwright',
    'PostCSS',
    'PostgreSQL',
    'Prometheus',
    'PyTorch',
    'Python',
    'React',
    'React Native',
    'Redux',
    'Redis',
    'REST',
    'Rollup',
    'Ruby',
    'Rails',
    'RxJS',
    'Rust',
    'SASS',
    'Scala',
    'Scikit-learn',
    'Svelte',
    'SolidJS',
    'Spark',
    'Spring',
    'Storybook',
    'SQL',
    'Swift',
    'Tailwind CSS',
    'TensorFlow',
    'TypeScript',
    'Vite',
    'Vitest',
    'Vue',
    'Webpack'
  ];

  const displayedTechnologies = [...topTechnologies, ...additionalTechs];

  // Status check states
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasRepoAccess, setHasRepoAccess] = useState(false);
  const [hasPaymentConfirmed, setHasPaymentConfirmed] = useState(false);

  // removed fault helpers

  const finalRole = customRole.trim() || selectedRole;
  const finalTemplate = selectedTemplate;
  const allFaults: any[] = [];
  
  const maxSalaryNum = parseFloat(maxSalary) || 0;
  const minSalaryNum = parseFloat(minSalary) || 0;
  const platformFee = positions * 0.20 * maxSalaryNum;
  
  const repoProvided = githubRepo.trim().length > 0;
  // Salary rules: min > 0, min < max, max <= 10,000,000
  const salaryValid = (minSalaryNum > 0) && (minSalaryNum < maxSalaryNum) && (maxSalaryNum <= 10000000);
  const allFieldsFilled = Boolean(finalRole && selectedLevel && (assignmentMode === 'wirre' || repoProvided) && salaryValid && selectedTechs.length >= 1 && selectedTechs.length <= 10 && durationMinutes > 0 && !!startAt);
  const canPublish = allFieldsFilled && hasCheckedStatus && hasRepoAccess && hasPaymentConfirmed;

  // keep a copy of original data when editing to detect changes (optional)
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const [salaryColumnsExist, setSalaryColumnsExist] = useState(false);

  // If editing an existing assessment, load it and prefill fields
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
        if (error) throw error;
        if (!mounted || !data) return;
        // populate fields
        setSelectedRole('');
        setCustomRole(data.title || '');
        setGithubRepo(data.github_repo || '');
        setPositions(data.positions || 1);
        setSelectedTechs(data.technologies || []);
        // prefill assignment mode defensively (support different prior values)
        const rawMode = (data as any).assignment_mode ?? (data as any).assignmentMode ?? null;
        if (rawMode) {
          const rm = String(rawMode).toLowerCase();
          if (rm === 'make repo' || rm === 'wirre' || rm === 'make_repo' || rm === 'make-repo') setAssignmentMode('wirre');
          else setAssignmentMode('repo');
        }
        setSelectedLevel((data as any).level ?? (data as any).assignment_level ?? '');
        setDurationMinutes(data.duration_minutes || 180);
        setStartAt(data.start_at ? new Date(data.start_at).toISOString().slice(0,16) : '');
        // prefill salary fields if present on the record (as strings)
        const minVal = (data as any).min_salary ?? (data as any).minSalary ?? '';
        const maxVal = (data as any).max_salary ?? (data as any).maxSalary ?? '';
        setMinSalary(minVal !== null && minVal !== undefined ? String(minVal) : '');
        setMaxSalary(maxVal !== null && maxVal !== undefined ? String(maxVal) : '');
        // detect whether salary columns exist in this DB schema
        const hasSalaryCols = Object.prototype.hasOwnProperty.call(data, 'min_salary') || Object.prototype.hasOwnProperty.call(data, 'max_salary') || Object.prototype.hasOwnProperty.call(data, 'minSalary') || Object.prototype.hasOwnProperty.call(data, 'maxSalary');
        setSalaryColumnsExist(Boolean(hasSalaryCols));
        // indicate checks already passed for existing assessment
        setHasCheckedStatus(true);
        setHasRepoAccess(true);
        setHasPaymentConfirmed(true);
        setOriginalLoaded(true);
      } catch (err) {
        console.error('Failed to load assessment for edit', err);
        toast({ title: 'Load failed', description: String(err), variant: 'destructive' });
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Detect whether salary columns exist for new assessments (create flow)
  useEffect(() => {
    if (id) return; // already handled in edit loader
    let mounted = true;
    (async () => {
      try {
        // try selecting the salary column; will error if column doesn't exist
        const { data, error } = await supabase.from('assessments').select('min_salary').limit(1).maybeSingle();
        if (!error && mounted) setSalaryColumnsExist(true);
      } catch (err) {
        // column likely doesn't exist
        if (mounted) setSalaryColumnsExist(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    
    // Simulate requesting repo access and payment
    toast({
      title: "Verification Initiated",
      description: "Repository access request sent. Please complete payment to continue.",
    });

    // Simulate checking - in production, this would be real API calls
    setTimeout(() => {
      setHasRepoAccess(true);
      toast({
        title: "Repository Access Granted",
        description: `WIRRE now has access to ${githubRepo}`,
      });
    }, 2000);

    setTimeout(() => {
      setHasPaymentConfirmed(true);
      toast({
        title: "Payment Confirmed",
        description: `$${platformFee.toLocaleString()} received. You can now publish the role.`,
      });
      setCheckingStatus(false);
      setHasCheckedStatus(true);
    }, 4000);
  };

  const handlePublish = () => {
    (async () => {
      try {
        if (!finalRole || !githubRepo) {
          toast({ title: 'Missing fields', description: 'Role and repository required', variant: 'destructive' });
          return;
        }

        if (id) {
          // update existing assessment
          const updates: any = {
            title: finalRole,
            github_repo: githubRepo,
            positions,
            technologies: selectedTechs,
            duration_minutes: durationMinutes,
            start_at: startAt ? new Date(startAt).toISOString() : null,
            assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
          };
          if (salaryColumnsExist) {
            updates.min_salary = minSalary ? parseFloat(minSalary) : null;
            updates.max_salary = maxSalary ? parseFloat(maxSalary) : null;
          }
          const { data, error } = await supabase.from('assessments').update(updates).eq('id', id).select().single();
          if (error) {
            console.error('Error updating assessment:', error);
            toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
            return;
          }

          toast({ title: 'Saved', description: 'Assessment updated.' });

          // audit
          try {
            await supabase.from('assessment_audits').insert([{
              assessment_id: data.id,
              actor_id: profile?.id,
              actor_role: profile?.role || 'company',
              action: 'edited',
              details: { title: finalRole, github_repo: githubRepo, positions, technologies: selectedTechs, duration_minutes: durationMinutes, start_at: startAt }
            }]);
          } catch (err) { console.error('Failed to write audit record:', err); }

          navigate(`/company/assessments/${id}`);
          return;
        }

        // insert assessment row so admins are notified
        const insertPayload: any = {
          company_user_id: profile?.id,
          title: finalRole,
          github_repo: githubRepo.trim().length > 0 ? githubRepo : null,
          assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
          assignment_level: selectedLevel || null,
          status: 'awaiting_classroom_setup',
          positions: positions,
          technologies: selectedTechs,
          duration_minutes: durationMinutes,
          start_at: startAt ? new Date(startAt).toISOString() : null,
        };
        if (salaryColumnsExist) {
          insertPayload.min_salary = minSalary ? parseFloat(minSalary) : null;
          insertPayload.max_salary = maxSalary ? parseFloat(maxSalary) : null;
        }
        const { data, error } = await supabase.from('assessments').insert([ insertPayload ]).select().single();

        if (error) {
          console.error('Error creating assessment:', error);
          toast({ title: 'Publish failed', description: error.message, variant: 'destructive' });
          return;
        }

        toast({
          title: "Role Published",
          description: `${finalRole} is not yet live for candidates to register. Admins have been notified to create the assignment; candidates will be able to register once it's provisioned.`,
        });

        // create an audit record for this publish action
        try {
          await supabase.from('assessment_audits').insert([{
            assessment_id: data.id,
            actor_id: profile?.id,
            actor_role: profile?.role || 'company',
            action: 'published',
            details: {
              title: finalRole,
              github_repo: githubRepo.trim().length > 0 ? githubRepo : null,
              assignment_mode: assignmentMode === 'repo' ? 'company repo' : 'make repo',
              assignment_level: selectedLevel || null,
              positions,
              platformFee,
              technologies: selectedTechs,
              duration_minutes: durationMinutes,
              start_at: startAt
            }
          }]);
        } catch (err) {
          console.error('Failed to write audit record:', err);
        }

        // create a notification for admins (recipient_role='admin')
        try {
          await supabase.from('assessment_notifications').insert([{
            assessment_id: data.id,
            recipient_role: 'admin',
            message: `New assessment published: ${finalRole}`,
            payload: { assessment_id: data.id, title: finalRole, github_repo: githubRepo }
          }]);
        } catch (err) {
          console.error('Failed to create admin notification:', err);
        }

        navigate('/company/dashboard');
      } catch (err) {
        console.error(err);
      }
    })();
  };

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold font-mono tracking-tight mb-2">
            Hire
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-12">
            Configure assessment round for candidates
          </p>

          {/* Role Selection */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Select Role
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {predefinedRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                      setSelectedRole(role);
                      setCustomRole("");
                      setSelectedLevel("");
                    }}
                  className={`p-3 border font-mono text-xs text-left transition-colors ${
                    selectedRole === role && !customRole
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Label className="font-mono text-xs mb-2 block">Custom Role</Label>
              <Input
                placeholder="Enter custom role name..."
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  setSelectedRole("");
                  setSelectedLevel("");
                }}
                className="font-mono"
              />
            </div>
          </section>

          {/* Level (appears after role selection) - single-select grid */}
          { (customRole.trim() || selectedRole) && (
            <section className="mb-6">
              <Label className="font-mono text-sm uppercase tracking-wider mb-2 block">Level</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`p-2 border font-mono text-xs text-left transition-colors ${
                      selectedLevel === lvl ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              {!selectedLevel && (
                <p className="text-xs text-destructive">Please select a level.</p>
              )}
            </section>
          )}

          
          <section className="mb-6">
            <Label className="font-mono text-sm uppercase tracking-wider mb-2 block">Technologies (select 1–10)</Label>
              <div className="mb-3 flex gap-2 items-center">
                <Input
                  placeholder="Add custom technology (press Enter or click Add)"
                  value={customTechInput}
                  onChange={(e) => setCustomTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const candidate = customTechInput.trim();
                      if (!candidate) return;
                      const exists = displayedTechnologies.some(t => t.toLowerCase() === candidate.toLowerCase());
                      if (exists) {
                        toast({ title: 'Duplicate', description: `${candidate} is already in the list.`, variant: 'destructive' });
                        return;
                      }
                      setAdditionalTechs(prev => [candidate, ...prev]);
                      setCustomTechInput('');
                    }
                  }}
                  className="font-mono flex-1"
                />
                <Button
                  onClick={() => {
                    const candidate = customTechInput.trim();
                    if (!candidate) return;
                    const exists = displayedTechnologies.some(t => t.toLowerCase() === candidate.toLowerCase());
                    if (exists) {
                      toast({ title: 'Duplicate', description: `${candidate} is already in the list.`, variant: 'destructive' });
                      return;
                    }
                    setAdditionalTechs(prev => [candidate, ...prev]);
                    setCustomTechInput('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="border border-border p-3 max-h-48 overflow-auto grid grid-cols-2 gap-2">
              {displayedTechnologies.map((tech) => (
                <label key={tech} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTechs.includes(tech)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedTechs.length < 10) setSelectedTechs(prev => [...prev, tech]);
                      } else {
                        setSelectedTechs(prev => prev.filter(t => t !== tech));
                      }
                    }}
                  />
                  <span className="font-mono">{tech}</span>
                </label>
              ))}
            </div>
              {(selectedTechs.length > 0 || additionalTechs.length > 0) && (
                <div className="mt-3 p-3 border border-border bg-secondary/30">
                  {selectedTechs.length > 0 && (
                    <p className="text-sm font-mono">
                      <strong>Selected:</strong>{' '}{selectedTechs.join(', ')}
                    </p>
                  )}
                  {additionalTechs.length > 0 && (
                    <p className="text-sm font-mono mt-2">
                      <strong>Custom added:</strong>{' '}{additionalTechs.join(', ')}
                    </p>
                  )}
                </div>
              )}
            {selectedTechs.length < 1 && <p className="text-xs text-destructive mt-2">Select at least 1 technology.</p>}
            {selectedTechs.length > 10 && <p className="text-xs text-destructive mt-2">You can select at most 10 technologies.</p>}
          </section>

          {/* Duration and Start time */}
          <section className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <Label className="font-mono text-sm mb-2 block">Duration (minutes)</Label>
              <Input type="number" min={10} value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value || '0'))} className="font-mono w-48" />
              <p className="text-xs text-muted-foreground mt-1">Specify how long candidates have to complete the assessment.</p>
            </div>
            <div>
              <Label className="font-mono text-sm mb-2 block">Start Time</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="font-mono w-full" />
              <p className="text-xs text-muted-foreground mt-1">When the assessment will be available to candidates.</p>
            </div>
          </section>

          {/* Positions Available */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Positions Available
            </Label>
            <Input
              type="number"
              min="1"
              value={positions}
              onChange={(e) => {
                const val = e.target.value;
                setPositions(val === '' ? 1 : parseInt(val) || 1);
              }}
              onFocus={(e) => e.target.select()}
              className="font-mono w-32"
            />
          </section>

 

          {/* Salary Range */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Salary Range (Annual, in USD)
            </Label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label className="font-mono text-xs mb-2 block">Min Salary (USD)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="80000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="font-mono"
                />
              </div>
              <span className="text-muted-foreground mt-6">—</span>
              <div className="flex-1">
                <Label className="font-mono text-xs mb-2 block">Max Salary (USD)</Label>
                <Input
                  type="number"
                  min="1"
                  max={10000000}
                  placeholder="150000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            {maxSalaryNum > 0 && (
              <div className="mt-4 p-4 border border-border bg-secondary/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">Platform Fee (20% × Max Salary × Positions)</span>
                  <span className="font-mono text-lg font-bold">
                    ${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Partial refunds available. Fee refunded for unhired positions (e.g., if 1 of 5 hired, 4/5 of fee refunded).
                </p>
              </div>
            )}
          </section>

          {/* Removed template/fault/weight placeholder sections — kept minimal inputs only */}

          {/* Assessment Source */}
          <section className="mb-6">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              Assessment Source
            </Label>
            <div className="flex gap-6 items-center mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assignmentMode"
                  value="repo"
                  checked={assignmentMode === 'repo'}
                  onChange={() => setAssignmentMode('repo')}
                />
                <span className="font-mono text-sm ml-1">Provide my GitHub repository</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assignmentMode"
                  value="wirre"
                  checked={assignmentMode === 'wirre'}
                  onChange={() => setAssignmentMode('wirre')}
                />
                <span className="font-mono text-sm ml-1">Make assignment for me</span>
              </label>
            </div>

            {assignmentMode === 'repo' && (
              <>
                <Input
                  placeholder="owner/repository"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="font-mono mb-2"
                />
                <p className="text-xs text-muted-foreground font-mono">
                Provide the repository URL (optional unless you choose this option). If you provide a repo, ensure the GitHub user <strong>wirrecompany</strong> has full access to your repository. The README should specify what candidates need to solve.
                </p>
              </>
            )}

            {assignmentMode === 'wirre' && (
              <p className="text-xs text-muted-foreground font-mono mb-2">
                We will create a custom assignment for your role. Choose this option if you want us to author the test. Note: We recommend creating your own repo and granting access.
              </p>
            )}

          </section>

          {/* Actions */}
          <div className="flex gap-4">
            {!hasCheckedStatus ? (
              <Button 
                size="lg" 
                onClick={handleCheckStatus}
                disabled={!allFieldsFilled || checkingStatus}
              >
                {checkingStatus ? "Checking..." : "Check Status"}
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={handlePublish}
                disabled={id ? !allFieldsFilled : !canPublish}
              >
                {id ? 'Save Changes' : 'Publish Role'}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/company/dashboard')}
            >
              Cancel
            </Button>
          </div>
          
          {/* Status Messages */}
          {!allFieldsFilled && (
            <div className="mt-4 p-3 border border-border bg-secondary/50">
                <p className="text-xs text-muted-foreground font-mono mb-2">Required: Role, Level, Repository (if chosen), Salary range, 1–10 technologies, duration and start time</p>
                <div className="text-xs text-destructive font-mono">
                  {! (minSalaryNum > 0) && <div>• Min salary must be greater than 0.</div>}
                  {! (minSalaryNum < maxSalaryNum) && (minSalaryNum > 0 || maxSalaryNum > 0) && <div>• Min salary must be less than max salary.</div>}
                  {maxSalaryNum > 10000000 && <div>• Max salary cannot exceed 10,000,000.</div>}
                </div>
            </div>
          )}

          {hasCheckedStatus && (
            <div className="mt-4 space-y-2">
              <div className={`p-3 border font-mono text-sm ${hasRepoAccess ? 'border-foreground bg-foreground/10' : 'border-border bg-secondary/50'}`}>
                <span className="mr-2">{hasRepoAccess ? '✓' : '○'}</span>
                Repository Access: {hasRepoAccess ? `Granted to ${githubRepo}` : 'Pending'}
              </div>
              <div className={`p-3 border font-mono text-sm ${hasPaymentConfirmed ? 'border-foreground bg-foreground/10' : 'border-border bg-secondary/50'}`}>
                <span className="mr-2">{hasPaymentConfirmed ? '✓' : '○'}</span>
                Payment: {hasPaymentConfirmed ? `Confirmed ($${platformFee.toLocaleString()})` : 'Pending'}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
