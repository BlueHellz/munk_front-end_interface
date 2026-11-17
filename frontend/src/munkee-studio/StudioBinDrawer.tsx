import { useState } from 'react';
import { Search, Folder, Video, Music, Image as ImageIcon, Box, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockBinAssets, type StudioBinAsset } from './munkee-studio-model';
import { Image } from '../components';

interface StudioBinDrawerProps {
    open: boolean;
    onToggle: () => void;
    onSelectAsset?: (asset: StudioBinAsset) => void;
}

export function StudioBinDrawer({ open, onToggle, onSelectAsset }: StudioBinDrawerProps) {
    const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'art' | '3d'>('all');
    const [search, setSearch] = useState('');

    const filtered = mockBinAssets.filter((item) => {
        const matchesKind = filter === 'all' || item.kind === filter;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase().trim());
        return matchesKind && matchesSearch;
    });

    if (!open) {
        return (
            <button className="bin-collapsed-bar" onClick={onToggle} title="Open Studio Bin Drawer">
                <Folder size={16} />
                <span>Studio Bin</span>
                <ChevronRight size={14} />
            </button>
        );
    }

    return (
        <aside className="studio-bin-sidebar">
            <div className="bin-header">
                <div className="bin-title">
                    <Folder size={16} className="text-electric" />
                    <h3>Studio Bin</h3>
                </div>
                <button className="bin-close-btn" onClick={onToggle} title="Collapse Bin">
                    <ChevronLeft size={16} />
                </button>
            </div>

            <div className="bin-search-box">
                <Search size={14} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search bin assets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bin-filter-pills">
                {[
                    ['all', 'All'],
                    ['video', 'Video'],
                    ['audio', 'Audio'],
                    ['art', 'Art'],
                    ['3d', '3D'],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        className={`bin-filter-pill ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key as any)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="bin-asset-grid">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="bin-asset-card"
                        draggable
                        onClick={() => onSelectAsset?.(item)}
                        title={`Click or drag ${item.name} onto canvas`}
                    >
                        <div className="asset-thumb">
                            <Image name={item.previewArt} alt={item.name} />
                            <span className="asset-type-icon">
                                {item.kind === 'video' ? <Video size={11} /> : item.kind === 'audio' ? <Music size={11} /> : item.kind === 'art' ? <ImageIcon size={11} /> : <Box size={11} />}
                            </span>
                        </div>
                        <div className="asset-info">
                            <span className="asset-filename">{item.name}</span>
                            <small>{item.size} · {item.updatedAt}</small>
                        </div>
                        <GripVertical size={14} className="drag-handle" />
                    </div>
                ))}
                {!filtered.length && (
                    <div className="bin-empty-state">
                        <small>No assets match this filter.</small>
                    </div>
                )}
            </div>
        </aside>
    );
}
