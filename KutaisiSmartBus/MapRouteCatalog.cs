using System.Text.Json;

namespace KutaisiSmartBus;

internal sealed record RouteStopAddition(string Name, int Waypoint);

internal sealed record MapLeg(string Label, int Start, int End, string Origin, string Destination)
{
    public override string ToString() => Label;
}

internal static class MapRouteCatalog
{
    public static Dictionary<string, MapLeg[]> Load()
    {
        string path = Path.Combine(AppContext.BaseDirectory, "Map", "route-legs.json");
        var routes = JsonSerializer.Deserialize<Dictionary<string, MapLeg[]>>(
            File.ReadAllText(path), JsonSerializerOptions.Web);
        return new Dictionary<string, MapLeg[]>(routes ?? [], StringComparer.OrdinalIgnoreCase);
    }
}
