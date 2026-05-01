import React, { useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $brandConfig,
  updateConfig,
  FONT_WEIGHT_OPTIONS,
  type FontWeight,
  type BodyFontWeights,
} from './store';
import { Combobox } from '../ui/Combobox';
import { appendGoogleFontStylesheet, GOOGLE_FONTS } from '../../data/googleFonts';

export { GOOGLE_FONTS };

interface WeightPillsProps {
  selected: FontWeight;
  onSelect: (w: FontWeight) => void;
  fontFamily: string;
}

const WeightPills: React.FC<WeightPillsProps> = ({ selected, onSelect, fontFamily }) => (
  <div className="flex flex-wrap gap-1.5">
    {FONT_WEIGHT_OPTIONS.map((w) => {
      const active = selected === w;
      return (
        <button
          key={w}
          onClick={() => onSelect(w)}
          style={{ fontFamily: `'${fontFamily}', system-ui, sans-serif`, fontWeight: w }}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
            active
              ? 'border-forest-green bg-forest-green/5 text-forest-green'
              : 'border-charcoal/10 text-charcoal/80 hover:border-charcoal/20'
          }`}
        >
          {w}
        </button>
      );
    })}
  </div>
);

const TabTypography: React.FC = () => {
  const config = useStore($brandConfig);

  useEffect(() => {
    const loadFont = (family: string, role: 'heading' | 'body') => {
      const id = `tab-typo-font-${role}-${family.replace(/\s+/g, '+')}`;
      appendGoogleFontStylesheet(family, id);
    };
    loadFont(config.headingFont, 'heading');
    loadFont(config.primaryFont, 'body');
  }, [config.headingFont, config.primaryFont]);

  const handleBodyFontChange = useCallback((font: string) => {
    updateConfig({ primaryFont: font, customBodyFontName: undefined });
  }, []);

  const handleHeadingFontChange = useCallback((font: string) => {
    updateConfig({ headingFont: font, customHeadingFontName: undefined });
  }, []);

  const setBodyWeight = useCallback(
    (slot: keyof BodyFontWeights, weight: FontWeight) => {
      updateConfig({ bodyWeights: { ...config.bodyWeights, [slot]: weight } });
    },
    [config.bodyWeights],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Heading typeface + weight */}
      <div className="flex flex-col gap-6">
        <Combobox
          label="Heading Typeface"
          value={config.headingFont}
          onValueChange={handleHeadingFontChange}
          options={GOOGLE_FONTS}
          placeholder="Search Google Fonts..."
          displayValue={config.customHeadingFontName}
          size="compact"
        />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-charcoal/80">Weight</span>
          <WeightPills
            selected={config.headingWeight}
            onSelect={(w) => updateConfig({ headingWeight: w })}
            fontFamily={config.headingFont}
          />
        </div>
      </div>

      {/* Body typeface + weights */}
      <div className="flex flex-col gap-6 pt-4 border-t border-charcoal/5">
        <Combobox
          label="Body Typeface"
          value={config.primaryFont}
          onValueChange={handleBodyFontChange}
          options={GOOGLE_FONTS}
          placeholder="Search Google Fonts..."
          displayValue={config.customBodyFontName}
          size="compact"
        />
        <div className="flex flex-col gap-6">
          {(['light', 'regular', 'bold'] as const).map((slot) => (
            <div key={slot} className="flex flex-col gap-2">
              <span className="text-xs text-charcoal/80 capitalize">Weight – {slot}</span>
              <WeightPills
                selected={config.bodyWeights[slot]}
                onSelect={(w) => setBodyWeight(slot, w)}
                fontFamily={config.primaryFont}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabTypography;
