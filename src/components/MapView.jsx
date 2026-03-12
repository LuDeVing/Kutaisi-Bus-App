import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import StopMarker from './StopMarker';
import BusMarker from './BusMarker';
import RoutePolyline from './RoutePolyline';
import { stops } from '../data/stops';
import { routesMap } from '../data/routes';

const KUTAISI_CENTER = [42.2662, 42.7180];

// Inner component to expose map instance
function MapController({ flyTo, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom || 17, { duration: 1.2 });
    }
  }, [flyTo, map]);

  return null;
}

export default function MapView({
  buses,
  selectedBus,
  selectedStop,
  onSelectBus,
  onSelectStop,
  flyTo,
  onMapReady,
}) {
  const selectedRoute = selectedBus ? routesMap[selectedBus.route_id] : null;

  return (
    <MapContainer
      center={KUTAISI_CENTER}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController flyTo={flyTo} onMapReady={onMapReady} />

      {/* Route highlight when bus selected */}
      {selectedRoute && <RoutePolyline route={selectedRoute} />}

      {/* All bus stops */}
      {stops.map(stop => (
        <StopMarker
          key={stop.id}
          stop={stop}
          isSelected={selectedStop?.id === stop.id}
          onSelect={onSelectStop}
        />
      ))}

      {/* Live buses */}
      {buses.map(bus => (
        <BusMarker
          key={bus.id}
          bus={bus}
          isSelected={selectedBus?.id === bus.id}
          onSelect={onSelectBus}
        />
      ))}
    </MapContainer>
  );
}
