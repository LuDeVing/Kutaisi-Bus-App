import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

function createStopIcon(isSelected) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${isSelected ? '18px' : '12px'};
        height: ${isSelected ? '18px' : '12px'};
        background: ${isSelected ? '#22c55e' : '#4ade80'};
        border: 2px solid ${isSelected ? '#fff' : '#16a34a'};
        border-radius: 50%;
        box-shadow: 0 0 0 ${isSelected ? '4px' : '0px'} rgba(34,197,94,0.4);
        transition: all 0.2s ease;
        cursor: pointer;
      "></div>
    `,
    iconSize: [isSelected ? 18 : 12, isSelected ? 18 : 12],
    iconAnchor: [isSelected ? 9 : 6, isSelected ? 9 : 6],
  });
}

export default function StopMarker({ stop, isSelected, onSelect }) {
  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={createStopIcon(isSelected)}
      eventHandlers={{
        click: () => onSelect(stop),
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>{stop.name}</span>
      </Tooltip>
    </Marker>
  );
}
