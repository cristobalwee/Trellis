import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What do I get with the free tier?',
    answer:
      'A complete token system exported as DTCG JSON, a CSS stylesheet, Tailwind config, shadcn-compatible config, and Figma variables — generated from your brand colors and typography choices. No account required.',
  },
  {
    question: "How is this different from customizing shadcn's theme?",
    answer:
      'shadcn gives you HSL sliders and leaves the design decisions to you. Trellis uses OKLCH perceptual color science to generate semantically layered tokens — background surfaces, interactive state scrims, accessible foreground pairings — that would take a design systems engineer weeks to architect manually.',
  },
  {
    question: 'Does this work with my existing component library?',
    answer:
      'Yes. Trellis generates the design system layer, not the components. The output tokens and styles can power shadcn, Radix, Chakra, HeroUI, or any component library that consumes CSS custom properties or Tailwind config.',
  },
  {
    question: "What's coming in the paid tier?",
    answer:
      'A production-ready React component library on Base UI, Figma component library, Storybook documentation, and governance files — all wired to your generated token system. Join the waitlist to get early access.',
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
