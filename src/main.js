import './style.css';
import { GAME_CONFIG } from './config.js';
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';
import { Game } from './game/Game.js';

const ui = new UIManager(GAME_CONFIG);
const audio = new AudioManager(GAME_CONFIG);

try {
  new Game(GAME_CONFIG, ui, audio);
} catch (error) {
  console.error(error);
  ui.stage.innerHTML = `
    <div style="display:grid;place-items:center;height:100%;padding:24px;text-align:center;color:white">
      <div>
        <h1 style="color:${GAME_CONFIG.colors.primary}">Impossibile avviare il gioco</h1>
        <p>Il browser potrebbe non supportare WebGL oppure si è verificato un errore inatteso.</p>
      </div>
    </div>
  `;
}
