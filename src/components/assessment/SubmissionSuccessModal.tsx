import React, { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, GitPullRequest } from "lucide-react";

interface SubmissionSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToDashboard: () => void;
    isSampleRound?: boolean;
    isPeerReviewSkip?: boolean;
    isPeerReviewSubmit?: boolean;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
    isOpen,
    onClose,
    onGoToDashboard,
    isSampleRound = false,
    isPeerReviewSkip = false,
    isPeerReviewSubmit = false,
}) => {
    // Auto-redirect when submission is finalized (peer review submitted, skipped, or sample round complete)
    useEffect(() => {
        if (!isOpen) return;
        if (!isPeerReviewSubmit && !isPeerReviewSkip && !isSampleRound) return;
        const timer = setTimeout(() => {
            onGoToDashboard();
        }, 5000);
        return () => clearTimeout(timer);
    }, [isOpen, isPeerReviewSubmit, isPeerReviewSkip, isSampleRound]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-background border-border font-mono">
                <DialogHeader className="flex flex-col items-center gap-4 py-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase tracking-widest text-center">
                        {isPeerReviewSubmit ? 'Peer Review Submitted' : isPeerReviewSkip ? 'Peer Review Skipped' : isSampleRound ? 'Sample Round Complete' : 'Submission Finalized'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed">
                        {isPeerReviewSubmit
                            ? "Your findings have been submitted. Your full submission is now finalized."
                            : isPeerReviewSkip
                            ? "You've opted out of the peer review phase. Your coding submission has been recorded."
                            : isSampleRound
                                ? "Your coding submission has been finalized. This sample round is now complete."
                                : "Your repository access has been successfully revoked. Your work has been submitted for evaluation."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted/50 border border-border rounded-sm space-y-3">
                        {isPeerReviewSubmit ? (
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1">What's Next?</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Your peer review findings have been recorded. Final results will be visible once the evaluation period ends.
                                    </p>
                                </div>
                            </div>
                        ) : isPeerReviewSkip ? (
                            <div className="flex items-start gap-3">
                                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1">What's Next?</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Your coding submission is under review. Since you skipped the peer review round, you will receive 0 points for that component. Final results will be visible once the evaluation period ends.
                                    </p>
                                </div>
                            </div>
                        ) : isSampleRound ? (
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1">Round Complete</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        You have successfully experienced the Wirre platform workflow. This was a sample round — no scores or evaluations apply. You'll be redirected to your dashboard shortly.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider mb-1">What's Next?</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            After the round duration expires, the Peer Review phase will start automatically. You will be assigned a fellow candidate's repository to review.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <GitPullRequest className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider mb-1">Peer Review Phase</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            You'll have a 1-hour window to explore their code and report any bugs you find.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex sm:flex-col gap-2">
                    <Button
                        className="w-full uppercase tracking-widest font-bold"
                        onClick={onGoToDashboard}
                    >
                        Go to Dashboard
                    </Button>
                    {!isPeerReviewSubmit && !isPeerReviewSkip && !isSampleRound && (
                        <Button
                            variant="ghost"
                            className="w-full text-[10px] uppercase tracking-tighter text-muted-foreground hover:bg-transparent"
                            onClick={onClose}
                        >
                            Close and Wait
                        </Button>
                    )}
                    {(isPeerReviewSubmit || isPeerReviewSkip || isSampleRound) && (
                        <p className="text-[10px] text-muted-foreground text-center font-mono">
                            Redirecting to dashboard in 5 seconds...
                        </p>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
