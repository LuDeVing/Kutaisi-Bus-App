import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { routesMap } from '../data/routes';

function createBusIcon(busNumber, color, isSelected, isDwelling, destination) {
  const size = isSelected ? 52 : 44;
  const destLabel = destination ? `→ ${destination.slice(0, 9)}` : '';
  const borderColor = isDwelling ? '#4ade80' : 'white';
  const glowColor = isDwelling ? '#22c55e' : color;
  const dwellingRing = isDwelling
    ? `box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 4px ${glowColor}88;`
    : isSelected
    ? `box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 3px ${color}66;`
    : `box-shadow: 0 4px 12px rgba(0,0,0,0.4);`;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; display:inline-block;">
        <div class="bus-marker-icon" style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 10px;
          border: 2px solid ${borderColor};
          ${dwellingRing}
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          cursor: pointer;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          padding: 2px;
        ">
          <span style="font-size:${isSelected ? '16px' : '14px'}; line-height:1;">🚌</span>
          <span style="color:white;font-size:9px;font-weight:800;font-family:system-ui;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,0.5);">
            ${busNumber}
          </span>
          ${destLabel ? `<span style="color:rgba(255,255,255,0.85);font-size:7px;font-family:system-ui;line-height:1;margin-top:1px;white-space:nowrap;overflow:hidden;max-width:${size-6}px;text-overflow:ellipsis;">${destLabel}</span>` : ''}
        </div>
        ${isDwelling ? `<div style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#4ade80;border-radius:50%;border:1.5px solid white;animation:pulse 1s ease-in-out infinite;"></div>` : ''}
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
  const isDwelling = bus.status === 'dwelling';

  return (
    <Marker
      position={[bus.lat, bus.lng]}
      icon={createBusIcon(busNumber, color, isSelected, isDwelling, bus.destination)}
      eventHandlers={{ click: () => onSelect(bus) }}
      zIndexOffset={isDwelling ? 900 : isSelected ? 1000 : 500}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={0.97}>
        <div style={{ fontSize: '12px' }}>
          <span style={{ fontWeight: 700 }}>Bus {busNumber}</span>
          {isDwelling && (
            <span style={{ marginLeft: 6, fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● AT STOP</span>
          )}
          <br />
          <span style={{ color: '#64748b', fontSize: 11 }}>
            {isDwelling ? `Stopped: ${bus.current_stop}` : `En route to ${bus.next_stop}`}
          </span>
          {bus.destination && (
            <>
              <br />
              <span style={{ color: '#94a3b8', fontSize: 10 }}>→ {bus.destination}</span>
            </>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
}
