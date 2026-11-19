import { useEffect, useRef, useState } from 'react';

export default function TimetablePanel({ segments, onClose }) {
  const dialog = useRef(null);
  const [line, setLine] = useState('');
  useEffect(() => { if (!dialog.current.open) dialog.current.showModal(); }, []);
  const routes = [...new Set(segments.map(segment => segment.route))];
  const rows = segments.filter(segment => !line || segment.route === line);
  const time = value => value?.slice(0, 5) ?? '—';

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="timetable-title"
      className="w-[min(880px,92vw)] max-h-[82vh] rounded-2xl border border-slate-600 bg-slate-900 p-0 text-slate-100 backdrop:bg-black/60">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-5 py-4">
        <h2 id="timetable-title" className="mr-auto text-lg font-semibold">Timetable</h2>
        <select aria-label="Filter by bus line" value={line} onChange={event => setLine(event.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm">
          <option value="">All bus lines</option>
          {routes.map(route => <option key={route} value={route}>Bus {route}</option>)}
        </select>
        <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">Close</button>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800 text-slate-300">
          <tr>{['Bus', 'Stop', 'Next stop', 'Departure', 'Arrival', 'Fare (GEL)', 'Service'].map(header =>
            <th key={header} scope="col" className="px-3 py-2">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(segment => (
            <tr key={segment.id} className="border-b border-slate-800" data-segment-id={segment.id}>
              <td className="px-3 py-2">Bus {segment.route}</td>
              <td className="px-3 py-2">{segment.stop}</td>
              <td className="px-3 py-2">{segment.nextStop}</td>
              <td className="px-3 py-2">{time(segment.departure)}</td>
              <td className="px-3 py-2">{time(segment.arrival)}</td>
              <td className="px-3 py-2">{Number(segment.fare).toFixed(2)}</td>
              <td className="px-3 py-2">{segment.isExpress ? 'Express' : 'Regular'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="px-5 py-4 text-slate-400">No saved segments for this bus line.</p>}
    </dialog>
  );
}
