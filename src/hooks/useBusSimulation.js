import { useState, useEffect } from 'react';
import { routesMap } from '../data/routes';
import { stopsMap } from '../data/stops';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function useBusSimulation(initialBuses) {
  const [buses, setBuses] = useState(() =>
    initialBuses.map((bus, i) => ({
      ...bus,
      pathIndex: 0,
      // Stagger starting progress so buses don't all move in sync
      progress: (i * 0.33) % 1,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev =>
        prev.map(bus => {
          const route = routesMap[bus.route_id];
          if (!route) return bus;

          const path = route.path;
          const stopIds = route.stops;
          // Number of valid segments: path[0]→path[1], ..., path[n-2]→path[n-1]
          const maxSegmentIndex = path.length - 2;

          let newPathIndex = bus.pathIndex;
          let newProgress = bus.progress + 0.008; // ~125 ticks per segment = ~12.5s per stop

          if (newProgress >= 1) {
            newProgress = 0;
            newPathIndex = newPathIndex >= maxSegmentIndex ? 0 : newPathIndex + 1;
          }

          const fromPt = path[newPathIndex];
          const toPt = path[newPathIndex + 1]; // safe: never wraps past end

          const lat = lerp(fromPt[0], toPt[0], newProgress);
          const lng = lerp(fromPt[1], toPt[1], newProgress);

          const stopIndex = Math.min(newPathIndex, stopIds.length - 1);
          const nextStopIndex = Math.min(newPathIndex + 1, stopIds.length - 1);
          const currentStopObj = stopsMap[stopIds[stopIndex]];
          const nextStopObj = stopsMap[stopIds[nextStopIndex]];
          const stopsRemaining = stopIds.length - stopIndex - 1;

          return {
            ...bus,
            lat,
            lng,
            pathIndex: newPathIndex,
            progress: newProgress,
            stopIndex,
            current_stop: currentStopObj ? currentStopObj.name : bus.current_stop,
            next_stop: nextStopObj ? nextStopObj.name : bus.next_stop,
            stops_remaining: stopsRemaining,
          };
        })
      );
    }, 100); // 100ms ticks for smooth movement

    return () => clearInterval(interval);
  }, []);

  return buses;
}
