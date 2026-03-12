import { routes } from '../data/routes';
import { routesMap } from '../data/routes';

function getArrivingBuses(stop, buses) {
  const arriving = [];

  for (const route of routes) {
    if (!route.stops.includes(stop.id)) continue;

    // Find if there's a live bus on this route
    const liveBus = buses.find(b => b.route_id === route.id);
    const stopPositionInRoute = route.stops.indexOf(stop.id);

    let eta;
    if (liveBus) {
      const busStopIndex = liveBus.stopIndex ?? 0;
      const diff = stopPositionInRoute - busStopIndex;
      const stopsAway = diff >= 0 ? diff : route.stops.length + diff;
      eta = Math.max(1, stopsAway * 3 - Math.floor(liveBus.progress * 3));
    } else {
      eta = (stopPositionInRoute + 1) * 3;
    }

    arriving.push({
      busNumber: route.bus_number,
      routeId: route.id,
      color: route.color,
      eta,
    });
  }

  return arriving.sort((a, b) => a.eta - b.eta);
}

export default function StopDetailPanel({ stop, buses, onClose, onSelectBus }) {
  if (!stop) return null;

  const arriving = getArrivingBuses(stop, buses);

  return (
    <div className="panel-slide-in flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></div>
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Bus Stop</span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">{stop.name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">Stop #{stop.id}</p>
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

      {/* Coordinates */}
      <div className="px-5 py-3 border-b border-slate-700/50">
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Lat: {stop.lat.toFixed(4)}</span>
          <span>Lng: {stop.lng.toFixed(4)}</span>
        </div>
      </div>

      {/* Arriving buses */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Arriving Buses
        </h3>

        {arriving.length === 0 ? (
          <p className="text-slate-500 text-sm">No buses serve this stop.</p>
        ) : (
          <div className="space-y-2">
            {arriving.map(({ busNumber, routeId, color, eta }) => (
              <button
                key={routeId}
                onClick={() => {
                  const bus = buses.find(b => b.route_id === routeId);
                  if (bus) onSelectBus(bus);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors border border-slate-600/50 hover:border-slate-500 group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                    style={{ background: color }}
                  >
                    {busNumber}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">Bus {busNumber}</p>
                    <p className="text-slate-400 text-xs">
                      {routesMap[routeId]?.stops.length} stops on route
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${eta <= 3 ? 'text-green-400' : eta <= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {eta} min
                  </p>
                  <p className="text-xs text-slate-500">arriving</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>Live arrivals updated every 5s</span>
        </div>
      </div>
    </div>
  );
}
