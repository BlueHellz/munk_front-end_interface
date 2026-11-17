import { useState } from 'react';
import { ArrowLeft, X, Clapperboard, Palette, Activity, Box, Minimize2 } from 'lucide-react';
import { studioCategories, type StudioCategory, type StudioWindowInstance, type StudioCategoryMeta } from './munkee-studio-model';
import { StudioWindow } from './StudioWindow';
import DefaultClock from '../default-ui/DefaultClock';
import { MunkLogo } from '../brand/MunkLogo';
import './munkee-studio.css';

export function MunkeeStudioIcon({ className = '' }: { className?: string }) {
    return <img src="/assets/film-palette.svg" alt="Munkee Studio" className={`munkee-studio-vector-icon ${className}`} />;
}

export default function MunkeeStudio() {
    const [windows, setWindows] = useState<StudioWindowInstance[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

    const openCategoryWindow = (cat: StudioCategoryMeta) => {
        const existing = windows.find((w) => w.category === cat.id);
        if (existing) {
            setWindows((prev) =>
                prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: false } : w))
            );
            setActiveWindowId(existing.id);
            return;
        }

        const newWin: StudioWindowInstance = {
            id: `win-${cat.id}-${Date.now()}`,
            category: cat.id,
            title: cat.title,
            tabs: cat.defaultTabs.map((t, idx) => ({
                id: `tab-${cat.id}-${idx}`,
                title: t,
                category: cat.id,
            })),
            activeTabId: `tab-${cat.id}-0`,
            isMinimized: false,
            isMaximized: false,
            binOpen: true,
        };

        setWindows((prev) => [...prev, newWin]);
        setActiveWindowId(newWin.id);
    };

    const closeWindow = (windowId: string) => {
        setWindows((prev) => prev.filter((w) => w.id !== windowId));
        if (activeWindowId === windowId) {
            const remaining = windows.filter((w) => w.id !== windowId);
            setActiveWindowId(remaining.length ? remaining[remaining.length - 1].id : null);
        }
    };

    const toggleMinimizeWindow = (windowId: string) => {
        setWindows((prev) =>
            prev.map((w) => (w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w))
        );
    };

    const toggleMaximizeWindow = (windowId: string) => {
        setWindows((prev) =>
            prev.map((w) => (w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w))
        );
    };

    const switchTab = (windowId: string, tabId: string) => {
        setWindows((prev) =>
            prev.map((w) => (w.id === windowId ? { ...w, activeTabId: tabId } : w))
        );
    };

    const toggleBin = (windowId: string) => {
        setWindows((prev) =>
            prev.map((w) => (w.id === windowId ? { ...w, binOpen: !w.binOpen } : w))
        );
    };

    const activeWindow = windows.find((w) => w.id === activeWindowId && !w.isMinimized);
    const minimizedWindows = windows.filter((w) => w.isMinimized);

    const exitStudio = () => {
        if (typeof window !== 'undefined') {
            window.location.hash = '#/home';
        }
    };

    return (
        <div className="munkee-studio-page">
            {/* Top Workspace Header (Matches Settings Screen Header in MUNK) */}
            <header className="munkee-studio-header">
                <div className="header-left-title">
                    <button className="back-arrow-btn" onClick={exitStudio} aria-label="Go back to Home">
                        <ArrowLeft size={18} />
                    </button>

                    <div className="header-icon-title">
                        <MunkeeStudioIcon className="studio-header-icon" />
                        <h1>Munkee Studio</h1>
                    </div>
                </div>

                <div className="header-right-tools">
                    <div className="munk-blue-logo-wrap">
                        <MunkLogo variant="wordmark" />
                    </div>

                    <div className="studio-clock-wrap">
                        <DefaultClock />
                    </div>

                    <button className="header-close-btn" onClick={exitStudio} aria-label="Close Munkee Studio">
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* Main Workspace Stage */}
            <div className="munkee-studio-stage">
                {/* Active Multi-Window View or Category Launcher */}
                {activeWindow ? (
                    <div className="windows-viewport-layer">
                        <StudioWindow
                            key={activeWindow.id}
                            window={activeWindow}
                            onCloseWindow={closeWindow}
                            onMinimizeWindow={toggleMinimizeWindow}
                            onMaximizeWindow={toggleMaximizeWindow}
                            onSwitchTab={switchTab}
                            onToggleBin={toggleBin}
                        />
                    </div>
                ) : (
                    /* Category Launcher Screen (Matching 2x2 Grid Reference Image) */
                    <div className="munkee-launcher-screen">
                        <div className="launcher-grid-2x2">
                            {studioCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    className="category-launcher-card"
                                    onClick={() => openCategoryWindow(cat)}
                                >
                                    <div className="card-icon-frame">
                                        {cat.id === 'editing' ? (
                                            <Clapperboard size={36} strokeWidth={1.5} />
                                        ) : cat.id === 'art' ? (
                                            <Palette size={36} strokeWidth={1.5} />
                                        ) : cat.id === 'audio' ? (
                                            <Activity size={36} strokeWidth={1.5} />
                                        ) : (
                                            <Box size={36} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <h3>{cat.title}</h3>
                                </button>
                            ))}
                        </div>

                        <p className="launcher-subtitle-text">
                            Select a creative studio to launch your workspace.
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Minimized Windows Dock Bar */}
            {minimizedWindows.length > 0 && (
                <div className="minimized-windows-dock">
                    <div className="dock-label">
                        <Minimize2 size={13} />
                        <span>Docked Windows</span>
                    </div>
                    <div className="dock-items-row">
                        {minimizedWindows.map((w) => (
                            <button
                                key={w.id}
                                className="dock-item-pill"
                                onClick={() => {
                                    setWindows((prev) =>
                                        prev.map((item) => (item.id === w.id ? { ...item, isMinimized: false } : item))
                                    );
                                    setActiveWindowId(w.id);
                                }}
                            >
                                <span className="dock-cat-dot"></span>
                                <span>{w.title} Studio</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
