import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBytes } from '../utils/formatters.js';
import { FileIcon } from '../components/FileIcon.js';
import { DropData } from '../types/index.js';
import { Download, Archive, Loader2, Clock, CheckCircle2 } from 'lucide-react';

export const RecipientDropPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [drop, setDrop] = useState<DropData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    if (!token) return;

    api
      .getDrop(token)
      .then((data) => {
        setDrop(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching recipient drop:', err);
        setLoading(false);
        const status = err.response?.data?.status;
        if (status === 'EXPIRED') {
          navigate('/drop/expired', { replace: true });
        } else if (status === 'REVOKED') {
          navigate('/drop/revoked', { replace: true });
        } else {
          navigate('/drop/expired', { replace: true });
        }
      });
  }, [token, navigate]);

  const handleDownloadAll = () => {
    if (!token) return;
    setDownloadingZip(true);
    const zipUrl = api.getDownloadAllZipUrl(token);

    // Trigger download
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `dropstuff-${token}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloadingZip(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-500">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-medium">Loading drop details...</p>
      </div>
    );
  }

  if (!drop) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Files ready to download
        </h1>
        <p className="text-sm text-slate-500">
          Select individual files below or download everything in a single archive.
        </p>
      </div>

      {/* Main Recipient Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Info & Download All CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <p className="text-base font-bold text-slate-900">
              {drop.fileCount} {drop.fileCount === 1 ? 'file' : 'files'} · {formatBytes(drop.totalSize)}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Secure temporary drop
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingZip}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {downloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing ZIP...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Download all
              </>
            )}
          </button>
        </div>

        {/* Individual File List */}
        <div className="divide-y divide-slate-100">
          {drop.files.map((file) => {
            const downloadUrl = api.getFileDownloadUrl(drop.token, file.id);
            return (
              <div
                key={file.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/50 p-2.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60">
                    <FileIcon filename={file.originalName} mimeType={file.mimeType} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-slate-500 font-normal">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                <a
                  href={downloadUrl}
                  download={file.originalName}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Download
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
