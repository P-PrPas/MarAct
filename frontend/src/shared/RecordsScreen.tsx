import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { requestJson } from './http';

type RecordItem = { id: number; title: string };

export function RecordsScreen({ title, endpoint }: { title: string; endpoint: string }) {
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<RecordItem[]>(endpoint, { signal: controller.signal })
      .then(setRecords)
      .catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [endpoint]);

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!records || !input.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const record = await requestJson<RecordItem>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input }),
      });
      setRecords([...records, record]);
      setInput('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save record.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h1>{title}</h1>
      <form onSubmit={addRecord}>
        <label htmlFor="record-title">Record title</label>
        <div className="form-row">
          <input id="record-title" value={input} maxLength={120} required
            onChange={(event) => setInput(event.target.value)} />
          <button disabled={!records || !input.trim() || saving}>Add record</button>
        </div>
      </form>
      {error && <p role="alert">{error}</p>}
      <h2>Records</h2>
      {records ? (
        records.length ? <ul>{records.map((record) => <li key={record.id}>{record.title}</li>)}</ul>
          : <p>No records yet.</p>
      ) : !error && <p role="status">Loading records…</p>}
    </section>
  );
}
