# No Trash Park

No Trash Park is a browser-based 2D tower-defense demo inspired by pixel-art
path defense games. The current build uses geometric CSS placeholders for
characters, towers, projectiles, and obstacles.

## Features

- Static HTML, CSS, and JavaScript demo.
- Pixel-style menu and in-game shop panel.
- Menu version label driven by `GAME_VERSION` in `src/constants.js`.
- Four themed biomes: Park, Lagoon, Fire, and Halloween.
- Tower placement on valid map tiles.
- Five-second undo window after placing a tower.
- Shop delete mode for selecting and removing placed towers.
- Enemy waves, projectiles, health bars, coins, lives, pause, and speed toggle.
- Background music per screen and biome, with fade transitions.
- Projectile throw sound effect when towers fire.
- Enemy defeat sound effect when a tower kill happens.
- Victory flow after a configurable number of waves.
- Biome progression: Park -> Lagoon -> Fire -> Halloween.
- Final victory message after protecting all biomes.
- Windows/Xbox-style gamepad support through the browser Gamepad API.
- On-screen gamepad key hints while a connected controller is active.
- Menu sound controls for BGM/SFX toggles and master volumes.

## Run Locally

From this folder:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5173/index.html
```

The game is static, so no build step is required. It can also be opened directly
from `index.html`.

## Controls

- Click `Jogar`, choose a difficulty, then press `Iniciar` to start.
- Open `Config.` to adjust BGM/SFX toggles and master volumes.
- Select a tower in the shop.
- Click a valid terrain tile to place the selected tower.
- Use `Desfazer` within 5 seconds to remove the last placed tower and recover its cost.
- Use `Excluir` to enter removal mode, click a placed tower, then confirm. Click `Excluir` again to cancel removal mode.
- Use `Pause` to pause or resume.
- Use `1x` / `2x` to change game speed.
- Use biome buttons to switch the current test map.
- Use `Reiniciar` to restart the current biome.

### Gamepad Controls

Most browsers expose a gamepad only after one controller button is pressed once.
When a controller is connected and used, the game shows compact key hints on the
menu and during gameplay.

- `D-pad` / left stick: move through menus or move the tile cursor.
- `A` / `RT`: confirm or place the selected tower.
- With a custom value or volume slider focused, `D-pad` / left stick changes the value.
- `B`: close the config or difficulty panel, or leave the victory screen for the menu.
- `LB` / `RB`: cycle tower selection.
- `X` / `Start`: pause or resume.
- `Y`: toggle `1x` / `2x` speed.
- `Back/View`: return to the menu during gameplay.

## Victory And Progression

The required difficulty step after `Jogar` controls how many waves must be cleared in each biome:

- `Facil`: 5 waves.
- `Medio`: 12 waves.
- `Dificil`: 20 waves.
- `Custom`: any typed value from 20 to 99 waves.

When the player wins:

- Park victory shows `Parque Protegido!` and `Continuar` moves to Lagoon.
- Lagoon victory shows `Lagoa Protegida!` and `Continuar` moves to Fire.
- Fire victory shows `Fogo Protegido!` and `Continuar` moves to Halloween.
- Halloween victory shows `Parabens voce protegeu todos os biomas` and only offers
  `De novo!` and `Menu`.

## Project Structure

```text
.
|-- index.html       Main HTML structure and screens
|-- styles.css       CSS entrypoint that imports focused style modules
|-- styles/          Split CSS modules by UI responsibility
|-- game.js          JavaScript entrypoint
|-- src/             Split JavaScript scripts by game responsibility
|-- sound/           Background music and sound effect assets
|-- demo-preview.png Browser verification preview image
```

## Visual Placeholder Notes

Current entities are CSS placeholders:

- `.tower-*` classes represent tower types.
- `.enemy-*` classes represent enemy types.
- `.projectile-*` classes represent projectile visuals.
- Tile theme classes live under `.theme-park`, `.theme-lagoon`,
  `.theme-lava`, and `.theme-halloween`.

These classes define the current geometric shapes and theme-specific visuals.
