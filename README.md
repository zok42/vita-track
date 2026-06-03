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
            ML["MealList.jsx<br/>Mahlzeiten anzeigen"]
            WF["WorkoutForm.jsx<br/>Training erfassen"]
            WL["WorkoutList.jsx<br/>Training anzeigen"]
            RM["ReportModal.jsx<br/>PDF-Zeitraum wählen"]
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

    REACT -- "window.api.*()" --> PRELOAD
    PRELOAD -- "ipcRenderer.invoke()" --> MAIN
    MAIN -- "ipcMain.handle()" --> PRELOAD
    PRELOAD -- "Rückgabewerte" --> REACT

    MAIN --> DB
    MAIN --> PDF
    DB <--> SQLITE
    PDF -- "Speichern" --> DISK["Dateisystem<br/>*.pdf"]

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
    DB-->>Main: id, date, meal_number
    Main-->>Bridge: Rueckgabewert
    Bridge-->>UI: Promise aufgeloest
    UI->>UI: setLoadKey, useEffect, Neuladen
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

### Mahlzeiten
- 3 Mahlzeiten pro Tag (Frühstück, Mittagessen, Abendessen)
- Erfassung des Gerichtsnamens
- Erfassung von Kohlenhydraten, Protein und Obst/Gemüse in Gramm
- Überschreiben bestehender Einträge

### Training
- Trainingsarten: Spazieren, Radfahren, Schwimmen
- Dauer in Minuten
- Intensität: locker, mittel, hoch
- Beliebig viele Einträge pro Tag

### Dashboard
- **Monatsansicht**: Kalender mit farbigen Indikatoren für Tage mit Mahlzeiten/Training
- **Wochenansicht**: 7-Tage-Raster mit Nährstoff- und Trainingsübersicht
- **Tagesansicht**: Detaillierte Zusammenfassung eines einzelnen Tages

### Datenhaltung
- Lokale SQLite-Datenbank (`better-sqlite3`)
- Gespeichert im Electron-Benutzerdatenverzeichnis (`vitatrack.db`)
- WAL-Journal-Mode für bessere Performance

## Projektstruktur

```
vita-track/
├── electron/
│   ├── main.js              # Electron-Hauptprozess, Fenster, IPC
│   ├── preload.cjs          # Context-Bridge (Renderer <-> Main)
│   ├── database.js          # SQLite-Schema, CRUD-Operationen
│   └── pdf.cjs              # PDF-Generierung (PDFKit)
├── src/
│   ├── main.jsx             # React-Einstiegspunkt
│   ├── App.jsx              # Hauptkomponente, Navigation, Zustand
│   ├── App.css              # Globales Styling
│   └── components/
│       ├── Dashboard.jsx    # Kalender-Ansichten (Monat/Woche/Tag)
│       ├── MealForm.jsx     # Mahlzeiten-Formular
│       ├── MealList.jsx     # Mahlzeiten-Liste
│       ├── WorkoutForm.jsx  # Trainings-Formular
│       ├── WorkoutList.jsx  # Trainings-Liste
│       └── ReportModal.jsx  # PDF-Zeitraum-Auswahl
├── index.html
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
    meals {
        int id
        string date
        int meal_number
        string name
        float carbs
        float protein
        float fruit_veggies
        string created_at
    }
    workouts {
        int id
        string date
        string type
        int duration
        string intensity
        string created_at
    }
```

```sql
-- Mahlzeiten
CREATE TABLE meals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,         -- YYYY-MM-DD
  meal_number   INTEGER NOT NULL CHECK(meal_number IN (1,2,3)),
  name          TEXT NOT NULL DEFAULT '',
  carbs         REAL NOT NULL DEFAULT 0,
  protein       REAL NOT NULL DEFAULT 0,
  fruit_veggies REAL NOT NULL DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Training
CREATE TABLE workouts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,            -- YYYY-MM-DD
  type       TEXT NOT NULL CHECK(type IN ('walking','cycling','swimming')),
  duration   INTEGER NOT NULL,
  intensity  TEXT NOT NULL CHECK(intensity IN ('light','medium','high')),
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Systemvoraussetzungen

- Node.js 18+
- npm 9+
- Betriebssystem: macOS, Windows oder Linux
