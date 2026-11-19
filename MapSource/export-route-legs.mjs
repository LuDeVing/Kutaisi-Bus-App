import { writeFileSync } from 'node:fs';
import { routes } from './src/data/routes.js';
import { stopsMap } from './src/data/stops.js';

const catalog = Object.fromEntries(routes.map(route => [
  route.bus_number,
  route.stopWaypoints.slice(0, -1).map((start, i) => ({
    label: `${i + 1}. ${stopsMap[route.stops[i]].name} → ${stopsMap[route.stops[i + 1]].name}`,
    origin: stopsMap[route.stops[i]].name,
    destination: stopsMap[route.stops[i + 1]].name,
    start,
    end: route.stopWaypoints[i + 1],
  })),
]));

writeFileSync(new URL('./dist/route-legs.json', import.meta.url), JSON.stringify(catalog));
