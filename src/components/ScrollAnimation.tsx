import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const StepContent = ({ 
  step, 
  title, 
  children 
}: { 
  step: string; 
  title: string; 
  children: ReactNode 
}) => (
  <div className="min-h-[60vh] flex flex-col justify-center gap-4 py-20">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0, ease: [0.17, 0.84, 0.44, 1] }}
      className="text-charcoal/70 font-sans"
    >
      {step}
    </motion.div>
    <motion.h3
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.17, 0.84, 0.44, 1] }}
      className="text-4xl md:text-5xl"
    >
      {title}
    </motion.h3>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.17, 0.84, 0.44, 1] }}
      className="text-lg text-charcoal/70"
    >
      {children}
    </motion.div>
  </div>
);

const ScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress through the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Create a smoother scroll progress for the animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Step 1 Transforms
  const step1RightOpacity = useTransform(smoothProgress, [0, 0.1], [0, 1]);
  const step1RightY = useTransform(smoothProgress, [0, 0.1, 0.2, 0.3], [50, 0, 0, -20]);
  const step1RightScale = useTransform(smoothProgress, [0.2, 0.3], [1, 0.9]);

  // Step 2 Transforms
  const step2RightOpacity = useTransform(smoothProgress, [0.2, 0.3], [0, 1]);
  const step2RightY = useTransform(smoothProgress, [0.2, 0.3, 0.45, 0.55], [100, 0, 0, -20]);
  const step2RightScale = useTransform(smoothProgress, [0.45, 0.55], [1, 0.9]);

  // Step 3 Transforms
  const step3RightOpacity = useTransform(smoothProgress, [0.45, 0.55], [0, 1]);
  const step3RightY = useTransform(smoothProgress, [0.45, 0.55, 0.7, 0.8], [100, 0, 0, -20]);
  const step3RightScale = useTransform(smoothProgress, [0.7, 0.8], [1, 0.9]);

  // Step 4 Transforms
  const step4RightOpacity = useTransform(smoothProgress, [0.7, 0.8], [0, 1]);
  const step4RightY = useTransform(smoothProgress, [0.7, 0.8], [100, 0]);
  const step4RightScale = useTransform(smoothProgress, [0.7, 0.8], [1, 1]);

  return (
    <div ref={containerRef} className="relative bg-white">
      <div className="container-custom w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Side - Natural Scroll Content */}
          <div className="relative z-10 py-[10vh]">
            <StepContent step="Step 1" title="Tell us about your brand">
              <p>
                Answer a few quick questions about your brand identity, colors,
                and style preferences. No design background or brand PDF required.
              </p>
            </StepContent>

            <div className="h-[20vh]" /> {/* Spacing */}

            <StepContent step="Step 2" title="Generate your design system">
              <p className="mb-4">
                In ~10 seconds, we generate everything, customized to your brand.
              </p>
              <ul className="list-none list-inside space-y-2">
                <li><img src="/src/assets/check.svg" alt="Check" className="w-5 h-5 inline-block mr-2" />DTCG-compliant tokens and JSON file </li>
                <li><img src="/src/assets/check.svg" alt="Check" className="w-5 h-5 inline-block mr-2" />Figma file with branded components</li>
                <li><img src="/src/assets/check.svg" alt="Check" className="w-5 h-5 inline-block mr-2" />Production PNPM monorepo with Storybook</li>
                <li><img src="/src/assets/check.svg" alt="Check" className="w-5 h-5 inline-block mr-2" />25 React components with Vitest</li>
                <li><img src="/src/assets/check.svg" alt="Check" className="w-5 h-5 inline-block mr-2" />Complete Starlight documentation site</li>
              </ul>
            </StepContent>

            <div className="h-[20vh]" /> {/* Spacing */}

            <StepContent step="Step 3" title="Install and run locally">
              <p>
                Download, unzip, and run three commands – your system is running locally. Time elapsed: ~2 minutes.
              </p>
            </StepContent>

            <div className="h-[20vh]" /> {/* Spacing */}

            <StepContent step="Step 4" title="Customize and ship your system">
              <p>
                All components use your tokens. Change one value, update everywhere. Add new components using the same patterns. Your team can extend it however you want. You own the code. Forever.
              </p>
            </StepContent>
            
            <div className="h-[20vh]" /> {/* Bottom Padding */}
          </div>

          {/* Right Side - Sticky Visuals */}
          <div className="sticky top-0 h-screen flex items-center">
            <div className="relative h-[500px] w-full">
              {/* Step 1 Visual - Form */}
              <motion.div
                className="absolute inset-0 bg-cream rounded-3xl flex flex-col justify-center p-8 shadow-lg"
                style={{ 
                  opacity: step1RightOpacity, 
                  y: step1RightY, 
                  scale: step1RightScale,
                  zIndex: 10
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-charcoal/70">
                      Brand Name
                    </label>
                    <motion.div
                      className="h-12 bg-white rounded-lg border-2 border-charcoal/10 px-4 flex items-center overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    >
                      <motion.span
                        className="font-serif italic text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                      >
                        Acme Inc.
                      </motion.span>
                    </motion.div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-charcoal/70">
                      Primary Color
                    </label>
                    <div className="flex gap-3">
                      {['#2D5016', '#E63946', '#457B9D', '#F4A261', '#2A9D8F'].map(
                        (color, i) => (
                          <motion.div
                            key={color}
                            className="w-12 h-12 rounded-lg shadow-sm"
                            style={{ backgroundColor: color }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 1.5 + i * 0.1 }}
                          />
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-charcoal/70">
                      Typography
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Modern', 'Classic', 'Geometric'].map((style, i) => (
                        <motion.div
                          key={style}
                          className="h-10 bg-white rounded-lg border-2 border-charcoal/10 flex items-center justify-center text-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 2 + i * 0.1 }}
                        >
                          {style}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 Visual - Generation Progress */}
              <motion.div
                className="absolute inset-0 bg-cream rounded-3xl flex flex-col justify-center p-8 shadow-lg"
                style={{ 
                  opacity: step2RightOpacity, 
                  y: step2RightY, 
                  scale: step2RightScale,
                  zIndex: 20
                }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="text-6xl mb-4"
                  >
                    ⚙️
                  </motion.div>
                  <div className="text-xl font-semibold mb-2">Generating...</div>
                  <motion.div
                    className="h-2 bg-white rounded-full overflow-hidden mb-6 mx-auto"
                    initial={{ width: '80%' }}
                  >
                    <motion.div
                      className="h-full bg-forest-green"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                  </motion.div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '📦', label: 'tokens.json', delay: 0.5 },
                    { icon: '⚛️', label: 'components.zip', delay: 0.7 },
                    { icon: '🎨', label: 'figma.fig', delay: 0.9 },
                    { icon: '📝', label: 'docs.zip', delay: 1.1 },
                    { icon: '⚡', label: 'storybook', delay: 1.3 },
                    { icon: '🔧', label: 'config.ts', delay: 1.5 },
                  ].map((file) => (
                    <motion.div
                      key={file.label}
                      className="bg-white rounded-lg p-3 text-center shadow-sm"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        damping: 15,
                        stiffness: 300,
                        delay: file.delay,
                      }}
                    >
                      <div className="text-2xl mb-1">{file.icon}</div>
                      <div className="text-xs font-mono">{file.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Step 3 Visual - Terminal */}
              <motion.div
                className="absolute inset-0 bg-cream rounded-3xl flex flex-col justify-center p-8 shadow-lg"
                style={{ 
                  opacity: step3RightOpacity, 
                  y: step3RightY, 
                  scale: step3RightScale,
                  zIndex: 30
                }}
              >
                <div className="bg-charcoal rounded-xl p-6 font-mono text-sm overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cream/20">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-cream/50 ml-2">terminal</span>
                  </div>
                  <div className="space-y-2 text-cream">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <span className="text-forest-green-200">$</span> pnpm install
                    </motion.div>
                    <motion.div
                      className="text-cream/70 text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      Packages: +247
                    </motion.div>
                    <motion.div
                      className="text-forest-green-200 text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 1.2 }}
                    >
                      ✓ Installation complete
                    </motion.div>
                    <motion.div
                      className="pt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 1.6 }}
                    >
                      <span className="text-forest-green-200">$</span> pnpm dev
                    </motion.div>
                    <motion.div
                      className="text-cream/70 text-xs space-y-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 2 }}
                    >
                      <div>📦 /packages/tokens</div>
                      <div>⚛️ /packages/components</div>
                      <div>📖 /apps/docs</div>
                      <div>📚 /apps/storybook</div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Step 4 Visual - Component Preview */}
              <motion.div
                className="absolute inset-0 bg-cream rounded-3xl flex flex-col justify-center p-8 shadow-lg"
                style={{ 
                  opacity: step4RightOpacity, 
                  y: step4RightY, 
                  scale: step4RightScale,
                  zIndex: 40
                }}
              >
                <div className="bg-white rounded-xl p-6 shadow-inner">
                  <div className="text-xs font-mono text-charcoal/50 mb-4">
                    Button.tsx
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <motion.button
                        className="px-6 py-3 rounded-full font-semibold shadow-sm"
                        style={{ backgroundColor: '#2D5016', color: 'white' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Primary
                      </motion.button>
                      <motion.button
                        className="px-6 py-3 rounded-full font-semibold border-2"
                        style={{ borderColor: '#2D5016', color: '#2D5016' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Ghost
                      </motion.button>
                    </div>
                    <div className="text-xs font-mono bg-charcoal/5 rounded-lg p-3 space-y-1">
                      <div className="text-charcoal/70">// Your tokens</div>
                      <div>
                        <span className="text-purple-600">primary</span>:{' '}
                        <span className="text-green-600">"#2D5016"</span>
                      </div>
                      <div>
                        <span className="text-purple-600">radius</span>:{' '}
                        <span className="text-green-600">"9999px"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollAnimation;
