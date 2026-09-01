/**
 * Google Drive REST API & OAuth 2.0 Service for XORYA Streaming Watchlist Sync
 */

const BACKUP_FILENAME = 'xorya_watchlist_backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';

// Load Google Identity Services (GIS) SDK dynamically
export function loadGisScript() {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) {
            resolve(window.google.accounts.oauth2);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google?.accounts?.oauth2) {
                resolve(window.google.accounts.oauth2);
            } else {
                reject(new Error('Google Identity Services SDK failed to load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK script'));
        document.head.appendChild(script);
    });
}

/**
 * Prompt user for OAuth authorization and return Access Token
 */
export async function requestGoogleToken(clientId) {
    const oauth2 = await loadGisScript();

    return new Promise((resolve, reject) => {
        const client = oauth2.initTokenClient({
            client_id: clientId,
            scope: DRIVE_SCOPE,
            callback: (response) => {
                if (response.error) {
                    reject(new Error(response.error_description || response.error));
                    return;
                }
                resolve({
                    accessToken: response.access_token,
                    expiresIn: response.expires_in,
                });
            },
            error_callback: (err) => {
                reject(new Error(err.message || 'OAuth authorization failed'));
            }
        });

        client.requestAccessToken();
    });
}

/**
 * Fetch User Info (Name, Email, Picture)
 */
export async function fetchUserInfo(accessToken) {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * Find existing backup file in Google Drive AppData or Root Folder
 */
async function findBackupFileId(accessToken) {
    const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder,drive&fields=files(id, name, modifiedTime)`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to search Google Drive files (${res.status})`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }

    return null;
}

/**
 * Download Backup JSON from Google Drive
 */
export async function downloadBackupFromDrive(accessToken) {
    const fileId = await findBackupFileId(accessToken);
    if (!fileId) return null;

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to download backup file (${res.status})`);
    }

    const backupData = await res.json();
    return {
        fileId,
        data: backupData
    };
}

/**
 * Upload or Update Backup JSON in Google Drive
 */
export async function uploadBackupToDrive(accessToken, watchlistData) {
    const fileId = await findBackupFileId(accessToken);

    const fileMetadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json',
    };

    const payload = JSON.stringify({
        version: '1.0',
        updatedAt: Date.now(),
        tiers: watchlistData.tiers,
        entries: watchlistData.entries,
    }, null, 2);

    if (fileId) {
        // Update existing file
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        const res = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: payload
        });

        if (!res.ok) {
            throw new Error(`Failed to update backup file on Google Drive (${res.status})`);
        }

        const result = await res.json();
        return { fileId: result.id, timestamp: Date.now() };
    } else {
        // Create new file via multipart upload
        fileMetadata.parents = ['appDataFolder'];

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', new Blob([payload], { type: 'application/json' }));

        const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let res = await fetch(createUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form
        });

        if (!res.ok) {
            delete fileMetadata.parents;
            const fallbackForm = new FormData();
            fallbackForm.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            fallbackForm.append('file', new Blob([payload], { type: 'application/json' }));

            res = await fetch(createUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: fallbackForm
            });
        }

        if (!res.ok) {
            throw new Error(`Failed to create backup file on Google Drive (${res.status})`);
        }

        const result = await res.json();
        return { fileId: result.id, timestamp: Date.now() };
    }
}
