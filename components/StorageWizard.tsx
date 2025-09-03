import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Folder, File as FileIcon, Upload, Eye, Download, Sparkles, XCircle } from "lucide-react";
import { DriveIcon, CloseIcon, DropboxIcon } from './Icons';
import type { ThemeSettings } from '../types';

// Helper functions for localStorage
const saveToken = (key: string, token: string) => localStorage.setItem(key, token);
const getToken = (key: string) => localStorage.getItem(key);
const removeToken = (key: string) => localStorage.removeItem(key);

// Interface for a cloud file
interface CloudFile {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  source: "dropbox" | "google";
}

interface StorageWizardProps {
    onClose: () => void;
    themeSettings: ThemeSettings;
    onAnalyzeFile: (fileName: string, fileContent: string) => void;
    onNavigateToIntegrations: () => void;
}

const StorageWizard: React.FC<StorageWizardProps> = ({ onClose, themeSettings, onAnalyzeFile, onNavigateToIntegrations }) => {
  const [dropboxToken, setDropboxToken] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ dropbox: string; google: string }>({ dropbox: '', google: 'root' });
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listFiles = useCallback(async (
    dbxToken: string | null = dropboxToken,
    gglToken: string | null = googleToken
  ) => {
    setIsLoading(true);
    setError(null);
    setFiles([]); // Clear previous files
    
    const newFiles: CloudFile[] = [];

    // Dropbox
    try {
        if (dbxToken) {
            const { Dropbox } = await import("dropbox");
            const dbx = new Dropbox({ accessToken: dbxToken });
            const res = await dbx.filesListFolder({ path: currentPath.dropbox });
            const mapped: CloudFile[] = res.result.entries.map((f: any) => ({
                id: f.id, name: f.name, path: f.path_lower,
                type: f[".tag"] === "folder" ? "folder" : "file",
                source: "dropbox",
            }));
            newFiles.push(...mapped);
        }
    } catch (e: any) {
        if(e.status === 401) {
             setError(`Dropbox token has expired. Please reconnect.`);
             setDropboxToken(null);
             removeToken("dropbox_token");
        } else {
             setError(`Dropbox error: ${e.message}`);
        }
        console.error(e);
    }

    // Google Drive
    try {
         if (gglToken) {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${currentPath.google}' in parents&pageSize=50&fields=files(id,name,mimeType)`, {
                headers: { Authorization: `Bearer ${gglToken}` }
            });
            if (res.status === 401) {
                setError(`Google Drive token has expired. Please reconnect.`);
                setGoogleToken(null);
                removeToken("google_token");
                throw new Error('Token expired');
            }
            if (!res.ok) throw new Error(`Google API responded with ${res.status}`);
            const data = await res.json();
            const mapped: CloudFile[] = data.files.map((f: any) => ({
                id: f.id, name: f.name, path: f.id,
                type: f.mimeType === "application/vnd.google-apps.folder" ? "folder" : "file",
                source: "google",
            }));
            newFiles.push(...mapped);
        }
    } catch (e: any) {
         if (!error) setError(`Google Drive error: ${e.message}`);
         console.error(e);
    }
    
    setFiles(newFiles.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, error]);

  useEffect(() => {
    setDropboxToken(getToken("dropbox_token"));
    setGoogleToken(getToken("google_token"));
  }, []);

  // OAuth redirect handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'oauth-token' && event.data.hash) {
            const params = new URLSearchParams(event.data.hash.substring(1));
            const token = params.get('access_token');
            if (token) {
                saveToken("dropbox_token", token);
                setDropboxToken(token);
                listFiles(token, googleToken);
            }
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleToken, listFiles]);
  
  const disconnectDropbox = () => {
    removeToken("dropbox_token");
    setDropboxToken(null);
    setFiles(f => f.filter(file => file.source !== 'dropbox'));
  };

  const disconnectGoogle = () => {
    removeToken("google_token");
    setGoogleToken(null);
    setFiles(f => f.filter(file => file.source !== 'google'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { /* as before */ };
  
  const previewFile = async (file: CloudFile) => { /* as before */ };

  const downloadFile = async (file: CloudFile) => { /* as before */ };
  
  const analyzeFile = async (file: CloudFile) => {
    setIsLoading(true);
    setError(null);
    try {
        let content: string | null = null;
        if (file.source === "dropbox" && dropboxToken) {
            const { Dropbox } = await import("dropbox");
            const dbx = new Dropbox({ accessToken: dropboxToken });
            const { result } = await dbx.filesDownload({ path: file.path });
            content = await (result as any).fileBlob.text();
        } else if (file.source === "google" && googleToken) {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { Authorization: `Bearer ${googleToken}` }
            });
            if (!res.ok) throw new Error('Failed to download from Google Drive.');
            content = await res.text();
        }
        if (content) {
            onAnalyzeFile(file.name, content);
        } else {
            throw new Error("Could not retrieve file content.");
        }
    } catch (e) {
        setError("Could not analyze file. It might be too large or not a text file.");
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <>
    <div className="holographic-panel flex flex-col h-full animate-slide-in-right">
      <div className="flex justify-between items-center panel-title !mb-4">
          <div className="flex items-center gap-3">
              <DriveIcon className="w-6 h-6 text-primary"/>
              <h2 className="!m-0 !p-0 !border-none">Cloud Storage</h2>
          </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200">
              <CloseIcon className="w-6 h-6" />
          </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
                <button
                    onClick={!dropboxToken ? onNavigateToIntegrations : undefined}
                    disabled={!!dropboxToken}
                    className="w-full px-4 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <DropboxIcon className="w-5 h-5"/> {dropboxToken ? "Dropbox Linked" : "Link Dropbox"}
                </button>
                {dropboxToken && <button onClick={disconnectDropbox} className="absolute -top-1 -right-1 p-0.5 bg-red-600 rounded-full text-white"><XCircle size={16}/></button>}
            </div>
            <div className="relative">
                 <button
                    onClick={!googleToken ? onNavigateToIntegrations : undefined}
                    disabled={!!googleToken}
                    className="w-full px-4 py-2 bg-green-600/20 rounded-lg hover:bg-green-600/40 border border-green-500/50 text-green-300 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                 >
                    <DriveIcon className="w-5 h-5"/> {googleToken ? "Drive Linked" : "Link Google Drive"}
                </button>
                {googleToken && <button onClick={disconnectGoogle} className="absolute -top-1 -right-1 p-0.5 bg-red-600 rounded-full text-white"><XCircle size={16}/></button>}
            </div>
        </div>
        
        {error && <div className="p-2 text-center bg-red-900/50 text-red-300 rounded-md text-sm">{error}</div>}

        <div className="flex-1 bg-panel/50 border border-primary-t-20 rounded-lg p-3 min-h-0 flex flex-col">
            <div className="flex justify-between items-center mb-2 flex-shrink-0 gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
                <button onClick={() => fileInputRef.current?.click()} disabled={(!dropboxToken && !googleToken) || isLoading} className="flex-1 text-xs px-3 py-1.5 rounded-md bg-primary-t-50 hover:bg-primary-t-80 flex items-center justify-center gap-2 disabled:opacity-50">
                    <Upload size={14}/> Upload
                </button>
                <button onClick={() => listFiles(dropboxToken, googleToken)} disabled={(!dropboxToken && !googleToken) || isLoading} className="flex-1 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                    {isLoading ? 'Loading...' : 'Refresh All'}
                </button>
            </div>
            {files.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center text-text-muted text-center p-4">
                    <p>{isLoading ? 'Accessing cloud drives...' : 'Connect a service and refresh to see files.'}</p>
                 </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 gap-2 max-h-full overflow-y-auto styled-scrollbar -mr-2 pr-2">
                    {files.map((f) => (
                    <div key={f.id} className="p-2 bg-slate-800/80 rounded-lg flex flex-col items-center border border-slate-700/50 group">
                        {f.type === "folder" ? <Folder className="w-8 h-8 text-sky-400"/> : <FileIcon className="w-8 h-8 text-slate-400" />}
                        <p className="mt-1 text-xs text-center truncate w-full" title={f.name}>{f.name}</p>
                        <span className="text-[10px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded-full" style={{ color: 'white', backgroundColor: f.source === 'dropbox' ? '#0061ff' : '#1da564' }}>{f.source}</span>
                        {f.type === 'file' && (
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => analyzeFile(f)} className="p-1.5 bg-amber-600/50 rounded-md hover:bg-amber-500/80" title="Analyze with J.A.R.V.I.S."><Sparkles size={14}/></button>
                                <button onClick={() => previewFile(f)} className="p-1.5 bg-indigo-600/50 rounded-md hover:bg-indigo-500/80" title="Preview"><Eye size={14}/></button>
                                <button onClick={() => downloadFile(f)} className="p-1.5 bg-teal-600/50 rounded-md hover:bg-teal-500/80" title="Download"><Download size={14}/></button>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>

    {previewUrl && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in-fast"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="holographic-panel w-full max-w-4xl h-[80vh] flex flex-col relative">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 p-1 bg-red-600/80 text-white rounded-full z-10 hover:bg-red-500/80"
              aria-label="Close preview"
            >
              <CloseIcon className="w-6 h-6"/>
            </button>
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-lg border-none bg-white"
              title="File Preview"
            />
          </div>
        </motion.div>
      )}
    </>
  );
};

export default StorageWizard;