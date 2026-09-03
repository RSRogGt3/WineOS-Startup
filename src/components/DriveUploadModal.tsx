import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  HardDrive,
  Copy,
  Check,
  X,
  FileArchive,
  RefreshCw,
  FolderUp,
} from 'lucide-react';
import { DriveUploadResponse, DriveFileItem, listUploadedKits } from '../services/driveApi';

interface DriveUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => Promise<DriveUploadResponse>;
  fileName: string;
  fileSizeEstimate?: string;
  isUploading: boolean;
  uploadResult: DriveUploadResponse | null;
  error: string | null;
}

export const DriveUploadModal: React.FC<DriveUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  fileName,
  fileSizeEstimate,
  isUploading,
  uploadResult,
  error,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [recentUploads, setRecentUploads] = useState<DriveFileItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecentFiles();
    }
  }, [isOpen, uploadResult]);

  const loadRecentFiles = async () => {
    setLoadingRecent(true);
    try {
      const items = await listUploadedKits();
      setRecentUploads(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Google Drive Backup</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Google API
                </span>
              </h3>
              <p className="text-xs text-slate-400">Direktes Speichern der ISO-Konfigurations-ZIP in Google Drive</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* File Card Info */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white font-mono">{fileName}</div>
                <div className="text-[11px] text-slate-400">
                  Archiso Profile, Pakete, Systemd-Units & Setup-Skripte
                  {fileSizeEstimate ? ` • ${fileSizeEstimate}` : ''}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                .ZIP
              </span>
            </div>
          </div>

          {/* Success Result Box */}
          {uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Erfolgreich in Google Drive hochgeladen!</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Datei-Name:</span>
                  <span className="font-mono text-white text-[11px]">{uploadResult.name}</span>
                </div>
                {uploadResult.id && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Drive-ID:</span>
                    <span className="font-mono text-slate-400 text-[11px] truncate max-w-[220px]">
                      {uploadResult.id}
                    </span>
                  </div>
                )}
              </div>

              {uploadResult.webViewLink && (
                <div className="pt-2 flex items-center space-x-2">
                  <a
                    href={uploadResult.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>In Google Drive öffnen</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(uploadResult.webViewLink!)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
                    title="Link kopieren"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-200">Upload fehlgeschlagen</div>
                <div className="text-slate-300 text-[11px] leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {/* Explanation note */}
          {!uploadResult && !error && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Drive Integration</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Beim Klick auf &bdquo;Jetzt nach Google Drive hochladen&ldquo; wird ein sicheres OAuth 2.0 Token über Ihr Google-Konto verwendet. Die ZIP-Datei wird direkt in Ihr Google Drive Stammverzeichnis übertragen und steht auf all Ihren Geräten bereit.
              </p>
            </div>
          )}

          {/* Recent Uploads from Drive list */}
          {recentUploads.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Zuletzt hochgeladene ISO-Kits in Google Drive
                </span>
                {loadingRecent && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentUploads.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileArchive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-slate-200 font-mono text-[11px] truncate">{file.name}</span>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center space-x-1 shrink-0 ml-2 font-medium"
                      >
                        <span>Öffnen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>

          <button
            type="button"
            onClick={onUpload}
            disabled={isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Wird hochgeladen...</span>
              </>
            ) : (
              <>
                <FolderUp className="w-4 h-4" />
                <span>{uploadResult ? 'Erneut hochladen' : 'Jetzt in Google Drive hochladen'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
