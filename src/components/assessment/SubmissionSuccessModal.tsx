import React from 'react';
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
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
    isOpen,
    onClose,
    onGoToDashboard,
    isSampleRound = false,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-background border-border font-mono">
                <DialogHeader className="flex flex-col items-center gap-4 py-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase tracking-widest text-center">
                        Submission Finalized
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed">
                        {isSampleRound
                            ? "Your sample repository access has been revoked. Since this is a sample round, you can see how the platform transitions through the workflow."
                            : "Your repository access has been successfully revoked. Your work has been submitted for evaluation."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted/50 border border-border rounded-sm space-y-3">
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
                    </div>
                </div>

                <DialogFooter className="flex sm:flex-col gap-2">
                    <Button
                        className="w-full uppercase tracking-widest font-bold"
                        onClick={onGoToDashboard}
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-[10px] uppercase tracking-tighter text-muted-foreground hover:bg-transparent"
                        onClick={onClose}
                    >
                        Close and Wait
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
