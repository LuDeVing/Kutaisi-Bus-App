using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace KutaisiSmartBus;

internal sealed partial class MainForm : Form
{
    private readonly SegmentRepository repository = new();
    private readonly TabControl tabs = new() { Name = "tabs", Dock = DockStyle.Fill };
    private readonly TabPage mapTab = new("Map & trip planner") { Name = "mapTab" };
    private readonly WebView2 webMap = new() { Name = "webMap", Dock = DockStyle.Fill };
    private readonly Dictionary<string, MapLeg[]> mapRoutes = MapRouteCatalog.Load();
    private List<Segment>? timetable;

    public MainForm()
    {
        Text = "Kutaisi Smart Bus";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(980, 610);
        ClientSize = new Size(1200, 765);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = new Font("Segoe UI", 10);
        Controls.Add(tabs);
        tabs.TabPages.AddRange([timetableTab, mapTab]);
        SetupTimetable();
        mapTab.Controls.Add(webMap);
        Shown += (_, _) => LoadSegments();
        tabs.SelectedIndexChanged += (_, _) =>
        {
            if (tabs.SelectedTab == mapTab && webMap.CoreWebView2 is null)
                _ = OpenMapAsync();
        };
    }

    private void LoadSegments(string message = "")
    {
        try
        {
            timetable = repository.Search("", null);
            ShowSegments(message);
            PublishTimetable();
        }
        catch (System.Data.Common.DbException)
        {
            lblStatus.Text = "Can’t connect to the timetable database. Run database.sql, then click Refresh.";
        }
    }

    private void PublishTimetable()
    {
        if (timetable is null || webMap.CoreWebView2 is null || webMap.Source?.Host != "kutaisi.local")
            return;
        webMap.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(
            new { type = "timetable-data", segments = timetable }, JsonSerializerOptions.Web));
    }

    private bool openingMap;

    private async Task OpenMapAsync()
    {
        if (openingMap)
            return;
        openingMap = true;
        try
        {
            string profile = Environment.GetEnvironmentVariable("KUTAISI_MAP_PROFILE") ??
                Path.Combine(AppContext.BaseDirectory, ".map-profile");
            var options = new CoreWebView2EnvironmentOptions("--disable-background-timer-throttling");
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: profile, options: options);
            if (IsDisposed)
                return;
            await webMap.EnsureCoreWebView2Async(environment);
            if (IsDisposed)
                return;
            webMap.CoreWebView2.SetVirtualHostNameToFolderMapping("kutaisi.local",
                Path.Combine(AppContext.BaseDirectory, "Map"), CoreWebView2HostResourceAccessKind.Deny);
            webMap.CoreWebView2.NavigationStarting += (_, e) =>
            {
                if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri) || uri.Host != "kutaisi.local")
                    e.Cancel = true;
            };
            webMap.CoreWebView2.NewWindowRequested += (_, e) =>
            {
                e.Handled = true;
                if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
            };

            webMap.CoreWebView2.NavigationCompleted += (_, e) =>
            {
                if (e.IsSuccess)
                    PublishTimetable();
            };
            webMap.Source = new Uri("https://kutaisi.local/index.html");
        }
        catch (Exception ex)
        {
            if (!IsDisposed)
            {
                lblStatus.Text = "The simulation could not start. Check the Microsoft Edge WebView2 Runtime.";
                MessageBox.Show(this, $"The map could not open. Check the Microsoft Edge WebView2 Runtime.\n\n{ex.Message}", Text);
            }
        }
        finally
        {
            openingMap = false;
        }
    }
}
