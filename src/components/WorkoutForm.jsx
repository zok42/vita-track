import { useState } from 'react';

const workoutTypes = [
  { value: 'walking', label: 'Spazieren' },
  { value: 'cycling', label: 'Radfahren' },
  { value: 'swimming', label: 'Schwimmen' },
];

const intensities = [
  { value: 'light', label: 'locker' },
  { value: 'medium', label: 'mittel' },
  { value: 'high', label: 'hoch' },
];

export default function WorkoutForm({ date, onAdded }) {
  const [type, setType] = useState('walking');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('medium');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!duration) return;
    await window.api.addWorkout(date, type, parseInt(duration), intensity);
    setDuration('');
    onAdded();
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Art
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {workoutTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label>
          Dauer (min)
          <input type="number" step="5" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>
        <label>
          Intensität
          <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
            {intensities.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit">Hinzufügen</button>
    </form>
  );
}
