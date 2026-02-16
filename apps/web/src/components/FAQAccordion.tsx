import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Can I customize everything?',
    answer:
      "Absolutely. This is your codebase, not a locked library. You own the code, the tokens, the components—everything. Modify anything you want. There are no proprietary formats or dependencies that lock you in. It's just well-structured, documented code that follows industry best practices.",
  },
  {
    question: 'Who is Trellis for?',
    answer:
      "Trellis is for product teams that need a design system but don't want to spend months building infrastructure. Perfect for startups launching products, agencies building for multiple clients, or in-house teams at mid-size companies. If you're a solo developer, you might be better off with a component library. If you're an enterprise with 50+ designers, you'll need something more custom.",
  },
  {
    question: 'What if I need support?',
    answer:
      "Every purchase includes 30 days of email support. I'll help you get set up, answer questions about customization, and troubleshoot any issues. After 30 days, you'll have access to a private Discord community where you can get help from other Trellis users. For ongoing priority support, the enhanced tier (coming Feb 2026) includes 90 days.",
  },
  {
    question: 'Can I get a refund?',
    answer:
      "Unfortunately, we don't have a refund policy; Trellis is a one-time purchase, not a subscription. You fully own the generated code, tokens, and figma file forever.",
  },
  {
    question: 'Is this better than building from scratch?',
    answer:
      "Depends on your timeline and resources. Building from scratch gives you 100% control but takes months. Using a component library is fast but lacks governance. Trellis is the middle ground: you get a professionally structured foundation that you own completely, saving months of setup while maintaining full customization. Most teams find this is the sweet spot.",
  },
  {
    question: 'What frameworks are supported?',
    answer:
      'Currently, React is available with TypeScript support. Vue, Svelte, and Solid support are coming in February 2026 as part of the enhanced tier. The design tokens and Figma files are framework-agnostic, so you can use them with any framework if you want to port the components yourself.',
  },
  {
    question: 'Will I get updates?',
    answer:
      "Yes. You'll get access to a private GitHub repository with updates and improvements. Since you own the code, you can choose when (or if) to pull in updates. No forced upgrades, no breaking changes pushed to your production app. You control your upgrade path.",
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
