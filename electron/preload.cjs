const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getMeals: (date) => ipcRenderer.invoke('get-meals', date),
  getMealsRange: (start, end) => ipcRenderer.invoke('get-meals-range', start, end),
  upsertMeal: (date, mealNumber, name, carbs, protein, fruitVeggies) =>
    ipcRenderer.invoke('upsert-meal', date, mealNumber, name, carbs, protein, fruitVeggies),
  deleteMeal: (id) => ipcRenderer.invoke('delete-meal', id),
  getWorkouts: (date) => ipcRenderer.invoke('get-workouts', date),
  getWorkoutsRange: (start, end) => ipcRenderer.invoke('get-workouts-range', start, end),
  addWorkout: (date, type, duration, intensity) =>
    ipcRenderer.invoke('add-workout', date, type, duration, intensity),
  deleteWorkout: (id) => ipcRenderer.invoke('delete-workout', id),
  getDailySummary: (date) => ipcRenderer.invoke('get-daily-summary', date),
  getMonthSummary: (year, month) => ipcRenderer.invoke('get-month-summary', year, month),
  generatePdfReport: (startDate, endDate) => ipcRenderer.invoke('generate-pdf-report', startDate, endDate),
});
