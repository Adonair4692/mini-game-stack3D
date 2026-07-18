# Height Stack

Mini-game 3D mobile-first per browser. Il giocatore ferma blocchi in movimento,
costruisce una torre e perde la parte non sovrapposta. Il punteggio non è
astratto: **H** corrisponde alla somma delle altezze reali dei blocchi collocati,
espressa in centimetri.

## Caratteristiche

- rendering 3D con Three.js;
- frammenti fisici con cannon-es;
- input mouse, touch, penna, trackpad, barra spaziatrice e Invio;
- taglio geometrico con collider aggiornati;
- altezza progressiva: ogni blocco normale cresce di 1 cm;
- blocco traguardo ogni 5 livelli, alto ×3 e più lento;
- perfect placement e combo;
- record locale, popup istruzioni, countdown e schermata finale;
- soundtrack sostituibile ed effetti sonori sintetici;
- interfaccia responsive portrait/landscape;
- test Vitest e deploy automatico su GitHub Pages.

## Requisiti

- Node.js 20.19.x oppure 22.12 o successivo;
- npm;
- un browser moderno con WebGL.

## Installazione e avvio

```bash
npm install
npm run dev
```

Vite mostrerà l’indirizzo locale da aprire nel browser.

## Test

```bash
npm run test
```

I test verificano sovrapposizioni, frammenti, perfect placement, conversione
centimetri/unità 3D, progressione verticale e blocchi traguardo.

## Build e anteprima

```bash
npm run build
npm run preview
```

La build viene generata in `dist/`.

## Struttura

```text
src/config.js                 configurazione centrale
src/game/Game.js              stato e ciclo principale
src/game/Block.js             mesh e dimensioni dei blocchi
src/game/PhysicsManager.js    corpi cannon-es e pulizia frammenti
src/game/CameraController.js  camera dinamica
src/game/InputManager.js      input unificati
src/audio/AudioManager.js     musica ed effetti sintetici
src/ui/UIManager.js           HUD, dialoghi e animazioni HTML/CSS
src/utils/overlap.js          calcoli geometrici puri
src/utils/dimensions.js       altezze, traguardi e velocità
```

## Cambiare titolo e colore principale

Aprire `src/config.js`:

```js
export const GAME_CONFIG = {
  gameTitle: 'HEIGHT STACK',
  gameSubtitle: 'Build higher. Place better.',
  colors: {
    primary: '#F2E600',
  },
};
```

`colors.primary` alimenta sia i materiali 3D sia la variabile CSS
`--primary-color`.

## Regolare la crescita dei blocchi

```js
block: {
  initialHeightCm: 10,
  increasePerPlacedBlockCm: 1,
  maximumRegularHeightCm: null,
  worldUnitsPerCm: 0.04,
}
```

- `initialHeightCm`: altezza del primo blocco;
- `increasePerPlacedBlockCm`: crescita dopo ogni collocamento valido;
- `maximumRegularHeightCm`: limite opzionale; `null` mantiene la crescita libera;
- `worldUnitsPerCm`: conversione tra centimetri logici e mondo 3D.

H viene sempre accumulato come intero in centimetri.

## Configurare i blocchi traguardo

```js
milestone: {
  everyBlocks: 5,
  heightMultiplier: 3,
  speedMultiplier: 0.55,
}
```

Con questi valori i blocchi 5, 10, 15 e successivi sono alti tre volte la loro
altezza normale e si muovono al 55% della velocità ordinaria corrente.

## Regolare la difficoltà

```js
movement: {
  initialSpeed: 3,
  maximumSpeed: 8,
  speedIncreasePerPlacedBlock: 0.08,
  travelDistance: 7,
}
```

La velocità è indipendente dal frame rate e viene limitata da `maximumSpeed`.

## Soundtrack

La traccia di appoggio si trova in:

```text
public/audio/soundtrack.mp3
```

È una semplice composizione sintetica originale destinata ai test. Può essere
sostituita mantenendo lo stesso nome oppure cambiando:

```js
audio: {
  soundtrackPath: 'audio/soundtrack.mp3',
  musicVolume: 0.25,
}
```

Il gioco continua a funzionare anche quando la soundtrack manca.

## Effetti sonori

Gli effetti provvisori vengono generati da `src/audio/AudioManager.js` con Web
Audio API. Ogni evento usa un nome separato (`cut`, `perfect`, `milestoneIn`,
`gameOver`, ecc.), quindi può essere sostituito in seguito con un file audio
senza modificare la logica del gioco.

## GitHub Pages

1. creare un repository GitHub;
2. caricare il progetto sul branch `main`;
3. aprire **Settings → Pages**;
4. scegliere **GitHub Actions** come sorgente;
5. effettuare un push.

Il workflow `.github/workflows/deploy.yml` esegue test, build e pubblicazione.
La configurazione Vite usa percorsi relativi, quindi non è necessario inserire
manualmente il nome del repository.

Comandi Git essenziali:

```bash
git init
git add .
git commit -m "Initial Height Stack release"
git branch -M main
git remote add origin URL_DEL_REPOSITORY
git push -u origin main
```

## Pubblicazione su itch.io

1. eseguire `npm run build`;
2. comprimere **il contenuto** della cartella `dist/` in uno ZIP;
3. creare un progetto itch.io di tipo HTML;
4. caricare lo ZIP e selezionare l’esecuzione nel browser;
5. scegliere una viewport responsiva o fullscreen.

`index.html` deve trovarsi alla radice dello ZIP.

## Asset e licenze

## Copyright e licenze

Copyright © 2026 Adriano Pantaleo. Tutti i diritti riservati.

È consentito utilizzare la versione pubblicata del gioco esclusivamente per
giocare a titolo personale e non commerciale.

Salvo preventiva autorizzazione scritta del titolare, non è consentito:

- copiare o redistribuire il codice sorgente;
- modificare o creare opere derivate dal progetto;
- ripubblicare il gioco, integralmente o in parte;
- utilizzare commercialmente il codice, il design, i testi, le animazioni,
  gli effetti sonori, la soundtrack o gli altri asset originali;
- rimuovere o alterare le indicazioni di copyright.

La disponibilità pubblica del repository non costituisce concessione di una
licenza open source e non attribuisce diritti ulteriori rispetto a quelli
necessari per visualizzare il repository, utilizzare le funzionalità offerte
da GitHub e giocare alla versione pubblicata.

Le librerie e le dipendenze di terze parti, tra cui Three.js, cannon-es, Vite
e Vitest, restano soggette alle rispettive licenze.

La traccia sintetica inclusa è un asset provvisorio realizzato per questo
progetto. Per eventuali asset aggiunti successivamente dovrà essere conservata
la documentazione relativa alla provenienza, alla licenza e ai diritti di
utilizzo.

Per richieste di autorizzazione o licenza contattare il titolare del copyright.
