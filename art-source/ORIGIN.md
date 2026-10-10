# Building artwork origin

The user supplied `Build_City_26_Art_Pack.zip`, containing the complete
`Build_City_26_Building_Art` package. Its README and `PROMPTS_TAO_ANH.json` identify
newly generated original reference illustrations for Build City 26. No game
assets were extracted. The package does not include an independent third-party
license grant; retain this provenance and the supplied metadata rather than
inventing a license. Original PNGs, manifest, hashes, QA reports and instructions
are retained unchanged here. `SHA256.json` verifies the 24 atlas + 4 UI originals.

The 24 alpha WebP derivatives in `public/art/buildings/` are same-dimension,
quality-84 UI resources made from these PNGs. See `scripts/prepare-building-art.py`
(Python + Pillow). Frames are copied verbatim, not divided into a uniform grid.

Actual 3D/Canvas models and SVG icons are original code in this repository,
reconstructed to the game's existing metre footprints from the supplied visual
references. They are not GLB files or screenshots pasted onto cubes. Occupancy,
vehicles, service outcomes, stock and money continue to come from simulation.
Inactive reference templates are kept as references, not sold as fake facilities.
The bitmap thumbnails may contain decorative vehicles; those pixels are never
simulation entities. No runtime AI request or paid asset-loading service is used.
