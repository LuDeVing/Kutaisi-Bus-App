import { routes } from './routes';

// Generate random buses spread across all routes
function generateBuses() {
  const buses = [];
  let id = 101;

  for (const route of routes) {
    // 3-4 buses per route
    const busCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < busCount; i++) {
      const pathIndex = Math.floor(Math.random() * Math.max(1, route.path.length - 1));
      const progress = Math.random();
      const fromPt = route.path[pathIndex];
      const toPt = route.path[Math.min(pathIndex + 1, route.path.length - 1)];
      const lat = fromPt[0] + (toPt[0] - fromPt[0]) * progress;
      const lng = fromPt[1] + (toPt[1] - fromPt[1]) * progress;

      // Determine current/next stop based on position
      const stopIndex = Math.min(
        Math.floor((pathIndex / route.path.length) * route.stops.length),
        route.stops.length - 1
      );

      // ~80% chance a bus is active
      const isActive = Math.random() < 0.8;

      buses.push({
        id: id++,
        route_id: route.id,
        lat,
        lng,
        current_stop: '',
        next_stop: '',
        stopIndex,
        pathIndex,
        progress,
        isActive, // on/off status
      });
    }
  }

  return buses;
}

export const initialBuses = generateBuses();
