import {frontendRoot,projectRoot,reviewRoot,artifactsRoot,viteEntry} from './paths.mjs';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('public/assets', { recursive: true });
// Isolated artwork only. All layouts, text, controls and overlays are HTML/CSS.
const crops = {
  wordmark: [48, 12, 145, 30],
  mountains: [910, 328, 202, 59],
  mountainBanner: [1090, 211, 290, 40],
  camp: [576, 227, 154, 61],
  forestCamp: [155, 355, 137, 67],
  coast: [303, 355, 137, 67],
  notebook: [450, 355, 140, 67],
  forest: [599, 355, 138, 67],
  traveler: [40, 410, 86, 77],
  creator: [922, 98, 172, 97],
  van: [910, 487, 138, 54],
  cliff: [1365, 487, 134, 54],
  road: [1317, 390, 57, 29],
  sunrise: [392, 683, 177, 66],
  boardMountain: [207, 683, 179, 66],
  video: [1108, 625, 230, 96],
  avatar: [164, 69, 18, 18],
  viewer: [923, 826, 23, 23],
  viewer2: [923, 874, 23, 23],
};
for (const [name,[left,top,width,height]] of Object.entries(crops)) {
 execFileSync('sips', ['--cropToHeightWidth', String(height), String(width), '--cropOffset', String(top), String(left), 'design-reference.png', '--out', `public/assets/${name}.png`]);
}
