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
        description: "Wirre is where code meets competition. Explore 'Opportunities' to find your next challenge. From global tournaments to exclusive college club events, your stage awaits.",
        icon: <Terminal className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Mission Protocol",
        description: "Registered events appear in 'My Rounds'. You gain Read Access 1 hour before launch—use it to study the codebase and strategize. When the clock strikes, the repo unlocks.",
        icon: <Zap className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Ghost Protocol",
        description: "Your code speaks for itself. Your identity is hidden from companies until the very end. They only see you after they select you in paid rounds. In practice rounds? You remain anonymous.",
        icon: <ShieldCheck className="h-12 w-12 text-foreground" />,
    },
    {
        title: "The Future",
        description: "We're expanding the battlefield. Soon, colleges will host exclusive tech fests, and clubs will run limited-entry scrimmages. Stay sharp, update your dashboard, and be ready.",
        icon: <Target className="h-12 w-12 text-foreground" />,
    },
];

const companyCards: OnboardingCard[] = [
    {
        title: "Meritocratic Hiring",
        description: "Forget resumes. Hire based on commits. Wirre runs on a simple philosophy: Code first, names later. Judge candidates solely on their engineering capability.",
        icon: <Target className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Paid vs Practice",
        description: "Run Paid Rounds to hire the best—pay to unlock the talent pool. Run Practice Rounds for free to build your brand, though candidate identities remain sealed.",
        icon: <Zap className="h-12 w-12 text-foreground" />,
    },
    {
        title: "The Reveal",
        description: "In Paid Rounds, anonymity is key. You assess submissions blindly. You unlock a candidate's full profile and contact details only after you decide they are worth interviewing.",
        icon: <ShieldCheck className="h-12 w-12 text-foreground" />,
    },
    {
        title: "Deep Analytics",
        description: "Don't just verify 'it runs'. See how they built it. Access metrics on refactoring patterns, bug-fix velocity, and code architecture. Hire the builders.",
        icon: <FileCode className="h-12 w-12 text-foreground" />,
    },
];

interface OnboardingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
    const { profile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);

    const cards = profile?.role === 'company' ? companyCards : candidateCards;

    useEffect(() => {
        if (profile && profile.onboarding_completed === false && profile.role !== 'admin') {
            onOpenChange(true);
        }
    }, [profile, onOpenChange]);

    const markAsComplete = async () => {
        if (!profile?.id) return;
        try {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', profile.id);
        } catch (err) {
            console.error('Error marking onboarding complete:', err);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && profile?.onboarding_completed === false) {
            markAsComplete();
        }
        onOpenChange(open);
    };

    const handleNext = () => {
        if (currentStep < cards.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Finished -> Just close, logic in handleOpenChange will update DB
            handleOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            className="flex-1 font-mono uppercase tracking-widest py-6"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={currentStep === 0}
                        >
                            Back
                        </Button>
                        <Button
                            className="flex-[2] font-mono uppercase tracking-widest py-6"
                            onClick={handleNext}
                        >
                            {currentStep === cards.length - 1 ? "Get Started" : "Next Step"}
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <p className="mt-4 text-[10px] uppercase font-mono text-muted-foreground tracking-widest">
                        Step {currentStep + 1} of {cards.length}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
