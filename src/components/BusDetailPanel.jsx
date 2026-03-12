import { routesMap } from '../data/routes';
import { stopsMap } from '../data/stops';

export default function BusDetailPanel({ bus, onClose }) {
  if (!bus) return null;

  const route = routesMap[bus.route_id];
  if (!route) return null;

  const stopIndex = bus.stopIndex ?? 0;
  const stopsRemaining = route.stops.length - stopIndex - 1;

  return (
    <div className="panel-slide-in flex flex-col h-full">
      {/* Header */}
      <div
        className="p-5 border-b border-slate-700"
        style={{ background: `linear-gradient(135deg, ${route.color}22, transparent)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ background: route.color }}
              >
                {route.bus_number}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: route.color }}>
                  Bus Route {route.bus_number}
                </p>
                <p className="text-xs text-slate-400">ID: {bus.id}</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">Bus #{route.bus_number}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-700">
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
          <p className="text-xs text-slate-400 mb-1">Current Stop</p>
          <p className="text-white font-semibold text-sm leading-tight">{bus.current_stop}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
          <p className="text-xs text-slate-400 mb-1">Next Stop</p>
          <p className="text-white font-semibold text-sm leading-tight">{bus.next_stop}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
          <p className="text-xs text-slate-400 mb-1">Stops Remaining</p>
          <p className="text-2xl font-bold" style={{ color: route.color }}>{stopsRemaining}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
          <p className="text-xs text-slate-400 mb-1">ETA Terminus</p>
          <p className="text-2xl font-bold text-white">{stopsRemaining * 3}<span className="text-sm text-slate-400 ml-1">min</span></p>
        </div>
      </div>

      {/* Route stop list */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Full Route — {route.stops.length} Stops
        </h3>
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[19px] top-5 bottom-5 w-0.5"
            style={{ background: `${route.color}44` }}
          ></div>

          <div className="space-y-1">
            {route.stops.map((stopId, idx) => {
              const stop = stopsMap[stopId];
              const isCurrent = idx === stopIndex;
              const isPast = idx < stopIndex;
              const isNext = idx === stopIndex + 1;

              return (
                <div key={stopId} className={`flex items-center gap-3 relative py-1.5 px-2 rounded-lg transition-colors ${isCurrent ? 'bg-slate-700/70' : ''}`}>
                  {/* Dot */}
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center z-10"
                    style={{
                      background: isCurrent ? route.color : isPast ? '#334155' : '#1e293b',
                      borderColor: isCurrent ? route.color : isPast ? '#475569' : '#334155',
                    }}
                  >
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCurrent ? 'text-white' : isPast ? 'text-slate-500' : 'text-slate-300'
                    }`}>
                      {stop ? stop.name : `Stop ${stopId}`}
                    </p>
                    {isCurrent && (
                      <p className="text-xs" style={{ color: route.color }}>● Current position</p>
                    )}
                    {isNext && (
                      <p className="text-xs text-amber-400">→ Next stop</p>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex-shrink-0">
                    {isCurrent ? '🚌' : isPast ? '✓' : `+${(idx - stopIndex) * 3}m`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: route.color }}></div>
          <span>Position updated live</span>
        </div>
      </div>
    </div>
  );
}
