import { routes } from '../data/routes';
import { stopsMap } from '../data/stops';

// Build adjacency: stopId -> [{toStopId, routeId, busNumber}]
function buildGraph() {
  const graph = {};
  for (const route of routes) {
    const stopList = route.stops;
    for (let i = 0; i < stopList.length - 1; i++) {
      const from = stopList[i];
      const to = stopList[i + 1];
      if (!graph[from]) graph[from] = [];
      graph[from].push({ to, routeId: route.id, busNumber: route.bus_number });
      // Also allow reverse direction
      if (!graph[to]) graph[to] = [];
      graph[to].push({ to: from, routeId: route.id, busNumber: route.bus_number });
    }
  }
  return graph;
}

// BFS returning path of {stopId, routeId, busNumber}
function bfs(fromId, toId, graph) {
  const queue = [{ stopId: fromId, path: [] }];
  const visited = new Set([fromId]);

  while (queue.length > 0) {
    const { stopId, path } = queue.shift();

    if (stopId === toId) return path;

    const neighbors = graph[stopId] || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({
          stopId: edge.to,
          path: [...path, { stopId: edge.to, routeId: edge.routeId, busNumber: edge.busNumber }],
        });
      }
    }
  }
  return null;
}

export function planTrip(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return null;

  const graph = buildGraph();
  const pathEdges = bfs(parseInt(fromId), parseInt(toId), graph);

  if (!pathEdges || pathEdges.length === 0) {
    return { error: 'No route found between these stops.' };
  }

  // Detect transfers: where bus number changes
  const segments = [];
  let currentBus = pathEdges[0].busNumber;
  let segmentStops = [parseInt(fromId)];

  for (const edge of pathEdges) {
    if (edge.busNumber !== currentBus) {
      segments.push({ busNumber: currentBus, stops: [...segmentStops] });
      currentBus = edge.busNumber;
      segmentStops = [segmentStops[segmentStops.length - 1]];
    }
    segmentStops.push(edge.stopId);
  }
  segments.push({ busNumber: currentBus, stops: segmentStops });

  const totalStops = pathEdges.length;
  const estimatedMinutes = totalStops * 3;
  const transfers = segments.length - 1;

  return {
    segments,
    totalStops,
    estimatedMinutes,
    transfers,
    fromStop: stopsMap[parseInt(fromId)],
    toStop: stopsMap[parseInt(toId)],
  };
}
