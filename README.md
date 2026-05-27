# No Trash Park

No Trash Park is a browser-based 2D tower-defense demo inspired by pixel-art
path defense games. The current build uses geometric CSS placeholders for
characters, towers, projectiles, and obstacles so final sprite art can be added
later without changing the core gameplay loop.

## Features

- Static HTML, CSS, and JavaScript demo.
- Pixel-style menu and in-game shop panel.
- Three themed biomes: Park, Lagoon, and Fire.
- Tower placement on valid map tiles.
- Enemy waves, projectiles, health bars, coins, lives, pause, and speed toggle.
- Victory flow after a configurable number of waves.
- Biome progression: Park -> Lagoon -> Fire.
- Final victory message after protecting all biomes.
- Windows/Xbox-style gamepad support through the browser Gamepad API.

## Run Locally

From this folder:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5173/index.html
```

The game is static, so no build step is required.

## Controls

- Click `Jogar` to start.
- Select a tower in the shop.
- Click a valid terrain tile to place the selected tower.
- Use `Pause` to pause or resume.
- Use `1x` / `2x` to change game speed.
- Use biome buttons to switch the current test map.
- Use `Reiniciar` to restart the current biome.

### Gamepad Controls

Most browsers expose a gamepad only after one controller button is pressed once.

- `D-pad` / left stick: move through menus or move the tile cursor.
- `A` / `RT`: confirm or place the selected tower.
- `B`: close the config panel or leave the victory screen for the menu.
- `LB` / `RB`: cycle tower selection.
- `X` / `Start`: pause or resume.
- `Y`: toggle `1x` / `2x` speed.
- `Back/View`: return to the menu during gameplay.

## Victory And Progression

The number of waves required to win a biome is controlled in `game.js`:

```js
const WAVES_TO_WIN = 3;
```

For testing, the current value is `3`. Increase it later, for example to `15`,
when the level pacing is ready.

When the player wins:

- Park victory shows `Parque Protegido!` and `Continuar` moves to Lagoon.
- Lagoon victory shows `Lagoa Protegida!` and `Continuar` moves to Fire.
- Fire victory shows `Parabens voce protegeu todos os biomas` and only offers
  `De novo!` and `Menu`.

## Project Structure

```text
.
|-- index.html       Main HTML structure and screens
|-- styles.css       Pixel-art styling, map themes, UI, and modal visuals
|-- game.js          Game state, waves, towers, enemies, and progression
|-- demo-preview.png Browser verification preview image
```

## Sprite Replacement Notes

Current entities are CSS placeholders:

- `.tower-*` classes represent tower types.
- `.enemy-*` classes represent enemy types.
- `.projectile-*` classes represent projectile visuals.
- Tile theme classes live under `.theme-park`, `.theme-lagoon`, and
  `.theme-lava`.

When final sprites are ready, these classes are the best places to replace
geometric shapes with image assets or sprite-sheet backgrounds.
