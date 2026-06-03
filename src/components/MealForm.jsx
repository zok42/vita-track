import { useState, useEffect } from 'react';

const mealTypes = [
  { value: 'breakfast', label: 'Frühstück' },
  { value: 'lunch', label: 'Mittagessen' },
  { value: 'dinner', label: 'Abendessen' },
  { value: 'snack', label: 'Zwischenmahlzeit' },
];

export default function MealForm({ date, onSaved, mealToEdit = null, onCancel }) {
  const [mealType, setMealType] = useState('breakfast');
  const [name, setName] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fruitVeggies, setFruitVeggies] = useState('');

  useEffect(() => {
    if (mealToEdit) {
      setMealType(mealToEdit.meal_type);
      setName(mealToEdit.name ?? '');
      setCarbs(String(mealToEdit.carbs));
      setProtein(String(mealToEdit.protein));
      setFruitVeggies(String(mealToEdit.fruit_veggies));
    } else {
      setMealType('breakfast');
      setName('');
      setCarbs('');
      setProtein('');
      setFruitVeggies('');
    }
  }, [mealToEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mealType) return;

    if (mealToEdit) {
      await window.api.updateMeal(
        mealToEdit.id,
        mealType,
        name,
        parseFloat(carbs) || 0,
        parseFloat(protein) || 0,
        parseFloat(fruitVeggies) || 0,
      );
    } else {
      await window.api.upsertMeal(
        date,
        mealType,
        name,
        parseFloat(carbs) || 0,
        parseFloat(protein) || 0,
        parseFloat(fruitVeggies) || 0,
      );
    }

    setName('');
    setCarbs('');
    setProtein('');
    setFruitVeggies('');
    setMealType('breakfast');
    onSaved();
  }

  function handleCancel() {
    if (onCancel) onCancel();
  }

  return (
    <form className="meal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Mahlzeit
          <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
            {mealTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-field">
        <label>
          Gericht
          <textarea
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={256}
            rows={2}
            placeholder="z.B. Haferflocken mit Beeren"
          />
          <span className="char-count">{name.length}/256</span>
        </label>
      </div>

      <div className="form-row">
        <label>
          Kohlenhydrate (g)
          <input type="number" step="1" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </label>
        <label>
          Protein (g)
          <input type="number" step="1" min="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </label>
        <label>
          Obst/Gemüse (g)
          <input type="number" step="1" min="0" value={fruitVeggies} onChange={(e) => setFruitVeggies(e.target.value)} />
        </label>
      </div>

      <button type="submit">
        {mealToEdit ? 'Speichern' : 'Hinzufügen'}
      </button>
      {mealToEdit && (
        <button type="button" onClick={handleCancel} style={{ marginLeft: '10px' }}>
          Abbrechen
        </button>
      )}
    </form>
  );
}
