import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Cloud,
  FileText,
  FileArchive,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Shield,
  FileCode,
} from 'lucide-react';
import { openGooglePicker, PickedFile } from '../services/pickerApi';
import { getAccessToken, googleSignIn, initAuth, type User } from '../services/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface GooglePickerManagerProps {
  onImportScript?: (fileName: string, content: string) => void;
}

export const GooglePickerManager: React.FC<GooglePickerManagerProps> = ({
  onImportScript,
}) => {
  const [pickedFiles, setPickedFiles] = useLocalStorage<PickedFile[]>(
    'arch_wine_os_picked_files',
    []
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allowMultiSelect, setAllowMultiSelect] = useState(true);

  // File Preview State
  const [previewingFile, setPreviewingFile] = useState<PickedFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);

  const handleOpenPicker = async () => {
    setIsOpeningPicker(true);
    setPickerError(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (!res) {
          setIsOpeningPicker(false);
          return;
        }
        token = res.accessToken;
        setCurrentUser(res.user);
      }

      await openGooglePicker({
        token,
        title: 'Arch Wine OS - Select Files from Google Drive',
        allowMultiSelect,
        onPick: (newDocs) => {
          setIsOpeningPicker(false);
          if (newDocs.length === 0) return;

          setPickedFiles((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const fresh = newDocs.filter((f) => !existingIds.has(f.id));
            return [...fresh, ...prev];
          });
        },
        onCancel: () => {
          setIsOpeningPicker(false);
        },
        onError: (err) => {
          setIsOpeningPicker(false);
          setPickerError(
            err.message ||
              'Failed to display Google Picker. Please ensure popups and third-party cookies are allowed for Google accounts.'
          );
        },
      });
    } catch (err: any) {
      setIsOpeningPicker(false);
      setPickerError(err.message || 'An unexpected error occurred while launching Google Picker.');
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveFile = (id: string) => {
    setPickedFiles((prev) => prev.filter((f) => f.id !== id));
    if (previewingFile?.id === id) {
      setPreviewingFile(null);
      setPreviewContent(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all picked files from this session?')) {
      setPickedFiles([]);
      setPreviewingFile(null);
      setPreviewContent(null);
    }
  };

  const handleInspectFile = async (file: PickedFile) => {
    setPreviewingFile(file);
    setPreviewContent(null);
    setPreviewError(null);
    setIsLoadingPreview(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No active Google authentication token available. Please sign in.');
      }

      // Fetch file content using Drive v3 API alt=media
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          throw new Error(
            `Unable to download content (HTTP ${res.status}). Ensure the file was shared or uploaded with drive.file scope.`
          );
        }
        throw new Error(`Failed to read file content (HTTP ${res.status} ${res.statusText})`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (
        contentType.includes('application/zip') ||
        contentType.includes('octet-stream') ||
        file.name.endsWith('.iso') ||
        file.name.endsWith('.zip')
      ) {
        const buffer = await res.arrayBuffer();
        setPreviewContent(
          `[Binary Archive File: ${file.name}]\nSize: ${(buffer.byteLength / (1024 * 1024)).toFixed(
            2
          )} MB\nContent-Type: ${contentType}\n\nThis binary file is stored in Google Drive and can be downloaded or verified.`
        );
      } else {
        const text = await res.text();
        setPreviewContent(text.slice(0, 100000)); // Cap preview at 100k chars for UI speed
      }
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to inspect file content.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes || isNaN(bytes)) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileBadge = (name: string, mime: string) => {
    if (name.endsWith('.zip') || mime.includes('zip')) {
      return { label: 'ZIP Archive', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: FileArchive };
    }
    if (name.endsWith('.sh') || name.endsWith('.ps1') || name.endsWith('.conf')) {
      return { label: 'Script / Config', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: FileCode };
    }
    if (name.endsWith('.iso')) {
      return { label: 'ISO Image', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Layers };
    }
    return { label: mime.split('/').pop() || 'Drive Document', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: FileText };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Google Picker</span>
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Drive Client API
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Wählen und durchsuchen Sie Dateien, ISO-Kits, Skripte und Dokumente direkt aus Ihrem Google Drive
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Das Google Picker Widget ermöglicht die sichere Auswahl von Dateien aus Ihrem Google Drive über
              OAuth 2.0 (Scopes <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded text-[11px]">drive.file</code> und{' '}
              <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded text-[11px]">drive.metadata.readonly</code>
              ), ohne dass Entwickler-Keys im Browser exponiert werden.
            </p>
          </div>

          {/* Action Button & Options */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 select-none">
              <input
                type="checkbox"
                checked={allowMultiSelect}
                onChange={(e) => setAllowMultiSelect(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
              />
              <span>Mehrfachauswahl (Multiselect)</span>
            </label>

            <button
              type="button"
              onClick={handleOpenPicker}
              disabled={isOpeningPicker}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isOpeningPicker ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Google Picker wird geöffnet...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4" />
                  <span>Google Picker öffnen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Picker Error Alert */}
        {pickerError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-rose-200">Google Picker Fehler</div>
              <div className="text-slate-300 leading-relaxed">{pickerError}</div>
              <p className="text-[11px] text-slate-400 pt-1">
                Tipp: Vergewissern Sie sich, dass Pop-ups im Browser erlaubt sind und Sie mit Ihrem Google-Konto
                angemeldet sind.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Picked Files Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              Ausgewählte Dateien ({pickedFiles.length})
            </h3>
            {currentUser && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                • Angemeldet als: <span className="text-indigo-300">{currentUser.email}</span>
              </span>
            )}
          </div>

          {pickedFiles.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenPicker}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                + Weitere Dateien wählen
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Liste leeren
              </button>
            </div>
          )}
        </div>

        {pickedFiles.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Cloud className="w-8 h-8 text-slate-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-200">Noch keine Dateien ausgewählt</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Klicken Sie auf &bdquo;Google Picker öffnen&ldquo;, um ISO-Profile, ZIP-Backups, Bash-Skripte oder
                Dateien direkt aus Ihrem Google Drive auszuwählen.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenPicker}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Google Picker jetzt starten</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickedFiles.map((file) => {
              const badge = getFileBadge(file.name, file.mimeType);
              const BadgeIcon = badge.icon;
              const isInspected = previewingFile?.id === file.id;

              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                    isInspected
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 shrink-0 mt-0.5">
                        <BadgeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate font-mono" title={file.name}>
                          {file.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          {file.sizeBytes !== undefined && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatBytes(file.sizeBytes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Aus Liste entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {file.description && (
                    <p className="text-xs text-slate-400 italic line-clamp-2">{file.description}</p>
                  )}

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleInspectFile(file)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                          isInspected
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                        }`}
                        title="Dateiinhalt über Google Drive API einsehen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Vorschau / Inhalt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(file.url, file.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                        title="Google Drive Link kopieren"
                      >
                        {copiedId === file.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                    >
                      <span>In Drive öffnen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Inspector Modal / View */}
      {previewingFile && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">{previewingFile.name}</h4>
                <p className="text-xs text-slate-400">
                  Vorschau via Drive Media API ({formatBytes(previewingFile.sizeBytes)})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewingFile(null);
                  setPreviewContent(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>

          {isLoadingPreview && (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <div className="text-xs text-slate-400 font-medium">Lade Dateiinhalt aus Google Drive...</div>
            </div>
          )}

          {previewError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-200">Vorschau konnte nicht geladen werden</div>
                <div className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{previewError}</div>
              </div>
            </div>
          )}

          {previewContent && !isLoadingPreview && (
            <div className="space-y-3">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 max-h-96 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                {previewContent}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Google Drive File ID: {previewingFile.id}</span>
                <a
                  href={previewingFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center space-x-1"
                >
                  <span>Vollständig in neuem Tab öffnen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
