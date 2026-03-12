import SearchBar from './SearchBar';
import { routes } from '../data/routes';

export default function Navbar({ onSelectStop, onSelectBus, buses }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-700/60 relative flex-shrink-0" style={{ zIndex: 2000 }}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <span className="text-xl">🚌</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none tracking-tight">
            Kutaisi Smart Bus
          </h1>
          <p className="text-slate-400 text-xs">Real-time transit map</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-6">
        <SearchBar
          onSelectStop={onSelectStop}
          onSelectBus={onSelectBus}
          buses={buses}
        />
      </div>

      {/* Route legend */}
      <div className="flex items-center gap-3">
        {routes.map(route => (
          <div key={route.id} className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: route.color }}
            >
              {route.bus_number}
            </div>
            <span className="text-slate-400 text-xs hidden lg:block">Route {route.bus_number}</span>
          </div>
        ))}
        <div className="w-px h-6 bg-slate-700 mx-1"></div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-slate-400 text-xs hidden lg:block">Stop</span>
        </div>
      </div>
    </header>
  );
}
