# Kutaisi Smart Bus

KIU C# midterm · Topic 13 · Devi Chikovani

The Windows Forms **Timetable** lists one row per stop-to-stop segment, grouped by bus line. Its initial rows follow the stop order in the original React project. Each line includes a final-to-first connection for the timetable. For example, Bus 30 shows Korkia Street → Music School, Music School → Train Station, and Train Station → Korkia Street.

- Use Add to insert one or two stops within drawn sections of a selected bus line. Choose a segment and a percentage along it for each new stop. Existing stops only need their names. Duplicate or out-of-order links are rejected with an explanation. Edit times, fare, and service for a segment. Renaming an added stop updates both adjacent rows. Delete removes the Stop on the selected row from its bus line and joins its neighbors. A line must retain at least two stops. Search by bus line, stop, or next stop and combine search with the service filter.
- Departure and arrival show a sample morning schedule estimated from route lengths, with one minute between legs. These times are editable and do not represent published bus service. The initial fare is a sample GEL 0.60. Bus 22 is marked Express in the seed to demonstrate both service categories.
- Add splits affected drawn segments and updates the map. An undrawn final-to-first connection cannot be selected for a new stop.
- Export CSV saves the displayed rows using UTF-8 and the Windows regional list separator so the columns open correctly in local Excel. In **Map & trip planner**, use the **Timetable** button to see the same saved rows. WinForms sends each saved change to React. Stop markers and route sequences also update.

## Database and setup

1. Install Visual Studio 2026 with .NET desktop development, .NET 9 targeting support, SQL Server Express LocalDB, and Microsoft Edge WebView2 Runtime.
2. Open a new query against `(localdb)\MSSQLLocalDB` in **SQL Server Object Explorer** and run `KutaisiSmartBus/database.sql`. The script creates `KutaisiRouteTimetableDb` and its one table `dbo.Segments` and inserts the initial route rows once.
3. Open `KutaisiSmartBus.sln`, choose **Build → Rebuild Solution**, then press F5.
4. Search for `Bus 30` to demonstrate the three rows for the example. Clear the search, then choose **Express** to see the sample Bus 22 segments.

Columns are Id, Route, Stop, NextStop, Departure, Arrival, Fare, IsExpress, SortOrder, StartWaypoint, EndWaypoint, and CustomWaypoint. The last three waypoint columns are used only to locate a segment and its custom stop on the map.

The original React source is in `MapSource`. To rebuild the bundled map, run `npm ci`, `npm run build`, and `node export-route-legs.mjs` there and copy `MapSource/dist` into `KutaisiSmartBus/Map`. Run `node export-segments.mjs` to regenerate the initial SQL seed from the React data. Map tiles and online walking-route geometry require an internet connection.
