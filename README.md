# LightPaws Destiny Hub

Prototyp desktopowej aplikacji dla klanu LightPaws. Lewy panel zawiera szybkie linki do serwisow Destiny 2, a prawa czesc wyswietla wybrana strone w osadzonym widoku Electron.

## Dlaczego Electron?

Do tego pomyslu Electron jest najpraktyczniejszy na start:

- dziala na Windows, macOS i Linux,
- uzywa HTML/CSS/JavaScript, wiec latwo szybko iterowac wyglad i liste linkow,
- potrafi wyswietlac zewnetrzne strony jako desktopowy `webview`, podczas gdy zwykly iframe w przegladarce czesto bylby blokowany przez naglowki bezpieczenstwa stron.

Tauri bylby lzejszy na pozniejszy etap, ale prototyp w Electronie szybciej pokazuje docelowy przeplyw i mniej boli przy osadzaniu wielu roznych serwisow.

## Uruchomienie

```powershell
npm install
npm start
```

## Linki

Liste stron zmienisz w `src/renderer.js` w tablicy `links`.

Aktualnie dodane sa:

- LightPaws
- Bungie
- Destiny Item Manager
- light.gg
- Braytech
- D2 Foundry
- Destiny Recipes
- Today in Destiny
- Raid Report
- Trials Report
- D2 Checkpoint
