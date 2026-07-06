# No Trash Park HTML Sprite Export

Generated from the current HTML/CSS rendering without changing the original game source.

## Folders

- `current_1x`: exact current browser scale; one board tile is 70x70 px.
- `godot_1080p_1_5x`: suggested Godot 1920x1080 target scale; one board tile is 105x105 px.
- `source_2x`: higher-resolution source for repainting/reworking; one board tile is 140x140 px.

Each scale contains:

- `individual/<category>/*.png`: transparent PNGs, trimmed where useful.
- `sheets/*.png` and `sheets/*.json`: packed spritesheets with frame rectangles and pivots.
- `reference/board_<theme>.png`: full-board visual references for Park, Lagoon, and Fire/Lava.
- `manifest.json`: per-scale metadata.

## Godot Notes

Use `godot_1080p_1_5x` first for a Full HD port. Set TileSet tile size to `105x105` if using those tiles directly.

For pixel-style sharpness in Godot, import textures with nearest filtering, or set the project default texture filter to nearest.

For trimmed entity PNGs, the manifest's `pivotPx` is the anchor point measured from the PNG's top-left corner. `godotOffsetFromCenterPx` is useful if you use centered Sprite2D nodes and need to reproduce the browser alignment.

Tiles are not trimmed and can be dropped into a TileSet directly. Entity sprites are trimmed to preserve clean transparent bounds while keeping pivot metadata.
