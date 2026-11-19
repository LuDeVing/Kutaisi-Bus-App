using Microsoft.Data.SqlClient;
using System.Data;

namespace KutaisiSmartBus;

internal sealed class SegmentRepository
{
    private const string ConnectionString =
        @"Server=(localdb)\MSSQLLocalDB;Database=KutaisiRouteTimetableDb;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=5";

    public List<Segment> Search(string text, bool? express, bool exactRoute = false)
    {
        const string sql = """
            SELECT Id, Route, Stop, NextStop, Departure, Arrival, Fare, IsExpress,
                SortOrder, StartWaypoint, EndWaypoint, CustomWaypoint
            FROM dbo.Segments
            WHERE ((@exactRoute = 1 AND Route = @text) OR
                (@exactRoute = 0 AND (@text = N'' OR Route LIKE @pattern OR Stop LIKE @pattern OR NextStop LIKE @pattern)))
              AND (@filter = 0 OR IsExpress = @express)
            ORDER BY CASE WHEN TRY_CONVERT(INT, Route) IS NULL THEN 1 ELSE 0 END,
                TRY_CONVERT(INT, Route), Route, SortOrder, Id;
            """;
        string escaped = text.Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
        using var connection = new SqlConnection(ConnectionString);
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@text", text);
        command.Parameters.AddWithValue("@exactRoute", exactRoute);
        command.Parameters.AddWithValue("@pattern", $"%{escaped}%");
        command.Parameters.AddWithValue("@filter", express.HasValue);
        command.Parameters.AddWithValue("@express", express.GetValueOrDefault());
        connection.Open();
        using var reader = command.ExecuteReader();
        return ReadSegments(reader);
    }

    private static List<Segment> ReadSegments(SqlDataReader reader)
    {
        var segments = new List<Segment>();
        while (reader.Read())
            segments.Add(new Segment(reader.GetInt32(0), reader.GetString(1), reader.GetString(2),
                reader.GetString(3), reader.IsDBNull(4) ? null : reader.GetTimeSpan(4),
                reader.IsDBNull(5) ? null : reader.GetTimeSpan(5), reader.GetDecimal(6), reader.GetBoolean(7),
                reader.GetInt32(8), ReadInt(9), ReadInt(10), ReadInt(11)));
        return segments;

        int? ReadInt(int index) => reader.IsDBNull(index) ? null : reader.GetInt32(index);
    }

    public void Update(Segment original, Segment edited)
    {
        WithRoute(original, (connection, transaction, route, index) =>
        {
            Segment current = route[index];
            if (!Same(edited.Route, current.Route) || !Same(edited.NextStop, current.NextStop))
                throw new InvalidOperationException("Edit keeps the existing line and next stop. Use Add or Delete to change the route order.");

            string name = edited.Stop.Trim();
            if (name.Length == 0)
                throw new InvalidOperationException("Enter a name for the stop.");
            if (name != current.Stop)
            {
                if (!current.CustomWaypoint.HasValue)
                    throw new InvalidOperationException("This stop comes from the original map. Only added stops can be renamed.");
                if (route.Any(segment => segment.Id != current.Id && Same(segment.Stop, name)))
                    throw new InvalidOperationException($"Bus {current.Route} already has a stop named “{name}”.");

                Segment previous = Previous(route, index);
                Run(connection, transaction, "UPDATE dbo.Segments SET NextStop = @name WHERE Id = @id;",
                    new SqlParameter("@name", name), new SqlParameter("@id", previous.Id));
            }

            Run(connection, transaction, """
                UPDATE dbo.Segments SET Stop = @name, Departure = @departure, Arrival = @arrival,
                    Fare = @fare, IsExpress = @express WHERE Id = @id;
                """, new SqlParameter("@name", name), TimeParameter("@departure", edited.Departure),
                TimeParameter("@arrival", edited.Arrival), new SqlParameter("@fare", edited.Fare),
                new SqlParameter("@express", edited.IsExpress), new SqlParameter("@id", current.Id));
        });
    }

    public void Delete(Segment original)
    {
        WithRoute(original, (connection, transaction, route, index) =>
        {
            if (route.Count <= 2)
                throw new InvalidOperationException("This line needs at least two stops. Removing another would leave no valid connection.");

            Segment removed = route[index];
            Segment previous = Previous(route, index);
            Segment next = route[(index + 1) % route.Count];
            if (!Same(removed.NextStop, next.Stop))
                throw new InvalidOperationException("The outgoing segment is disconnected. Refresh the timetable before deleting the stop.");
            if (Same(previous.Stop, removed.NextStop) || route.Any(segment =>
                segment.Id != previous.Id && segment.Id != removed.Id &&
                Same(segment.Stop, previous.Stop) && Same(segment.NextStop, removed.NextStop)))
                throw new InvalidOperationException("Removing this stop would create a duplicate segment or connect a stop to itself.");

            bool drawn = previous.StartWaypoint.HasValue && previous.EndWaypoint.HasValue && removed.StartWaypoint.HasValue &&
                removed.EndWaypoint.HasValue && previous.EndWaypoint == removed.StartWaypoint;
            Run(connection, transaction, """
                UPDATE dbo.Segments SET NextStop = @next, Arrival = @arrival,
                    StartWaypoint = @start, EndWaypoint = @end WHERE Id = @id;
                """, new SqlParameter("@next", removed.NextStop), TimeParameter("@arrival", removed.Arrival),
                WaypointParameter("@start", drawn ? previous.StartWaypoint : null),
                WaypointParameter("@end", drawn ? removed.EndWaypoint : null), new SqlParameter("@id", previous.Id));
            Run(connection, transaction, "DELETE FROM dbo.Segments WHERE Id = @id;", new SqlParameter("@id", removed.Id));
        });
    }

    private static Segment Previous(IReadOnlyList<Segment> route, int index)
    {
        Segment previous = route[(index + route.Count - 1) % route.Count];
        if (!Same(previous.NextStop, route[index].Stop))
            throw new InvalidOperationException("The preceding segment is disconnected. Refresh the timetable and try again.");
        return previous;
    }

    private static bool Same(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    private static void WithRoute(Segment original,
        Action<SqlConnection, SqlTransaction, List<Segment>, int> change)
    {
        using var connection = new SqlConnection(ConnectionString);
        connection.Open();
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        using var command = new SqlCommand("""
            SELECT Id, Route, Stop, NextStop, Departure, Arrival, Fare, IsExpress,
                SortOrder, StartWaypoint, EndWaypoint, CustomWaypoint
            FROM dbo.Segments WITH (UPDLOCK, HOLDLOCK)
            WHERE Route = @route ORDER BY SortOrder, Id;
            """, connection, transaction);
        command.Parameters.AddWithValue("@route", original.Route);
        List<Segment> route;
        using (var reader = command.ExecuteReader())
            route = ReadSegments(reader);

        int index = route.FindIndex(segment => segment.Id == original.Id);
        if (index < 0 || route[index] != original)
            throw new InvalidOperationException("The selected segment changed. Refresh the timetable and try again.");

        change(connection, transaction, route, index);
        transaction.Commit();
    }

    private static SqlParameter TimeParameter(string name, TimeSpan? value) =>
        new(name, SqlDbType.Time) { Value = (object?)value ?? DBNull.Value };

    private static SqlParameter WaypointParameter(string name, int? value) =>
        new(name, SqlDbType.Int) { Value = (object?)value ?? DBNull.Value };

    private static void Run(SqlConnection connection, SqlTransaction transaction, string sql, params SqlParameter[] parameters)
    {
        using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddRange(parameters);
        if (command.ExecuteNonQuery() != 1)
            throw new InvalidOperationException("The selected segment changed. Refresh the timetable and try again.");
    }


    public void AddStops(IReadOnlyList<StopPlacement> stops)
    {
        if (stops.Count == 0)
            throw new InvalidOperationException("Both stops are already on this line. Add cannot skip or duplicate a stop.");
        if (stops.Select(stop => stop.Name).Distinct(StringComparer.OrdinalIgnoreCase).Count() != stops.Count ||
            stops.GroupBy(stop => (stop.Segment.Id, stop.Waypoint)).Any(group => group.Count() > 1))
            throw new InvalidOperationException("Give the two stops different names and positions.");

        using var connection = new SqlConnection(ConnectionString);
        connection.Open();
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        foreach (var group in stops.GroupBy(stop => stop.Segment.Id).OrderByDescending(group => group.First().Segment.SortOrder))
        {
            Segment segment = group.First().Segment;
            foreach (var placement in group.OrderByDescending(stop => stop.Waypoint))
            {
                if (segment.StartWaypoint is not int start || segment.EndWaypoint is not int end ||
                    placement.Waypoint <= start || placement.Waypoint >= end)
                    throw new InvalidOperationException("A new stop must be inside a segment drawn on the selected line.");

                TimeSpan? middle = InterpolateTime(segment, placement.Waypoint);
                SplitSegment(connection, transaction, segment, placement, middle);
                segment = segment with { NextStop = placement.Name, EndWaypoint = placement.Waypoint, Arrival = middle };
            }
        }
        transaction.Commit();
    }

    private static TimeSpan? InterpolateTime(Segment segment, int waypoint)
    {
        if (segment.Departure is not TimeSpan departure || segment.Arrival is not TimeSpan arrival)
            return null;
        TimeSpan duration = arrival - departure;
        if (duration < TimeSpan.Zero)
            duration += TimeSpan.FromDays(1);
        double fraction = (double)(waypoint - segment.StartWaypoint!.Value) / (segment.EndWaypoint!.Value - segment.StartWaypoint.Value);
        long ticks = (departure + TimeSpan.FromSeconds(Math.Round(duration.TotalSeconds * fraction))).Ticks;
        return TimeSpan.FromTicks(ticks % TimeSpan.TicksPerDay);
    }

    private static void SplitSegment(SqlConnection connection, SqlTransaction transaction, Segment segment,
        StopPlacement placement, TimeSpan? middle)
    {
        const string sql = """
            SET NOCOUNT ON;
            IF EXISTS (SELECT 1 FROM dbo.Segments WITH (UPDLOCK, HOLDLOCK)
                WHERE Route = @route AND (Stop = @name OR NextStop = @name OR CustomWaypoint = @waypoint))
                THROW 50000, 'That stop name or position is already used by this line.', 1;

            UPDATE dbo.Segments SET NextStop = @name, EndWaypoint = @waypoint, Arrival = @middle
            WHERE Id = @id AND Route = @route AND StartWaypoint = @start AND EndWaypoint = @end
                AND NextStop = @next AND SortOrder = @order AND Fare = @fare AND IsExpress = @express
                AND (Departure = @departure OR (Departure IS NULL AND @departure IS NULL))
                AND (Arrival = @arrival OR (Arrival IS NULL AND @arrival IS NULL));
            IF @@ROWCOUNT <> 1
                THROW 50001, 'The segment changed. Refresh the timetable and try again.', 1;

            UPDATE dbo.Segments SET SortOrder = SortOrder + 1
            WHERE Route = @route AND SortOrder > @order;
            INSERT INTO dbo.Segments (Route, Stop, NextStop, Departure, Arrival, Fare, IsExpress, SortOrder,
                StartWaypoint, EndWaypoint, CustomWaypoint)
            VALUES (@route, @name, @next, @middle, @arrival, @fare, @express, @order + 1, @waypoint, @end, @waypoint);
            """;
        using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@id", segment.Id);
        command.Parameters.AddWithValue("@route", segment.Route);
        command.Parameters.AddWithValue("@name", placement.Name);
        command.Parameters.AddWithValue("@next", segment.NextStop);
        command.Parameters.AddWithValue("@start", segment.StartWaypoint!.Value);
        command.Parameters.AddWithValue("@end", segment.EndWaypoint!.Value);
        command.Parameters.AddWithValue("@waypoint", placement.Waypoint);
        command.Parameters.AddWithValue("@order", segment.SortOrder);
        command.Parameters.AddWithValue("@fare", segment.Fare);
        command.Parameters.AddWithValue("@express", segment.IsExpress);
        command.Parameters.Add(TimeParameter("@departure", segment.Departure));
        command.Parameters.Add("@middle", SqlDbType.Time).Value = (object?)middle ?? DBNull.Value;
        command.Parameters.Add("@arrival", SqlDbType.Time).Value = (object?)segment.Arrival ?? DBNull.Value;
        command.ExecuteNonQuery();
    }
}

internal sealed record StopPlacement(Segment Segment, string Name, int Waypoint);
