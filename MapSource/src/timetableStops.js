import { routes } from './data/routes.js';
import { stops, stopsMap } from './data/stops.js';

const originalStops = stops.slice();
const originalsByRoute = new Map(routes.map(route => [route.bus_number, route.stops.map((id, index) => ({
  id,
  name: stopsMap[id].name,
  waypoint: route.stopWaypoints[index],
}))]));
const originallyServed = new Set([...originalsByRoute.values()].flatMap(sequence => sequence.map(stop => stop.id)));

export function applyTimetableStops(segments) {
  const served = new Set();
  const customStops = [];
  for (const route of routes) {
    const originals = originalsByRoute.get(route.bus_number);
    const positions = new Map();
    for (const segment of segments.filter(segment => segment.route === route.bus_number)) {
      const original = originals.find(stop => stop.name === segment.stop);
      const waypoint = segment.customWaypoint ?? segment.startWaypoint ?? original?.waypoint;
      if (!Number.isInteger(waypoint) || !route.path[waypoint] || positions.has(waypoint)) continue;

      if (original?.waypoint === waypoint && segment.customWaypoint == null) {
        positions.set(waypoint, original.id);
        served.add(original.id);
      } else {
        const [lat, lng] = route.path[waypoint];
        const stop = { id: -(route.id * 1_000_000 + waypoint), name: segment.stop, lat, lng };
        positions.set(waypoint, stop.id);
        customStops.push(stop);
      }
    }
    const ordered = [...positions].sort(([a], [b]) => a - b);
    route.stopWaypoints = ordered.map(([waypoint]) => waypoint);
    route.stops = ordered.map(([, id]) => id);
  }

  for (const stop of stops) delete stopsMap[stop.id];
  stops.length = 0;
  for (const stop of [...originalStops.filter(stop => served.has(stop.id) || !originallyServed.has(stop.id)), ...customStops]) {
    stops.push(stop);
    stopsMap[stop.id] = stop;
  }
}
