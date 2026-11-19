import { writeFileSync } from 'node:fs';
import { routes } from './src/data/routes.js';
import { stopsMap } from './src/data/stops.js';

const text = value => "N'" + value.replaceAll("'", "''") + "'";
const radians = degrees => degrees * Math.PI / 180;
function distanceKm([lat1, lon1], [lat2, lon2]) {
  const lat = radians(lat2 - lat1);
  const lon = radians(lon2 - lon1);
  const a = Math.sin(lat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
function clock(minutes) {
  const hour = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return "'" + hour + ":" + minute + "'";
}

const rows = routes.flatMap((route, routeIndex) => {
  const pairs = route.stops.map((id, i) => {
    const next = (i + 1) % route.stops.length;
    const origin = stopsMap[id];
    const destination = stopsMap[route.stops[next]];
    const start = next ? route.stopWaypoints[i] : null;
    const end = next ? route.stopWaypoints[next] : null;
    const path = start === null
      ? [[origin.lat, origin.lng], [destination.lat, destination.lng]]
      : route.path.slice(start, end + 1);
    const distance = path.slice(1).reduce((total, point, index) =>
      total + distanceKm(path[index], point), 0);
    // Estimate at 18 km/h, with a higher allowance for undrawn return legs.
    const duration = Math.max(2, Math.ceil(distance / 18 * 60 * (next ? 1 : 1.35)));
    return { stop: origin.name, nextStop: destination.name, start, end, duration };
  });
  if (route.bus_number === '30') pairs.push(pairs.shift());

  let departure = 7 * 60 + routeIndex * 2;
  return pairs.map((pair, i) => {
    const arrival = departure + pair.duration;
    const row = '    (' + [
      text(route.bus_number), text(pair.stop), text(pair.nextStop),
      clock(departure), clock(arrival), i + 1, pair.start ?? 'NULL', pair.end ?? 'NULL',
    ].join(', ') + ')';
    departure = arrival + 1;
    return row;
  });
});

const opening = `IF DB_ID(N'KutaisiRouteTimetableDb') IS NULL
    CREATE DATABASE KutaisiRouteTimetableDb;
GO
USE KutaisiRouteTimetableDb;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;
DECLARE @Schedule TABLE
(
    Route NVARCHAR(20), Stop NVARCHAR(100), NextStop NVARCHAR(100),
    Departure TIME(0), Arrival TIME(0), SortOrder INT, StartWaypoint INT, EndWaypoint INT
);
INSERT INTO @Schedule VALUES
`;
const schema = `
IF OBJECT_ID(N'dbo.Segments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Segments
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Route NVARCHAR(20) NOT NULL,
        Stop NVARCHAR(100) NOT NULL,
        NextStop NVARCHAR(100) NOT NULL,
        Departure TIME(0) NULL,
        Arrival TIME(0) NULL,
        Fare DECIMAL(6,2) NOT NULL DEFAULT (0.60) CHECK (Fare BETWEEN 0 AND 100),
        IsExpress BIT NOT NULL DEFAULT (0),
        SortOrder INT NOT NULL,
        StartWaypoint INT NULL,
        EndWaypoint INT NULL,
        CustomWaypoint INT NULL,
        CHECK (Stop <> NextStop)
    );
    INSERT INTO dbo.Segments
        (Route, Stop, NextStop, Departure, Arrival, SortOrder, StartWaypoint, EndWaypoint, IsExpress)
    SELECT Route, Stop, NextStop, Departure, Arrival, SortOrder, StartWaypoint, EndWaypoint,
        CASE WHEN Route = N'22' THEN 1 ELSE 0 END
    FROM @Schedule;
END;
ELSE
BEGIN
    -- Existing timetables keep their edits. Fill only missing times for original segments.
    UPDATE segment
    SET Departure = COALESCE(segment.Departure,
            CONVERT(TIME(0), DATEADD(MINUTE, -travel.Minutes, CONVERT(DATETIME2, segment.Arrival))),
            sample.Departure),
        Arrival = COALESCE(segment.Arrival,
            CONVERT(TIME(0), DATEADD(MINUTE, travel.Minutes, CONVERT(DATETIME2, segment.Departure))),
            sample.Arrival)
    FROM dbo.Segments AS segment
    JOIN @Schedule AS sample ON sample.Route = segment.Route AND sample.Stop = segment.Stop
        AND sample.NextStop = segment.NextStop
    CROSS APPLY (VALUES (DATEDIFF(MINUTE, sample.Departure, sample.Arrival))) AS travel(Minutes)
    WHERE segment.Departure IS NULL OR segment.Arrival IS NULL;
END;
COMMIT;
GO
`;
writeFileSync(new URL('../KutaisiSmartBus/database.sql', import.meta.url),
  opening + rows.join(',\n') + ';\n' + schema);
