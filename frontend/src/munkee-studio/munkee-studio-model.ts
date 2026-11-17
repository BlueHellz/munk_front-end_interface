export type StudioCategory = 'editing' | 'art' | 'audio' | '3d';

export interface StudioCategoryMeta {
    id: StudioCategory;
    title: string;
    description: string;
    icon: string;
    defaultTabs: string[];
}

export const studioCategories: StudioCategoryMeta[] = [
    {
        id: 'editing',
        title: 'Editing',
        description: 'Video timeline, motion graphics, and 2D animation',
        icon: 'clapperboard',
        defaultTabs: ['Video Timeline', 'Motion & VFX', '2D Animation'],
    },
    {
        id: 'art',
        title: 'Art',
        description: 'Raster, vector graphics, RAW color, and UI layouts',
        icon: 'palette',
        defaultTabs: ['Photo & Raster', 'Vector & Logo', 'RAW & Color', 'Print & Layout', 'UI & Prototype'],
    },
    {
        id: 'audio',
        title: 'Audio',
        description: 'DAW music production and post-audio FX',
        icon: 'waveform',
        defaultTabs: ['Music & DAW', 'Audio Post & FX'],
    },
    {
        id: '3d',
        title: '3D',
        description: 'Texture painting and PBR materials',
        icon: 'cube3d',
        defaultTabs: ['Texture Painter', 'PBR Materials'],
    },
];

export interface StudioTab {
    id: string;
    title: string;
    category: StudioCategory;
    isDirty?: boolean;
}

export interface StudioWindowInstance {
    id: string;
    category: StudioCategory;
    title: string;
    tabs: StudioTab[];
    activeTabId: string;
    isMinimized: boolean;
    isMaximized: boolean;
    binOpen: boolean;
    position?: { x: number; y: number };
}

export interface StudioBinAsset {
    id: string;
    name: string;
    kind: 'video' | 'audio' | 'art' | '3d';
    size: string;
    updatedAt: string;
    previewArt: string;
}

export const mockBinAssets: StudioBinAsset[] = [
    { id: 'asset-1', name: 'clip_01_4k.mp4', kind: 'video', size: '142 MB', updatedAt: '2 mins ago', previewArt: 'art:mountains' },
    { id: 'asset-2', name: 'beat_v1_stems.wav', kind: 'audio', size: '38 MB', updatedAt: '10 mins ago', previewArt: 'art:campfire' },
    { id: 'asset-3', name: 'cover_art_v2.png', kind: 'art', size: '12 MB', updatedAt: '1 hour ago', previewArt: 'art:coast' },
    { id: 'asset-4', name: 'metal_pbr_material.zip', kind: '3d', size: '85 MB', updatedAt: '3 hours ago', previewArt: 'art:notebook' },
    { id: 'asset-5', name: 'intro_sequence_draft.mp4', kind: 'video', size: '210 MB', updatedAt: 'Yesterday', previewArt: 'art:road' },
    { id: 'asset-6', name: 'ambient_pad_loop.wav', kind: 'audio', size: '24 MB', updatedAt: 'Yesterday', previewArt: 'art:forest' },
    { id: 'asset-7', name: 'vector_logo_mark.svg', kind: 'art', size: '1.2 MB', updatedAt: '2 days ago', previewArt: 'art:off-grid' },
    { id: 'asset-8', name: 'character_rig_v3.fbx', kind: '3d', size: '64 MB', updatedAt: '3 days ago', previewArt: 'art:signal-hill' },
];
