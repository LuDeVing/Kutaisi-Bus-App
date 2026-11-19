namespace KutaisiSmartBus;

internal sealed partial class SegmentForm
{
    private readonly ComboBox cmbLine = new() { Name = "cmbLine", DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly TextBox txtOrigin = new() { Name = "txtOrigin", MaxLength = 100 };
    private readonly TextBox txtDestination = new() { Name = "txtDestination", MaxLength = 100 };
    private readonly ComboBox cmbOriginSegment = CreateSegmentPicker("cmbOriginSegment");
    private readonly ComboBox cmbDestinationSegment = CreateSegmentPicker("cmbDestinationSegment");
    private readonly NumericUpDown numOriginPosition = CreatePosition("numOriginPosition");
    private readonly NumericUpDown numDestinationPosition = CreatePosition("numDestinationPosition");
    private readonly List<Segment> segments = [];
    private readonly SegmentRepository addRepository = new();
    public int AddedCount { get; private set; }

    public SegmentForm(List<Segment> segments, string? route) : this()
    {
        this.segments = segments;
        Text = "Add stops to bus line";
        ClientSize = new Size(610, 375);

        cmbLine.Items.AddRange(segments.Select(segment => segment.Route).Distinct().Cast<object>().ToArray());
        cmbLine.SelectedIndexChanged += (_, _) => LoadRoute();
        if (route is not null)
            cmbLine.SelectedItem = route;
        if (cmbLine.SelectedIndex < 0 && cmbLine.Items.Count > 0)
            cmbLine.SelectedIndex = 0;

        var fields = new TableLayoutPanel
        {
            Name = "addStopFields", ColumnCount = 2, Dock = DockStyle.Fill, Padding = new Padding(18, 12, 18, 6)
        };
        fields.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 172));
        fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        AddField("Bus number", cmbLine, 34);
        AddField("Origin", txtOrigin, 34);
        AddField("New origin segment", cmbOriginSegment, 34);
        AddField("Origin position (%)", numOriginPosition, 34);
        AddField("Destination", txtDestination, 34);
        AddField("New destination segment", cmbDestinationSegment, 34);
        AddField("Destination position (%)", numDestinationPosition, 34);

        var help = new Label
        {
            Text = "For a new stop, select its drawn segment and set its position from the first stop (1–99%). Existing stops only need a name.",
            AutoSize = true, MaximumSize = new Size(560, 0)
        };
        fields.Controls.Add(help, 0, 7);
        fields.SetColumnSpan(help, 2);

        var btnSave = new Button { Name = "btnAddRouteStops", Text = "Add stops", AutoSize = true };
        var btnCancel = new Button { Name = "btnCancelRouteStops", Text = "Cancel", AutoSize = true, DialogResult = DialogResult.Cancel };
        btnSave.Click += SaveStops;
        AcceptButton = btnSave;
        CancelButton = btnCancel;
        var actions = new FlowLayoutPanel
        {
            Name = "addStopActions", Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft,
            Height = 54, Padding = new Padding(10, 7, 10, 0)
        };
        actions.Controls.AddRange([btnCancel, btnSave]);
        Controls.Add(fields);
        Controls.Add(actions);

        void AddField(string label, Control field, int height)
        {
            fields.RowStyles.Add(new RowStyle(SizeType.Absolute, height));
            fields.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left });
            fields.Controls.Add(field);
            field.Anchor = AnchorStyles.Left | AnchorStyles.Right;
        }
    }

    private void LoadRoute()
    {
        if (cmbLine.SelectedItem is not string route)
            return;

        var onLine = segments.Where(segment => segment.Route == route).ToArray();
        var drawn = onLine.Where(segment => segment.StartWaypoint is int start && segment.EndWaypoint is int end && end - start > 1)
            .Select(segment => new DrawnSegment(segment)).Cast<object>().ToArray();
        foreach (ComboBox picker in new[] { cmbOriginSegment, cmbDestinationSegment })
        {
            picker.Items.Clear();
            picker.Items.AddRange(drawn);
        }
        var names = onLine.SelectMany(segment => new[] { segment.Stop, segment.NextStop })
            .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        foreach (TextBox input in new[] { txtOrigin, txtDestination })
        {
            var suggestions = new AutoCompleteStringCollection();
            suggestions.AddRange(names);
            input.AutoCompleteCustomSource = suggestions;
            input.AutoCompleteSource = AutoCompleteSource.CustomSource;
            input.AutoCompleteMode = AutoCompleteMode.SuggestAppend;
        }
    }

    private void SaveStops(object? sender, EventArgs e)
    {
        try
        {
            var newStops = PlanStops();
            addRepository.AddStops(newStops);
            AddedCount = newStops.Count;
            DialogResult = DialogResult.OK;


        }
        catch (Exception ex) when (ex is System.Data.Common.DbException or InvalidOperationException)
        {
            MessageBox.Show(this, ex.Message, "Can’t add stops", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    internal List<StopPlacement> PlanStops()
    {
        if (cmbLine.SelectedItem is not string route)
            throw new InvalidOperationException("Select a bus line that already has a drawn route.");

        string origin = txtOrigin.Text.Trim();
        string destination = txtDestination.Text.Trim();
        if (origin.Length == 0 || destination.Length == 0)
            throw new InvalidOperationException("Enter both the origin and destination.");
        if (Same(origin, destination))
            throw new InvalidOperationException("Origin and destination refer to the same stop.");

        var onLine = segments.Where(segment => segment.Route == route).ToArray();
        bool originExists = Exists(origin);
        bool destinationExists = Exists(destination);
        if (originExists && destinationExists)
        {
            if (onLine.Any(segment => Same(segment.Stop, origin) && Same(segment.NextStop, destination)))
                throw new InvalidOperationException($"Bus {route} already has the segment {origin} → {destination}. Adding it would duplicate a row.");
            throw new InvalidOperationException($"Both stops are already on Bus {route}, but {destination} is not the next stop after {origin}. Adding that link would skip stops or change the route order.");
        }

        var newStops = new List<StopPlacement>();
        if (!originExists)
            newStops.Add(Place("Origin", origin, cmbOriginSegment, numOriginPosition));
        if (!destinationExists)
            newStops.Add(Place("Destination", destination, cmbDestinationSegment, numDestinationPosition));
        return newStops;

        bool Exists(string name) => onLine.Any(segment => Same(name, segment.Stop) || Same(name, segment.NextStop));
    }

    private static StopPlacement Place(string role, string name, ComboBox picker, NumericUpDown position)
    {
        if (picker.SelectedItem is not DrawnSegment choice)
            throw new InvalidOperationException($"{role} “{name}” is new to the line. Select a drawn segment for it. Segments without a path, including an undrawn closing link, cannot accept a new stop.");

        var segment = choice.Segment;
        int start = segment.StartWaypoint!.Value;
        int end = segment.EndWaypoint!.Value;
        int waypoint = Math.Clamp(start + (int)Math.Round((end - start) * position.Value / 100), start + 1, end - 1);
        return new StopPlacement(segment, name, waypoint);
    }

    private static bool Same(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    private static ComboBox CreateSegmentPicker(string name) =>
        new() { Name = name, DropDownStyle = ComboBoxStyle.DropDownList };

    private static NumericUpDown CreatePosition(string name) =>
        new() { Name = name, Minimum = 1, Maximum = 99, Value = 50 };

    private sealed record DrawnSegment(Segment Segment)
    {
        public override string ToString() => $"{Segment.Stop} → {Segment.NextStop}";
    }
}
