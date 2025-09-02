import { SyncedData, DropboxUser } from '../types';

const REDIRECT_URI = window.location.href.split('#')[0];
const DATA_FILE_PATH = '/jarvis_data.json';

// --- Authentication ---

/**
 * Initiates the Dropbox OAuth flow by opening a popup window.
 */
export const authorize = (clientId: string) => {
    if (!clientId) {
        throw new Error("Dropbox Client ID is not configured. Please set it in the settings.");
    }
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    const width = 600, height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const popup = window.open(authUrl, 'DropboxAuth', `width=${width},height=${height},top=${top},left=${left}`);
    
    // Check if the popup was blocked
    if (!popup || popup.closed || typeof popup.closed == 'undefined') {
        // Throw a specific error that the UI can catch and interpret.
        throw new Error("POPUP_BLOCKED");
    }
};

/**
 * Handles the OAuth redirect from Dropbox. This function should be called by the root
 * application component when it detects it has been loaded in a popup for authentication.
 * It parses the token from the URL hash and sends it to the main application window.
 */
export const handleOAuthRedirect = () => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    const error = params.get('error_description');

    if (window.opener) {
        window.opener.postMessage({ type: 'dropbox-auth-token', accessToken, error }, window.location.origin);
    }
};

// --- API Calls ---

/**
 * A generic helper function to make requests to the Dropbox API.
 */
const dropboxApiRequest = async (path: string, token: string, args: any, options: { contentType?: string, body?: any } = {}) => {
    const { contentType = 'application/json', body = null } = options;
    
    // The Dropbox API has two domains: one for metadata (api.dropboxapi.com)
    // and one for content (content.dropboxapi.com). We select the appropriate one.
    const domain = path.startsWith('/files/upload') || path.startsWith('/files/download')
        ? 'https://content.dropboxapi.com/2'
        : 'https://api.dropboxapi.com/2';

    const response = await fetch(`${domain}${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Dropbox-API-Arg': JSON.stringify(args),
            'Content-Type': contentType,
        },
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
            throw new Error('DROPBOX_TOKEN_EXPIRED');
        }
        throw new Error(`Dropbox API Error: ${response.status} ${errorText}`);
    }
    
    // For downloads, return the raw blob
    if (path === '/files/download') {
        return response.blob();
    }
    
    // For uploads or calls that return no content
    if (response.headers.get('content-length') === '0' || response.status === 204) {
        return {};
    }

    return response.json();
};

/**
 * Fetches the current user's profile information.
 */
export const getUserProfile = async (token: string): Promise<DropboxUser> => {
    const profile = await dropboxApiRequest('/users/get_current_account', token, null);
    return {
        name: profile.name.display_name,
        email: profile.email,
        // Provide a fallback avatar if the user doesn't have a profile photo
        imageUrl: profile.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name.display_name)}&background=2563eb&color=fff`,
    };
};

/**
 * Downloads the `jarvis_data.json` file from the user's Dropbox.
 */
export const getSyncedData = async (token: string): Promise<SyncedData | null> => {
    try {
        const blob = await dropboxApiRequest('/files/download', token, { path: DATA_FILE_PATH }, { contentType: 'application/octet-stream' });
        const text = await blob.text();
        return JSON.parse(text);
    } catch (error: any) {
        // If the file isn't found, that's not an error. It means we need to create it.
        if (error.message && error.message.includes("path/not_found")) {
            console.log("No sync file found in Dropbox. A new one will be created.");
            return null;
        }
        console.error("Error getting Dropbox sync data:", error);
        throw error;
    }
};

/**
 * Uploads the `jarvis_data.json` file to the user's Dropbox, overwriting the existing file.
 */
export const saveSyncedData = async (token: string, data: SyncedData): Promise<void> => {
    const content = JSON.stringify(data);
    const fileBlob = new Blob([content], { type: 'application/json' });

    const args = {
        path: DATA_FILE_PATH,
        mode: 'overwrite', // Overwrite the existing file
        autorename: false,
        mute: true, // Don't send a notification to the user
    };

    await dropboxApiRequest('/files/upload', token, args, { contentType: 'application/octet-stream', body: fileBlob });
    console.log("Data saved successfully to Dropbox.");
};

/**
 * Revokes the current access token, effectively logging the user out.
 */
export const revokeToken = async (token: string): Promise<void> => {
    try {
        await dropboxApiRequest('/auth/token/revoke', token, null);
        console.log("Dropbox token revoked.");
    } catch (error) {
        console.error("Failed to revoke Dropbox token:", error);
    }
};