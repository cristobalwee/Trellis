import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig, resetConfig } from './store';

import Step1Identity from './Step1Identity';
import Step2Colors from './Step2Colors';
import Step3Typography from './Step3Typography';
import Step4Style from './Step4Style';
import Step5Preview from './Step5Preview';

const STEPS_INFO = [
  { title: 'Step 1', subtitle: 'Brand Identity' },
  { title: 'Step 2', subtitle: 'Colors' },
  { title: 'Step 3', subtitle: 'Typography' },
  { title: 'Step 4', subtitle: 'Style' },
  { title: 'Step 5', subtitle: 'Preview' },
];

const TOTAL_STEPS = STEPS_INFO.length;

const StepItem = ({ 
  index, 
  current, 
  maxReached,
  stepInfo, 
  onClick 
}: { 
  index: number; 
  current: number; 
  maxReached: number;
  stepInfo: typeof STEPS_INFO[0]; 
  onClick: () => void; 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const stepNum = index + 1;
  const isSelected = stepNum <= current;
  const isClickable = stepNum <= maxReached;
  const isCurrent = stepNum === current;

  // Calculate width classes based on state
  let widthClass = 'w-5 md:w-6 bg-charcoal/30 will-change-auto';
  if (isSelected) {
    widthClass = 'w-6 md:w-12 bg-forest-green';
  } else if (isHovered) {
    widthClass = 'w-12 md:w-16 bg-charcoal/50';
  }

  return (
    <div
      className={`relative flex items-center justify-center py-4 px-[3px] md:px-1.5 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isClickable ? onClick : undefined}
    >
      <div
        className={`h-1 rounded-full transition-width duration-300 ${widthClass}`}
      />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none flex flex-col items-start will-change-auto"
          >
            <div className="text-sm text-charcoal/80 mb-1 leading-none">
              {stepInfo.title}
            </div>
            <div className="text-base font-bold text-charcoal leading-none">
              {stepInfo.subtitle}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Stepper = ({ current, onStepClick }: { current: number; onStepClick: (step: number) => void }) => {
  const [maxReached, setMaxReached] = useState(current);

  useEffect(() => {
    if (current > maxReached) {
      setMaxReached(current);
    }
  }, [current]);

  // Sync with prop if it starts higher (e.g. reload)
  useEffect(() => {
    setMaxReached(prev => Math.max(prev, current));
  }, []);

  return (
    <div className="flex items-center">
      {STEPS_INFO.map((step, i) => (
        <StepItem
          key={i}
          index={i}
          current={current}
          maxReached={maxReached}
          stepInfo={step}
          onClick={() => onStepClick(i + 1)}
        />
      ))}
    </div>
  );
};

const isDev = import.meta.env.DEV;

const stepVariants = {
  enter: (direction: 'forward' | 'back') => ({
    opacity: 0,
    y: direction === 'forward' ? 40 : -40,
  }),
  center: { opacity: 1, y: 0 },
  exit: (direction: 'forward' | 'back') => ({
    opacity: 0,
    y: direction === 'forward' ? -40 : 40,
  }),
};

const BrandIntake = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const config = useStore($brandConfig);
  const currentStep = config.currentStep;

  // Listen for open event from Hero/Header CTAs
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.classList.add('modal-open');
      // Stop Lenis to allow native modal scrolling
      (window as any).lenis?.stop();
    };

    window.addEventListener('openBrandIntake', handleOpen);
    return () => window.removeEventListener('openBrandIntake', handleOpen);
  }, []);

  // Ensure Lenis is restarted if component unmounts while modal is open
  useEffect(() => {
    return () => {
      if (isOpen) {
        (window as any).lenis?.start();
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    document.body.classList.remove('modal-open');
    // Resume Lenis smooth scroll
    (window as any).lenis?.start();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const form = document.getElementById('brand-intake-step1') as HTMLFormElement | null;
      if (form && !form.reportValidity()) return;
    }
    if (currentStep < TOTAL_STEPS) {
      setDirection('forward');
      updateConfig({ currentStep: currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('back');
      updateConfig({ currentStep: currentStep - 1 });
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && currentStep < TOTAL_STEPS) {
      // Don't auto-advance on textareas or if focusing something specific
      if (document.activeElement?.tagName !== 'TEXTAREA') {
        handleNext();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown as any);
      return () => window.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [isOpen, currentStep, config]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Identity />;
      case 2: return <Step2Colors />;
      case 3: return <Step3Typography />;
      case 4: return <Step4Style />;
      case 5: return <Step5Preview />;
      default: return <Step1Identity />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed z-50 inset-0 flex flex-col justify-start items-center bg-white overflow-y-scroll overscroll-none"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 1, ease: [0.32, 0.72, 0, 1] }}
          data-lenis-prevent="true"
        >
          {/* Header */}
          <header className="flex items-center justify-between px-6 md:px-12 py-6 w-full md:py-8 bg-white/80 backdrop-blur-md z-10 sticky top-0">
            <div className="flex-1">
              <img src="/src/assets/logo_icon.svg" alt="Trellis" className="w-8 h-8" />
            </div>

            <div className="flex-1 flex justify-end">
              <button
                onClick={handleClose}
                className="p-3 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-xl bg-gray transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-scroll min-h-fit pt-[5vh] pb-48 w-full">
            <div className="max-w-5xl mx-auto px-6 md:px-12 w-full">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Fixed Footer */}
          <footer className="bg-white shadow-[0px_-1px_12px_rgba(0,0,0,0.06)] px-6 md:px-12 py-6 fixed bottom-0 left-0 right-0 overflow-hidden">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-4">
                {isDev && (
                  <button
                    onClick={() => {
                      if (confirm('Reset all config and restart from Step 1?')) {
                        resetConfig();
                      }
                    }}
                    className="text-xs font-mono text-red-500/60 hover:text-red-500 transition-colors"
                  >
                    [DEV] Reset
                  </button>
                )}
                <div className="text-charcoal/80 text-lg">
                  Step {currentStep} of {TOTAL_STEPS}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`text-lg btn btn-secondary ${currentStep > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="text-lg btn btn-primary"
                >
                  {currentStep < TOTAL_STEPS ? 'Continue' : 'Finish'}
                </button>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntake;
