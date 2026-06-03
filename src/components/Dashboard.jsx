import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const mealNames = ['Frühstück', 'Mittagessen', 'Abendessen'];
const intensityLabels = { light: 'locker', medium: 'mittel', high: 'hoch' };
const typeLabels = { walking: 'Spazieren', cycling: 'Radfahren', swimming: 'Schwimmen' };

export default function Dashboard({ onDateSelect }) {
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [daySummary, setDaySummary] = useState(null);

  useEffect(() => {
    if (viewMode === 'month') {
      loadMonthData();
    } else if (viewMode === 'week') {
      loadWeekData();
    } else {
      loadDayData();
    }
  }, [viewMode, selectedDate]);

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(d.setDate(monday.getDate() + 6));
    return { start: formatDate(monday), end: formatDate(sunday) };
  }

  async function loadMonthData() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const data = await window.api.getMonthSummary(year, month);
    setMonthData(data);
  }

  async function loadWeekData() {
    const { start, end } = getWeekRange(selectedDate);
    const [meals, workouts] = await Promise.all([
      window.api.getMealsRange(start, end),
      window.api.getWorkoutsRange(start, end),
    ]);
    const data = {};
    for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
      const ds = formatDate(d);
      data[ds] = { meals: [], workouts: [] };
    }
    meals.forEach((m) => { if (data[m.date]) data[m.date].meals.push(m); });
    workouts.forEach((w) => { if (data[w.date]) data[w.date].workouts.push(w); });
    setWeekData(Object.entries(data));
  }

  async function loadDayData() {
    const ds = formatDate(selectedDate);
    const summary = await window.api.getDailySummary(ds);
    setDaySummary(summary);
  }

  function handleDayClick(date) {
    setSelectedDate(date);
    if (viewMode === 'month') setViewMode('day');
  }

  function tileContent({ date, view }) {
    if (view !== 'month') return null;
    const ds = formatDate(date);
    const day = monthData.find((d) => d.date === ds);
    if (!day) return null;
    const hasMeals = day.carbs > 0 || day.protein > 0 || day.fruit_veggies > 0;
    const hasWorkouts = day.total_duration > 0;
    return (
      <div className="tile-indicators">
        {hasMeals && <span className="indicator indicator-meal" title="Mahlzeiten">M</span>}
        {hasWorkouts && <span className="indicator indicator-workout" title="Training">T</span>}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <div className="view-toggle">
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Monat</button>
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Woche</button>
          <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>Tag</button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="calendar-wrapper">
          <Calendar
            onChange={(d) => { setSelectedDate(d); onDateSelect(formatDate(d)); }}
            value={selectedDate}
            tileContent={tileContent}
            onClickDay={handleDayClick}
            locale="de-DE"
          />
          <div className="legend">
            <span className="indicator indicator-meal">M</span> Mahlzeiten
            <span className="indicator indicator-workout" style={{ marginLeft: 16 }}>T</span> Training
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="week-view">
          <div className="week-grid">
            {weekData.map(([date, data]) => {
              const d = new Date(date + 'T12:00:00');
              const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' });
              const totalCarbs = data.meals.reduce((s, m) => s + m.carbs, 0);
              const totalProtein = data.meals.reduce((s, m) => s + m.protein, 0);
              const totalFv = data.meals.reduce((s, m) => s + m.fruit_veggies, 0);
              const totalDuration = data.workouts.reduce((s, w) => s + w.duration, 0);
              return (
                <div key={date} className="week-day-card" onClick={() => { onDateSelect(date); setViewMode('day'); }}>
                  <div className="week-day-header">{dayName}<br /><small>{date.slice(5)}</small></div>
                  <div className="week-day-stats">
                    <div>KH: {totalCarbs}g</div>
                    <div>P: {totalProtein}g</div>
                    <div>O/G: {totalFv}g</div>
                    {totalDuration > 0 && <div>Training: {totalDuration}min</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'day' && daySummary && (
        <div className="day-summary">
          <h3>{selectedDate.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Mahlzeiten</h4>
              <div className="nutrient-row">
                <span>Kohlenhydrate</span><span className="value">{daySummary.meals_total.total_carbs}g</span>
              </div>
              <div className="nutrient-row">
                <span>Protein</span><span className="value">{daySummary.meals_total.total_protein}g</span>
              </div>
              <div className="nutrient-row">
                <span>Obst/Gemüse</span><span className="value">{daySummary.meals_total.total_fruit_veggies}g</span>
              </div>
              {daySummary.meals.map((m) => (
                <div key={m.id} className="meal-detail">
                  <strong>{mealNames[m.meal_number - 1]}:</strong> {m.name && <em>{m.name} — </em>}KH {m.carbs}g | P {m.protein}g | O/G {m.fruit_veggies}g
                </div>
              ))}
            </div>
            <div className="summary-card">
              <h4>Training</h4>
              {daySummary.workouts.length === 0 && <p className="empty">Keine Trainings</p>}
              {daySummary.workouts.map((w) => (
                <div key={w.id} className="workout-detail">
                  <strong>{typeLabels[w.type]}</strong> — {w.duration}min, {intensityLabels[w.intensity]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
