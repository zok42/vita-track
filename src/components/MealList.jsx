const typeLabels = {
  breakfast: '🌅 Frühstück',
  lunch: '☀️ Mittagessen',
  dinner: '🌙 Abendessen',
  snack: '🍎 Zwischenmahlzeit',
};

export default function MealList({ meals, onDelete, onEdit }) {
  if (meals.length === 0) return <p className="empty">Keine Mahlzeiten erfasst</p>;

  return (
    <table className="meal-table">
      <thead>
        <tr>
          <th>Mahlzeit</th>
          <th>Gericht</th>
          <th>KH (g)</th>
          <th>Protein (g)</th>
          <th>Obst/Gemüse (g)</th>
          <th>Kalorien (kcal)</th>
          <th className="actions">⚙️</th>
        </tr>
      </thead>
      <tbody>
        {meals.map((m, index) => (
          <tr key={m.id} className={index % 2 === 0 ? 'even' : 'odd'}>
            <td>{typeLabels[m.meal_type]}</td>
            <td>{m.name || '—'}</td>
            <td>{m.carbs}</td>
            <td>{m.protein}</td>
            <td>{m.fruit_veggies}</td>
            <td>{m.calories || '—'}</td>
            <td className="actions">
              <button className="btn-edit" onClick={() => onEdit(m)} title="Bearbeiten">✏️</button>
              <button className="btn-delete" onClick={() => onDelete(m.id)} title="Löschen">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
