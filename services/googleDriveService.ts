// NOTE TO USER: To enable this feature, you must create a Google Cloud Platform project,
// enable the Google Drive API, and create OAuth 2.0 credentials for a Web Application.
// The Client ID from those credentials must be set in the app's settings panel.

const API_KEY = process.env.API_KEY; // Needed for gapi discovery
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DATA_FILE_NAME = 'jarvis_data.json';

let tokenClient: any | null = null; // Using 'any' for google.accounts.oauth2.TokenClient
let gapiLoaded = false;
let gisInited = false;

export interface DriveUser {
    name: string;
    email: string;
    imageUrl: string;
}

// --- Initialization ---

export const initGoogleClient = (clientId: string, onGapiLoad: () => void) => {
    if (!clientId) {
        console.warn("Attempted to initialize Google Client without a Client ID.");
        return;
    }

    // Load GAPI for Drive API calls
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true;
    scriptGapi.defer = true;
    scriptGapi.onload = () => {
        window.gapi.load('client', async () => {
            await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            gapiLoaded = true;
            if (gisInited) onGapiLoad();
        });
    };
    document.body.appendChild(scriptGapi);

    // Load GIS for OAuth tokens
    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true;
    scriptGis.defer = true;
    scriptGis.onload = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: '', // Callback is set dynamically
        });
        gisInited = true;
        if (gapiLoaded) onGapiLoad();
    };
    document.body.appendChild(scriptGis);
};


// --- Authentication ---

export const signIn = (): Promise<any> => { // Using 'any' for google.accounts.oauth2.TokenResponse
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject(new Error("Google Client not initialized. Please set the Client ID in settings."));
        }
        tokenClient.callback = (resp: any) => {
            if (resp.error) {
                return reject(resp);
            }
            window.gapi.client.setToken(resp);
            resolve(resp);
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

export const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken(null);
            console.log('Google Drive token revoked.');
        });
    }
};

export const getUserProfile = async (): Promise<DriveUser> => {
    try {
        const response = await window.gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'GET',
        });
        const profile = response.result;
        return {
            name: profile.name,
            email: profile.email,
            imageUrl: profile.picture,
        };
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw new Error("Could not fetch user profile.");
    }
};


// --- File Operations ---

const getFileId = async (): Promise<string | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            pageSize: 10,
        });
        const file = response.result.files.find((f: any) => f.name === DATA_FILE_NAME);
        return file ? file.id : null;
    } catch (error) {
        console.error("Error listing files:", error);
        return null;
    }
};

export const getSyncedData = async (): Promise<any | null> => {
    const fileId = await getFileId();
    if (!fileId) {
        return null;
    }
    try {
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return JSON.parse(response.body);
    } catch (error) {
        console.error("Error getting file content:", error);
        return null;
    }
};

export const saveSyncedData = async (data: any): Promise<void> => {
    const fileId = await getFileId();
    const content = JSON.stringify(data);
    
    // Using multipart upload which is more robust
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
        name: DATA_FILE_NAME,
        mimeType: 'application/json',
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;

    const request = window.gapi.client.request({
        'path': `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
        'method': fileId ? 'PATCH' : 'POST',
        'params': { 'uploadType': 'multipart', 'parents': fileId ? undefined : ['appDataFolder'] },
        'headers': {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
    });
    
    return new Promise((resolve, reject) => {
        request.execute((file: any, err: any) => {
            if (err) {
                console.error("Error saving data to Drive:", err);
                reject(new Error("Failed to save data to Google Drive."));
            } else {
                console.log("Data saved successfully to Drive. File ID:", file.id);
                resolve();
            }
        });
    });
};