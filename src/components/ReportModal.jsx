import { useState } from 'react';

export default function ReportModal({ onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + '-01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate]     = useState(today);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleGenerate() {
    if (!startDate || !endDate) {
      setError('Bitte Datum von und bis auswählen.');
      return;
    }
    if (startDate > endDate) {
      setError('"Von" muss vor oder gleich "Bis" liegen.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await window.api.generatePdfReport(startDate, endDate);
      if (!result.canceled) onClose();
    } catch (e) {
      setError('PDF konnte nicht erstellt werden: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>PDF-Bericht erstellen</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-hint">
            Der Bericht listet pro Tag alle Mahlzeiten mit Nährwerten und alle Trainings auf.
          </p>
          <div className="form-row">
            <label>
              Von
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Bis
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
          {error && <p className="modal-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Abbrechen
          </button>
          <button type="button" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Wird erstellt…' : 'PDF erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
