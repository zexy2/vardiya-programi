# Shift Manager

PWA for tracking employee shifts and overtime. Works offline.

**Demo:** https://zexy2.github.io/vardiya-programi/

## Features

- Daily timesheet tracking
- Overtime logging
- Employee management
- Monthly reports with PDF export
- Offline support (IndexedDB + Service Worker)

## Usage

Open `index.html` in a browser, or serve with any static server:

```bash
npx serve
```

To install as PWA, use the browser's "Add to Home Screen" option.

## Tech

- Vanilla JS (no frameworks)
- IndexedDB for storage
- Service Worker for offline
- CSS with glassmorphism design

## Structure

```
 index.html
 manifest.json
 sw.js
 css/styles.css
 js/app.js
 assets/icons/
```

## License

MIT
