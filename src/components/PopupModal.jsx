import { routes, routesMap } from '../data/routes';
import { stopsMap } from '../data/stops';

function getArrivingBuses(stop, buses) {
  const arriving = [];

  for (const route of routes) {
    if (!route.stops.includes(stop.id)) continue;

    const routeBuses = buses.filter(b => b.route_id === route.id);
    const stopPositionInRoute = route.stops.indexOf(stop.id);

    for (const liveBus of routeBuses) {
      const busStopIndex = liveBus.stopIndex ?? 0;
      const diff = stopPositionInRoute - busStopIndex;
      const stopsAway = diff >= 0 ? diff : route.stops.length + diff;
      const eta = Math.max(1, stopsAway * 3 - Math.floor((liveBus.progress || 0) * 3));

      arriving.push({
        busId: liveBus.id,
        busNumber: route.bus_number,
        routeId: route.id,
        color: route.color,
        eta,
        isActive: liveBus.isActive !== false,
      });
    }

    // If no live bus exists for this route, show schedule estimate
    if (routeBuses.length === 0) {
      arriving.push({
        busId: null,
        busNumber: route.bus_number,
        routeId: route.id,
        color: route.color,
        eta: (stopPositionInRoute + 1) * 3,
        isActive: false,
      });
    }
  }

  return arriving.sort((a, b) => a.eta - b.eta);
}

export default function PopupModal({ type, stop, bus, buses, onClose, onSelectBus }) {
  if (!type) return null;

  // STOP POPUP
  if (type === 'stop' && stop) {
    const arriving = getArrivingBuses(stop, buses);

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-modal" onClick={e => e.stopPropagation()}>
          {/* Close button */}
          <button className="popup-close" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="popup-header">
            <div className="popup-icon stop-icon">🟢</div>
            <div>
              <h2 className="popup-title">{stop.name}</h2>
              <p className="popup-subtitle">Stop #{stop.id}</p>
            </div>
          </div>

          {/* Bus list */}
          <div className="popup-content">
            <h3 className="popup-section-title">Buses through this stop</h3>
            {arriving.length === 0 ? (
              <p className="popup-empty">No buses serve this stop.</p>
            ) : (
              <div className="popup-list">
                {arriving.map((item, i) => (
                  <button
                    key={`${item.routeId}-${item.busId || i}`}
                    className="popup-bus-item"
                    onClick={() => {
                      if (item.busId) {
                        const liveBus = buses.find(b => b.id === item.busId);
                        if (liveBus && onSelectBus) onSelectBus(liveBus);
                      }
                    }}
                  >
                    <div className="popup-bus-left">
                      <div className="popup-bus-badge" style={{ background: item.color }}>
                        {item.busNumber}
                      </div>
                      <div>
                        <p className="popup-bus-name">Bus {item.busNumber}</p>
                        <p className="popup-bus-status" style={{ color: item.isActive ? '#22c55e' : '#ef4444' }}>
                          {item.isActive ? '● Active' : '● Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="popup-bus-right">
                      <p className={`popup-eta ${item.eta <= 3 ? 'eta-soon' : item.eta <= 7 ? 'eta-mid' : ''}`}>
                        {item.eta} min
                      </p>
                      <p className="popup-eta-label">arriving</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // BUS POPUP
  if (type === 'bus' && bus) {
    const route = routesMap[bus.route_id];
    if (!route) return null;

    const stopIndex = bus.stopIndex ?? 0;
    const currentStop = stopsMap[route.stops[stopIndex]];
    const nextStopIdx = Math.min(stopIndex + 1, route.stops.length - 1);
    const nextStop = stopsMap[route.stops[nextStopIdx]];
    const firstStop = stopsMap[route.stops[0]];
    const lastStop = stopsMap[route.stops[route.stops.length - 1]];
    const stopsRemaining = route.stops.length - stopIndex - 1;
    const etaNext = Math.max(1, Math.round(3 - (bus.progress || 0) * 3));
    const isActive = bus.isActive !== false;

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-modal" onClick={e => e.stopPropagation()}>
          {/* Close button */}
          <button className="popup-close" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="popup-header" style={{ borderLeft: `4px solid ${route.color}` }}>
            <div className="popup-icon" style={{ background: route.color }}>
              {route.bus_number}
            </div>
            <div>
              <h2 className="popup-title">Bus #{route.bus_number}</h2>
              <p className="popup-subtitle" style={{ color: isActive ? '#22c55e' : '#ef4444' }}>
                {isActive ? '● Active' : '● Inactive'} — ID: {bus.id}
              </p>
            </div>
          </div>

          {/* Route info */}
          <div className="popup-content">
            <div className="popup-route-info">
              <div className="popup-route-endpoint">
                <span className="popup-route-label">From</span>
                <span className="popup-route-name">{firstStop?.name || 'Unknown'}</span>
              </div>
              <div className="popup-route-arrow">→</div>
              <div className="popup-route-endpoint">
                <span className="popup-route-label">To</span>
                <span className="popup-route-name">{lastStop?.name || 'Unknown'}</span>
              </div>
            </div>

            <div className="popup-stats">
              <div className="popup-stat">
                <span className="popup-stat-label">Current Stop</span>
                <span className="popup-stat-value">{currentStop?.name || 'En route'}</span>
              </div>
              <div className="popup-stat">
                <span className="popup-stat-label">Next Stop</span>
                <span className="popup-stat-value">{nextStop?.name || '—'}</span>
              </div>
              <div className="popup-stat">
                <span className="popup-stat-label">Time to Next</span>
                <span className="popup-stat-value" style={{ color: route.color, fontWeight: 700, fontSize: '1.25rem' }}>
                  {etaNext} min
                </span>
              </div>
              <div className="popup-stat">
                <span className="popup-stat-label">Stops Left</span>
                <span className="popup-stat-value" style={{ color: route.color, fontWeight: 700, fontSize: '1.25rem' }}>
                  {stopsRemaining}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
