import React from 'react';
import { X, ShieldCheck, FileCheck } from 'lucide-react';

interface LegalDocModalProps {
  title: string | null;
  onClose: () => void;
}

export const LegalDocModal: React.FC<LegalDocModalProps> = ({ title, onClose }) => {
  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
          <p className="font-semibold text-slate-800">
            GlobalFX Institutional Exchange Legal & Operational Overview
          </p>
          <p>
            GlobalFX is an institutional multibank foreign exchange conversion protocol operating under international tier-1 liquidity provisioning standards. All client trades and executions are performed with segregated tier-1 treasury custody, guaranteed straight-through processing (STP), and real-time interbank order routing.
          </p>
          <p>
            <strong>Regulatory & Compliance Framework:</strong> Compliant with ISO-20022 messaging, FinCEN regulatory registrations, FCA algorithmic trading guidelines, and strict AML/KYC Level 3 entity segregation.
          </p>
          <p>
            <strong>Execution Guarantees:</strong> Rates displayed within active quote windows (45 seconds) are firm and fully guaranteed against market slippage. Zero fees apply under prime institutional execution tiers.
          </p>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#082c5e] hover:bg-[#062147] rounded-lg transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
