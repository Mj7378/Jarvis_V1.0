import React, { useState, useEffect } from 'react';

const TOUR_STEPS = [
    {
        title: "Welcome to J.A.R.V.I.S.",
        content: "This is your advanced AI assistant. Let's take a quick look at the main interface.",
        target: null
    },
    {
        title: "Tactical Sidebar",
        content: "This is your command hub. Access key modules like Vision, Image Studio, and Settings from here.",
        target: ".hud-sidebar-dock"
    },
    {
        title: "Command Input",
        content: "Type or use your voice to interact with J.A.R.V.I.S. Use the paperclip icon to attach files, images, or use your location.",
        target: ".user-input-area"
    },
    {
        title: "Control Center",
        content: "Click the grid icon in the header to open the Control Center for quick actions and smart home controls.",
        target: ".hud-header button[aria-label='Toggle Control Center']"
    },
    {
        title: "Ready to Go!",
        content: "That's the basics. You can explore more advanced features and customization in the Settings panel.",
        target: null
    }
];

const OnboardingTour: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const currentStep = TOUR_STEPS[step];
        if (currentStep.target) {
            const element = document.querySelector(currentStep.target);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            } else {
                setTargetRect(null); // Target not found, don't highlight
            }
        } else {
            setTargetRect(null);
        }
    }, [step]);
    
    const handleNext = () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };
    
    const currentStep = TOUR_STEPS[step];
    
    return (
        <div className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/50 animate-fade-in-fast">
            {targetRect && (
                <div 
                    className="absolute border-2 border-primary border-dashed rounded-lg shadow-[0_0_25px_rgba(var(--primary-color-rgb),0.7)] transition-all duration-300 pointer-events-none"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                    }}
                />
            )}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                 <div className="holographic-panel max-w-sm w-full animate-pop-in-center p-6 text-center">
                    <h2 className="panel-title !justify-center">{currentStep.title}</h2>
                    <p className="text-text-primary mb-6">{currentStep.content}</p>
                    <div className="flex justify-center items-center gap-4">
                        <button onClick={handleSkip} className="text-sm text-text-muted hover:text-text-primary">Skip</button>
                        <button onClick={handleNext} className="px-8 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary transition-all duration-200 transform hover:scale-105 active:scale-100">
                            {step === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
