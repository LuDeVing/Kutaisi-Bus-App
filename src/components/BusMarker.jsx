import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { routesMap } from '../data/routes';

function createBusIcon(busNumber, color, isSelected) {
  const size = isSelected ? 44 : 36;
  return L.divIcon({
    className: '',
    html: `
      <div class="bus-marker-icon" style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 10px;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4)${isSelected ? ', 0 0 0 3px ' + color + '66' : ''};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <span style="font-size: ${isSelected ? '16px' : '14px'}; line-height:1;">🚌</span>
        <span style="
          color: white;
          font-size: 9px;
          font-weight: 800;
          font-family: system-ui;
          line-height: 1;
          margin-top: 1px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        ">${busNumber}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function BusMarker({ bus, isSelected, onSelect }) {
  const route = routesMap[bus.route_id];
  const color = route ? route.color : '#f59e0b';
  const busNumber = route ? route.bus_number : '?';

  return (
    <Marker
      position={[bus.lat, bus.lng]}
      icon={createBusIcon(busNumber, color, isSelected)}
      eventHandlers={{
        click: () => onSelect(bus),
      }}
      zIndexOffset={isSelected ? 1000 : 500}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>Bus {busNumber}</span>
        <br />
        <span style={{ fontSize: '11px', color: '#64748b' }}>{bus.current_stop}</span>
      </Tooltip>
    </Marker>
  );
}
