import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, HelpCircle, X, ShieldCheck, Zap, QrCode, Trash2 } from 'lucide-react';

export const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">DropStuff</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full border border-slate-200">
                Temporary Transfer
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-50"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>How it works</span>
            </button>
          </nav>
        </div>
      </header>

      {/* How It Works Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" />
                How DropStuff Works
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-slate-600 text-sm">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 font-semibold flex items-center justify-center shrink-0 border border-brand-100">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-0.5">Select Files & Expiration</h4>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Drag and drop up to 20 files (max 500 MB total). Choose how long the link should stay active (1 hour to 7 days).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 font-semibold flex items-center justify-center shrink-0 border border-brand-100">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-0.5">Generate Instant QR & Link</h4>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    DropStuff uploads files securely and generates a unique QR code and random, unguessable recipient URL.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 font-semibold flex items-center justify-center shrink-0 border border-brand-100">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-0.5">Scan & Download</h4>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Recipients scan the QR code with their mobile phone or open the link to download files individually or as a single ZIP archive.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-semibold flex items-center justify-center shrink-0 border border-amber-100">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-0.5">Automatic Purge</h4>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Once the drop expires or is manually revoked, files and metadata are completely purged from storage.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-brand-600 text-white font-medium text-sm rounded-lg hover:bg-brand-700 transition-colors shadow-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
