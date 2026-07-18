# Height Stack

A mobile-first 3D browser game in which players stop moving blocks to build an
ever-growing tower. Any part of a block that does not overlap the previous layer
is cut off and falls away.

The score is not abstract: **H** represents the total real height of all
successfully placed blocks, measured in centimetres.

## Features

- 3D rendering with Three.js;
- physics-based falling fragments with cannon-es;
- mouse, touch, pen, trackpad, Space bar, and Enter input;
- precise geometric cutting with updated physics colliders;
- progressive height system: each regular block grows by 1 cm;
- a milestone block every 5 levels, three times taller and slower;
- perfect placement and combo system;
- locally saved height record;
- instructions dialog, countdown, and game-over screen;
- replaceable soundtrack and synthesised sound effects;
- responsive portrait and landscape interface;
- Vitest test suite;
- automatic deployment to GitHub Pages.

## Requirements

- Node.js 20.19.x, 22.12, or later;
- npm;
- a modern browser with WebGL support.

## Installation and Local Development

```bash
npm install
npm run dev
```

Vite will display the local address to open in your browser.

## Tests

```bash
npm run test
```

The test suite covers:

- full, partial, and missing overlaps;
- retained and falling fragment geometry;
- perfect-placement tolerance;
- centimetre-to-world-unit conversion;
- progressive block heights;
- milestone block detection and dimensions;
- total height calculation.

## Build and Preview

```bash
npm run build
npm run preview
```

The production build is generated in the `dist/` directory.

## Project Structure

```text
src/config.js                 central configuration
src/game/Game.js              main game state and loop
src/game/Block.js             block meshes and dimensions
src/game/PhysicsManager.js    cannon-es bodies and fragment cleanup
src/game/CameraController.js  dynamic camera behaviour
src/game/InputManager.js      unified input handling
src/audio/AudioManager.js     music and synthesised sound effects
src/ui/UIManager.js           HUD, dialogs, and HTML/CSS animations
src/utils/overlap.js          pure geometric calculations
src/utils/dimensions.js       heights, milestones, and speed calculations
```

## Changing the Title and Main Colour

Open `src/config.js`:

```js
export const GAME_CONFIG = {
  gameTitle: 'HEIGHT STACK',
  gameSubtitle: 'Build higher. Place better.',

  colors: {
    primary: '#F2E600',
  },
};
```

The `colors.primary` property controls both the 3D materials and the CSS
variable `--primary-color`.

Changing this single value updates the main visual identity of the game.

## Configuring Block Growth

```js
block: {
  initialHeightCm: 10,
  increasePerPlacedBlockCm: 1,
  maximumRegularHeightCm: null,
  worldUnitsPerCm: 0.04,
}
```

- `initialHeightCm`: height of the first playable block;
- `increasePerPlacedBlockCm`: height added to each following regular block;
- `maximumRegularHeightCm`: optional maximum regular height; use `null` for
  unlimited growth;
- `worldUnitsPerCm`: conversion between logical centimetres and 3D world units.

The value of **H** is always stored and calculated as a whole number of
centimetres.

## Configuring Milestone Blocks

```js
milestone: {
  everyBlocks: 5,
  heightMultiplier: 3,
  speedMultiplier: 0.55,
}
```

With these settings, blocks 5, 10, 15, and every following multiple of five:

- are three times taller than their corresponding regular height;
- move at 55% of the current regular speed;
- use the same overlap and cutting rules as every other block.

For example:

```text
Block 5 regular height: 14 cm
Milestone multiplier: ×3
Actual block height: 42 cm
```

## Adjusting Difficulty

```js
movement: {
  initialSpeed: 3,
  maximumSpeed: 8,
  speedIncreasePerPlacedBlock: 0.08,
  travelDistance: 7,
}
```

The regular movement speed increases after every successfully placed block and
is capped by `maximumSpeed`.

Movement is calculated independently of the frame rate.

## Height Score

The primary score is the total constructed height:

```text
H 120 cm
```

It is calculated as the sum of the actual heights of all successfully placed
blocks.

Example:

```text
10 + 11 + 12 + 13 + 42 = 88 cm
```

The starting platform is not included.

Perfect placements do not grant artificial bonus centimetres. They preserve
the full block surface and increase the combo instead.

## Soundtrack

The placeholder soundtrack is located at:

```text
public/audio/soundtrack.mp3
```

It can be replaced while keeping the same filename, or by changing the path in
`src/config.js`:

```js
audio: {
  soundtrackPath: 'audio/soundtrack.mp3',
  musicVolume: 0.25,
}
```

The game continues to work when the soundtrack file is missing.

Browser autoplay restrictions require the soundtrack to begin only after the
player presses the Play button.

## Sound Effects

The temporary sound effects are generated in
`src/audio/AudioManager.js` through the Web Audio API.

Each game event has a separate sound identifier, including:

```text
place
cut
perfect
combo
milestoneIn
milestonePlace
newRecord
miss
gameOver
button
```

The synthesised effects can later be replaced with audio files without
changing the main game logic.

## GitHub Pages Deployment

1. Create a GitHub repository.
2. Upload or push the project to the `main` branch.
3. Open **Settings → Pages**.
4. Select **GitHub Actions** as the publishing source.
5. Push a commit or manually run the deployment workflow.

The workflow located at:

```text
.github/workflows/deploy.yml
```

automatically:

- installs the dependencies;
- runs the test suite;
- creates the production build;
- uploads the `dist/` directory;
- deploys the game to GitHub Pages.

The Vite configuration uses relative paths, so the repository name does not
need to be entered manually.

### Essential Git Commands

```bash
git init
git add .
git commit -m "Initial Height Stack release"
git branch -M main
git remote add origin REPOSITORY_URL
git push -u origin main
```

## Publishing on itch.io

1. Run:

```bash
npm run build
```

2. Compress the **contents** of the `dist/` directory into a ZIP file.
3. Create a new HTML project on itch.io.
4. Upload the ZIP file.
5. Select the option to run the game in the browser.
6. Use a responsive or fullscreen viewport.

The production `index.html` file must be located at the root of the uploaded
ZIP archive.

## Copyright and Licensing

Copyright © 2026 Adriano Pantaleo. All rights reserved.

The published version of the game may be used for personal, non-commercial
play.

Unless prior written permission is obtained from the copyright holder, users
may not:

- copy or redistribute the source code;
- modify the project or create derivative works;
- republish the game, in whole or in substantial part;
- commercially exploit the code, visual design, texts, animations, soundtrack,
  sound effects, or other original assets;
- remove or alter copyright notices.

The public availability of this repository does not constitute the grant of an
open-source licence.

Third-party libraries and development dependencies, including Three.js,
cannon-es, Vite, and Vitest, remain subject to their respective licences and
copyright notices.

The included synthetic soundtrack is a temporary asset created for this
project. For any assets added in the future, documentation concerning origin,
licensing, and distribution rights should be retained.

For permission or licensing enquiries, contact the copyright holder.
