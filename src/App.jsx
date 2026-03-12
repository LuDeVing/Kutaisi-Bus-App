import { useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import TripPlanner from './components/TripPlanner';
import MapView from './components/MapView';
import StopDetailPanel from './components/StopDetailPanel';
import BusDetailPanel from './components/BusDetailPanel';
import { useBusSimulation } from './hooks/useBusSimulation';
import { initialBuses } from './data/buses';

export default function App() {
  const buses = useBusSimulation(initialBuses);
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const mapRef = useRef(null);

  const handleSelectStop = useCallback((stop) => {
    setSelectedStop(stop);
    setSelectedBus(null);
    setFlyTo({ lat: stop.lat, lng: stop.lng, zoom: 17 });
  }, []);

  const handleSelectBus = useCallback((bus) => {
    // Sync with live bus data
    const liveBus = buses.find(b => b.id === bus.id) || bus;
    setSelectedBus(liveBus);
    setSelectedStop(null);
    setFlyTo({ lat: liveBus.lat, lng: liveBus.lng, zoom: 16 });
  }, [buses]);

  const handleClosePanel = useCallback(() => {
    setSelectedStop(null);
    setSelectedBus(null);
  }, []);

  // Keep selected bus synced with simulation
  const liveBus = selectedBus ? buses.find(b => b.id === selectedBus.id) || selectedBus : null;

  const showPanel = selectedStop || selectedBus;

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
            selectedBus={liveBus}
            selectedStop={selectedStop}
            onSelectBus={handleSelectBus}
            onSelectStop={handleSelectStop}
            flyTo={flyTo}
            onMapReady={(map) => { mapRef.current = map; }}
          />

          {/* Right detail panel */}
          {showPanel && (
            <div
              className="absolute top-3 right-3 bottom-3 w-80 bg-slate-800/95 backdrop-blur-sm rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col z-[1000]"
              style={{ animation: 'slideInRight 0.3s ease-out' }}
            >
              {selectedStop && (
                <StopDetailPanel
                  stop={selectedStop}
                  buses={buses}
                  onClose={handleClosePanel}
                  onSelectBus={handleSelectBus}
                />
              )}
              {liveBus && (
                <BusDetailPanel
                  bus={liveBus}
                  onClose={handleClosePanel}
                />
              )}
            </div>
          )}

          {/* Map overlay — live bus count badge */}
          <div className="absolute bottom-5 left-4 flex flex-col gap-2 z-[999]">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-white text-xs font-semibold">{buses.length} buses live</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-white text-xs font-semibold">120 stops</span>
            </div>
          </div>

          {/* Help hint */}
          {!showPanel && (
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
