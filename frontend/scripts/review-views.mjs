export const devices=[['desktop',1440,1024],['tablet',768,1024],['mobile',390,844]];
// 24 requested views × three viewports. Predicates validate the actual current UI.
export const views=[
 ['discovery','/home?preset=discovery',"document.querySelector('.network-home .discovery')&&document.querySelector('#network-search')&&document.querySelectorAll('.discovery-feature-grid .discovery-tile').length===5"],
 ['exchange-mosaic','/home?tab=exchange&view=mosaic',"document.querySelector('.exchange-view')?.dataset.view==='mosaic'&&document.querySelectorAll('.house-mosaic-tile').length===20"],
 ['exchange-comparison','/home?tab=exchange&view=comparison',"document.querySelector('.exchange-view')?.dataset.view==='comparison'&&document.querySelectorAll('.exchange-card').length===20"],
 ['market-off-grid','/home?tab=exchange&view=mosaic&market=off-grid',"document.querySelector('.exchange-market')&&document.querySelector('[role=dialog]')?.textContent.includes('Off Grid · sample market preview')"],
 ['house-off-grid','/houses/off-grid',"document.querySelector('.house-page')?.dataset.house==='off-grid'&&document.querySelector('[data-intro-id=welcome-off-grid]')"],
 ['video','/videos/the-long-way-home',"document.querySelector('.video-title h1')?.textContent==='The long way home'&&document.querySelector('video source')?.getAttribute('src')==='/media/munk-sample.webm'"],
 ['board','/board',"document.querySelector('.board-page')&&document.querySelectorAll('[data-post]').length===2"],
 ['article','/articles/a-quieter-notebook',"document.querySelector('.reader h1')?.textContent==='A quieter notebook'"],
 ['thread','/board/posts/morning-light',"document.querySelector('[data-post=morning-light]')&&document.querySelectorAll('[data-post]').length===1"],
 ['creator-house-create','/create/house',"document.querySelector('[data-creator-view=house-setup]')&&document.querySelector('main h1')?.textContent==='Create a House'"],
 ['creator-introduction','/create/house',"document.querySelector('input[type=file]')&&document.querySelector('.creator-steps [aria-current=step]')?.textContent.includes('2.')"],
 ['creator-admission','/create/house',"document.querySelector('.requirements')&&document.querySelector('[data-protected-intro]')"],
 ['creator-overview','/creator/overview',"document.querySelector('[data-creator-panel=overview]')"],
 ['creator-library','/creator/library',"document.querySelector('[data-content-library]')"],
 ['creator-uploads','/creator/uploads',"document.querySelector('[data-upload-queue]')"],
 ['creator-house-design','/creator/design',"document.querySelector('[data-house-designer]')&&document.querySelector('[data-protected-intro]')"],
 ['creator-settings','/creator/settings',"document.querySelector('[data-creator-panel=settings]')"],
 ['creator-community','/creator/community',"document.querySelector('[data-creator-panel=community]')"],
 ['creator-house-preview','/creator/house-preview',"document.querySelector('[data-house-preview]')"],
 ['creator-video-editor','/creator/videos/review-video',"document.querySelector('[data-creator-view=video-editor]')"],
 ['creator-video-preview','/creator/videos/review-video/preview',"document.querySelector('[data-creator-view=video-preview] video')"],
 ['creator-article-editor','/creator/articles/review-article',"document.querySelector('[data-article-body]')"],
 ['creator-article-preview','/creator/articles/review-article/preview',"document.querySelector('[data-private-content] .article-paragraph')"],
 ['interface-designer','/home',"document.querySelector('[role=dialog]')?.getAttribute('aria-label')==='Make yourself at Home'&&document.querySelector('.home-preset-picker')"]
];
export const fixtureView=view=>view.startsWith('creator-')||view==='interface-designer';
