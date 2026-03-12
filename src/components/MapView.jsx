import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import StopMarker from './StopMarker';
import BusMarker from './BusMarker';
import RoutePolyline from './RoutePolyline';
import { routesMap } from '../data/routes';

const KUTAISI_CENTER = [42.2662, 42.7180];

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
  visibleBuses,
  visibleStops,
  selectedBus,
  selectedStop,
  onSelectBus,
  onSelectStop,
  flyTo,
  onMapReady,
  filterMode,
}) {
  // Determine which route polylines to show
  const routesToShow = [];
  if (filterMode) {
    const seenRoutes = new Set();
    for (const bus of visibleBuses) {
      if (!seenRoutes.has(bus.route_id)) {
        seenRoutes.add(bus.route_id);
        const route = routesMap[bus.route_id];
        if (route) routesToShow.push(route);
      }
    }
  } else if (selectedBus) {
    const route = routesMap[selectedBus.route_id];
    if (route) routesToShow.push(route);
  }

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

      {/* Route polylines */}
      {routesToShow.map(route => (
        <RoutePolyline key={route.id} route={route} />
      ))}

      {/* Bus stops */}
      {visibleStops.map(stop => (
        <StopMarker
          key={stop.id}
          stop={stop}
          isSelected={selectedStop?.id === stop.id}
          onSelect={onSelectStop}
        />
      ))}

      {/* Live buses */}
      {visibleBuses.map(bus => (
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
