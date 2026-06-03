import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MealForm from './components/MealForm';
import MealList from './components/MealList';
import WorkoutForm from './components/WorkoutForm';
import WorkoutList from './components/WorkoutList';
import ReportModal from './components/ReportModal';
import ReportView from './components/ReportView';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [view, setView]                 = useState('dashboard');
  const [meals, setMeals]               = useState([]);
  const [workouts, setWorkouts]         = useState([]);
  const [showReport, setShowReport]     = useState(false);
  const [editingMeal, setEditingMeal]   = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);

  // Reload list data whenever date changes or view switches to 'day'
  useEffect(() => {
    if (view === 'day') loadDayData(selectedDate);
  }, [selectedDate, view]);

  async function loadDayData(date) {
    const [mealsData, workoutsData] = await Promise.all([
      window.api.getMeals(date),
      window.api.getWorkouts(date),
    ]);
    setMeals(mealsData);
    setWorkouts(workoutsData);
  }

  function handleDateChange(date) {
    setSelectedDate(date);
  }

  async function handleMealSaved() {
    await loadDayData(selectedDate);
    setEditingMeal(null);
  }

  async function handleMealDeleted(id) {
    await window.api.deleteMeal(id);
    await loadDayData(selectedDate);
    if (editingMeal?.id === id) setEditingMeal(null);
  }

  async function handleWorkoutAdded() {
    await loadDayData(selectedDate);
    setEditingWorkout(null);
  }

  async function handleWorkoutDeleted(id) {
    await window.api.deleteWorkout(id);
    await loadDayData(selectedDate);
    if (editingWorkout?.id === id) setEditingWorkout(null);
  }

  async function handleWorkoutUpdated() {
    await loadDayData(selectedDate);
    setEditingWorkout(null);
  }

    return (
      <div className="app">
        <header className="app-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/src/assets/logo.svg" alt="VitaTrack Logo" width="32" height="32" />
          <h1>VitaTrack</h1>
          <nav className="app-nav">
            <button
              className={view === 'dashboard' ? 'active' : ''}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={view === 'day' ? 'active' : ''}
              onClick={() => setView('day')}
            >
              Tag erfassen
            </button>
            <button
              className={view === 'report' ? 'active' : ''}
              onClick={() => setView('report')}
            >
              Bericht
            </button>
          </nav>
          <div className="header-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
            <button className="btn-report" onClick={() => setShowReport(true)}>
              PDF-Bericht
            </button>
          </div>
        </header>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}

      <main className="app-main">
        {view === 'dashboard' ? (
          <Dashboard onDateSelect={(date) => { handleDateChange(date); setView('day'); }} />
        ) : view === 'report' ? (
          <ReportView />
        ) : (
          <div className="day-view">
            <div className="day-view-section">
              <h2>Mahlzeiten</h2>
              <MealForm 
                date={selectedDate} 
                onSaved={handleMealSaved} 
                mealToEdit={editingMeal}
                onCancel={() => setEditingMeal(null)}
              />
              <MealList 
                meals={meals} 
                onDelete={handleMealDeleted} 
                onEdit={setEditingMeal} 
              />
            </div>
            <div className="day-view-section">
              <h2>Training</h2>
              <WorkoutForm 
                date={selectedDate} 
                onSaved={handleWorkoutUpdated} 
                onCancel={() => setEditingWorkout(null)}
                workoutToEdit={editingWorkout} 
              />
              <WorkoutList 
                workouts={workouts} 
                onDelete={handleWorkoutDeleted} 
                onEdit={setEditingWorkout} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
