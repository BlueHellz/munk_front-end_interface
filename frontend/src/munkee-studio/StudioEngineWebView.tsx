import { useEffect, useRef, useState } from 'react';
import type { StudioCategory, StudioTab, StudioBinAsset } from './munkee-studio-model';

interface StudioEngineWebViewProps {
    category: StudioCategory;
    activeTab?: StudioTab;
    selectedAsset?: StudioBinAsset | null;
}

const GH_PAGES_BASE = 'https://bluehellz.github.io/munk_front-end_interface/studio-engines';

export function getEnginePathForTab(category: StudioCategory, tabTitle: string = ''): string {
    let folder = 'filmcraft';
    if (tabTitle.includes('Video Timeline') || tabTitle.includes('Editing')) folder = 'filmcraft';
    else if (tabTitle.includes('Motion') || tabTitle.includes('VFX')) folder = 'effectcraft';
    else if (tabTitle.includes('2D Animation') || tabTitle.includes('Animation')) folder = 'anicraft';
    else if (tabTitle.includes('Photo') || tabTitle.includes('Raster')) folder = 'photocraft';
    else if (tabTitle.includes('Vector') || tabTitle.includes('Logo')) folder = 'vectorcraft';
    else if (tabTitle.includes('RAW') || tabTitle.includes('Color')) folder = 'lightcraft';
    else if (tabTitle.includes('Print') || tabTitle.includes('Layout')) folder = 'designcraft';
    else if (tabTitle.includes('UI') || tabTitle.includes('Prototype')) folder = 'figcraft';
    else if (tabTitle.includes('Music') || tabTitle.includes('DAW') || tabTitle.includes('Audio Post') || tabTitle.includes('FX')) folder = 'soundcraft';
    else if (tabTitle.includes('Texture') || tabTitle.includes('Painter')) folder = 'texturecraft';
    else if (tabTitle.includes('PBR') || tabTitle.includes('Material')) folder = 'materialcraft';
    else if (category === 'art') folder = 'photocraft';
    else if (category === 'audio') folder = 'soundcraft';
    else if (category === '3d') folder = 'texturecraft';

    return `${GH_PAGES_BASE}/${folder}/index.html`;
}

export function StudioEngineWebView({ category, activeTab, selectedAsset }: StudioEngineWebViewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [hasError, setHasError] = useState(false);

    const engineUrl = getEnginePathForTab(category, activeTab?.title);

    // Bridge connection for asset injection
    useEffect(() => {
        if (selectedAsset && iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                { type: 'INJECT_ASSET', asset: selectedAsset },
                '*'
            );
        }
    }, [selectedAsset]);

    return (
        <div className="engine-webview-container" style={{ width: '100%', height: '100%', position: 'relative', background: '#181A1F' }}>
            <iframe
                ref={iframeRef}
                src={engineUrl}
                title={activeTab?.title || 'Studio Engine'}
                className="engine-iframe-viewport"
                allow="cross-origin-isolated; autoplay; microphone; clipboard-read; clipboard-write"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#181A1F',
                    display: 'block',
                }}
                onError={() => {
                    setHasError(true);
                    console.error(`[MunkeeStudio] Failed to load engine at live URL: ${engineUrl}`);
                }}
            />
        </div>
    );
}
