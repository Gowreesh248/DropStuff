import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Plus } from 'lucide-react';

export const ExpiredDropPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
        <Clock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900">
          This drop has expired.
        </h1>
        <p className="text-sm text-slate-500">
          The files are no longer available.
        </p>
      </div>

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create a new drop
        </Link>
      </div>
    </div>
  );
};
