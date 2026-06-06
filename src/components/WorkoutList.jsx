const typeLabels = { 
  walking: '🚶 Spazieren', 
  cycling: '🚴 Radfahren', 
  swimming: '🏊 Schwimmen',
  workout: '💪 Workout',
  'tai chi': '🧘 Tai Chi',
  paddling: '🛶 Paddeln',
  other: '❓ Andere'
};
const intensityLabels = { light: '🟢 Locker', medium: '🟡 Mittel', high: '🔴 Hoch' };

export default function WorkoutList({ workouts, onDelete, onEdit }) {
  if (workouts.length === 0) return <p className="empty">Keine Trainings erfasst</p>;

  return (
    <table className="workout-table">
      <thead>
        <tr>
          <th>Art</th>
          <th>Dauer (min)</th>
          <th>Kalorien (kcal)</th>
          <th>Puls (bpm)</th>
          <th>Intensität</th>
          <th className="actions">⚙️</th>
        </tr>
      </thead>
      <tbody>
        {workouts.map((w, index) => (
          <tr key={w.id} className={index % 2 === 0 ? 'even' : 'odd'}>
            <td>{typeLabels[w.type]}</td>
            <td>{w.duration}</td>
            <td>{w.calories > 0 ? w.calories : '-'}</td>
            <td>{w.avg_heart_rate > 0 ? w.avg_heart_rate : '-'}</td>
            <td>{intensityLabels[w.intensity]}</td>
            <td className="actions">
              <button className="btn-edit" onClick={() => onEdit(w)} title="Bearbeiten">✏️</button>
              <button className="btn-delete" onClick={() => onDelete(w.id)} title="Löschen">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
