# Audio

`public/audio/soundtrack.mp3` è una traccia sintetica originale di appoggio,
fornita soltanto per testare il sistema musicale.

Per sostituirla:

1. esporta la nuova musica in MP3;
2. chiamala `soundtrack.mp3`, oppure modifica `audio.soundtrackPath` in
   `src/config.js`;
3. verifica di possedere i diritti necessari per pubblicarla;
4. usa preferibilmente un loop senza silenzi iniziali o finali.

Se il file manca, il gioco continua a funzionare e usa soltanto gli effetti
sonori generati tramite Web Audio API.
