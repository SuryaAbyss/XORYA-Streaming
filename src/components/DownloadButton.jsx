import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/flow-hover-button';

/**
 * Download button — switches the player iframe to Rive's download page
 * so the download UI shows inside the player, not in a new tab.
 * Requires `onDownload` callback from VideoPlayer that switches the server.
 */
const DownloadButton = ({ onDownload }) => {
    return (
        <Button
            id="xorya-download-btn"
            onClick={onDownload}
            icon={<Download size={16} />}
        >
            Download
        </Button>
    );
};

export default DownloadButton;
