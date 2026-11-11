import { fictionalCatalog } from './fictional-catalog';
export type HouseId = 'off-grid' | 'the-margin' | 'field-notes' | 'signal-hill' | typeof fictionalCatalog[number]['id'];
export type Theme = {
    surface: 'ivory' | 'peach' | 'sage' | 'paper';
    font: 'classic' | 'literary' | 'modern';
    spacing: 'relaxed' | 'balanced' | 'tight';
    density: 'comfortable' | 'compact';
    columns: 2 | 3 | 4;
};
export const sectionIds = ['featured', 'new', 'conversations', 'watchlist', 'board', 'live'] as const;
export type SectionId = typeof sectionIds[number];
export const discoverySectionIds = ['featured', 'continue', 'films', 'writing', 'series', 'following', 'houses'] as const;
export type DiscoverySectionId = typeof discoverySectionIds[number];
export type HomeDesign = Theme & {
    schemaVersion?: 1;
    discoverySections?: DiscoverySectionId[];
    sections: SectionId[];
    layout?: 'classic' | 'discovery';
};
export const discoverySectionNames: Record<DiscoverySectionId, string> = { featured: 'Featured stories', continue: 'Continue watching & reading', films: 'Films', writing: 'Writing', series: 'Series', following: 'Followed Houses', houses: 'Discover Houses' };
export const getDiscoverySections = (design: HomeDesign): DiscoverySectionId[] => design.discoverySections ?? [...discoverySectionIds];
export const defaultDesign: HomeDesign = { surface: 'ivory', font: 'classic', spacing: 'balanced', density: 'comfortable', columns: 4, sections: ['featured', 'new', 'conversations', 'watchlist'] };
export const discoveryDesign: HomeDesign = { ...defaultDesign, layout: 'discovery' };
export const homePresets = [{ id: 'discovery', name: 'MUNK Discovery', design: discoveryDesign }, { id: 'classic', name: 'MUNK Classic', design: defaultDesign }] as const;
export type House = {
    id: HouseId;
    name: string;
    image: string;
    creator: {
        id: string;
        name: string;
        portrait: string;
        portraitPlaceholder: boolean;
        role: string;
        bio: string;
        introduction: {
            id: string;
            title: string;
            text: string;
        };
    };
    theme: Theme;
    tagline: string;
    featuredId: string;
    collectionIds: string[];
};
export const houses: House[] = [
    { id: 'off-grid', name: 'Off Grid', image: 'forestCamp', creator: { id: 'maya-laurent', name: 'Maya Laurent', portrait: 'creator', portraitPlaceholder: false, role: 'Filmmaker · Writer · Road dweller', bio: 'Films and field notes from a slower, wilder life. Real places. Real people. Always independent.', introduction: { id: 'welcome-off-grid', title: 'Welcome to Off Grid', text: 'I’m Maya. This House follows the road less travelled through independent films, mountain journeys and field notes.' } }, theme: { surface: 'ivory', font: 'classic', spacing: 'balanced', density: 'comfortable', columns: 4 }, tagline: 'A little space for the road less travelled.', featuredId: 'the-long-way-home', collectionIds: ['meeting-the-mountains', 'people-on-the-road', 'why-i-live-this-way'] },
    { id: 'the-margin', name: 'The Margin', image: 'coast', creator: { id: 'elias-reed', name: 'Elias Reed', portrait: 'elias-reed', portraitPlaceholder: true, role: 'Essayist · Coastal filmmaker', bio: 'Essays and films about coastlines, patient observation and the spaces between plans.', introduction: { id: 'welcome-the-margin', title: 'Welcome to The Margin', text: 'I’m Elias. Here I share coastal films and essays on tides, timing and making room for uncertainty.' } }, theme: { surface: 'paper', font: 'literary', spacing: 'relaxed', density: 'comfortable', columns: 2 }, tagline: 'Room for the things between the lines.', featuredId: 'tides-and-timing', collectionIds: ['tides-and-timing', 'on-tides-and-timing'] },
    { id: 'field-notes', name: 'Field Notes', image: 'notebook', creator: { id: 'nia-brooks', name: 'Nia Brooks', portrait: 'nia-brooks', portraitPlaceholder: true, role: 'Writer · Illustrator · Walker', bio: 'Handwritten observations, quiet notebooks and short essays collected one walk at a time.', introduction: { id: 'welcome-field-notes', title: 'Welcome to Field Notes', text: 'I’m Nia. This is a writing House for close observation, everyday walks and unfinished questions.' } }, theme: { surface: 'sage', font: 'literary', spacing: 'relaxed', density: 'comfortable', columns: 3 }, tagline: 'Small observations. A wider world.', featuredId: 'a-quieter-notebook', collectionIds: ['a-quieter-notebook', 'notes-from-the-road'] },
    { id: 'signal-hill', name: 'Signal Hill', image: 'forest', creator: { id: 'theo-park', name: 'Theo Park', portrait: 'theo-park', portraitPlaceholder: true, role: 'Filmmaker · Forest rambler', bio: 'Films about finding green space and a slower rhythm at the edge of city life.', introduction: { id: 'welcome-signal-hill', title: 'Welcome to Signal Hill', text: 'I’m Theo. Follow the paths from city streets to forest trails through my short films and written reflections.' } }, theme: { surface: 'peach', font: 'modern', spacing: 'tight', density: 'compact', columns: 3 }, tagline: 'Follow the signal back outside.', featuredId: 'city-to-forest', collectionIds: ['city-to-forest', 'back-to-the-trees'] }
];
export type Work = {
    id: string;
    kind: 'FILM' | 'ESSAY';
    title: string;
    houseId: HouseId;
    duration: string;
    image: string;
    summary: string;
    paragraphs?: string[];
    home?: boolean;
};
const articleText = (opening: string) => [opening, 'The smallest things become landmarks: the sound of rain, a path through the trees, a conversation that lasts longer than planned. These notes make room for those moments.', 'This is original fixture writing for the frontend review. It is not a published creator work.'];
export const works: Work[] = [
    { id: 'the-long-way-home', kind: 'FILM', title: 'The long way home', houseId: 'off-grid', duration: '8 sec sample', image: 'mountains', summary: 'A journey through mountains, small towns and the people who make a different kind of life possible.' },
    { id: 'building-a-simpler-life', kind: 'FILM', title: 'Building a simpler life', houseId: 'off-grid', duration: '8 sec sample', image: 'forestCamp', summary: 'A small camp and the people building a quieter life together.', home: true },
    { id: 'tides-and-timing', kind: 'FILM', title: 'Tides and timing', houseId: 'the-margin', duration: '8 sec sample', image: 'coast', summary: 'A coastal film about waiting for the right moment.', home: true },
    { id: 'a-quieter-notebook', kind: 'ESSAY', title: 'A quieter notebook', houseId: 'field-notes', duration: '1 min read', image: 'notebook', summary: 'Little observations from an open notebook.', paragraphs: articleText('Some mornings ask very little of us. A warm cup, an open notebook, and enough time to notice where we are.'), home: true },
    { id: 'city-to-forest', kind: 'FILM', title: 'City to forest', houseId: 'signal-hill', duration: '8 sec sample', image: 'forest', summary: 'Finding room to breathe beyond the city.', home: true },
    { id: 'meeting-the-mountains', kind: 'FILM', title: 'Meeting the mountains', houseId: 'off-grid', duration: '8 sec sample', image: 'forest', summary: 'A first trail into the mountains.' },
    { id: 'people-on-the-road', kind: 'FILM', title: 'People on the road', houseId: 'off-grid', duration: '8 sec sample', image: 'road', summary: 'Conversations from a journey without a timetable.' },
    { id: 'why-i-live-this-way', kind: 'FILM', title: 'Why I live this way', houseId: 'off-grid', duration: '8 sec sample', image: 'traveler', summary: 'Maya’s fixture reflection on travelling slowly.' },
    { id: 'a-slower-kind-of-morning', kind: 'ESSAY', title: 'A slower kind of morning', houseId: 'off-grid', duration: '1 min read', image: 'van', summary: 'Taking the morning as it comes.', paragraphs: articleText('The van stayed parked this morning. There was nowhere more important to be than here.') },
    { id: 'a-journal-at-the-pass', kind: 'ESSAY', title: 'A journal at the pass', houseId: 'off-grid', duration: '1 min read', image: 'notebook', summary: 'A page from the mountains.', paragraphs: articleText('At the mountain pass I stopped to write down the names of places I wanted to remember.') },
    { id: 'a-path-through-pines', kind: 'ESSAY', title: 'A path through pines', houseId: 'off-grid', duration: '1 min read', image: 'forest', summary: 'A quiet trail after the rain.', paragraphs: articleText('After the rain, the path through the pines smelled of wet earth and the promise of another clear morning.') },
    { id: 'notes-from-the-road', kind: 'ESSAY', title: 'Notes from the road', houseId: 'field-notes', duration: '1 min read', image: 'notebook', summary: 'Pages gathered between destinations.', paragraphs: articleText('A notebook makes a good travelling companion: patient, quiet, and always ready for a detour.') },
    { id: 'back-to-the-trees', kind: 'ESSAY', title: 'Back to the trees', houseId: 'signal-hill', duration: '1 min read', image: 'forest', summary: 'The path beyond the last street.', paragraphs: articleText('The noise of the city faded before the last houses disappeared behind the trees.') },
    { id: 'the-edge-of-everything', kind: 'ESSAY', title: 'The edge of everything', houseId: 'off-grid', duration: '1 min read', image: 'cliff', summary: 'A note from the coast.', paragraphs: articleText('At the edge of the land, the horizon feels like the beginning of something rather than its end.') },
    { id: 'on-tides-and-timing', kind: 'ESSAY', title: 'On tides and timing', houseId: 'the-margin', duration: '1 min read', image: 'coast', summary: 'The ocean has a way of reminding us that not everything needs to be rushed.', paragraphs: articleText('The tide does not hurry because I am late. That may be the most useful lesson the shore has taught me.') }
];
// Expanded catalog: every House and its works have independent IDs/ownership.
for (const [index, entry] of fictionalCatalog.entries()) {
    const writingOnly = index % 4 === 3;
    const firstId = `${entry.id}-first-light`, secondId = `${entry.id}-notebook`;
    const portrait = `art:portrait-${entry.id}`;
    houses.push({ id: entry.id, name: entry.name, image: `art:${entry.id}`, creator: {
            id: entry.creator.toLowerCase().replaceAll(' ', '-'), name: entry.creator, portrait, portraitPlaceholder: true,
            role: `Fictional ${entry.topic} creator`, bio: `${entry.creator} is a fictional creator exploring ${entry.topic}. ${entry.tagline} Original local fixture writing and artwork; no real creator or publication is represented.`,
            introduction: { id: `welcome-${entry.id}`, title: `Welcome to ${entry.name}`, text: `I’m ${entry.creator.split(' ')[0]}, the fictional host of ${entry.name}. This demo House brings together ${entry.topic} stories. No welcome video or verified identity is supplied.` }
        }, theme: { surface: ['ivory', 'peach', 'paper', 'sage'][index % 4] as Theme['surface'], font: ['classic', 'literary', 'modern'][index % 3] as Theme['font'], spacing: index % 2 ? 'relaxed' : 'balanced', density: index % 2 ? 'compact' : 'comfortable', columns: (index % 3 + 2) as 2 | 3 | 4 }, tagline: entry.tagline, featuredId: firstId, collectionIds: [firstId, secondId] });
    works.push({ id: firstId, kind: writingOnly ? 'ESSAY' : 'FILM', title: entry.title, houseId: entry.id, duration: writingOnly ? '1 min read' : '8 sec sample', image: `art:work-${firstId}`, summary: `A fictional ${entry.topic} story by ${entry.creator}. ${entry.tagline}`, ...(writingOnly ? { paragraphs: articleText(`${entry.creator.split(' ')[0]} opens a notebook on ${entry.topic}. ${entry.tagline}`) } : {}) }, { id: secondId, kind: 'ESSAY', title: entry.second, houseId: entry.id, duration: '1 min read', image: `art:work-${secondId}`, summary: `Original fixture reflections on ${entry.topic} from ${entry.name}.`, paragraphs: articleText(`At ${entry.name}, even a small detail can become a story. ${entry.tagline}`) });
}
// Sharp, work-specific original artwork on content pages as well as discovery.
for (const house of houses)
    house.image = `art:${house.id}`;
for (const work of works)
    work.image = `art:work-${work.id}`;
export type Post = {
    id: string;
    houseId: HouseId;
    text: string;
    createdAt: number;
    images?: string[];
    workId?: string;
    likes: string[];
};
export const posts: Post[] = [
    { id: 'morning-light', houseId: 'off-grid', text: 'Morning light in the high country. This is why we keep going.', createdAt: 3, images: ['boardMountain', 'sunrise'], workId: 'the-long-way-home', likes: ['fixture-reader-1', 'fixture-reader-2'] },
    { id: 'tides-and-letting-go', houseId: 'the-margin', text: 'A short essay on tides, timing and letting go. Sometimes the best plan is no plan.', createdAt: 5, workId: 'on-tides-and-timing', likes: ['fixture-reader-1', 'fixture-reader-2', 'fixture-reader-3'] }
];
export type Comment = {
    id: string;
    target: string;
    parent?: string;
    author: string;
    text: string;
    likes: string[];
};
export const initialComments: Comment[] = [
    { id: 'video-c1', target: 'the-long-way-home', author: 'Viewer 2891', text: 'This film really captures what it means to choose a slower life. It’s the people that make it special.', likes: ['fixture-reader-1'] },
    { id: 'video-c2', target: 'the-long-way-home', author: 'Viewer 772A', text: 'That final scene at the pass gave me chills. A reminder to keep going.', likes: [] },
    { id: 'video-c3', target: 'the-long-way-home', parent: 'video-c2', author: 'Viewer 2891', text: 'Completely agree. It felt like a new beginning. 🌄', likes: [] },
    { id: 'board-c1', target: 'tides-and-letting-go', author: 'Viewer 2891', text: 'Beautifully written. This resonates with me a lot.', likes: ['fixture-reader-2'] },
    { id: 'board-c2', target: 'tides-and-letting-go', parent: 'board-c1', author: 'Viewer 772A', text: 'Same here. The sea has a way of resetting everything.', likes: [] }
];
export function asset(name: string) { if (name.startsWith('art:'))
    return `/art/${name.slice(4)}.svg`; return `/assets/${name}.${['elias-reed', 'nia-brooks', 'theo-park'].includes(name) ? 'svg' : 'png'}`; }
export const houseById = (id: string) => houses.find(h => h.id === id);
export const workById = (id: string) => works.find(w => w.id === id);
export const postById = (id: string) => posts.find(p => p.id === id);
export const workPath = (w: Work) => `#/${w.kind === 'FILM' ? 'videos' : 'articles'}/${w.id}`;
