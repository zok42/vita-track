# VitaTrack

Desktop-Anwendung zur Erfassung und Übersicht von Ernährung und Training.

## Technologie-Stack

| Schicht     | Technologie                         |
| ----------- | ----------------------------------- |
| Frontend    | React 18 + Vite                     |
| Desktop     | Electron 33                         |
| Datenbank   | SQLite (better-sqlite3)             |
| PDF-Export  | PDFKit                              |
| Build       | Vite (Frontend), electron-builder   |
| Sprache     | JavaScript (ESM + JSX)              |

## Architektur

```mermaid
graph TB
    subgraph "Electron Hauptprozess (Node.js)"
        MAIN["electron/main.js<br/>Fenster-Management, IPC-Handler"]
        DB["electron/database.js<br/>SQLite CRUD-Operationen"]
        PDF["electron/pdf.cjs<br/>PDF-Generierung (PDFKit)"]
        SQLITE[("vitatrack.db<br/>SQLite")]
    end

    subgraph "Preload-Bridge"
        PRELOAD["electron/preload.cjs<br/>contextBridge → window.api"]
    end

    subgraph "Renderer-Prozess (Browser)"
        REACT["React App<br/>src/App.jsx"]
        subgraph "UI-Komponenten"
            DASH["Dashboard.jsx<br/>Kalender: Monat / Woche / Tag"]
            MF["MealForm.jsx<br/>Mahlzeiten erfassen"]
            ML["MealList.jsx<br/>Mahlzeiten-Tabelle"]
            WF["WorkoutForm.jsx<br/>Training erfassen"]
            WL["WorkoutList.jsx<br/>Training-Tabelle"]
            RM["ReportModal.jsx<br/>PDF-Zeitraum wählen"]
            RV["ReportView.jsx<br/>Bericht mit Charts"]
        end
    end

    subgraph "Build-Pipeline"
        VITE["Vite<br/>Dev-Server + Bundler"]
        EB["electron-builder<br/>Installierbares Paket"]
    end

    REACT --> DASH
    REACT --> MF
    REACT --> ML
    REACT --> WF
    REACT --> WL
    REACT --> RM
    REACT --> RV

    REACT -- "window.api.*()" --> PRELOAD
    PRELOAD -- "ipcRenderer.invoke()" --> MAIN
    MAIN -- "ipcMain.handle()" --> PRELOAD
    PRELOAD -- "Rückgabewerte" --> REACT

    MAIN --> DB
    MAIN --> PDF
    MAIN -- "exportAllData / importData" --> DB
    DB <--> SQLITE
    PDF -- "Speichern" --> DISK["Dateisystem<br/>*.pdf"]
    MAIN -- "export-json / import-json" --> DISK

    REACT -- "npm run dev" --> VITE
    VITE -- "npm run electron:dev" --> MAIN
    VITE -- "npm run electron:build" --> EB

    style MAIN fill:#1a1a2e,color:#fff
    style PRELOAD fill:#e94560,color:#fff
    style REACT fill:#2196f3,color:#fff
    style DB fill:#4caf50,color:#fff
    style PDF fill:#ff9800,color:#fff
    style SQLITE fill:#795548,color:#fff
```

### Datenfluss

```mermaid
sequenceDiagram
    participant User as Benutzer
    participant UI as React
    participant Bridge as preload.cjs
    participant Main as main.js
    participant DB as database.js
    participant SQLite as vitatrack.db

    User->>UI: Klick Speichern
    UI->>Bridge: window.api.upsertMeal(...)
    Bridge->>Main: ipcRenderer.invoke
    Main->>DB: upsertMeal(...)
    DB->>SQLite: INSERT / UPDATE
    SQLite-->>DB: OK
    DB-->>Main: id, date, meal_type
    Main-->>Bridge: Rueckgabewert
    Bridge-->>UI: Promise aufgeloest
    UI->>UI: Neuladen der Daten
    UI->>Bridge: window.api.getMeals(date)
    Bridge->>Main: ipcRenderer.invoke
    Main->>DB: getMeals(date)
    DB->>SQLite: SELECT
    SQLite-->>DB: Zeilen
    DB-->>Main: Array von Meals
    Main-->>Bridge: Daten
    Bridge-->>UI: meals Array
    UI->>User: Aktualisierte Anzeige
```

## Funktionen

### Navigation
- **Dashboard**: Kalender mit Monats-, Wochen- und Tagesansicht
- **Tag erfassen**: Mahlzeiten und Training für ein Datum erfassen/bearbeiten
- **Bericht**: Diagramme und Statistiken für einen frei wählbaren Zeitraum

### Mahlzeiten
- 4 Mahlzeitentypen: 🌅 Frühstück, ☀️ Mittagessen, 🌙 Abendessen, 🍎 Zwischenmahlzeit
- Erfassung des Gerichtsnamens (bis 256 Zeichen)
- Erfassung von Kohlenhydraten, Protein, Obst/Gemüse und Kalorien
- Erfassung der Uhrzeit (default: aktuelle Uhrzeit, frei änderbar)
- Tabelle mit Bearbeiten (✏️) und Löschen (🗑️) Funktionen
- Alternierende Zeilenfarben für bessere Lesbarkeit

### Training
- Trainingsarten: Spazieren, Radfahren, Schwimmen, Workout, Tai Chi, Paddeln
- Dauer in Minuten
- Intensität: locker, mittel, hoch
- Kalorienverbrauch (kcal)
- Durchschnittspuls (bpm)
- Tabelle mit Bearbeiten (✏️) und Löschen (🗑️) Funktionen
- Alternierende Zeilenfarben für bessere Lesbarkeit

### Dashboard
- **Monatsansicht**: Kalender mit farbigen Indikatoren für Tage mit Mahlzeiten/Training
- **Wochenansicht**: 7-Tage-Raster mit Nährstoff- und Trainingsübersicht
- **Tagesansicht**: Detaillierte Zusammenfassung eines einzelnen Tages

### Bericht (In-App)
- Frei wählbarer Datumsbereich (Von/Bis)
- Zusammenfassungskarten (Ernährung & Training Gesamt)
- Balkendiagramme:
  - Makronährstoffe Gesamt (KH, Protein, Obst/Gemüse)
  - Trainingsdauer nach Art
  - Training nach Intensität
  - Makronährstoffe nach Mahlzeit
- Tagesverlauf-Diagramm mit KH, Protein und Training pro Tag

### PDF-Bericht
- Export über "PDF-Bericht" Button
- Deckblatt mit Zeitraum
- Wochen-Zusammenfassung Training (Matrix: Art × Intensität)
- Balkendiagramme (Makronährstoffe, Trainingsdauer)
- Detaillierte Tageseinträge mit Mahlzeiten und Training
- Fußzeile mit Seitennummer und Erstellungsdatum

### JSON-Import / Export
- Export aller Daten als JSON-Datei über den 📤 Export-Button
- Import aus JSON-Datei über den 📥 Import-Button
- JSON-Format mit Version, Export-Datum, Mahlzeiten und Trainings
- **Import-Verhalten**: Mahlzeiten werden per Datum + Mahlzeitentyp upgesert (bestehende überschrieben), Trainings werden immer neu eingefügt
- Validierung des JSON-Formats beim Import
- Ermöglicht Datensicherung und Übertragung zwischen Geräten

### Datenhaltung
- Lokale SQLite-Datenbank (`better-sqlite3`)
- Gespeichert im Electron-Benutzerdatenverzeichnis (`vitatrack.db`)
- WAL-Journal-Mode für bessere Performance
- Automatische Migration von `meal_number` → `meal_type`

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
│   └── components/
│       ├── Dashboard.jsx    # Kalender-Ansichten (Monat/Woche/Tag)
│       ├── MealForm.jsx     # Mahlzeiten-Formular mit Typ-Dropdown
│       ├── MealList.jsx     # Mahlzeiten-Tabelle mit Bearbeiten/Löschen
│       ├── WorkoutForm.jsx  # Trainings-Formular mit Kalorien/Puls
│       ├── WorkoutList.jsx  # Trainings-Tabelle mit Bearbeiten/Löschen
│       ├── ReportModal.jsx  # PDF-Zeitraum-Auswahl
│       └── ReportView.jsx   # In-App Bericht mit Diagrammen
├── src/assets/
│   └── logo.svg             # Anwendungs-Logo
├── index.html               # HTML-Entry mit Favicon
├── vite.config.js
└── package.json
```

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Native Module für Electron neu kompilieren
npm run postinstall
```

## Entwicklung

```bash
# Vite-Dev-Server + Electron parallel starten
npm run electron:dev

# Nur Vite-Dev-Server (Browser-Test)
npm run dev
```

## Produktions-Build

```bash
npm run electron:build
```

Das installierbare Paket liegt anschließend im Ordner `release/`.

## Datenbank-Schema

```mermaid
erDiagram
    datum ||--o{ meals : ""
    datum ||--o{ workouts : ""

    datum {
        string date PK "YYYY-MM-DD"
    }
    meals {
        int id PK
        string date FK
        string meal_type "breakfast | lunch | dinner | snack"
        string name
        float carbs
        float protein
        float fruit_veggies
        float calories
        string time "HH:MM"
        string created_at
    }
    workouts {
        int id PK
        string date FK
        string type "walking | cycling | swimming"
        int duration
        string intensity "light | medium | high"
        float calories
        int avg_heart_rate
        string created_at
    }
```

```sql
-- Mahlzeiten
CREATE TABLE meals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,         -- YYYY-MM-DD
  meal_type     TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
  name          TEXT NOT NULL DEFAULT '',
  carbs         REAL NOT NULL DEFAULT 0,
  protein       REAL NOT NULL DEFAULT 0,
  fruit_veggies REAL NOT NULL DEFAULT 0,
  calories      REAL NOT NULL DEFAULT 0,
  time          TEXT NOT NULL DEFAULT '', -- HH:MM
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Training
CREATE TABLE workouts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  date           TEXT NOT NULL,            -- YYYY-MM-DD
  type           TEXT NOT NULL CHECK(type IN ('walking','cycling','swimming')),
  duration       INTEGER NOT NULL,
  intensity      TEXT NOT NULL CHECK(intensity IN ('light','medium','high')),
  calories       REAL NOT NULL DEFAULT 0,
  avg_heart_rate INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT DEFAULT (datetime('now'))
);
```

## API-Referenz (window.api)

| Methode | Parameter | Beschreibung |
| ------- | --------- | ------------ |
| `getMeals(date)` | `date: string` | Mahlzeiten eines Tages laden |
| `getMealsRange(start, end)` | `start, end: string` | Mahlzeiten im Zeitraum laden |
| `upsertMeal(date, mealType, name, carbs, protein, fruitVeggies, calories, time?)` | – | Mahlzeit erstellen/aktualisieren |
| `updateMeal(id, mealType, name, carbs, protein, fruitVeggies, calories, time?)` | – | Mahlzeit aktualisieren |
| `deleteMeal(id)` | `id: number` | Mahlzeit löschen |
| `getWorkouts(date)` | `date: string` | Training eines Tages laden |
| `getWorkoutsRange(start, end)` | `start, end: string` | Training im Zeitraum laden |
| `addWorkout(date, type, duration, intensity, calories, avgHeartRate)` | – | Training hinzufügen |
| `updateWorkout(id, type, duration, intensity, calories, avgHeartRate)` | – | Training aktualisieren |
| `deleteWorkout(id)` | `id: number` | Training löschen |
| `getDailySummary(date)` | `date: string` | Tageszusammenfassung laden |
| `getMonthSummary(year, month)` | `year, month: number` | Monatszusammenfassung laden |
| `generatePdfReport(startDate, endDate)` | `start, end: string` | PDF-Bericht generieren |
| `exportJson()` | – | Alle Daten als JSON-Datei exportieren |
| `importJson()` | – | Daten aus JSON-Datei importieren (mit Dateiauswahl) |

## JSON-Format

```json
{
  "version": 1,
  "exported_at": "2026-06-05T12:00:00.000Z",
  "meals": [
    {
      "id": 1,
      "date": "2026-06-01",
      "meal_type": "breakfast",
      "name": "Haferflocken mit Obst",
      "carbs": 45,
      "protein": 12,
      "fruit_veggies": 80,
      "calories": 350,
      "time": "08:30",
      "created_at": "2026-06-01 08:30:00"
    }
  ],
  "workouts": [
    {
      "id": 1,
      "date": "2026-06-01",
      "type": "walking",
      "duration": 30,
      "intensity": "light",
      "calories": 120,
      "avg_heart_rate": 90,
      "created_at": "2026-06-01 18:00:00"
    }
  ]
}
```

## Systemvoraussetzungen

- Node.js 18+
- npm 9+
- Betriebssystem: macOS, Windows oder Linux
