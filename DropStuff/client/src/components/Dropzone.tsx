import React, { useRef, useState } from 'react';
import { UploadCloud, FolderPlus } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value so re-selecting same file works
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none ${
        disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60' : ''
      } ${
        isDragOver
          ? 'border-brand-600 bg-brand-50/50 shadow-xs scale-[0.99]'
          : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          isDragOver ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
        }`}>
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <p className="text-base font-semibold text-slate-800">
            Drop your files here
          </p>
          <p className="text-xs text-slate-400 my-1 font-medium">or</p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) fileInputRef.current?.click();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-slate-500" />
          Choose files
        </button>

        <p className="text-xs text-slate-400 pt-2">
          Up to 20 files · Max 100 MB per file · 500 MB total
        </p>
      </div>
    </div>
  );
};
