import { works, houses, type Work, type HouseId } from './fixtures';
export const discoveryPresetName = 'MUNK Discovery';
export const editorialFeatures = ['the-long-way-home', 'tides-and-timing', 'a-quieter-notebook', 'city-to-forest', 'building-a-simpler-life'];
export const editorialFilms = ['building-a-simpler-life', 'tides-and-timing', 'city-to-forest', 'the-long-way-home', 'meeting-the-mountains', 'people-on-the-road', 'why-i-live-this-way'];
export const editorialWriting = ['a-quieter-notebook', 'on-tides-and-timing', 'a-slower-kind-of-morning', 'notes-from-the-road', 'back-to-the-trees', 'the-edge-of-everything', 'a-journal-at-the-pass', 'a-path-through-pines'];
export type Series = {
    id: string;
    title: string;
    houseId: HouseId;
    description: string;
    episodes: string[];
    art: string;
};
export const series: Series[] = [
    { id: 'road-less-travelled', title: 'The road less travelled', houseId: 'off-grid', description: 'Three fixture films from Maya’s mountain journey. Each episode plays the disclosed local sample.', episodes: ['meeting-the-mountains', 'people-on-the-road', 'why-i-live-this-way'], art: 'road' },
    { id: 'a-simpler-life', title: 'A simpler life', houseId: 'off-grid', description: 'A two-film fixture collection about making room for a slower life. Sample media only.', episodes: ['building-a-simpler-life', 'the-long-way-home'], art: 'campfire' }
];
export type DiscoveryCategory = 'All' | 'Films' | 'Writing' | 'Series' | 'Houses';
export function discover(query: string, category: DiscoveryCategory) { const q = query.trim().toLowerCase(); return { works: (category === 'Series' || category === 'Houses' ? [] : works.filter(w => (category === 'All' || w.kind === (category === 'Films' ? 'FILM' : 'ESSAY')) && `${w.title} ${w.summary} ${houses.find(h => h.id === w.houseId)!.name} ${houses.find(h => h.id === w.houseId)!.creator.name}`.toLowerCase().includes(q))), houses: category === 'All' || category === 'Houses' ? houses.filter(h => `${h.name} ${h.creator.name} ${h.creator.bio}`.toLowerCase().includes(q)) : [], series: category === 'All' || category === 'Series' ? series.filter(s => `${s.title} ${s.description}`.toLowerCase().includes(q)) : [] }; }
export function workArt(w: Work): string { return `work-${w.id}`; }
export const artPath = (id: string) => `/art/${id}.svg`;
