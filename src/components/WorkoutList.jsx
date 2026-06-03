const typeLabels = { walking: 'Spazieren', cycling: 'Radfahren', swimming: 'Schwimmen' };
const intensityLabels = { light: 'locker', medium: 'mittel', high: 'hoch' };

export default function WorkoutList({ workouts, onDelete }) {
  if (workouts.length === 0) return <p className="empty">Keine Trainings erfasst</p>;

  return (
    <div className="workout-list">
      {workouts.map((w) => (
        <div key={w.id} className="workout-item">
          <div className="workout-details">
            <strong>{typeLabels[w.type]}</strong> — {w.duration}min, {intensityLabels[w.intensity]}
          </div>
          <button className="btn-delete" onClick={() => onDelete(w.id)}>Löschen</button>
        </div>
      ))}
    </div>
  );
}
