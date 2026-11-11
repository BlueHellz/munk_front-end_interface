# Asset provenance and remaining substitutions

Authoritative visual reference: `design-reference.png`. All layouts, text, forms, overlays and controls are components; the screenshot is never used as an application background.

The MUNK wordmark and nineteen small PNG artwork/portrait areas were extracted from the supplied reference with `scripts/extract-assets.mjs`. The wordmark crop preserves its shapes but is raster with a pale background and CSS multiply blending. Photos have low resolution and different framing at large sizes. Maya Laurent’s fixture retains the supplied reference portrait.

Elias Reed (The Margin), Nia Brooks (Field Notes) and Theo Park (Signal Hill) have original SVG monogram assets, explicitly labeled “Portrait placeholder.” Their fixture names, biographies and introductions are distinct; Maya’s identity is not reused for them. Original face portraits and all actual creator introduction videos are unavailable.

Typography uses system Arial/Helvetica, Georgia/Times New Roman and Brush Script MT/Segoe Script/cursive; exact original fonts and handwritten lettering remain unavailable. Lucide supplies approximate SVG icons. No new external image services are required.

The local `public/media/munk-sample.webm` is an original procedural sunrise/mountain animation, generated without reference images or third-party footage. It is eight seconds, 480×270, 6 fps, VP8/WebM and silent. A VTT caption track describes the sample. All film fixtures intentionally share it and explicitly state that it is not creator footage. Media and captions are CC0; see `public/media/LICENSE.txt` and `scripts/create-sample.mjs`.

No rendered comparison claim is made. Browser capture is blocked at the local listener in this environment; native media control styling and responsive wrapping require ordinary-browser review.

## Focused visual correction pass

No higher-resolution original reference photographs were found in the supplied workspace. Existing crops and composition have been retained, with no upscaling represented as additional detail. `review/visual-corrections/asset-inventory.json` records every current crop's native pixel dimensions and explicitly records zero photo replacements. Full-resolution source photography remains missing, as do three creator face portraits.

The handwritten film/banner/poster treatment now uses one shared lightweight system-font stack. On Macs with Noteworthy Light installed, it is selected via local font lookup, at weight 300 with normal style. Other systems fall back to Segoe Script, Snell Roundhand or cursive. No proprietary font file was copied or bundled. This remains a font substitution, not a claim that the reference font has been identified.

Default article surfaces now use the network's orange/ivory palette and classic typography. An explicit reader control can apply the owning House's alternate theme, without changing either the network default or the House configuration.
