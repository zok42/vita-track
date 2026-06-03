import { useState, useEffect } from 'react';

const workoutTypes = [
  { value: 'walking', label: 'Spazieren' },
  { value: 'cycling', label: 'Radfahren' },
  { value: 'swimming', label: 'Schwimmen' },
  { value: 'workout', label: 'Workout' },
  { value: 'tai chi', label: 'Tai Chi' },
  { value: 'paddling', label: 'Paddeln' },
];

const intensities = [
  { value: 'light', label: 'locker' },
  { value: 'medium', label: 'mittel' },
  { value: 'high', label: 'hoch' },
];

export default function WorkoutForm({ date, onSaved, workoutToEdit = null, onCancel }) {
  const [type, setType] = useState('walking');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [calories, setCalories] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');

  // Initialize form from workoutToEdit prop
  useEffect(() => {
    if (workoutToEdit) {
      setType(workoutToEdit.type);
      setDuration(workoutToEdit.duration.toString());
      setIntensity(workoutToEdit.intensity);
      setCalories(workoutToEdit.calories.toString());
      setAvgHeartRate(workoutToEdit.avg_heart_rate.toString());
    } else {
      // Reset to default values when not editing
      setType('walking');
      setDuration('');
      setIntensity('medium');
      setCalories('');
      setAvgHeartRate('');
    }
  }, [workoutToEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!duration) return;

    const workoutData = {
      type,
      duration: parseInt(duration),
      intensity,
      calories: calories ? parseFloat(calories) : 0,
      avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : 0
    };

    if (workoutToEdit) {
      await window.api.updateWorkout(workoutToEdit.id, type, workoutData.duration, intensity, workoutData.calories, workoutData.avgHeartRate);
    } else {
      await window.api.addWorkout(date, type, workoutData.duration, intensity, workoutData.calories, workoutData.avgHeartRate);
    }

    // Reset form
    setDuration('');
    setCalories('');
    setAvgHeartRate('');
    setType('walking');
    setIntensity('medium');

    onSaved();
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      // Fallback: reset form locally
      setDuration('');
      setCalories('');
      setAvgHeartRate('');
      setType('walking');
      setIntensity('medium');
    }
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
      <div className="form-row">
        <label>
          Kalorienverbrauch (kcal)
          <input type="number" step="0.1" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </label>
        <label>
          Durchschnittspuls (bpm)
          <input type="number" step="1" min="0" value={avgHeartRate} onChange={(e) => setAvgHeartRate(e.target.value)} />
        </label>
      </div>
      <button type="submit">
        {workoutToEdit ? 'Speichern' : 'Hinzufügen'}
      </button>
      {workoutToEdit && (
        <button type="button" onClick={handleCancel} style={{ marginLeft: '10px' }}>
          Abbrechen
        </button>
      )}
    </form>
  );
}
