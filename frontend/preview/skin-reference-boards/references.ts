export type Screen='home'|'browse'|'details'|'settings';
export const pins={
 ah2:{name:'Arctic Horizon 2',version:'0.8.30~nexus',sha:'5668ff2bc9ef4bcbef72cb53e1f54e0b98e3bf5d',repo:'jurialmunkey/skin.arctic.horizon.2',note:'Pinned archived main snapshot. The four bundled screenshots are one browsing composition with alternate background treatments—not four different screens.'},
 silvo:{name:'Aeon Nox: SiLVO',version:'9.0.1 · Nexus',sha:'4bc10d4c0464831ddb748fae9ddd4dabe445d3d5',repo:'MikeSiLVO/skin.aeon.nox.silvo',note:'One pinned Nexus snapshot matching the visible v9.0.1 Settings reference. The supplied Omega listing is newer; it is not mixed into this board. Bundled promotional images can predate the package; a screenshot does not independently prove runtime version.'}
};
export const screens:Screen[]=['home','browse','details','settings'];
export const references:Record<'ah2'|'silvo',Record<Screen,{file:string|null;path:string;caption:string;adaptation:string}>>={
 ah2:{
 home:{file:null,path:'1080i/Home.xml; Includes_Home.xml',caption:'MISSING: no version-confirmed Home screenshot or inspectable walkthrough frame found. Home XML supports multiple menu/widget configurations; selecting one by imagination would be a guess.',adaptation:'Withheld pending a matching visual reference. The approved default Home is not used as an AH2 substitute.'},
 browse:{file:'ah2/extras/screenshots/classic.jpg',path:'extras/screenshots/classic.jpg',caption:'Actual bundled classic browsing image. Title/metadata upper left; broad artwork background; selected poster strip in lower half; restrained footer.',adaptation:'Translate the information zone, horizontal poster strip, rounded selection outline and footer. Use MUNK typography, ivory/peach surfaces and blue selection, without ratings/codecs that MUNK does not supply.'},
 details:{file:null,path:'1080i/DialogVideoInfo.xml',caption:'MISSING visual reference. Source confirms separate information/menu controls, default focus and left/right groups; it does not substitute for visually inspecting their rendered arrangement.',adaptation:'Withheld. No generic Cinema details screen is substituted.'},
 settings:{file:null,path:'1080i/Settings.xml; SettingsCategory.xml',caption:'MISSING visual reference. Settings.xml redirects to InterfaceSettings; SettingsCategory.xml defines category and control navigation. The rendered screen has not been verified visually.',adaptation:'Withheld. Do not transplant the default Estuary Settings screen into this skin.'}
 },
 silvo:{
 home:{file:'silvo-901/resources/screenshots/screenshot-02.jpg',path:'resources/screenshots/screenshot-02.jpg',caption:'Actual bundled lower horizontal text-menu configuration, captured April 6, 2023. This configuration is used consistently; the vertical and icon-menu variants are not combined with it.',adaptation:'Keep the expansive background and lower horizontal network navigation band. Map destinations to Home, Catalogue, Exchange, Houses, Board, Extensions and Saved. Use compact MUNK utilities without weather, RSS or local-library statistics.'},
 browse:{file:'silvo-901/resources/screenshots/screenshot-12.jpg',path:'resources/screenshots/screenshot-12.jpg',caption:'Actual filmstrip browsing capture from April 6, 2023: selected-work information above a low poster strip; large backdrop to the right.',adaptation:'Keep the selected-work information/filmstrip hierarchy. Use actual catalog fields when available; do not invent ratings, viewed badges, codec flags or library counts.'},
 details:{file:'silvo-901/resources/screenshots/screenshot-11.jpg',path:'resources/screenshots/screenshot-11.jpg',caption:'Actual bundled media-information example. Source at this pin confirms a 720/1920-width artwork pane and a 1200/1920-width information pane. This promotional image has no independently visible capture version/date.',adaptation:'Keep the 37.5% artwork / 62.5% information split, metadata rows and horizontal action band. Use title, House, creator, duration and description; omit budget, box office, ratings and unsupported actions.'},
 settings:{file:'silvo-901/resources/screenshots/screenshot-06.jpg',path:'resources/screenshots/screenshot-06.jpg',caption:'Actual Skin Settings → Help capture, visibly labeled v9.0.1 / Kodi Nexus, April 6, 2023. This is a category/detail reference, not a claim that Kodi’s system hub is the same screen.',adaptation:'Keep the inset category rail, information/control pane and bottom brand line. Map to MUNK’s six Settings categories, with Profile owning account/security and creator access.'}
 }
};
export const coverage=[
 ['Home','No verified visual; source-only Home/Includes_Home inspected.','screenshot-02; Home.xml; one horizontal-menu configuration.'],
 ['Browsing','classic.jpg; flixart/blur/keyart inspected as background variants, not new screens.','screenshot-12; filmstrip configuration.'],
 ['Search','Custom_1114_Search.xml inspected; no pinned visual found.','script-globalsearch.xml inspected; no pinned visual found.'],
 ['Media details','DialogVideoInfo.xml inspected; rendered visual missing.','screenshot-11 + pinned DialogVideoInfo.xml split geometry.'],
 ['Settings','Settings.xml / SettingsCategory.xml inspected; rendered visual missing.','screenshot-06; pinned SkinSettings.xml / SettingsCategory.xml.'],
 ['Dialogs','DialogSelect.xml and DialogKeyboard.xml inspected; visual missing.','DialogSelect.xml / DialogKeyboard.xml inspected; screenshot-07 exists in bundled set but is not used as a substitute for a selection/security dialog.'],
 ['Navigation','Source supports horizontal/vertical Home menus and focus directions; configuration visually unverified.','Chosen horizontal Home configuration; category rail and details focus behavior inspected.']
];
