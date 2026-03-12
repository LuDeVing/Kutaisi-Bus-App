import { useState, useCallback, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import TripPlanner from './components/TripPlanner';
import MapView from './components/MapView';
import PopupModal from './components/PopupModal';
import { useBusSimulation } from './hooks/useBusSimulation';
import { initialBuses } from './data/buses';
import { stops } from './data/stops';
import { routes, routesMap } from './data/routes';

export default function App() {
  const buses = useBusSimulation(initialBuses);
  const [filterMode, setFilterMode] = useState(null); // null | { type: 'stop', stopId } | { type: 'bus', busId }
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const mapRef = useRef(null);

  // Compute visible stops and buses based on filter mode
  const { visibleStops, visibleBuses } = useMemo(() => {
    if (!filterMode) {
      return { visibleStops: stops, visibleBuses: buses };
    }

    if (filterMode.type === 'stop') {
      // Find all routes that pass through this stop
      const relevantRoutes = routes.filter(r => r.stops.includes(filterMode.stopId));
      const routeIds = new Set(relevantRoutes.map(r => r.id));

      // Only show buses on those routes
      const filteredBuses = buses.filter(b => routeIds.has(b.route_id));

      // Only show stops that belong to those routes
      const relevantStopIds = new Set();
      for (const route of relevantRoutes) {
        for (const sId of route.stops) {
          relevantStopIds.add(sId);
        }
      }
      const filteredStops = stops.filter(s => relevantStopIds.has(s.id));

      return { visibleStops: filteredStops, visibleBuses: filteredBuses };
    }

    if (filterMode.type === 'bus') {
      const bus = buses.find(b => b.id === filterMode.busId);
      if (!bus) return { visibleStops: stops, visibleBuses: buses };

      const route = routesMap[bus.route_id];
      if (!route) return { visibleStops: [bus], visibleBuses: [bus] };

      // Only the selected bus
      const filteredBuses = [bus];

      // Only stops on this bus's route
      const routeStopIds = new Set(route.stops);
      const filteredStops = stops.filter(s => routeStopIds.has(s.id));

      return { visibleStops: filteredStops, visibleBuses: filteredBuses };
    }

    return { visibleStops: stops, visibleBuses: buses };
  }, [filterMode, buses]);

  const handleSelectStop = useCallback((stop) => {
    setSelectedStop(stop);
    setSelectedBus(null);
    setFilterMode({ type: 'stop', stopId: stop.id });
    setFlyTo({ lat: stop.lat, lng: stop.lng, zoom: 16 });
  }, []);

  const handleSelectBus = useCallback((bus) => {
    const liveBus = buses.find(b => b.id === bus.id) || bus;
    setSelectedBus(liveBus);
    setSelectedStop(null);
    setFilterMode({ type: 'bus', busId: liveBus.id });
    setFlyTo({ lat: liveBus.lat, lng: liveBus.lng, zoom: 16 });
  }, [buses]);

  const handleClosePopup = useCallback(() => {
    setSelectedStop(null);
    setSelectedBus(null);
    setFilterMode(null);
  }, []);

  // Keep selected bus synced with simulation
  const liveBus = selectedBus ? buses.find(b => b.id === selectedBus.id) || selectedBus : null;

  const activeBusCount = buses.filter(b => b.isActive !== false).length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Top navbar */}
      <Navbar
        onSelectStop={handleSelectStop}
        onSelectBus={handleSelectBus}
        buses={buses}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar - Trip Planner */}
        <TripPlanner onSelectStop={handleSelectStop} />

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            buses={buses}
            visibleBuses={visibleBuses}
            visibleStops={visibleStops}
            selectedBus={liveBus}
            selectedStop={selectedStop}
            onSelectBus={handleSelectBus}
            onSelectStop={handleSelectStop}
            flyTo={flyTo}
            onMapReady={(map) => { mapRef.current = map; }}
            filterMode={filterMode}
          />

          {/* Popup Modal */}
          <PopupModal
            type={filterMode?.type || null}
            stop={selectedStop}
            bus={liveBus}
            buses={buses}
            onClose={handleClosePopup}
            onSelectBus={handleSelectBus}
          />

          {/* Map overlay — live bus count badge */}
          <div className="absolute bottom-5 left-4 flex flex-col gap-2 z-[999]">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-white text-xs font-semibold">{activeBusCount} buses active</span>
              <span className="text-slate-500 text-xs">/ {buses.length} total</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-white text-xs font-semibold">{stops.length} stops</span>
            </div>
          </div>

          {/* Help hint */}
          {!filterMode && (
            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-xl px-4 py-3 shadow-lg z-[999] max-w-xs">
              <p className="text-white text-sm font-semibold mb-1">Get started</p>
              <p className="text-slate-400 text-xs">Click any 🟢 stop or 🚌 bus icon to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
