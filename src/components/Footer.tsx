import React from 'react';

interface FooterProps {
  onOpenDocModal?: (title: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDocModal }) => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#eef2f6] text-slate-600 text-xs py-7 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center">
          <span className="text-base font-black text-[#0a2540] tracking-tight">
            Global<span className="text-[#0a2540]">FX</span>
          </span>
        </div>

        {/* Center: Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
          <button
            onClick={() => onOpenDocModal?.('Privacy Policy')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => onOpenDocModal?.('Terms of Service')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            onClick={() => onOpenDocModal?.('Compliance & Regulatory')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Compliance
          </button>
          <button
            onClick={() => onOpenDocModal?.('Contact Support Desk')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Contact Us
          </button>
        </div>

        {/* Right: Copyright */}
        <div className="text-slate-500 text-center md:text-right">
          © 2024 GlobalFX Institutional Exchange. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
