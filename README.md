# 📋 Vardiya Programı

> Modern, offline-capable employee shift and overtime tracking PWA (Progressive Web App)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen.svg)
![Language](https://img.shields.io/badge/language-Turkish-red.svg)

<p align="center">
  <img src="assets/screenshots/demo.png" alt="Vardiya Programı Demo" width="300">
</p>

## ✨ Features

- **📱 Progressive Web App** - Install on any device, works offline
- **📋 Daily Timesheet (Puantaj)** - Track daily work hours for all employees
- **⏰ Overtime Tracking** - Log and monitor overtime hours (mesai)
- **👥 Employee Management** - Add, edit, and remove employees easily
- **📊 Monthly Reports** - View summarized monthly data per employee
- **📄 PDF Export** - Generate printable monthly reports
- **🔄 Bulk Actions** - Set default shifts, overtime, or days off for all at once
- **📅 Date Navigation** - Browse records for any date
- **💾 Persistent Storage** - Data saved locally using IndexedDB
- **🎨 Modern UI** - Clean, responsive glassmorphism design

## 🚀 Quick Start

### Option 1: Direct Use (No Installation Required)
Simply open `index.html` in a modern web browser.

### Option 2: Local Server (Recommended for PWA features)

```bash
# Clone the repository
git clone https://github.com/zexy2/vardiya-programi.git
cd vardiya-programi

# Serve with any static server
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Install as PWA
1. Open the app in Chrome/Edge/Safari
2. Click the "Install" or "Add to Home Screen" prompt
3. Use like a native app!

## 📱 Screenshots

| Timesheet | Employees | Report |
|-----------|-----------|--------|
| Daily shift tracking | Manage employee list | Monthly summary |

## 🏗️ Project Structure

```
vardiya-programi/
├── index.html          # Main HTML entry point
├── manifest.json       # PWA manifest configuration
├── sw.js               # Service Worker for offline support
├── css/
│   └── styles.css      # All application styles
├── js/
│   └── app.js          # Main application logic
├── assets/
│   ├── icons/          # PWA icons (192x192, 512x512)
│   └── screenshots/    # App screenshots for README
└── README.md           # Documentation
```

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern layouts (Grid, Flexbox), Glassmorphism effects
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **IndexedDB** - Client-side persistent storage
- **Service Worker** - Offline caching and PWA support
- **Web App Manifest** - PWA installation support

## 📖 Usage Guide

### Managing Employees
1. Go to **👥 Çalışanlar** (Employees) tab
2. Click **➕ Çalışan ekle** to add a new employee
3. Enter the name and click **Kaydet** (Save)
4. Use **Düzenle** (Edit) or **🗑️** (Delete) to modify

### Recording Daily Shifts
1. Go to **📋 Puantaj** (Timesheet) tab
2. Navigate to the desired date using ◀ ▶ buttons
3. For each employee, set:
   - **Start time** - Shift start
   - **End time** - Shift end
   - **Mesai** - Overtime hours (optional)
   - **İzin** - Mark as day off

### Quick Actions
- **Tümü 07:00 - 18:00** - Set default shift for all
- **Tümü +2 mesai** - Add 2 hours overtime to all
- **Tümünü İzinli Yap** - Mark everyone as off
- **Dünü kopyala** - Copy yesterday's records

### Viewing Reports
1. Go to **📊 Rapor** (Report) tab
2. View monthly totals per employee
3. Click on an employee to expand daily details
4. Use **Detaylı PDF indir** to export

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Opera | ✅ Full |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Zeki Akgül** - [@zexy2](https://github.com/zexy2)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

<p align="center">Made with ❤️ in Turkey</p>
