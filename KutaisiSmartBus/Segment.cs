namespace KutaisiSmartBus;

internal sealed record Segment(int Id, string Route, string Stop, string NextStop,
    TimeSpan? Departure, TimeSpan? Arrival, decimal Fare, bool IsExpress,
    int SortOrder = 0, int? StartWaypoint = null, int? EndWaypoint = null, int? CustomWaypoint = null)
{
    public string Bus => $"Bus {Route}";
    public string Service => IsExpress ? "Express" : "Regular";
}
