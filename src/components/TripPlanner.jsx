import { useState } from 'react';
import { stops } from '../data/stops';
import { planTrip } from '../utils/tripPlanner';
import { routesMap } from '../data/routes';
import { stopsMap } from '../data/stops';

const sortedStops = [...stops].sort((a, b) => a.name.localeCompare(b.name));

export default function TripPlanner({ onSelectStop }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFind() {
    if (!fromId || !toId) return;
    setLoading(true);
    setTimeout(() => {
      const res = planTrip(fromId, toId);
      setResult(res);
      setLoading(false);
    }, 400);
  }

  function handleStopClick(stopId) {
    const stop = stopsMap[stopId];
    if (stop) onSelectStop(stop);
  }

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
        <p className="text-slate-400 text-xs">Find the best route between stops</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Form */}
        <div className="p-4 space-y-3">
          {/* From */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              From
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-400"></div>
              </div>
              <select
                value={fromId}
                onChange={e => { setFromId(e.target.value); setResult(null); }}
                className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">Select start stop</option>
                {sortedStops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={() => { setFromId(toId); setToId(fromId); setResult(null); }}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Swap stops"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              To
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
              <select
                value={toId}
                onChange={e => { setToId(e.target.value); setResult(null); }}
                className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
              >
                <option value="">Select destination</option>
                {sortedStops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Find button */}
          <button
            onClick={handleFind}
            disabled={!fromId || !toId || loading}
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
          <div className="px-4 pb-4">
            {result.error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm font-medium">Route Not Found</p>
                <p className="text-slate-400 text-xs mt-1">{result.error}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                {/* Result header */}
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm">Route Found</p>
                    <div className="flex items-center gap-1.5">
                      {result.transfers > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                          {result.transfers} transfer{result.transfers > 1 ? 's' : ''}
                        </span>
                      )}
                      {result.transfers === 0 && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                          Direct
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-px bg-slate-700">
                  <div className="bg-slate-800 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{result.totalStops}</p>
                    <p className="text-xs text-slate-400">stops</p>
                  </div>
                  <div className="bg-slate-800 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{result.estimatedMinutes}</p>
                    <p className="text-xs text-slate-400">minutes</p>
                  </div>
                </div>

                {/* Segments */}
                <div className="bg-slate-800/50 p-3 space-y-3">
                  {result.segments.map((seg, segIdx) => {
                    const route = Object.values(routesMap).find(r => r.bus_number === seg.busNumber);
                    return (
                      <div key={segIdx}>
                        {segIdx > 0 && (
                          <div className="flex items-center gap-2 py-2 text-xs text-amber-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Transfer here
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: route ? route.color : '#64748b' }}
                          >
                            {seg.busNumber}
                          </div>
                          <p className="text-white text-sm font-medium">Take Bus {seg.busNumber}</p>
                        </div>
                        <div className="ml-9 space-y-1">
                          {seg.stops.map((stopId, idx) => {
                            const stop = stopsMap[stopId];
                            const isFirst = idx === 0;
                            const isLast = idx === seg.stops.length - 1;
                            return (
                              <button
                                key={stopId}
                                onClick={() => handleStopClick(stopId)}
                                className="flex items-center gap-2 text-left hover:bg-slate-700 rounded-lg px-2 py-1 w-full transition-colors group"
                              >
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  isFirst ? 'bg-blue-400' : isLast ? 'bg-green-400' : 'bg-slate-500'
                                }`}></div>
                                <span className={`text-xs ${isFirst || isLast ? 'text-white font-medium' : 'text-slate-400'} group-hover:text-white transition-colors`}>
                                  {stop ? stop.name : `Stop ${stopId}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-4 border-t border-slate-700/60">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-white">120</p>
            <p className="text-xs text-slate-500">Bus Stops</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">3</p>
            <p className="text-xs text-slate-500">Active Routes</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
