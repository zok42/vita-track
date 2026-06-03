import { useState, useEffect } from 'react';

const MEAL_LABELS = {
  breakfast: '🌅 Frühstück',
  lunch: '☀️ Mittagessen',
  dinner: '🌙 Abendessen',
  snack: '🍎 Zwischenmahlzeit',
};

const TYPE_LABELS = {
  walking: 'Spazieren',
  cycling: 'Radfahren',
  swimming: 'Schwimmen',
  workout: 'Workout',
  'tai chi': 'Tai Chi',
  paddling: 'Paddeln',
};

export default function ReportView() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [startDate, setStartDate] = useState(weekAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  async function loadReport() {
    const meals = await window.api.getMealsRange(startDate, endDate);
    const workouts = await window.api.getWorkoutsRange(startDate, endDate);

    // Daily totals
    const dailyMeals = {};
    for (const m of meals) {
      if (!dailyMeals[m.date]) dailyMeals[m.date] = { carbs: 0, protein: 0, fruitVeggies: 0, calories: 0 };
      dailyMeals[m.date].carbs += m.carbs;
      dailyMeals[m.date].protein += m.protein;
      dailyMeals[m.date].fruitVeggies += m.fruit_veggies;
      dailyMeals[m.date].calories += m.calories || 0;
    }

    const dailyWorkouts = {};
    for (const w of workouts) {
      if (!dailyWorkouts[w.date]) dailyWorkouts[w.date] = 0;
      dailyWorkouts[w.date] += w.duration;
    }

    // Macros by meal type
    const macrosByType = {};
    for (const m of meals) {
      if (!macrosByType[m.meal_type]) macrosByType[m.meal_type] = { carbs: 0, protein: 0, fruitVeggies: 0, calories: 0 };
      macrosByType[m.meal_type].carbs += m.carbs;
      macrosByType[m.meal_type].protein += m.protein;
      macrosByType[m.meal_type].fruitVeggies += m.fruit_veggies;
      macrosByType[m.meal_type].calories += m.calories || 0;
    }

    // Workout totals by type
    const workoutByType = {};
    for (const w of workouts) {
      if (!workoutByType[w.type]) workoutByType[w.type] = { count: 0, duration: 0, calories: 0 };
      workoutByType[w.type].count++;
      workoutByType[w.type].duration += w.duration;
      workoutByType[w.type].calories += w.calories || 0;
    }

    // Workout by intensity
    const workoutByIntensity = {};
    for (const w of workouts) {
      if (!workoutByIntensity[w.intensity]) workoutByIntensity[w.intensity] = { count: 0, duration: 0 };
      workoutByIntensity[w.intensity].count++;
      workoutByIntensity[w.intensity].duration += w.duration;
    }

    // Daily workout duration by intensity
    const dailyWorkoutByIntensity = {};
    for (const w of workouts) {
      if (!dailyWorkoutByIntensity[w.date]) dailyWorkoutByIntensity[w.date] = { light: 0, medium: 0, high: 0 };
      dailyWorkoutByIntensity[w.date][w.intensity] += w.duration;
    }

    // Totals
    const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
    const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
    const totalFruitVeggies = meals.reduce((s, m) => s + m.fruit_veggies, 0);
    const totalMealCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const totalDuration = workouts.reduce((s, w) => s + w.duration, 0);
    const totalCalories = workouts.reduce((s, w) => s + (w.calories || 0), 0);

    setReportData({
      meals,
      workouts,
      dailyMeals,
      dailyWorkouts,
      dailyWorkoutByIntensity,
      macrosByType,
      workoutByType,
      workoutByIntensity,
      totals: { totalCarbs, totalProtein, totalFruitVeggies, totalMealCalories, totalDuration, totalCalories },
      daysCount: new Set([...Object.keys(dailyMeals), ...Object.keys(dailyWorkouts)]).size,
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (!reportData) return <p>Laden...</p>;

  const { totals, macrosByType, workoutByType, workoutByIntensity, dailyMeals, dailyWorkouts, dailyWorkoutByIntensity, workouts } = reportData;

  // Chart max values
  const macroMax = Math.max(totals.totalCarbs, totals.totalProtein, totals.totalFruitVeggies) || 1;
  const calorieMax = Math.max(totals.totalMealCalories, totals.totalCalories) || 1;
  const workoutTypeMax = Math.max(...Object.values(workoutByType).map(v => v.duration)) || 1;
  const dailyDurationMax = Math.max(...Object.values(dailyWorkouts)) || 1;
  const dailyCarbsMax = Math.max(...Object.values(dailyMeals).map(d => d.carbs)) || 1;
  const dailyProteinMax = Math.max(...Object.values(dailyMeals).map(d => d.protein)) || 1;
  const dailyCaloriesMax = Math.max(...Object.values(dailyMeals).map(d => d.calories)) || 1;

  const sortedDates = [...new Set([
    ...Object.keys(dailyMeals),
    ...Object.keys(dailyWorkouts),
  ])].sort();

  return (
    <div className="report-view">
      <div className="report-controls">
        <label>
          Von
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          Bis
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <span className="report-period">{formatDate(startDate)} – {formatDate(endDate)} ({reportData.daysCount} Tage)</span>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Ernährung Gesamt</h4>
          <div className="nutrient-row"><span>Kohlenhydrate</span><span className="value">{totals.totalCarbs.toFixed(0)}g</span></div>
          <div className="nutrient-row"><span>Protein</span><span className="value">{totals.totalProtein.toFixed(0)}g</span></div>
          <div className="nutrient-row"><span>Obst/Gemüse</span><span className="value">{totals.totalFruitVeggies.toFixed(0)}g</span></div>
          <div className="nutrient-row"><span>Kalorien</span><span className="value">{totals.totalMealCalories.toFixed(0)} kcal</span></div>
        </div>
        <div className="summary-card">
          <h4>Training Gesamt</h4>
          <div className="nutrient-row"><span>Dauer</span><span className="value">{totals.totalDuration} min</span></div>
          <div className="nutrient-row"><span>Kalorien</span><span className="value">{totals.totalCalories.toFixed(0)} kcal</span></div>
          <div className="nutrient-row"><span>Einheiten</span><span className="value">{workouts.length}</span></div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Macros Bar Chart */}
        <div className="chart-card">
          <h4>Makronährstoffe Gesamt</h4>
          <div className="bar-chart">
            <div className="bar-item">
              <span className="bar-label">KH</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(totals.totalCarbs / macroMax) * 100}%`, background: '#4caf50' }} />
              </div>
              <span className="bar-value">{totals.totalCarbs.toFixed(0)}g</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">Prot</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(totals.totalProtein / macroMax) * 100}%`, background: '#2196f3' }} />
              </div>
              <span className="bar-value">{totals.totalProtein.toFixed(0)}g</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">Obst/Gem</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(totals.totalFruitVeggies / macroMax) * 100}%`, background: '#ff9800' }} />
              </div>
              <span className="bar-value">{totals.totalFruitVeggies.toFixed(0)}g</span>
            </div>
          </div>
        </div>

        {/* Workout Type Bar Chart */}
        <div className="chart-card">
          <h4>Trainingsdauer nach Art</h4>
          <div className="bar-chart">
            {Object.entries(workoutByType).map(([type, data]) => (
              <div className="bar-item" key={type}>
                <span className="bar-label">{TYPE_LABELS[type]}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(data.duration / workoutTypeMax) * 100}%`, background: '#9c27b0' }} />
                </div>
                <span className="bar-value">{data.duration} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intensity Chart */}
      <div className="charts-row">
        <div className="chart-card">
          <h4>Training nach Intensität</h4>
          <div className="bar-chart">
            {['light', 'medium', 'high'].map((intens) => {
              const data = workoutByIntensity[intens] || { count: 0, duration: 0 };
              const label = { light: '🟢 Locker', medium: '🟡 Mittel', high: '🔴 Hoch' }[intens];
              const color = { light: '#8bc34a', medium: '#ff9800', high: '#e94560' }[intens];
              const maxDur = Math.max(...Object.values(workoutByIntensity).map(v => v.duration)) || 1;
              return (
                <div className="bar-item" key={intens}>
                  <span className="bar-label">{label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(data.duration / maxDur) * 100}%`, background: color }} />
                  </div>
                  <span className="bar-value">{data.count}x {data.duration}min</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Macros by Meal Type */}
        <div className="chart-card">
          <h4>Makronährstoffe nach Mahlzeit</h4>
          <div className="bar-chart">
            {Object.entries(macrosByType).map(([type, data]) => (
              <div className="bar-item" key={type}>
                <span className="bar-label">{MEAL_LABELS[type]}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(data.carbs / macroMax) * 100}%`, background: '#4caf50' }} />
                </div>
                <span className="bar-value">{data.carbs.toFixed(0)}g KH</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Workout Duration by Intensity */}
      {Object.keys(dailyWorkoutByIntensity).length > 0 && (
        <div className="chart-card full-width">
          <h4>Trainingsdauer pro Tag nach Intensität</h4>
          <div className="stacked-bar-chart">
            {Object.keys(dailyWorkoutByIntensity).sort().map((date) => {
              const d = dailyWorkoutByIntensity[date];
              const total = d.light + d.medium + d.high;
              const maxDur = Math.max(...Object.values(dailyWorkoutByIntensity).map(v => v.light + v.medium + v.high)) || 1;
              return (
                <div className="stacked-bar-item" key={date}>
                  <span className="bar-label">{formatDate(date)}</span>
                  <div className="stacked-bar-track">
                    {d.light > 0 && (
                      <div className="stacked-bar-fill" style={{ width: `${(d.light / maxDur) * 100}%`, background: '#8bc34a' }} title={`Locker: ${d.light}min`} />
                    )}
                    {d.medium > 0 && (
                      <div className="stacked-bar-fill" style={{ width: `${(d.medium / maxDur) * 100}%`, background: '#ff9800' }} title={`Mittel: ${d.medium}min`} />
                    )}
                    {d.high > 0 && (
                      <div className="stacked-bar-fill" style={{ width: `${(d.high / maxDur) * 100}%`, background: '#e94560' }} title={`Hoch: ${d.high}min`} />
                    )}
                    {total === 0 && <div className="stacked-bar-fill" style={{ width: '0%' }} />}
                  </div>
                  <span className="bar-value">{total} min</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color" style={{ background: '#8bc34a' }}></span>Locker</span>
            <span className="legend-item"><span className="legend-color" style={{ background: '#ff9800' }}></span>Mittel</span>
            <span className="legend-item"><span className="legend-color" style={{ background: '#e94560' }}></span>Hoch</span>
          </div>
        </div>
      )}

      {/* Daily Timeline Chart */}
      {sortedDates.length > 0 && (
        <div className="chart-card full-width">
          <h4>Tagesverlauf</h4>
          <div className="timeline-chart">
            <div className="timeline-header">
              <span className="tl-label">KH (g)</span>
              <span className="tl-label">Prot (g)</span>
              <span className="tl-label">Kalorien (kcal)</span>
              <span className="tl-label">Training (min)</span>
            </div>
            {sortedDates.map((date) => {
              const m = dailyMeals[date] || { carbs: 0, protein: 0, calories: 0 };
              const w = dailyWorkouts[date] || 0;
              return (
                <div className="timeline-row" key={date}>
                  <span className="tl-date">{formatDate(date)}</span>
                  <div className="tl-bars">
                    <div className="tl-bar-track">
                      <div className="tl-bar-fill" style={{ width: `${(m.carbs / dailyCarbsMax) * 100}%`, background: '#4caf50' }} />
                    </div>
                    <div className="tl-bar-track">
                      <div className="tl-bar-fill" style={{ width: `${(m.protein / dailyProteinMax) * 100}%`, background: '#2196f3' }} />
                    </div>
                    <div className="tl-bar-track">
                      <div className="tl-bar-fill" style={{ width: `${(m.calories / dailyCaloriesMax) * 100}%`, background: '#ff9800' }} />
                    </div>
                    <div className="tl-bar-track">
                      <div className="tl-bar-fill" style={{ width: `${(w / dailyDurationMax) * 100}%`, background: '#9c27b0' }} />
                    </div>
                  </div>
                  <span className="tl-values">{m.carbs.toFixed(0)} / {m.protein.toFixed(0)} / {m.calories.toFixed(0)} / {w}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
