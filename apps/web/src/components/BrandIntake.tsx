import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';

interface BrandData {
  brandName: string;
  primaryColor: string;
  typography: 'modern-sans' | 'classic-serif' | 'geometric' | '';
  framework: 'react' | 'vue' | 'svelte' | '';
}

const BrandIntake = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [brandData, setBrandData] = useState<BrandData>({
    brandName: '',
    primaryColor: '#2D5016',
    typography: '',
    framework: '',
  });

  const totalSteps = 5;

  const Stepper = ({ current: currentStep, total: totalSteps }: { current: number; total: number }) => (
    <div className="flex items-center gap-1.5 md:gap-3">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i + 1 <= currentStep 
              ? 'w-6 md:w-12 bg-forest-green' 
              : 'w-2 md:w-4 bg-charcoal/10'
          }`}
        />
      ))}
    </div>
  );

  // Listen for open event from Hero/Header CTAs
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.classList.add('modal-open');
    };

    window.addEventListener('openBrandIntake', handleOpen);

    return () => {
      window.removeEventListener('openBrandIntake', handleOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    document.body.classList.remove('modal-open');
    // Reset after animation completes
    setTimeout(() => {
      setCurrentStep(1);
      setBrandData({
        brandName: '',
        primaryColor: '#2D5016',
        typography: '',
        framework: '',
      });
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return brandData.brandName.trim().length > 0;
      case 2:
        return true; // Color always valid
      case 3:
        return brandData.typography !== '';
      case 4:
        return brandData.framework !== '';
      default:
        return true;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && canProceed() && currentStep < totalSteps) {
      handleNext();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown as any);
      return () => window.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [isOpen, currentStep, brandData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white shadow-xl"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 35, stiffness: 200 }}
        >
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto relative">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-[20vh]">
              <AnimatePresence mode="wait">
                {/* Step 1: Brand Name */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 01</span>
                    <h2 className="text-5xl md:text-7xl mb-6">What's your brand name?</h2>
                    <p className="text-xl text-charcoal/60 mb-12 max-w-xl">This will be used throughout your design system and documentation.</p>
                    <input
                      type="text"
                      value={brandData.brandName}
                      onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                      placeholder="Acme Inc."
                      className="text-4xl md:text-6xl font-serif italic p-0 bg-transparent border-none focus:outline-none placeholder:text-charcoal/10"
                      autoFocus
                    />
                    <div className="h-px w-full bg-charcoal/10 mt-4" />
                  </motion.div>
                )}

                {/* Step 2: Primary Color */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 02</span>
                    <h2 className="text-5xl md:text-7xl mb-6">Choose your primary color</h2>
                    <p className="text-xl text-charcoal/60 mb-12 max-w-xl">This color will define your brand's primary visual identity and theme.</p>
                    <div className="flex flex-col md:flex-row gap-12 items-start">
                      <div className="flex-1 w-full max-w-md">
                        <HexColorPicker
                          color={brandData.primaryColor}
                          onChange={(color) => setBrandData({ ...brandData, primaryColor: color })}
                          style={{ width: '100%', height: '300px' }}
                        />
                      </div>
                      <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-sm border border-charcoal/5">
                        <div
                          className="w-48 h-48 rounded-2xl shadow-inner mb-6 transition-colors duration-200"
                          style={{ backgroundColor: brandData.primaryColor }}
                        />
                        <div className="font-mono text-2xl font-semibold tracking-tight">{brandData.primaryColor}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Typography */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 03</span>
                    <h2 className="text-5xl md:text-7xl mb-6">Select your typography style</h2>
                    <p className="text-xl text-charcoal/60 mb-12 max-w-xl">Choose the aesthetic that best matches your brand's personality.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'modern-sans', label: 'Modern Sans', preview: 'Aa', desc: 'Clean, professional, and highly readable.' },
                        { id: 'classic-serif', label: 'Classic Serif', preview: 'Aa', desc: 'Elegant, timeless, and sophisticated.' },
                        { id: 'geometric', label: 'Geometric', preview: 'Aa', desc: 'Modern, playful, and mathematically precise.' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setBrandData({ ...brandData, typography: option.id as any })}
                          className={`p-8 rounded-3xl border-2 text-left transition-all duration-300 ${
                            brandData.typography === option.id
                              ? 'border-forest-green bg-forest-green/5 ring-4 ring-forest-green/10'
                              : 'border-charcoal/5 bg-white hover:border-charcoal/20'
                          }`}
                        >
                          <div className={`text-6xl mb-6 ${
                            option.id === 'modern-sans' ? 'font-sans' : 
                            option.id === 'classic-serif' ? 'font-serif' : 'font-sans'
                          }`}>{option.preview}</div>
                          <div className="font-semibold text-xl mb-2">{option.label}</div>
                          <div className="text-charcoal/50 text-sm">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Framework */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 04</span>
                    <h2 className="text-5xl md:text-7xl mb-6">Which framework?</h2>
                    <p className="text-xl text-charcoal/60 mb-12 max-w-xl">Select your preferred JavaScript framework for the implementation.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <button
                        onClick={() => setBrandData({ ...brandData, framework: 'react' })}
                        className={`p-8 rounded-3xl border-2 text-left transition-all duration-300 ${
                          brandData.framework === 'react'
                            ? 'border-forest-green bg-forest-green/5 ring-4 ring-forest-green/10'
                            : 'border-charcoal/5 bg-white hover:border-charcoal/20'
                        }`}
                      >
                        <div className="text-4xl mb-6">⚛️</div>
                        <div className="font-semibold text-xl mb-2">React</div>
                        <div className="inline-flex px-2 py-1 rounded bg-forest-green/10 text-forest-green text-xs font-bold uppercase tracking-wider">Available Now</div>
                      </button>
                      <button
                        disabled
                        className="p-8 rounded-3xl border-2 border-charcoal/5 bg-charcoal/5 opacity-50 cursor-not-allowed text-left"
                      >
                        <div className="text-4xl mb-6">🌱</div>
                        <div className="font-semibold text-xl mb-2">Vue</div>
                        <div className="text-sm text-charcoal/40">Coming Feb 2026</div>
                      </button>
                      <button
                        disabled
                        className="p-8 rounded-3xl border-2 border-charcoal/5 bg-charcoal/5 opacity-50 cursor-not-allowed text-left"
                      >
                        <div className="text-4xl mb-6">🔥</div>
                        <div className="font-semibold text-xl mb-2">Svelte</div>
                        <div className="text-sm text-charcoal/40">Coming Feb 2026</div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Summary & Purchase */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 05</span>
                    <h2 className="text-5xl md:text-7xl mb-6">Ready to build?</h2>
                    <p className="text-xl text-charcoal/60 mb-12 max-w-xl">Review your selections and complete your purchase to get started.</p>
                    
                    <div className="bg-white rounded-3xl p-8 md:p-12 mb-12 shadow-sm border border-charcoal/5 grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div>
                          <span className="text-charcoal/40 text-sm uppercase tracking-wider font-bold block mb-2">Brand Name</span>
                          <span className="text-3xl font-serif italic">{brandData.brandName}</span>
                        </div>
                        <div>
                          <span className="text-charcoal/40 text-sm uppercase tracking-wider font-bold block mb-2">Primary Color</span>
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-xl"
                              style={{ backgroundColor: brandData.primaryColor }}
                            />
                            <span className="font-mono text-xl">{brandData.primaryColor}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div>
                          <span className="text-charcoal/40 text-sm uppercase tracking-wider font-bold block mb-2">Typography</span>
                          <span className="text-2xl font-semibold capitalize">{brandData.typography?.replace('-', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-charcoal/40 text-sm uppercase tracking-wider font-bold block mb-2">Framework</span>
                          <span className="text-2xl font-semibold capitalize">{brandData.framework}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-serif italic">$149</span>
                        <span className="text-charcoal/60">one-time purchase</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* Fixed Footer */}
          <footer className="bg-white border-t border-charcoal/5 px-6 md:px-12 py-6">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
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

              <div className="hidden md:block text-charcoal/30 text-sm font-medium uppercase tracking-widest">
                {currentStep} / {totalSteps}
              </div>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn btn-primary px-10 py-4 text-lg"
                >
                  Continue
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  className="btn btn-primary px-12 py-4 text-lg"
                  onClick={() => {
                    alert('Payment integration coming soon!');
                    handleClose();
                  }}
                >
                  Complete Purchase
                </button>
              )}
            </div>
          </footer>
          {/* Header */}
          <header className="flex items-center justify-between container-custom py-6 md:py-8 fixed left-0 right-0 top-0">
            <div className="flex-1">
              <img src="/src/assets/logo_icon.svg" alt="Trellis" className="w-8 h-8" />
            </div>
            
            <div className="flex-2 flex justify-center">
              <Stepper current={currentStep} total={totalSteps} />
            </div>

            <div className="flex-1 flex justify-end">
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-end rounded-full text-charcoal/40 hover:text-charcoal transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </header>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntake;
