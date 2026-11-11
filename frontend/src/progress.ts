import { useState, useEffect, useRef } from 'react';
import { workById } from './fixtures';
export type Progress = {
    id: string;
    position: number;
    duration: number;
    updatedAt: number;
};
export const PROGRESS_KEY = 'munk-reading-watching-progress-v1';
export function isProgress(value: unknown): value is Progress[] { return Array.isArray(value) && value.length <= 100 && value.every(p => p && typeof p === 'object' && typeof p.id === 'string' && !!workById(p.id) && Number.isFinite(p.position) && p.position >= 0 && Number.isFinite(p.duration) && p.duration > 0 && p.position <= p.duration && Number.isFinite(p.updatedAt)); }
export function readProgress(): Progress[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
        return isProgress(value) ? value : [];
    }
    catch {
        return [];
    }
}
export function recordProgress(id: string, position: number, duration: number) {
    if (!workById(id) || !Number.isFinite(position) || !Number.isFinite(duration) || position < 0 || duration <= 0)
        return;
    try {
        const next = [...readProgress().filter(p => p.id !== id), { id, position: Math.min(position, duration), duration, updatedAt: Date.now() }].slice(-100);
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('munk-progress'));
    }
    catch { /* Progress is optional; never interrupt playback or article reading. */ }
}
export function useProgress() { const [items, setItems] = useState<Progress[]>(() => typeof window === 'undefined' ? [] : readProgress()); useEffect(() => { const update = () => setItems(readProgress()); window.addEventListener('munk-progress', update); window.addEventListener('storage', update); return () => { window.removeEventListener('munk-progress', update); window.removeEventListener('storage', update); }; }, []); return items.filter(p => p.position > 0 && p.position / p.duration < .97).sort((a, b) => b.updatedAt - a.updatedAt); }
export function useVideoProgress(id: string) {
    const last = useRef(0);
    return { onTimeUpdate: (video: HTMLVideoElement) => {
            if (Date.now() - last.current < 1000)
                return;
            last.current = Date.now();
            recordProgress(id, video.currentTime, video.duration);
        }, onPause: (video: HTMLVideoElement) => recordProgress(id, video.currentTime, video.duration), onLoadedMetadata: (video: HTMLVideoElement) => {
            if (new URLSearchParams(location.hash.split('?')[1]).get('resume') === '1') {
                const p = readProgress().find(p => p.id === id);
                if (p)
                    video.currentTime = Math.min(p.position, Math.max(0, video.duration - .1));
            }
        } };
}
