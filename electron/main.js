import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {
  initDatabase,
  getMeals,
  getMealsRange,
  upsertMeal,
  deleteMeal,
  getWorkouts,
  getWorkoutsRange,
  addWorkout,
  deleteWorkout,
  getDailySummary,
  getMonthSummary,
  getReportData,
} from './database.js';

const require = createRequire(import.meta.url);
const { generatePDF } = require('./pdf.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.handle('get-meals', (_e, date) => getMeals(date));
  ipcMain.handle('get-meals-range', (_e, start, end) => getMealsRange(start, end));
  ipcMain.handle('upsert-meal', (_e, date, mealNumber, name, carbs, protein, fruitVeggies) =>
    upsertMeal(date, mealNumber, name, carbs, protein, fruitVeggies));
  ipcMain.handle('delete-meal', (_e, id) => deleteMeal(id));
  ipcMain.handle('get-workouts', (_e, date) => getWorkouts(date));
  ipcMain.handle('get-workouts-range', (_e, start, end) => getWorkoutsRange(start, end));
  ipcMain.handle('add-workout', (_e, date, type, duration, intensity) =>
    addWorkout(date, type, duration, intensity));
  ipcMain.handle('delete-workout', (_e, id) => deleteWorkout(id));
  ipcMain.handle('get-daily-summary', (_e, date) => getDailySummary(date));
  ipcMain.handle('get-month-summary', (_e, year, month) => getMonthSummary(year, month));

  ipcMain.handle('generate-pdf-report', async (_e, startDate, endDate) => {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Bericht speichern',
      defaultPath: `VitaTrack_Bericht_${startDate}_${endDate}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { canceled: true };
    const days = getReportData(startDate, endDate);
    await generatePDF(filePath, days, startDate, endDate);
    shell.openPath(filePath);
    return { canceled: false, filePath };
  });
}

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
