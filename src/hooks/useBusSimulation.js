import { useState, useEffect } from 'react';
import { routesMap } from '../data/routes';
import { stopsMap } from '../data/stops';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function useBusSimulation(initialBuses) {
  const [buses, setBuses] = useState(() =>
    initialBuses.map(bus => ({
      ...bus,
      pathIndex: bus.pathIndex || 0,
      progress: bus.progress || 0,
      isActive: bus.isActive !== undefined ? bus.isActive : true,
      direction: 1, // 1 = forward, -1 = backward (for looping)
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev =>
        prev.map(bus => {
          // Inactive buses don't move
          if (!bus.isActive) return bus;

          const route = routesMap[bus.route_id];
          if (!route) return bus;

          const path = route.path;
          const stopIds = route.stops;
          const maxSegmentIndex = path.length - 2;

          let newPathIndex = bus.pathIndex;
          let newProgress = bus.progress + 0.12 * bus.direction;
          let newDirection = bus.direction;

          if (newDirection === 1) {
            // Moving forward
            if (newProgress >= 1) {
              newProgress = 0;
              newPathIndex += 1;
              if (newPathIndex > maxSegmentIndex) {
                // Reached end — reverse direction for loop
                newDirection = -1;
                newPathIndex = maxSegmentIndex;
                newProgress = 1;
              }
            }
          } else {
            // Moving backward
            if (newProgress <= 0) {
              newProgress = 1;
              newPathIndex -= 1;
              if (newPathIndex < 0) {
                // Reached start — reverse direction for loop
                newDirection = 1;
                newPathIndex = 0;
                newProgress = 0;
              }
            }
          }

          // Ensure indices stay in bounds
          newPathIndex = Math.max(0, Math.min(newPathIndex, maxSegmentIndex));

          const fromPt = path[newPathIndex];
          const toPt = path[newPathIndex + 1];

          if (!fromPt || !toPt) return bus;

          const lat = lerp(fromPt[0], toPt[0], newProgress);
          const lng = lerp(fromPt[1], toPt[1], newProgress);

          // Map path position to stop index
          const routeProgress = (newPathIndex + newProgress) / path.length;
          const stopIndex = Math.min(
            Math.floor(routeProgress * stopIds.length),
            stopIds.length - 1
          );
          const nextStopIndex = Math.min(stopIndex + 1, stopIds.length - 1);
          const currentStopObj = stopsMap[stopIds[stopIndex]];
          const nextStopObj = stopsMap[stopIds[nextStopIndex]];

          return {
            ...bus,
            lat,
            lng,
            pathIndex: newPathIndex,
            progress: newProgress,
            direction: newDirection,
            stopIndex,
            current_stop: currentStopObj ? currentStopObj.name : bus.current_stop,
            next_stop: nextStopObj ? nextStopObj.name : bus.next_stop,
            stops_remaining: stopIds.length - stopIndex - 1,
          };
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return buses;
}
