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

## Budowanie instalatora

Aplikacja jest skonfigurowana do aktualizacji z repo:

```text
https://github.com/LixayTheFox/lightpaws_app
```

Potem zbuduj instalator Windows:

```powershell
npm run dist
```

Gotowy plik `.exe` pojawi sie w folderze `dist`, np. `LightPaws-Destiny-Hub-Setup-0.1.7.exe`.

Lokalny build ma wylaczone `build.win.signAndEditExecutable`, zeby instalator dal sie zbudowac bez certyfikatu podpisu kodu. Do publicznej dystrybucji najlepiej kupic/dodac certyfikat code signing i wlaczyc to pole ponownie, bo inaczej Windows SmartScreen moze pokazac ostrzezenie przy pierwszym uruchomieniu.

## Aktualizacje z GitHub Releases

Aplikacja korzysta z `electron-updater` i po zainstalowaniu sprawdza GitHub Releases. Jesli znajdzie nowsza wersje, pyta uzytkownika, czy pobrac aktualizacje. Po pobraniu pyta ponownie, czy zainstalowac i uruchomic aplikacje od nowa.

Najwygodniejszy proces wydania:

```powershell
npm version patch
git push
git push --tags
```

Workflow `.github/workflows/release.yml` zbuduje instalator i opublikuje go w GitHub Releases dla tagow `v*`.

## Kalendarz klanu

Przycisk kalendarza w aplikacji pobiera najblizsze wydarzenie z publicznego Google Calendar w formacie iCal.

Skonfiguruj kalendarz w `src/calendar-config.json`:

```json
{
  "googleCalendarId": "twoj-publiczny-kalendarz@group.calendar.google.com",
  "publicIcsUrl": "",
  "timezone": "Europe/Warsaw",
  "lookAheadDays": 180
}
```

Mozesz tez wkleic pelny publiczny adres iCal w `publicIcsUrl`. Jesli oba pola sa wypelnione, aplikacja uzyje `publicIcsUrl`.

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
