const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getMeals: (date) => ipcRenderer.invoke('get-meals', date),
  getMealsRange: (start, end) => ipcRenderer.invoke('get-meals-range', start, end),
  upsertMeal: (date, mealType, name, carbs, protein, fruitVeggies, calories) =>
    ipcRenderer.invoke('upsert-meal', date, mealType, name, carbs, protein, fruitVeggies, calories),
  updateMeal: (id, mealType, name, carbs, protein, fruitVeggies, calories) =>
    ipcRenderer.invoke('update-meal', id, mealType, name, carbs, protein, fruitVeggies, calories),
  deleteMeal: (id) => ipcRenderer.invoke('delete-meal', id),
  getWorkouts: (date) => ipcRenderer.invoke('get-workouts', date),
  getWorkoutsRange: (start, end) => ipcRenderer.invoke('get-workouts-range', start, end),
  addWorkout: (date, type, duration, intensity, calories, avgHeartRate) =>
    ipcRenderer.invoke('add-workout', date, type, duration, intensity, calories, avgHeartRate),
  updateWorkout: (id, type, duration, intensity, calories, avgHeartRate) =>
    ipcRenderer.invoke('update-workout', id, type, duration, intensity, calories, avgHeartRate),
  deleteWorkout: (id) => ipcRenderer.invoke('delete-workout', id),
  getDailySummary: (date) => ipcRenderer.invoke('get-daily-summary', date),
  getMonthSummary: (year, month) => ipcRenderer.invoke('get-month-summary', year, month),
  generatePdfReport: (startDate, endDate) => ipcRenderer.invoke('generate-pdf-report', startDate, endDate),
});
