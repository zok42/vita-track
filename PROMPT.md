# VitaTrack - Anforderungen

## Projektbeschreibung
Erstelle eine Desktop-Anwendung namens **VitaTrack** zur Erfassung und Übersicht von Ernährung und Training. Die Anwendung soll als Electron-App mit React-Frontend und SQLite-Datenbank implementiert werden.

## Technologie-Stack
- **Frontend**: React 18 + Vite
- **Desktop**: Electron 33
- **Datenbank**: SQLite (better-sqlite3)
- **PDF-Export**: PDFKit
- **Sprache**: JavaScript (ESM + JSX)
- **Lokalisierung**: Deutsch

## Funktionen

### Navigation
- **Dashboard**: Kalender mit Monats-, Wochen- und Tagesansicht
- **Tag erfassen**: Mahlzeiten und Training für ein Datum erfassen/bearbeiten
- **Bericht**: Diagramme und Statistiken für einen frei wählbaren Zeitraum

### Mahlzeiten
- 4 Mahlzeitentypen mit Emojis:
  - 🌅 Frühstück
  - ☀️ Mittagessen
  - 🌙 Abendessen
  - 🍎 Zwischenmahlzeit
- Erfassungsfelder:
  - Gerichtename (bis 256 Zeichen)
  - Kohlenhydrate (g)
  - Protein (g)
  - Obst/Gemüse (g)
  - Kalorien (kcal)
- CRUD-Operationen (Erstellen, Lesen, Aktualisieren, Löschen)
- Tabelle mit Bearbeiten (✏️) und Löschen (🗑️) Icons
- Alternierende Zeilenfarben für bessere Lesbarkeit
- Kalorien-Feld in der ersten Formularzeile neben Mahlzeit-Dropdown

### Training
- 6 Trainingsarten mit Emojis:
  - 🚶 Spazieren
  - 🚴 Radfahren
  - 🏊 Schwimmen
  - 💪 Workout
  - 🧘 Tai Chi
  - 🛶 Paddeln
- 3 Intensitätsstufen mit Emojis:
  - 🟢 Locker
  - 🟡 Mittel
  - 🔴 Hoch
- Erfassungsfelder:
  - Dauer (min)
  - Kalorienverbrauch (kcal)
  - Durchschnittspuls (bpm)
- CRUD-Operationen (Erstellen, Lesen, Aktualisieren, Löschen)
- Tabelle mit Bearbeiten (✏️) und Löschen (🗑️) Icons
- Alternierende Zeilenfarben für bessere Lesbarkeit

### Dashboard
- **Monatsansicht**: Kalender mit farbigen Indikatoren für Tage mit Mahlzeiten/Training
- **Wochenansicht**: 7-Tage-Raster mit Nährstoff- und Trainingsübersicht
- **Tagesansicht**: Detaillierte Zusammenfassung eines einzelnen Tages

### In-App Bericht
- Frei wählbarer Datumsbereich (Von/Bis)
- Zusammenfassungskarten (Ernährung & Training Gesamt)
- Balkendiagramme:
  - Makronährstoffe Gesamt (KH, Protein, Obst/Gemüse)
  - Trainingsdauer nach Art
  - Training nach Intensität
  - Makronährstoffe nach Mahlzeit
- Gestapeltes Balkendiagramm: Trainingsdauer pro Tag nach Intensität
- Tagesverlauf-Diagramm mit KH, Protein, Kalorien und Training pro Tag

### PDF-Bericht
- Export über "PDF-Bericht" Button
- Deckblatt mit Zeitraum
- Wochen-Zusammenfassung Training (Matrix: Art × Intensität)
- Balkendiagramme (Makronährstoffe inkl. Kalorien, Trainingsdauer)
- Detaillierte Tageseinträge mit Mahlzeiten und Training
- Fußzeile mit Seitennummer und Erstellungsdatum

## Datenbank-Schema

### meals
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| date | TEXT NOT NULL | YYYY-MM-DD |
| meal_type | TEXT NOT NULL | breakfast, lunch, dinner, snack |
| name | TEXT NOT NULL DEFAULT '' | Gerichtename |
| carbs | REAL NOT NULL DEFAULT 0 | Kohlenhydrate in g |
| protein | REAL NOT NULL DEFAULT 0 | Protein in g |
| fruit_veggies | REAL NOT NULL DEFAULT 0 | Obst/Gemüse in g |
| calories | REAL NOT NULL DEFAULT 0 | Kalorien in kcal |
| created_at | TEXT DEFAULT (datetime('now')) | |

### workouts
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| date | TEXT NOT NULL | YYYY-MM-DD |
| type | TEXT NOT NULL | walking, cycling, swimming |
| duration | INTEGER NOT NULL | Minuten |
| intensity | TEXT NOT NULL | light, medium, high |
| calories | REAL NOT NULL DEFAULT 0 | Kalorien in kcal |
| avg_heart_rate | INTEGER NOT NULL DEFAULT 0 | Puls in bpm |
| created_at | TEXT DEFAULT (datetime('now')) | |

## Projektstruktur
```
vita-track/
├── electron/
│   ├── main.js              # Electron-Hauptprozess, Fenster, IPC
│   ├── preload.cjs          # Context-Bridge (Renderer <-> Main)
│   ├── database.js          # SQLite-Schema, CRUD-Operationen, Migration
│   └── pdf.cjs              # PDF-Generierung (PDFKit) mit Charts
├── src/
│   ├── main.jsx             # React-Einstiegspunkt
│   ├── App.jsx              # Hauptkomponente, Navigation, Zustand
│   ├── App.css              # Globales Styling, Tabellen, Charts
│   ├── assets/
│   │   └── logo.svg         # Anwendungs-Logo
│   └── components/
│       ├── Dashboard.jsx    # Kalender-Ansichten (Monat/Woche/Tag)
│       ├── MealForm.jsx     # Mahlzeiten-Formular mit Typ-Dropdown
│       ├── MealList.jsx     # Mahlzeiten-Tabelle mit Bearbeiten/Löschen
│       ├── WorkoutForm.jsx  # Trainings-Formular mit Kalorien/Puls
│       ├── WorkoutList.jsx  # Trainings-Tabelle mit Bearbeiten/Löschen
│       ├── ReportModal.jsx  # PDF-Zeitraum-Auswahl
│       └── ReportView.jsx   # In-App Bericht mit Diagrammen
├── index.html               # HTML-Entry mit Favicon
├── vite.config.js
├── package.json
└── README.md
```

## UI/UX Anforderungen
- Logo im Header, als Favicon und als Fenster-Icon
- Font-Smoothing für macOS (`-webkit-font-smoothing: antialiased`)
- Tabellen mit alternierenden Zeilenfarben (even/odd)
- Hover-Effekte für Zeilen und Buttons
- Emojis für Mahlzeitentypen, Trainingsarten und Intensitäten
- ⚙️ Zahnrad-Emoji als Spaltenheader für Aktionen

## API-Referenz (window.api)
| Methode | Parameter | Beschreibung |
|---------|-----------|--------------|
| `getMeals(date)` | date: string | Mahlzeiten eines Tages laden |
| `getMealsRange(start, end)` | start, end: string | Mahlzeiten im Zeitraum laden |
| `upsertMeal(date, mealType, name, carbs, protein, fruitVeggies, calories)` | – | Mahlzeit erstellen/aktualisieren |
| `updateMeal(id, mealType, name, carbs, protein, fruitVeggies, calories)` | – | Mahlzeit aktualisieren |
| `deleteMeal(id)` | id: number | Mahlzeit löschen |
| `getWorkouts(date)` | date: string | Training eines Tages laden |
| `getWorkoutsRange(start, end)` | start, end: string | Training im Zeitraum laden |
| `addWorkout(date, type, duration, intensity, calories, avgHeartRate)` | – | Training hinzufügen |
| `updateWorkout(id, type, duration, intensity, calories, avgHeartRate)` | – | Training aktualisieren |
| `deleteWorkout(id)` | id: number | Training löschen |
| `getDailySummary(date)` | date: string | Tageszusammenfassung laden |
| `getMonthSummary(year, month)` | year, month: number | Monatszusammenfassung laden |
| `generatePdfReport(startDate, endDate)` | start, end: string | PDF-Bericht generieren |

## Datenhaltung
- Lokale SQLite-Datenbank (`better-sqlite3`)
- Gespeichert im Electron-Benutzerdatenverzeichnis (`~/Library/Application Support/vita-track/vitatrack.db` auf macOS)
- WAL-Journal-Mode für bessere Performance
- Automatische Migration von `meal_number` → `meal_type`

## Systemvoraussetzungen
- Node.js 18+
- npm 9+
- Betriebssystem: macOS, Windows oder Linux

## Befehle
```bash
# Abhängigkeiten installieren
npm install

# Native Module für Electron neu kompilieren
npm run postinstall

# Entwicklung
npm run electron:dev

# Produktions-Build
npm run electron:build
```
