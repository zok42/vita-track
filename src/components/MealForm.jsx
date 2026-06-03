import { useState, useEffect, useRef } from 'react';

const MEAL_NAMES = ['Frühstück', 'Mittagessen', 'Abendessen'];
const EMPTY = { name: '', carbs: '', protein: '', fruitVeggies: '' };

function fromDb(row) {
  return {
    name:         row.name ?? '',
    carbs:        String(row.carbs),
    protein:      String(row.protein),
    fruitVeggies: String(row.fruit_veggies),
  };
}

export default function MealForm({ date, onSaved }) {
  const [mealNumber, setMealNumber] = useState(1);
  const [fields, setFields]         = useState(EMPTY);
  const [loadKey, setLoadKey]       = useState(0);  // increment to force a DB reload
  const drafts                      = useRef({});

  // Load from DB when date, tab, or loadKey changes.
  // Draft takes priority over DB value so ongoing edits are never overwritten.
  useEffect(() => {
    const draftKey = `${date}|${mealNumber}`;
    if (drafts.current[draftKey]) {
      setFields(drafts.current[draftKey]);
      return;
    }
    let cancelled = false;
    window.api.getMeals(date).then((rows) => {
      if (cancelled) return;
      const row = rows.find((m) => m.meal_number === mealNumber);
      setFields(row ? fromDb(row) : EMPTY);
    });
    return () => { cancelled = true; };
  }, [date, mealNumber, loadKey]);

  // Reset to tab 1 and wipe drafts when the date changes
  const prevDate = useRef(date);
  useEffect(() => {
    if (prevDate.current === date) return;
    drafts.current = {};
    prevDate.current = date;
    setMealNumber(1);
    setFields(EMPTY);
  }, [date]);

  function set(field) {
    return (e) => {
      const val = e.target.value;
      setFields((prev) => {
        const next = { ...prev, [field]: val };
        drafts.current[`${date}|${mealNumber}`] = next;
        return next;
      });
    };
  }

  function selectMeal(num) {
    if (num === mealNumber) return;
    drafts.current[`${date}|${mealNumber}`] = fields;
    setFields(drafts.current[`${date}|${num}`] ?? EMPTY);
    setMealNumber(num);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await window.api.upsertMeal(
      date,
      mealNumber,
      fields.name,
      parseFloat(fields.carbs)        || 0,
      parseFloat(fields.protein)      || 0,
      parseFloat(fields.fruitVeggies) || 0,
    );
    // discard draft so the useEffect reloads fresh data from DB
    delete drafts.current[`${date}|${mealNumber}`];
    setLoadKey((k) => k + 1);   // triggers useEffect → fresh DB read
    onSaved();
  }

  return (
    <form className="meal-form" onSubmit={handleSubmit}>
      <div className="meal-tabs">
        {MEAL_NAMES.map((label, i) => (
          <button
            key={i + 1}
            type="button"
            className={mealNumber === i + 1 ? 'active' : ''}
            onClick={() => selectMeal(i + 1)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="form-field">
        <label>
          Gericht
          <textarea
            value={fields.name}
            onChange={set('name')}
            maxLength={256}
            rows={2}
            placeholder="z.B. Haferflocken mit Beeren"
          />
          <span className="char-count">{fields.name.length}/256</span>
        </label>
      </div>

      <div className="form-row">
        <label>
          Kohlenhydrate (g)
          <input type="number" step="1" min="0" value={fields.carbs}        onChange={set('carbs')} />
        </label>
        <label>
          Protein (g)
          <input type="number" step="1" min="0" value={fields.protein}      onChange={set('protein')} />
        </label>
        <label>
          Obst/Gemüse (g)
          <input type="number" step="1" min="0" value={fields.fruitVeggies} onChange={set('fruitVeggies')} />
        </label>
      </div>

      <button type="submit">Speichern</button>
    </form>
  );
}
