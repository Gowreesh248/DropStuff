import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropzone } from '../components/Dropzone.js';
import { FileIcon } from '../components/FileIcon.js';
import { ExpirationPicker } from '../components/ExpirationPicker.js';
import { api } from '../services/api.js';
import { formatBytes } from '../utils/formatters.js';
import { ExpirationOption, FileItem } from '../types/index.js';
import { Trash2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [expiration, setExpiration] = useState<ExpirationOption>('24h');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    setErrorMessage(null);

    // Filter duplicates or add new files
    const newItems: FileItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const updated = [...fileItems, ...newItems];

    // Client-side limits check
    if (updated.length > 20) {
      setErrorMessage('Maximum 20 files per drop allowed.');
      return;
    }

    const totalSize = updated.reduce((sum, item) => sum + item.size, 0);
    if (totalSize > 500 * 1024 * 1024) {
      setErrorMessage('Total drop size exceeds 500 MB limit.');
      return;
    }

    setFileItems(updated);
  };

  const handleRemoveFile = (id: string) => {
    setErrorMessage(null);
    setFileItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setErrorMessage(null);
    setFileItems([]);
  };

  const totalBytes = fileItems.reduce((sum, item) => sum + item.size, 0);

  const handleCreateDrop = async () => {
    if (fileItems.length === 0) {
      setErrorMessage('Please select at least one file to create a drop.');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const rawFiles = fileItems.map((item) => item.file);
      const createdDrop = await api.createDrop(rawFiles, expiration, (pct) => {
        setUploadProgress(pct);
      });

      // Redirect to Drop Created confirmation page
      navigate(`/drop/${createdDrop.token}/created`);
    } catch (err: any) {
      console.error('Failed to create drop:', err);
      const msg = err.response?.data?.error || 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero Section */}
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Share files without the hassle.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
          Drop your files, create a temporary link, and let anyone download them with a single scan.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {fileItems.length === 0 ? (
          <Dropzone onFilesSelected={handleFilesSelected} disabled={isUploading} />
        ) : (
          <div className="space-y-4">
            {/* Header / Summary Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-base">
                  Selected Files
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-full">
                  {fileItems.length} {fileItems.length === 1 ? 'file' : 'files'} · {formatBytes(totalBytes)}
                </span>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* File List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
              {fileItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileIcon filename={item.name} mimeType={item.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 font-normal">
                        {formatBytes(item.size)}
                      </p>
                    </div>
                  </div>

                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add More Files trigger if under limit */}
            {!isUploading && fileItems.length < 20 && (
              <div className="pt-2">
                <Dropzone onFilesSelected={handleFilesSelected} disabled={isUploading} />
              </div>
            )}
          </div>
        )}

        {/* Expiration Selector */}
        <div className="pt-4 border-t border-slate-100">
          <ExpirationPicker
            selected={expiration}
            onChange={setExpiration}
            disabled={isUploading}
          />
        </div>

        {/* Uploading Progress Bar State */}
        {isUploading && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                Uploading files...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Create Drop Primary Button */}
        <button
          type="button"
          onClick={handleCreateDrop}
          disabled={fileItems.length === 0 || isUploading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
            fileItems.length === 0 || isUploading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-md hover:shadow-lg'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Drop...
            </>
          ) : (
            <>
              Create Drop
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
