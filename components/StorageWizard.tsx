import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Folder, File as FileIcon, Upload, Eye, Download } from "lucide-react";
import { DriveIcon, CloseIcon, DropboxIcon } from './Icons';
import type { ThemeSettings } from '../types';

// Helper functions for localStorage
const saveToken = (key: string, token: string) => localStorage.setItem(key, token);
const getToken = (key: string) => localStorage.getItem(key);

// Interface for a cloud file
interface CloudFile {
  id: string;
  path: string; // Add path for Dropbox operations
  name: string;
  type: "file" | "folder";
  source: "dropbox" | "google";
}

interface StorageWizardProps {
    onClose: () => void;
    themeSettings: ThemeSettings;
}

const StorageWizard: React.FC<StorageWizardProps> = ({ onClose, themeSettings }) => {
  const [dropboxToken, setDropboxToken] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDropboxToken(getToken("dropbox_token"));
    setGoogleToken(getToken("google_token"));
  }, []);

  // --- AUTHENTICATION ---
  // Using the original, SPA-friendly auth flows

  const connectDropbox = async () => {
    setError(null);
    if (!themeSettings.dropboxClientId) {
        setError("Dropbox Client ID is not configured in settings.");
        return;
    }
    try {
        const { DropboxAuth } = await import("dropbox");
        const auth = new DropboxAuth({ clientId: themeSettings.dropboxClientId });
        const url = await auth.getAuthenticationUrl(window.location.origin + "/redirect.html", undefined, 'token');
        window.open(url.toString(), "dropboxAuth", "width=800,height=600");
    } catch (e) {
        setError("An error occurred with Dropbox authentication. Check the console for details.");
        console.error(e);
    }
  };

  const connectGoogle = async () => {
    setError(null);
    if (!themeSettings.googleApiKey || !themeSettings.googleClientId) {
        setError("Google API Key or Client ID is not configured in settings.");
        return;
    }
    try {
        const { gapi } = await import("gapi-script");
        gapi.load("client:auth2", () => {
            gapi.client
            .init({
                apiKey: themeSettings.googleApiKey,
                clientId: themeSettings.googleClientId,
                scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file",
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            })
            .then(() => {
                const authInstance = gapi.auth2.getAuthInstance();
                if (!authInstance.isSignedIn.get()) {
                    authInstance.signIn().then((user: any) => {
                        const token = user.getAuthResponse().access_token;
                        saveToken("google_token", token);
                        setGoogleToken(token);
                    });
                } else {
                    const token = authInstance.currentUser.get().getAuthResponse().access_token;
                    saveToken("google_token", token);
                    setGoogleToken(token);
                }
            });
        });
    } catch(e) {
        setError("An error occurred with Google authentication. Check the console for details.");
        console.error(e);
    }
  };
  
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
            }
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- FILE OPERATIONS ---
  
  const listFiles = async () => {
    setIsLoading(true);
    setError(null);
    setFiles([]); // Clear previous files
    
    const newFiles: CloudFile[] = [];

    // Dropbox
    try {
        if (dropboxToken) {
            const { Dropbox } = await import("dropbox");
            const dbx = new Dropbox({ accessToken: dropboxToken });
            const res = await dbx.filesListFolder({ path: "" });
            const mapped: CloudFile[] = res.result.entries.map((f: any) => ({
                id: f.id, name: f.name, path: f.path_lower,
                type: f[".tag"] === "folder" ? "folder" : "file",
                source: "dropbox",
            }));
            newFiles.push(...mapped);
        }
    } catch (e: any) {
        setError(`Dropbox token might be expired. Please reconnect.`);
        console.error(e);
    }

    // Google Drive
    try {
         if (googleToken) {
            const res = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType)", {
                headers: { Authorization: `Bearer ${googleToken}` }
            });
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
         setError(`Google Drive token might be expired. Please reconnect.`);
         console.error(e);
    }
    
    setFiles(newFiles);
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        let uploaded = false;
        if (googleToken) { // Prioritize Google Drive for uploads
            const form = new FormData();
            form.append("metadata", new Blob([JSON.stringify({ name: file.name, parents: ['root'] })], { type: "application/json" }));
            form.append("file", file);
            await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
                method: "POST",
                headers: { Authorization: `Bearer ${googleToken}` },
                body: form,
            });
            uploaded = true;
        } else if (dropboxToken) {
            const { Dropbox } = await import("dropbox");
            const dbx = new Dropbox({ accessToken: dropboxToken });
            await dbx.filesUpload({ path: `/${file.name}`, contents: file });
            uploaded = true;
        }

        if (uploaded) {
            await listFiles(); // Refresh file list
        } else {
            setError("Connect a storage provider to upload files.");
        }
      } catch (e) {
        setError("File upload failed. Check permissions and token validity.");
        console.error(e);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };
  
  const previewFile = async (file: CloudFile) => {
    setError(null);
    try {
        if (file.source === "dropbox" && dropboxToken) {
            const { Dropbox } = await import("dropbox");
            const dbx = new Dropbox({ accessToken: dropboxToken });
            const link = await dbx.filesGetTemporaryLink({ path: file.path });
            window.open(link.result.link, "_blank");
        } else if (file.source === "google" && googleToken) {
            setPreviewUrl(`https://drive.google.com/file/d/${file.id}/preview`);
        }
    } catch (e) {
        setError("Could not get file preview link.");
        console.error(e);
    }
  };

  const downloadFile = async (file: CloudFile) => {
    setError(null);
    try {
        if (file.source === "dropbox" && dropboxToken) {
            const { Dropbox } = await import("dropbox");
            const dbx = new Dropbox({ accessToken: dropboxToken });
            const { result } = await dbx.filesDownload({ path: file.path });
            const blob = (result as any).fileBlob;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else if (file.source === "google" && googleToken) {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { Authorization: `Bearer ${googleToken}` }
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    } catch (e) {
        setError("Could not download file.");
        console.error(e);
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
            <button onClick={connectDropbox} className="px-4 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 transition-all flex items-center justify-center gap-2">
                <DropboxIcon className="w-5 h-5"/> {dropboxToken ? "Dropbox Linked" : "Link Dropbox"}
            </button>
            <button onClick={connectGoogle} className="px-4 py-2 bg-green-600/20 rounded-lg hover:bg-green-600/40 border border-green-500/50 text-green-300 transition-all flex items-center justify-center gap-2">
                <DriveIcon className="w-5 h-5"/> {googleToken ? "Drive Linked" : "Link Google Drive"}
            </button>
        </div>
        
        {error && <div className="p-2 text-center bg-red-900/50 text-red-300 rounded-md text-sm">{error}</div>}

        <div className="flex-1 bg-panel/50 border border-primary-t-20 rounded-lg p-3 min-h-0 flex flex-col">
            <div className="flex justify-between items-center mb-2 flex-shrink-0 gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
                <button onClick={() => fileInputRef.current?.click()} disabled={(!dropboxToken && !googleToken) || isLoading} className="flex-1 text-xs px-3 py-1.5 rounded-md bg-primary-t-50 hover:bg-primary-t-80 flex items-center justify-center gap-2 disabled:opacity-50">
                    <Upload size={14}/> Upload
                </button>
                <button onClick={listFiles} disabled={(!dropboxToken && !googleToken) || isLoading} className="flex-1 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
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
                                <button onClick={() => previewFile(f)} className="p-1 bg-indigo-600/50 rounded-md hover:bg-indigo-500/80" title="Preview"><Eye size={14}/></button>
                                <button onClick={() => downloadFile(f)} className="p-1 bg-teal-600/50 rounded-md hover:bg-teal-500/80" title="Download"><Download size={14}/></button>
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