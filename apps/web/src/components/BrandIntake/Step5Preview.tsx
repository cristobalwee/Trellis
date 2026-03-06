import React from 'react';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from './store';
import IntakePlayground from '../LivePlayground/IntakePlayground';

const Step5Preview = () => {
  const config = useStore($brandConfig);

  return (
    <div className="flex flex-col">
      <span className="text-charcoal/80 mb-4 text-base">Step 5</span>
      <h2 className="text-5xl md:text-7xl mb-6">Review and purchase</h2>
      <p className="text-base md:text-xl text-charcoal/80 mb-16">
        Preview your design system live. Tweak anything you'd like, and when you're ready click "finish" to purchase and generate your library.
      </p>

      {/* Live Playground */}
      <div className="mb-12 xl:-mx-24">
        <IntakePlayground />
      </div>
    </div>
  );
};

export default Step5Preview;
