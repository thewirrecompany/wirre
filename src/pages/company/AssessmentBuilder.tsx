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
  "Backend Engineer",
  "Senior Backend Engineer",
  "Staff Backend Engineer",
  "Platform Engineer",
  "Senior Platform Engineer",
  "Systems Engineer",
  "Staff Systems Engineer",
  "Infrastructure Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
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
  const [durationMinutes, setDurationMinutes] = useState(48 * 60); // default 48 hours
  const [startAt, setStartAt] = useState<string>('');
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [selectedFaults, setSelectedFaults] = useState<string[]>([]);
  
  // removed scoring weight placeholders

  const topTechnologies = [
    'JavaScript','TypeScript','React','Vue','Angular','Node.js','Express','Next.js','NestJS','Python','Django','Flask','FastAPI','Java','Spring','Kotlin','Go','Rust','C#','Dotnet','PHP','Laravel','Ruby','Rails','SQL','PostgreSQL','MySQL','MongoDB','Redis','GraphQL','Docker','Kubernetes','AWS','GCP','Azure','Terraform','HTML','CSS','Tailwind CSS','SASS','Webpack','Vite','Jest','Cypress','Playwright','Electron','Redux','MobX','RxJS','Elixir','Phoenix','Scala'
  ];

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
  
  const allFieldsFilled = finalRole && githubRepo.trim() && minSalaryNum > 0 && maxSalaryNum > 0 && maxSalaryNum >= minSalaryNum && selectedTechs.length >= 3 && selectedTechs.length <= 5 && durationMinutes > 0 && !!startAt;
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
        setDurationMinutes(data.duration_minutes || 48 * 60);
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
          github_repo: githubRepo,
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
          description: `${finalRole} is now live for candidates to register. Admins have been notified to create the Classroom assignment.`,
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
              github_repo: githubRepo,
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
                }}
                className="font-mono"
              />
            </div>
          </section>

          {/* GitHub Repository */}
          <section className="mb-12">
            <Label className="font-mono text-sm uppercase tracking-wider mb-4 block">
              GitHub Repository
            </Label>
            <Input
              placeholder="owner/repository"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              className="font-mono mb-2"
            />
            <p className="text-xs text-muted-foreground font-mono">
              Provide the repository URL. Ensure WIRRE has access before publishing. The README should specify what candidates need to solve.
            </p>
          </section>
          <section className="mb-6">
            <Label className="font-mono text-sm uppercase tracking-wider mb-2 block">Technologies (select 3–5)</Label>
            <div className="border border-border p-3 max-h-48 overflow-auto grid grid-cols-2 gap-2">
              {topTechnologies.map((tech) => (
                <label key={tech} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTechs.includes(tech)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedTechs.length < 5) setSelectedTechs(prev => [...prev, tech]);
                      } else {
                        setSelectedTechs(prev => prev.filter(t => t !== tech));
                      }
                    }}
                  />
                  <span className="font-mono">{tech}</span>
                </label>
              ))}
            </div>
            {selectedTechs.length < 3 && <p className="text-xs text-destructive mt-2">Select at least 3 technologies.</p>}
            {selectedTechs.length > 5 && <p className="text-xs text-destructive mt-2">You can select at most 5 technologies.</p>}
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
                  min="0"
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
                  min="0"
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
              <p className="text-xs text-muted-foreground font-mono">
                Required: Role, GitHub repository, Salary range (max ≥ min), Template, at least one Fault, and weights summing to 100%
              </p>
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
