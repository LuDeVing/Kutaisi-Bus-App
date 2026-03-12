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
  const [activeTripPlan, setActiveTripPlan] = useState(null);
  const [tripFrom, setTripFrom] = useState(null); // { type: 'stop', id, name } | { type: 'point', lat, lng }
  const [tripTo, setTripTo] = useState(null);
  const [pickMode, setPickMode] = useState(null); // 'from' | 'to' | null
  const mapRef = useRef(null);

  const handleMapClick = useCallback((lat, lng) => {
    if (pickMode === 'from') setTripFrom({ type: 'point', lat, lng });
    else if (pickMode === 'to') setTripTo({ type: 'point', lat, lng });
    setPickMode(null);
  }, [pickMode]);

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
        <TripPlanner
          onSelectStop={handleSelectStop}
          onTripFound={plan => setActiveTripPlan(plan && !plan.error ? plan : null)}
          tripFrom={tripFrom}
          tripTo={tripTo}
          onTripFromChange={setTripFrom}
          onTripToChange={setTripTo}
          pickMode={pickMode}
          onPickMode={setPickMode}
        />

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
            tripPlan={activeTripPlan}
            pickMode={pickMode}
            onMapClick={handleMapClick}
            tripFrom={tripFrom}
            tripTo={tripTo}
          />

          {/* Pick mode overlay */}
          {pickMode && (
            <div className="absolute inset-0 z-[998] pointer-events-none" style={{ outline: `3px solid ${pickMode === 'from' ? '#60a5fa' : '#4ade80'}`, outlineOffset: '-3px' }}>
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-xl ${pickMode === 'from' ? 'bg-blue-600' : 'bg-green-600'}`}>
                📍 Click anywhere to set {pickMode === 'from' ? 'start' : 'destination'}
              </div>
            </div>
          )}

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
                  onSetTripFrom={id => { setTripFrom({ type: 'stop', id: String(id), name: selectedStop.name }); setActiveTripPlan(null); }}
                  onSetTripTo={id => { setTripTo({ type: 'stop', id: String(id), name: selectedStop.name }); setActiveTripPlan(null); }}
                  tripFromId={tripFrom?.type === 'stop' ? tripFrom.id : ''}
                  tripToId={tripTo?.type === 'stop' ? tripTo.id : ''}
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
              <span className="text-white text-xs font-semibold">54 stops</span>
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
