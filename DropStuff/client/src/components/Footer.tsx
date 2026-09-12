import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500 space-y-1.5">
        <p className="font-semibold text-slate-800 text-sm">DropStuff</p>
        <p>Temporary file sharing, made simple.</p>
        <p className="text-slate-400">Files are automatically removed after expiration.</p>
        <p className="pt-2 text-[11px] text-slate-400">© 2026 DropStuff</p>
      </div>
    </footer>
  );
};
