const mealNames = ['Frühstück', 'Mittagessen', 'Abendessen'];

export default function MealList({ meals, onDelete }) {
  if (meals.length === 0) return <p className="empty">Keine Mahlzeiten erfasst</p>;

  return (
    <div className="meal-list">
      {meals.map((meal) => (
        <div key={meal.id} className="meal-item">
          <div className="meal-header">{mealNames[meal.meal_number - 1]}</div>
          <div className="meal-info">
            <div className="meal-name">{meal.name || '—'}</div>
            <div className="meal-nutrients">
              <span>KH: {meal.carbs}g</span>
              <span>P: {meal.protein}g</span>
              <span>O/G: {meal.fruit_veggies}g</span>
            </div>
          </div>
          <button className="btn-delete" onClick={() => onDelete(meal.id)}>Löschen</button>
        </div>
      ))}
    </div>
  );
}
