import { useState } from 'react';
import { stops } from '../data/stops';
import { planTrip, planTripFromCoords } from '../utils/tripPlanner';
import { routesMap } from '../data/routes';
import { stopsMap } from '../data/stops';

const sortedStops = [...stops].sort((a, b) => a.name.localeCompare(b.name));

// Convert segments into a flat list of human-readable steps
function buildSteps(result) {
  const steps = [];
  const segs = result.segments;

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const firstStop = stopsMap[seg.stops[0]];
    const lastStop = stopsMap[seg.stops[seg.stops.length - 1]];
    const distM = Math.round((seg.distKm ?? 0) * 1000);
    const route = seg.type === 'bus' ? Object.values(routesMap).find(r => r.bus_number === seg.busNumber) : null;
    const color = seg.type === 'walk' ? '#ef4444' : (route?.color ?? '#64748b');

    if (seg.type === 'walk') {
      steps.push({
        icon: 'walk',
        color: '#ef4444',
        title: `Walk to ${lastStop?.name ?? 'destination'}`,
        sub: `${distM}m · about ${Math.round(seg.timeMin)} min on foot`,
        stopId: seg.stops[seg.stops.length - 1],
        timeMin: seg.timeMin,
        highlight: false,
      });
    } else {
      // Board step
      steps.push({
        icon: seg.busNumber,
        color,
        title: `Board Bus ${seg.busNumber}`,
        sub: `At stop: ${firstStop?.name ?? 'stop'}`,
        stopId: seg.stops[0],
        timeMin: null,
        highlight: true,
      });
      // Ride step
      const stopCount = seg.stops.length - 1;
      steps.push({
        icon: seg.busNumber,
        color,
        title: `Ride ${stopCount} stop${stopCount !== 1 ? 's' : ''}`,
        sub: `Get off at: ${lastStop?.name ?? 'stop'}`,
        stopId: seg.stops[seg.stops.length - 1],
        timeMin: seg.timeMin,
        highlight: false,
      });
    }
  }

  // Final arrive step
  const destination = result.toStop?.name ?? result.toPoint ? 'destination' : 'destination';
  steps.push({
    icon: 'arrive',
    color: '#4ade80',
    title: `Arrive at ${result.toStop?.name ?? 'destination'}`,
    sub: null,
    stopId: result.toStop?.id,
    timeMin: null,
    highlight: false,
  });

  return steps;
}

export default function TripPlanner({ onSelectStop, onTripFound, tripFrom, tripTo, onTripFromChange, onTripToChange, pickMode, onPickMode }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleFind() {
    if (!tripFrom || !tripTo) return;
    setLoading(true);
    let res;
    if (tripFrom.type === 'point' || tripTo.type === 'point') {
      const fromLat = tripFrom.type === 'point' ? tripFrom.lat : stopsMap[tripFrom.id]?.lat;
      const fromLng = tripFrom.type === 'point' ? tripFrom.lng : stopsMap[tripFrom.id]?.lng;
      const toLat = tripTo.type === 'point' ? tripTo.lat : stopsMap[tripTo.id]?.lat;
      const toLng = tripTo.type === 'point' ? tripTo.lng : stopsMap[tripTo.id]?.lng;
      res = await planTripFromCoords(fromLat, fromLng, toLat, toLng);
    } else {
      res = await planTrip(tripFrom.id, tripTo.id);
    }
    setResult(res);
    setLoading(false);
    onTripFound?.(res);
  }

  function handleStopClick(stopId) {
    const stop = stopsMap[stopId];
    if (stop) onSelectStop(stop);
  }

  const walkCount = result?.segments?.filter(s => s.type === 'walk').length ?? 0;
  const busCount = result?.segments?.filter(s => s.type === 'bus').length ?? 0;

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-700/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="text-white font-semibold text-sm">Trip Planner</h2>
        </div>
        <p className="text-slate-400 text-xs">Bus + walking — every route possible</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Form */}
        <div className="p-4 space-y-3">
          {/* From field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">From</label>
            <div className="flex gap-1.5">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${tripFrom ? 'bg-slate-700 border-blue-500/50 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-400 flex-shrink-0"></div>
                <span className="truncate text-xs">
                  {tripFrom ? (tripFrom.type === 'stop' ? tripFrom.name : `📍 ${tripFrom.lat.toFixed(4)}, ${tripFrom.lng.toFixed(4)}`) : 'Not set'}
                </span>
                {tripFrom && (
                  <button onClick={() => { onTripFromChange(null); setResult(null); }} className="ml-auto text-slate-400 hover:text-white flex-shrink-0">×</button>
                )}
              </div>
              <button
                onClick={() => onPickMode(pickMode === 'from' ? null : 'from')}
                className={`px-2.5 rounded-xl border text-xs font-semibold transition-colors flex-shrink-0 ${pickMode === 'from' ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                title="Pick on map"
              >📍</button>
            </div>
            {/* Also allow dropdown selection */}
            <select
              value={tripFrom?.type === 'stop' ? tripFrom.id : ''}
              onChange={e => { if (e.target.value) { const s = stopsMap[e.target.value]; onTripFromChange({ type: 'stop', id: e.target.value, name: s?.name ?? '' }); setResult(null); } }}
              className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-xs appearance-none focus:outline-none cursor-pointer"
            >
              <option value="">Or select stop from list...</option>
              {sortedStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={() => { onTripFromChange(tripTo); onTripToChange(tripFrom); setResult(null); }}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Swap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">To</label>
            <div className="flex gap-1.5">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${tripTo ? 'bg-slate-700 border-green-500/50 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0"></div>
                <span className="truncate text-xs">
                  {tripTo ? (tripTo.type === 'stop' ? tripTo.name : `📍 ${tripTo.lat.toFixed(4)}, ${tripTo.lng.toFixed(4)}`) : 'Not set'}
                </span>
                {tripTo && (
                  <button onClick={() => { onTripToChange(null); setResult(null); }} className="ml-auto text-slate-400 hover:text-white flex-shrink-0">×</button>
                )}
              </div>
              <button
                onClick={() => onPickMode(pickMode === 'to' ? null : 'to')}
                className={`px-2.5 rounded-xl border text-xs font-semibold transition-colors flex-shrink-0 ${pickMode === 'to' ? 'bg-green-500 border-green-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                title="Pick on map"
              >📍</button>
            </div>
            {/* Also allow dropdown selection */}
            <select
              value={tripTo?.type === 'stop' ? tripTo.id : ''}
              onChange={e => { if (e.target.value) { const s = stopsMap[e.target.value]; onTripToChange({ type: 'stop', id: e.target.value, name: s?.name ?? '' }); setResult(null); } }}
              className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-xs appearance-none focus:outline-none cursor-pointer"
            >
              <option value="">Or select stop from list...</option>
              {sortedStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Find button */}
          <button
            onClick={handleFind}
            disabled={!tripFrom || !tripTo || loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Finding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Route
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="px-4 pb-4 space-y-2">
            {result.error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm font-medium">Route Not Found</p>
                <p className="text-slate-400 text-xs mt-1">{result.error}</p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <div>
                    <p className="text-white font-bold text-sm">{result.totalMinutes} min total</p>
                    <p className="text-slate-400 text-xs">
                      {busCount > 0 ? `${result.totalBusStops} bus stop${result.totalBusStops !== 1 ? 's' : ''}` : 'Walk only'}
                      {result.totalWalkMin > 0 ? ` · ${result.totalWalkMin} min walking` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {result.transfers === 0 && walkCount === 0 && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Direct</span>
                    )}
                    {result.transfers > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                        {result.transfers} transfer{result.transfers > 1 ? 's' : ''}
                      </span>
                    )}
                    {walkCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-full border border-sky-500/30">+ walk</span>
                    )}
                  </div>
                </div>

                {/* Step-by-step list */}
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                  {buildSteps(result).map((step, i, arr) => (
                    <div
                      key={i}
                      className={`flex gap-3 px-3 py-3 ${i < arr.length - 1 ? 'border-b border-slate-700/60' : ''} ${step.highlight ? 'bg-slate-700/30' : 'bg-slate-800/40'}`}
                    >
                      {/* Icon + connector line */}
                      <div className="flex flex-col items-center gap-0 flex-shrink-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: step.color + '25', border: `1.5px solid ${step.color}55` }}
                        >
                          {step.icon === 'walk' ? (
                            <svg className="w-4 h-4" style={{ color: step.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          ) : step.icon === 'arrive' ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                          ) : (
                            <span className="text-xs font-bold" style={{ color: step.color }}>{step.icon}</span>
                          )}
                        </div>
                        {i < arr.length - 1 && (
                          <div className="w-px mt-1" style={{ height: 'calc(100% - 28px)', minHeight: 8, background: step.color + '35' }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold leading-snug">{step.title}</p>
                        {step.sub && <p className="text-slate-400 text-xs mt-0.5 leading-snug">{step.sub}</p>}
                        {step.stopId && step.icon !== 'arrive' && (
                          <button
                            onClick={() => handleStopClick(step.stopId)}
                            className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Show on map →
                          </button>
                        )}
                      </div>

                      {/* Time */}
                      {step.timeMin != null && (
                        <span className="text-xs font-semibold text-slate-300 flex-shrink-0 pt-0.5">
                          ~{Math.round(step.timeMin)}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/60">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-white">54</p>
            <p className="text-xs text-slate-500">Bus Stops</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">15</p>
            <p className="text-xs text-slate-500">Active Routes</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
