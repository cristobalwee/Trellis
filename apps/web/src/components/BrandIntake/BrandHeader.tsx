import React, { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { Upload } from 'lucide-react';
import { $brandConfig, updateConfig } from './store';
import { Input } from '../ui/Input';

const BrandHeader: React.FC = () => {
  const config = useStore($brandConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateConfig({ logoUrl: url });
  };

  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-charcoal/10 shrink-0">
      {/* Logo upload - compact avatar */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="relative w-10 h-10 rounded-xl border-2 border-dashed border-charcoal/15 flex items-center justify-center shrink-0 hover:border-forest-green/30 hover:bg-forest-green/5 transition-colors cursor-pointer overflow-hidden group"
        aria-label="Upload logo"
      >
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <Upload size={16} className="text-charcoal/30 group-hover:text-forest-green transition-colors" />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Brand name */}
      <div className="flex-1 min-w-0">
        <Input
          value={config.brandName}
          onChange={(e) => updateConfig({ brandName: (e.target as HTMLInputElement).value })}
          placeholder="Brand name"
          size="compact"
        />
      </div>
    </div>
  );
};

export default BrandHeader;
