import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig, resetConfig } from './store';

import Step1Identity from './Step1Identity';
import Step2Colors from './Step2Colors';
import Step3Typography from './Step3Typography';
import Step4Style from './Step4Style';
import Step5Preview from './Step5Preview';

const TOTAL_STEPS = 5;

const Stepper = ({ current }: { current: number }) => (
  <div className="flex items-center gap-1.5 md:gap-3">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div
        key={i}
        className={`h-1 rounded-full transition-all duration-500 ${
          i + 1 <= current 
            ? 'w-6 md:w-12 bg-forest-green' 
            : 'w-2 md:w-4 bg-charcoal/10'
        }`}
      />
    ))}
  </div>
);

const BrandIntake = () => {
  const [isOpen, setIsOpen] = useState(false);
  const config = useStore($brandConfig);
  const currentStep = config.currentStep;

  // Listen for open event from Hero/Header CTAs
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.classList.add('modal-open');
    };

    window.addEventListener('openBrandIntake', handleOpen);
    return () => window.removeEventListener('openBrandIntake', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    document.body.classList.remove('modal-open');
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      updateConfig({ currentStep: currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      updateConfig({ currentStep: currentStep - 1 });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.brandName.trim().length > 0 && config.packageScope !== '';
      case 2:
        return true;
      case 3:
        return config.primaryFont !== '';
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && canProceed() && currentStep < TOTAL_STEPS) {
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
          className="fixed z-50 inset-0 flex flex-col bg-white overflow-y-scroll overscroll-none"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 35, stiffness: 200 }}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-6 md:px-12 py-6 md:py-8 fixed left-0 right-0 top-0 bg-white/80 backdrop-blur-md z-10">
            <div className="flex-1">
              <img src="/src/assets/logo_icon.svg" alt="Trellis" className="w-8 h-8" />
            </div>
            
            <div className="flex-2 flex justify-center">
              <Stepper current={currentStep} />
            </div>

            <div className="flex-1 flex justify-end">
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-end rounded-full text-charcoal/40 hover:text-charcoal transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-scroll min-h-fit pt-32 pb-32">
            <div className="max-w-6xl mx-auto px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Fixed Footer */}
          <footer className="bg-white border-t border-charcoal/5 px-6 md:px-12 py-6 fixed bottom-0 left-0 right-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="text-charcoal/60 hover:text-charcoal font-medium disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="hidden md:block text-charcoal/30 text-xs font-bold uppercase tracking-widest">
                {currentStep} of {TOTAL_STEPS}
              </div>

              {currentStep < TOTAL_STEPS && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-forest-green text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-forest-green/10"
                >
                  Continue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntake;
