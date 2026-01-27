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
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-charcoal/80 backdrop-blur-lg"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative bg-cream rounded-3xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-charcoal/10 hover:bg-charcoal/20 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-charcoal"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Progress Bar */}
            <div className="h-1 bg-charcoal/10">
              <motion.div
                className="h-full bg-forest-green"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                {/* Step 1: Brand Name */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    className="flex-1 flex flex-col justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl md:text-5xl mb-4">What's your brand name?</h2>
                    <p className="text-charcoal/60 mb-8">This will be used throughout your design system.</p>
                    <input
                      type="text"
                      value={brandData.brandName}
                      onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                      placeholder="Acme Inc."
                      className="text-2xl font-serif italic p-4 bg-white rounded-xl border-2 border-charcoal/10 focus:border-forest-green focus:outline-none transition-colors"
                      autoFocus
                    />
                  </motion.div>
                )}

                {/* Step 2: Primary Color */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    className="flex-1 flex flex-col justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl md:text-5xl mb-4">Choose your primary color</h2>
                    <p className="text-charcoal/60 mb-8">This will define your brand's visual identity.</p>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="flex-1">
                        <HexColorPicker
                          color={brandData.primaryColor}
                          onChange={(color) => setBrandData({ ...brandData, primaryColor: color })}
                          style={{ width: '100%', height: '240px' }}
                        />
                      </div>
                      <div className="text-center">
                        <div
                          className="w-32 h-32 rounded-2xl shadow-lg mb-4"
                          style={{ backgroundColor: brandData.primaryColor }}
                        />
                        <div className="font-mono text-lg font-semibold">{brandData.primaryColor}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Typography */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    className="flex-1 flex flex-col justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl md:text-5xl mb-4">Select your typography style</h2>
                    <p className="text-charcoal/60 mb-8">Choose the aesthetic that matches your brand.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'modern-sans', label: 'Modern Sans', preview: 'Aa' },
                        { id: 'classic-serif', label: 'Classic Serif', preview: 'Aa' },
                        { id: 'geometric', label: 'Geometric', preview: 'Aa' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setBrandData({ ...brandData, typography: option.id as any })}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            brandData.typography === option.id
                              ? 'border-forest-green bg-forest-green/5'
                              : 'border-charcoal/10 hover:border-charcoal/30'
                          }`}
                        >
                          <div className="text-5xl mb-2">{option.preview}</div>
                          <div className="font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Framework */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    className="flex-1 flex flex-col justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl md:text-5xl mb-4">Which framework?</h2>
                    <p className="text-charcoal/60 mb-8">Select your preferred JavaScript framework.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setBrandData({ ...brandData, framework: 'react' })}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          brandData.framework === 'react'
                            ? 'border-forest-green bg-forest-green/5'
                            : 'border-charcoal/10 hover:border-charcoal/30'
                        }`}
                      >
                        <div className="text-3xl mb-2">⚛️</div>
                        <div className="font-medium">React</div>
                        <div className="text-sm text-charcoal/50 mt-1">Available Now</div>
                      </button>
                      <button
                        disabled
                        className="p-6 rounded-xl border-2 border-charcoal/10 opacity-50 cursor-not-allowed"
                      >
                        <div className="text-3xl mb-2">🌱</div>
                        <div className="font-medium">Vue</div>
                        <div className="text-sm text-charcoal/50 mt-1">Coming Feb 2026</div>
                      </button>
                      <button
                        disabled
                        className="p-6 rounded-xl border-2 border-charcoal/10 opacity-50 cursor-not-allowed"
                      >
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="font-medium">Svelte</div>
                        <div className="text-sm text-charcoal/50 mt-1">Coming Feb 2026</div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Summary & Purchase */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    className="flex-1 flex flex-col justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl md:text-5xl mb-6">Ready to build?</h2>
                    <div className="bg-white rounded-xl p-6 mb-6 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Brand Name</span>
                        <span className="font-semibold">{brandData.brandName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-charcoal/60">Primary Color</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: brandData.primaryColor }}
                          />
                          <span className="font-mono text-sm">{brandData.primaryColor}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Typography</span>
                        <span className="font-semibold capitalize">{brandData.typography?.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Framework</span>
                        <span className="font-semibold capitalize">{brandData.framework}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-serif italic">$149</span>
                      <span className="text-charcoal/60">one-time purchase</span>
                    </div>
                    <button
                      className="btn btn-primary w-full text-lg"
                      onClick={() => {
                        // Placeholder for payment integration
                        alert('Payment integration coming soon! Your selection has been saved.');
                        handleClose();
                      }}
                    >
                      Complete Purchase
                    </button>
                    <button onClick={handleBack} className="btn btn-ghost w-full mt-4">
                      Go Back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              {currentStep < 5 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-charcoal/10">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="text-charcoal/60 hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    ← Back
                  </button>
                  <div className="text-sm text-charcoal/40">
                    Step {currentStep} of {totalSteps}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntake;
