import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress through the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to step indices (0-25%, 25-50%, 50-75%, 75-100%)
  const step1Opacity = useTransform(scrollYProgress, [0, 0.2, 0.25], [1, 1, 0]);
  const step2Opacity = useTransform(scrollYProgress, [0.2, 0.25, 0.45, 0.5], [0, 1, 1, 0]);
  const step3Opacity = useTransform(scrollYProgress, [0.45, 0.5, 0.7, 0.75], [0, 1, 1, 0]);
  const step4Opacity = useTransform(scrollYProgress, [0.7, 0.75, 1], [0, 1, 1]);

  return (
    <div ref={containerRef} className="relative bg-white" style={{ height: '400vh' }}>
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container-custom w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Text (Sticky) */}
            <div className="relative h-[400px] flex items-center">
              {/* Step 1 Text */}
              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: step1Opacity }}
              >
                <div className="text-forest-green font-sans font-semibold mb-2">
                  Step 1
                </div>
                <h3 className="text-4xl md:text-5xl mb-4">Tell us about your brand</h3>
                <p className="text-lg text-charcoal/70">
                  Answer a few quick questions about your brand identity, colors,
                  and style preferences.
                </p>
              </motion.div>

              {/* Step 2 Text */}
              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: step2Opacity }}
              >
                <div className="text-forest-green font-sans font-semibold mb-2">
                  Step 2
                </div>
                <h3 className="text-4xl md:text-5xl mb-4">We generate your system</h3>
                <p className="text-lg text-charcoal/70">
                  Our engine creates tokens, components, Figma files, and documentation
                  tailored to your brand.
                </p>
              </motion.div>

              {/* Step 3 Text */}
              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: step3Opacity }}
              >
                <div className="text-forest-green font-sans font-semibold mb-2">
                  Step 3
                </div>
                <h3 className="text-4xl md:text-5xl mb-4">Install in seconds</h3>
                <p className="text-lg text-charcoal/70">
                  Download your monorepo, run one command, and you're ready to build.
                </p>
              </motion.div>

              {/* Step 4 Text */}
              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: step4Opacity }}
              >
                <div className="text-forest-green font-sans font-semibold mb-2">
                  Step 4
                </div>
                <h3 className="text-4xl md:text-5xl mb-4">Customize endlessly</h3>
                <p className="text-lg text-charcoal/70">
                  It's your codebase. Modify tokens, add components, adjust styles—no
                  limits.
                </p>
              </motion.div>
            </div>

            {/* Right Side - Visuals */}
            <div className="relative h-[500px] bg-cream rounded-3xl flex items-center justify-center p-8 shadow-lg">
              {/* Step 1 Visual - Form */}
              <motion.div
                className="absolute inset-8 flex flex-col justify-center"
                style={{ opacity: step1Opacity }}
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
                className="absolute inset-8 flex flex-col justify-center"
                style={{ opacity: step2Opacity }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚙️
                  </motion.div>
                  <div className="text-xl font-semibold mb-2">Generating...</div>
                  <motion.div
                    className="h-2 bg-white rounded-full overflow-hidden mb-6"
                    initial={{ width: '80%' }}
                    className="mx-auto"
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
                className="absolute inset-8 flex flex-col justify-center"
                style={{ opacity: step3Opacity }}
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
                className="absolute inset-8 flex flex-col justify-center"
                style={{ opacity: step4Opacity }}
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
