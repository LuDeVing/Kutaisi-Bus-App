namespace KutaisiSmartBus;

internal sealed partial class SegmentForm : Form
{
    private readonly ComboBox cmbRoute = new() { Name = "cmbRoute", DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly TextBox txtStop = new() { Name = "txtStop", MaxLength = 100 };
    private readonly TextBox txtNextStop = new() { Name = "txtNextStop", MaxLength = 100 };
    private readonly DateTimePicker dtpDeparture = CreateTimePicker("dtpDeparture");
    private readonly DateTimePicker dtpArrival = CreateTimePicker("dtpArrival");
    private readonly NumericUpDown numFare = new() { Name = "numFare", Maximum = 100, DecimalPlaces = 2, Increment = 0.1m, Value = 0.60m };
    private readonly CheckBox chkExpress = new() { Name = "chkExpress", Text = "Express", AutoSize = true };
    private Segment? existing;
    public Segment? CurrentSegment { get; private set; }

    private SegmentForm()
    {
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MinimizeBox = MaximizeBox = false;
        ShowInTaskbar = false;
        Font = new Font("Segoe UI", 10);
    }

    public SegmentForm(IEnumerable<string> routes, Segment segment) : this()
    {
        Text = "Edit segment";
        ClientSize = new Size(510, 365);
        cmbRoute.Items.AddRange(routes.Cast<object>().ToArray());
        cmbRoute.SelectedItem = segment.Route;

        var fields = new TableLayoutPanel
        {
            Name = "segmentFields", ColumnCount = 2, Dock = DockStyle.Fill, Padding = new Padding(18)
        };
        fields.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 130));
        fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        AddField("Bus line", cmbRoute);
        AddField("Stop", txtStop);
        AddField("Next stop", txtNextStop);
        AddField("Departure", dtpDeparture);
        AddField("Arrival", dtpArrival);
        AddField("Fare (GEL)", numFare);
        AddField("Service", chkExpress);

        var btnSave = new Button { Name = "btnSaveSegment", Text = "Save", AutoSize = true };
        var btnCancel = new Button { Name = "btnCancelSegment", Text = "Cancel", AutoSize = true, DialogResult = DialogResult.Cancel };
        btnSave.Click += SaveEdit;
        AcceptButton = btnSave;
        CancelButton = btnCancel;
        var actions = new FlowLayoutPanel
        {
            Name = "segmentActions", Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft,
            Height = 54, Padding = new Padding(10, 7, 10, 0)
        };
        actions.Controls.AddRange([btnCancel, btnSave]);
        Controls.Add(fields);
        Controls.Add(actions);

        void AddField(string label, Control field)
        {
            fields.RowStyles.Add(new RowStyle(SizeType.Absolute, 37));
            fields.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left });
            fields.Controls.Add(field);
            field.Anchor = AnchorStyles.Left | AnchorStyles.Right;
        }
        existing = segment;
        cmbRoute.Enabled = false;
        txtStop.Text = segment.Stop;
        txtStop.ReadOnly = !segment.CustomWaypoint.HasValue;
        txtNextStop.Text = segment.NextStop;
        txtNextStop.ReadOnly = true;
        SetTime(dtpDeparture, segment.Departure);
        SetTime(dtpArrival, segment.Arrival);
        numFare.Value = segment.Fare;
        chkExpress.Checked = segment.IsExpress;
    }

    private static DateTimePicker CreateTimePicker(string name) => new()
    {
        Name = name, Format = DateTimePickerFormat.Custom, CustomFormat = "HH:mm",
        ShowCheckBox = true, Checked = false, ShowUpDown = true
    };

    private static void SetTime(DateTimePicker control, TimeSpan? time)
    {
        if (time.HasValue)
            control.Value = DateTime.Today.Add(time.Value);
        control.Checked = time.HasValue;
    }

    private void SaveEdit(object? sender, EventArgs e)
    {
        string stop = txtStop.Text.Trim();
        string next = txtNextStop.Text.Trim();
        if (cmbRoute.SelectedItem is not string route || stop.Length == 0 || next.Length == 0 ||
            string.Equals(stop, next, StringComparison.OrdinalIgnoreCase))
        {
            MessageBox.Show(this, "Select a bus line and enter two different stop names.", Text);
            return;
        }

        CurrentSegment = new Segment(existing?.Id ?? 0, route, stop, next,
            dtpDeparture.Checked ? dtpDeparture.Value.TimeOfDay : null,
            dtpArrival.Checked ? dtpArrival.Value.TimeOfDay : null, numFare.Value, chkExpress.Checked);
        DialogResult = DialogResult.OK;
    }
}
