import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api.js';
import { formatBytes, formatCountdown } from '../utils/formatters.js';
import { DropData } from '../types/index.js';
import {
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  FileCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const DropCreatedPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [drop, setDrop] = useState<DropData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  // Fetch drop data
  useEffect(() => {
    if (!token) return;

    api
      .getDrop(token)
      .then((data) => {
        setDrop(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading created drop:', err);
        setLoading(false);
        const status = err.response?.data?.status;
        if (status === 'EXPIRED') {
          navigate('/drop/expired', { replace: true });
        } else if (status === 'REVOKED') {
          navigate('/drop/revoked', { replace: true });
        } else {
          setError('Drop not found or expired.');
        }
      });
  }, [token, navigate]);

  // Live Expiration Countdown Timer
  useEffect(() => {
    if (!drop?.expiresAt) return;

    const updateTimer = () => {
      const { formatted, isExpired } = formatCountdown(drop.expiresAt);
      setCountdownText(formatted);
      if (isExpired) {
        navigate('/drop/expired', { replace: true });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [drop, navigate]);

  const fullRecipientUrl = drop ? drop.recipientUrl : `${window.location.origin}/drop/${token}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullRecipientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleRevoke = async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to revoke this drop? Access will be immediately disabled and files removed.')) {
      return;
    }

    setIsRevoking(true);
    try {
      await api.revokeDrop(token);
      navigate('/drop/revoked', { replace: true });
    } catch (err) {
      console.error('Failed to revoke drop:', err);
      alert('Could not revoke drop. Please try again.');
      setIsRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-500">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-medium">Preparing your drop confirmation...</p>
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Drop Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'This drop could not be found.'}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Create New Drop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 mb-2">
          <FileCheck className="w-3.5 h-3.5" /> Drop Created Successfully
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Your drop is ready.
        </h1>
        <p className="text-sm text-slate-500">
          Scan the QR code or share the direct link with recipients.
        </p>
      </div>

      {/* Main QR Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-6">
        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <QRCodeSVG
              value={fullRecipientUrl}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs font-medium text-slate-500 mt-4">
            Scan this code from another device
          </p>
        </div>

        {/* URL Box & Copy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
            <input
              type="text"
              readOnly
              value={fullRecipientUrl}
              className="bg-transparent text-xs sm:text-sm font-mono text-slate-800 flex-1 outline-none px-2 select-all overflow-ellipsis"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metadata summary & Expiration */}
        <div className="flex items-center justify-between py-3 px-4 bg-slate-50/70 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {drop.fileCount} {drop.fileCount === 1 ? 'file' : 'files'} · {formatBytes(drop.totalSize)}
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {countdownText}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <a
            href={api.getDownloadAllZipUrl(drop.token)}
            download
            className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-brand-600" />
            Download all as ZIP
          </a>

          <a
            href={fullRecipientUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-colors"
          >
            Preview recipient page <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleRevoke}
            disabled={isRevoking}
            className="w-full py-2.5 px-4 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            {isRevoking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Revoke drop
          </button>
        </div>
      </div>
    </div>
  );
};
