import { useState } from 'react';
import {
    Minus, Square, Copy, X, Save, Upload,
    CheckCircle2, Folder
} from 'lucide-react';
import type { StudioWindowInstance, StudioBinAsset } from './munkee-studio-model';
import { StudioBinDrawer } from './StudioBinDrawer';
import { StudioEngineWebView } from './StudioEngineWebView';

interface StudioWindowProps {
    window: StudioWindowInstance;
    onCloseWindow: (windowId: string) => void;
    onMinimizeWindow: (windowId: string) => void;
    onMaximizeWindow: (windowId: string) => void;
    onSwitchTab: (windowId: string, tabId: string) => void;
    onToggleBin: (windowId: string) => void;
}

export function StudioWindow({
    window: win,
    onCloseWindow,
    onMinimizeWindow,
    onMaximizeWindow,
    onSwitchTab,
    onToggleBin,
}: StudioWindowProps) {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<StudioBinAsset | null>(null);

    const activeTab = win.tabs.find((t) => t.id === win.activeTabId) || win.tabs[0];

    const triggerSave = () => {
        setToastMessage(`Draft saved to munkee_studio/user/${activeTab?.title.toLowerCase().replace(/\s+/g, '_')}_draft.json`);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const triggerPublishModal = () => {
        setShowPublishModal(true);
    };

    return (
        <div className={`studio-window-container ${win.isMaximized ? 'maximized' : ''}`}>
            {/* Top Window Frame */}
            <div className="window-chrome-bar">
                {/* Left: Window Title / Category Indicator */}
                <div className="window-category-indicator">
                    <span className="category-tag">{win.category.toUpperCase()} STUDIO</span>
                </div>

                {/* Center: Fixed Clean Tab Strip (No X buttons, No + button) */}
                <div className="browser-tab-strip">
                    {win.tabs.map((tab) => {
                        const isActive = tab.id === win.activeTabId;
                        return (
                            <div
                                key={tab.id}
                                className={`browser-tab ${isActive ? 'active' : ''}`}
                                onClick={() => onSwitchTab(win.id, tab.id)}
                            >
                                <span className="tab-title-text">{tab.title}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Window Frame Controls (Minimize, Maximize, Close) */}
                <div className="window-frame-controls">
                    <button
                        className="win-btn"
                        onClick={() => onMinimizeWindow(win.id)}
                        title="Minimize"
                    >
                        <Minus size={14} />
                    </button>
                    <button
                        className="win-btn"
                        onClick={() => onMaximizeWindow(win.id)}
                        title={win.isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {win.isMaximized ? <Copy size={12} /> : <Square size={12} />}
                    </button>
                    <button
                        className="win-btn close"
                        onClick={() => onCloseWindow(win.id)}
                        title="Close Window"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Window Sub-Header Action Bar: Studio Bin Toggle & Two-Step Save/Publish */}
            <div className="window-action-bar">
                <div className="bar-left">
                    <button
                        className={`bin-toggle-btn ${win.binOpen ? 'active' : ''}`}
                        onClick={() => onToggleBin(win.id)}
                    >
                        <Folder size={15} />
                        <span>Studio Bin</span>
                    </button>
                </div>

                <div className="bar-right-two-step">
                    <button className="save-btn-outline" onClick={triggerSave}>
                        <Save size={14} />
                        <span>Save</span>
                    </button>

                    <button className="publish-btn-electric" onClick={triggerPublishModal}>
                        <Upload size={14} />
                        <span>Publish</span>
                    </button>
                </div>
            </div>

            {/* Main Window Workspace Body */}
            <div className="window-workspace-body">
                {/* Collapsible Studio Bin Sidebar */}
                <StudioBinDrawer
                    open={win.binOpen}
                    onToggle={() => onToggleBin(win.id)}
                    onSelectAsset={(asset) => {
                        setSelectedAsset(asset);
                        setToastMessage(`Injected ${asset.name} into active ${activeTab?.title} engine viewport`);
                        setTimeout(() => setToastMessage(null), 3500);
                    }}
                />

                {/* WebAssembly / WebGPU Hardware-Accelerated Engine Viewport */}
                <main className="studio-canvas-area">
                    <StudioEngineWebView
                        category={win.category}
                        activeTab={activeTab}
                        selectedAsset={selectedAsset}
                    />
                </main>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="studio-toast-banner" role="status">
                    <CheckCircle2 size={16} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Two-Step Publish Modal */}
            {showPublishModal && (
                <div className="publish-modal-backdrop" onClick={() => setShowPublishModal(false)}>
                    <div className="publish-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Publish to House Catalog</h3>
                            <button className="modal-close" onClick={() => setShowPublishModal(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>You are preparing to publish <strong>{activeTab?.title || win.title}</strong> to your House channel.</p>
                            <div className="publish-summary-box">
                                <div><small>Category</small><strong>{win.category.toUpperCase()}</strong></div>
                                <div><small>Engine Tab</small><strong>{activeTab?.title}</strong></div>
                                <div><small>Export Target</small><strong className="text-electric">munkee_studio/user/export</strong></div>
                            </div>
                            <p className="publish-note">
                                This action generates your compiled export manifest. Final network publication requires a House owner sign-off.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-cancel-btn" onClick={() => setShowPublishModal(false)}>Cancel</button>
                            <button className="modal-publish-confirm" onClick={() => {
                                setShowPublishModal(false);
                                setToastMessage(`Published ${activeTab?.title} export manifest to House channel!`);
                                setTimeout(() => setToastMessage(null), 3500);
                            }}>
                                Confirm & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
