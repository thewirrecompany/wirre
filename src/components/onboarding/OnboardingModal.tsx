import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Terminal,
    Target,
    Cpu,
    Trophy,
    Users,
    FileCode,
    Zap,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingCard {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const candidateCards: OnboardingCard[] = [
    {
        title: "Welcome to the Arena",
        description: "Wirre is a competitive engineering platform. Here's a quick guide of your arena tools.",
        icon: <Terminal className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Registered Rounds",
        description: "In 'My Rounds', you'll find every tournament you've registered for. This is where you launch your dev containers when a round starts.",
        icon: <Zap className="h-12 w-12 text-foreground" />,
    },
    {
        title: "New Opportunities",
        description: "The 'Opportunities' tab is your marketplace. Browse upcoming engineering tournaments, check tech stacks, and register for new challenges.",
        icon: <Target className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Your Dashboard",
        description: "This is your home base. Update your GitHub/LinkedIn (required for prizes), track your progress, and manage your account security.",
        icon: <Cpu className="h-12 w-12 text-foreground" />,
    },
];

const companyCards: OnboardingCard[] = [
    {
        title: "Engineering-First Hiring",
        description: "Wirre transforms your hiring into a competitive tournament. Here's how to manage your talent pipeline.",
        icon: <Target className="h-12 w-12 text-foreground" />,
    },
    {
        title: "The Main Dashboard",
        description: "Your dashboard gives you a bird's-eye view of active roles, candidate volume, and aggregate submission metrics across all tournaments.",
        icon: <Users className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Creating Rounds",
        description: "Use the 'Hire' button to launch a new tournament. Define tech stacks, durations, and salary ranges. We handle the container orchestration.",
        icon: <Zap className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Candidate Insights",
        description: "Click into any role to see deep audits. Review actual candidate submissions, BUG-fix times, and specific refactoring capability reports.",
        icon: <FileCode className="h-12 w-12 text-foreground" />,
    },
];

export function OnboardingModal() {
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [updating, setUpdating] = useState(false);

    const cards = profile?.role === 'company' ? companyCards : candidateCards;

    useEffect(() => {
        if (profile && profile.onboarding_completed === false && profile.role !== 'admin') {
            setOpen(true);
        }
    }, [profile]);

    const handleNext = () => {
        if (currentStep < cards.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        if (!profile?.id) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', profile.id);

            if (error) throw error;
            setOpen(false);
        } catch (err) {
            console.error('Error completing onboarding:', err);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md bg-background border-foreground/20 p-0 overflow-hidden outline-none">
                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Progress dots */}
                    <div className="flex gap-1.5 mb-8">
                        {cards.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 w-8 rounded-full transition-colors ${i === currentStep ? 'bg-foreground' : 'bg-foreground/10'}`}
                            />
                        ))}
                    </div>

                    <div className="mb-6 p-4 rounded-full bg-secondary/50 border border-foreground/10">
                        {cards[currentStep].icon}
                    </div>

                    <DialogHeader className="space-y-4 mb-8">
                        <DialogTitle className="text-2xl font-mono uppercase tracking-tighter">
                            {cards[currentStep].title}
                        </DialogTitle>
                        <DialogDescription className="font-mono text-sm leading-relaxed text-muted-foreground">
                            {cards[currentStep].description}
                        </DialogDescription>
                    </DialogHeader>

                    <Button
                        className="w-full font-mono uppercase tracking-widest py-6"
                        onClick={handleNext}
                        disabled={updating}
                    >
                        {currentStep === cards.length - 1 ? (updating ? "Initializing..." : "Get Started") : "Next Step"}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>

                    <p className="mt-4 text-[10px] uppercase font-mono text-muted-foreground tracking-widest">
                        Step {currentStep + 1} of {cards.length}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
