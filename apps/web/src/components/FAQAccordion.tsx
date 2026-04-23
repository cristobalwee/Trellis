import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is Trellis?',
    answer:
      "Trellis is a design system generator that produces production-ready token architecture from your brand inputs. Rather than replacing your component library, it acts as the intelligence layer beneath it — generating OKLCH-native color systems, semantic token structures, and type scales that work with whatever stack you're already using.",
  },
  {
    question: 'What do I get for free?',
    answer:
      "Everything you need to start building on a principled foundation: a full token configuration package including DTCG JSON, CSS custom properties, a Tailwind config, shadcn-compatible CSS variables, and a README documenting your system's architecture. No sign-up required, no email gate — just configure and download.",
  },
  {
    question:
      'What makes Trellis different from a theming tool like tweakcn or Shadcraft?',
    answer:
      "Theming tools let you adjust surface-level styles on an existing component set. Trellis generates the underlying architecture — semantic token layering, surface-dependent state logic, perceptually uniform color ramps — that a theming tool never touches. It's the difference between picking colors and building a color system.",
  },
  {
    question: 'How does the color system work?',
    answer:
      "Trellis generates all colors in OKLCH, a perceptually uniform color space that produces more consistent and accessible palettes than HSL or hex. From your primary brand color, it builds a full 10-hue palette using a greedy algorithm that maximizes angular distance while guaranteeing coverage of red, green, blue, and yellow. Each hue gets a multi-step ramp with saturation scaling relative to each shade's natural chroma ceiling.",
  },
  {
    question:
      'Can I use Trellis with shadcn/ui, Chakra, HeroUI, or other component libraries?',
    answer:
      'Yes! Trellis outputs are designed to slot into your existing tools. The free tier includes a shadcn-compatible CSS variables file out of the box, so you can drop a Trellis-generated system directly into a shadcn project. Think of it as "shadcn with a real design system underneath" rather than "shadcn or Trellis."',
  },
  {
    question: 'Is Trellis open source?',
    answer:
      'The token architecture and color science are fully open. The free tier gives you the complete token package with no restrictions on how you use it — in personal projects, client work, or commercial products. The generated output is yours.',
  },
  {
    question: "What's coming in the paid tier?",
    answer:
      'The paid tier will add a full React component library built on Base UI, Figma Variables with a plugin importer so you can apply your generated system to a canonical Figma file, Storybook documentation, governance docs, and agentic guidance files for AI-assisted development. Pricing will be around $99. You can join the waitlist now — the MVP focuses on nailing the free tier first.',
  },
];

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="bg-white border-b border-charcoal/10 overflow-hidden transition-all hover:border-charcoal/20"
        >
          <button
            onClick={() => toggleAccordion(index)}
            className="w-full px-4 md:px-8 py-6 md:py-8 flex items-center justify-between gap-4 text-left hover:px-10 hover:cursor-pointer transition-all duration-300"
            aria-expanded={openIndex === index}
          >
            <span className="font-semibold text-lg md:text-xl pr-4">
              {faq.question}
            </span>
            <motion.svg
              className="w-6 h-6 flex-shrink-0 text-charcoal"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </button>

          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 md:px-8 pb-5 md:pb-6 pt-0">
                  <p className="text-charcoal/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default FAQAccordion;
