import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db;

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'vitatrack.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

   db.exec(`
     CREATE TABLE IF NOT EXISTS meals (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       date TEXT NOT NULL,
       meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
       name TEXT NOT NULL DEFAULT '',
       carbs REAL NOT NULL DEFAULT 0,
       protein REAL NOT NULL DEFAULT 0,
       fruit_veggies REAL NOT NULL DEFAULT 0,
       created_at TEXT DEFAULT (datetime('now'))
     );

     CREATE TABLE IF NOT EXISTS workouts (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       date TEXT NOT NULL,
       type TEXT NOT NULL CHECK(type IN ('walking','cycling','swimming')),
       duration INTEGER NOT NULL,
       intensity TEXT NOT NULL CHECK(intensity IN ('light','medium','high')),
       calories REAL NOT NULL DEFAULT 0,
       avg_heart_rate INTEGER NOT NULL DEFAULT 0,
       created_at TEXT DEFAULT (datetime('now'))
     );

     CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
     CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
   `);

   // Migration: meal_number → meal_type
   try {
     db.exec(`ALTER TABLE meals ADD COLUMN meal_type TEXT`);
   } catch {}
   try {
     db.exec(`UPDATE meals SET meal_type = CASE meal_number WHEN 1 THEN 'breakfast' WHEN 2 THEN 'lunch' WHEN 3 THEN 'dinner' ELSE 'snack' END WHERE meal_type IS NULL`);
   } catch {}
   try {
     db.exec(`UPDATE meals SET meal_type = 'breakfast' WHERE meal_type IS NULL`);
   } catch {}

   try {
     db.exec(`ALTER TABLE meals ADD COLUMN name TEXT NOT NULL DEFAULT ''`);
   } catch {
   }

   try {
     db.exec(`ALTER TABLE workouts ADD COLUMN calories REAL NOT NULL DEFAULT 0`);
   } catch {
   }

   try {
     db.exec(`ALTER TABLE workouts ADD COLUMN avg_heart_rate INTEGER NOT NULL DEFAULT 0`);
   } catch {
   }

  return db;
}

export function getMeals(date) {
  return db.prepare("SELECT * FROM meals WHERE date = ? ORDER BY CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 WHEN 'snack' THEN 4 END").all(date);
}

export function getMealsRange(startDate, endDate) {
  return db.prepare("SELECT * FROM meals WHERE date >= ? AND date <= ? ORDER BY date, CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 WHEN 'snack' THEN 4 END").all(startDate, endDate);
}

export function upsertMeal(date, mealType, name, carbs, protein, fruitVeggies) {
  const existing = db.prepare('SELECT id FROM meals WHERE date = ? AND meal_type = ?').get(date, mealType);
  if (existing) {
    db.prepare('UPDATE meals SET name = ?, carbs = ?, protein = ?, fruit_veggies = ? WHERE id = ?')
      .run(name, carbs, protein, fruitVeggies, existing.id);
    return { id: existing.id, date, meal_type: mealType };
  } else {
    const result = db.prepare('INSERT INTO meals (date, meal_type, name, carbs, protein, fruit_veggies) VALUES (?, ?, ?, ?, ?, ?)')
      .run(date, mealType, name, carbs, protein, fruitVeggies);
    return { id: result.lastInsertRowid, date, meal_type: mealType };
  }
}

export function updateMeal(id, mealType, name, carbs, protein, fruitVeggies) {
  db.prepare(`
    UPDATE meals 
    SET meal_type = ?, name = ?, carbs = ?, protein = ?, fruit_veggies = ?
    WHERE id = ?
  `).run(mealType, name, carbs, protein, fruitVeggies, id);
  return { id, meal_type: mealType, name, carbs, protein, fruit_veggies };
}

export function deleteMeal(id) {
  db.prepare('DELETE FROM meals WHERE id = ?').run(id);
}

export function getWorkouts(date) {
  return db.prepare('SELECT * FROM workouts WHERE date = ? ORDER BY created_at').all(date);
}

export function getWorkoutsRange(startDate, endDate) {
  return db.prepare('SELECT * FROM workouts WHERE date >= ? AND date <= ? ORDER BY date, created_at').all(startDate, endDate);
}

export function addWorkout(date, type, duration, intensity, calories = 0, avgHeartRate = 0) {
  const result = db.prepare('INSERT INTO workouts (date, type, duration, intensity, calories, avg_heart_rate) VALUES (?, ?, ?, ?, ?, ?)')
    .run(date, type, duration, intensity, calories, avgHeartRate);
  return { id: result.lastInsertRowid, date, type, duration, intensity, calories, avgHeartRate };
}

export function deleteWorkout(id) {
  db.prepare('DELETE FROM workouts WHERE id = ?').run(id);
}

export function updateWorkout(id, type, duration, intensity, calories, avgHeartRate) {
  db.prepare(`
    UPDATE workouts 
    SET type = ?, duration = ?, intensity = ?, calories = ?, avg_heart_rate = ?
    WHERE id = ?
  `).run(type, duration, intensity, calories, avgHeartRate, id);
  
  return { id, type, duration, intensity, calories, avgHeartRate };
}

export function getDailySummary(date) {
  const meals = db.prepare("SELECT * FROM meals WHERE date = ? ORDER BY CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 WHEN 'snack' THEN 4 END").all(date);
  const totals = db.prepare(`
    SELECT COALESCE(SUM(carbs),0) as total_carbs,
           COALESCE(SUM(protein),0) as total_protein,
           COALESCE(SUM(fruit_veggies),0) as total_fruit_veggies
    FROM meals WHERE date = ?
  `).get(date) ?? { total_carbs: 0, total_protein: 0, total_fruit_veggies: 0 };
  const workouts = db.prepare('SELECT * FROM workouts WHERE date = ?').all(date);
  return { meals, meals_total: totals, workouts };
}

export function getReportData(startDate, endDate) {
  const meals = db.prepare(
    "SELECT * FROM meals WHERE date >= ? AND date <= ? ORDER BY date, CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 WHEN 'snack' THEN 4 END"
  ).all(startDate, endDate);
  const workouts = db.prepare(
    'SELECT * FROM workouts WHERE date >= ? AND date <= ? ORDER BY date, created_at'
  ).all(startDate, endDate);

  const days = {};
  for (const m of meals) {
    if (!days[m.date]) days[m.date] = { meals: [], workouts: [] };
    days[m.date].meals.push(m);
  }
  for (const w of workouts) {
    if (!days[w.date]) days[w.date] = { meals: [], workouts: [] };
    days[w.date].workouts.push(w);
  }
  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

export function getMonthSummary(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  return db.prepare(`
    SELECT d.date,
           COALESCE(SUM(m.carbs),0)         as carbs,
           COALESCE(SUM(m.protein),0)        as protein,
           COALESCE(SUM(m.fruit_veggies),0)  as fruit_veggies,
           COALESCE((SELECT SUM(duration) FROM workouts WHERE date = d.date),0) as total_duration
    FROM (
      SELECT date FROM meals   WHERE date >= ? AND date <= ?
      UNION
      SELECT date FROM workouts WHERE date >= ? AND date <= ?
    ) d
    LEFT JOIN meals m ON m.date = d.date
    GROUP BY d.date ORDER BY d.date
  `).all(startDate, endDate, startDate, endDate);
}
