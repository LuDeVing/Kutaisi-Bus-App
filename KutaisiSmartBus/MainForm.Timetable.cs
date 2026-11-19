using System.Globalization;
using System.Text;

namespace KutaisiSmartBus;

internal sealed partial class MainForm
{
    private readonly TabPage timetableTab = new("Timetable") { Name = "timetableTab", BackColor = Color.White };
    private readonly DataGridView dgvSegments = new()
    {
        Name = "dgvSegments", ReadOnly = true, AutoGenerateColumns = false, AllowUserToAddRows = false,
        AllowUserToDeleteRows = false, MultiSelect = false, RowHeadersVisible = false,
        SelectionMode = DataGridViewSelectionMode.FullRowSelect,
        AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill, BackgroundColor = Color.White
    };
    private readonly TextBox txtSearch = new()
    {
        Name = "txtSearch", AccessibleName = "Search bus line or stop", PlaceholderText = "Search bus line or stop",
        Width = 175, MaxLength = 100
    };
    private readonly ComboBox cmbService = new()
    {
        Name = "cmbService", AccessibleName = "Service type", Width = 88, DropDownStyle = ComboBoxStyle.DropDownList
    };
    private readonly Label lblStatus = new() { Name = "lblStatus", AutoEllipsis = true };
    private void SetupTimetable()
    {
        timetableTab.BackColor = Color.FromArgb(243, 247, 246);
        var toolbar = CreateToolbar("timetableToolbar");
        txtSearch.Margin = new Padding(2, 5, 12, 0);
        cmbService.Margin = new Padding(2, 5, 12, 0);
        cmbService.Items.AddRange(["All", "Express", "Regular"]);
        cmbService.SelectedIndex = 0;
        toolbar.Controls.AddRange([
            ToolbarLabel("Search"), txtSearch, ToolbarLabel("Service"), cmbService,
            CreateButton("btnAddSegment", "Add stops", (_, _) => AddRouteStops(), primary: true),
            CreateButton("btnEditSegment", "Edit", (_, _) => EditSegment()),
            CreateButton("btnDeleteSegment", "Remove stop", (_, _) => DeleteSegment()),
            CreateButton("btnRefresh", "Refresh", (_, _) => LoadSegments()),
            CreateButton("btnExportCsv", "Export CSV", (_, _) => ExportRows())]);

        dgvSegments.SetBounds(16, 72, timetableTab.ClientSize.Width - 32, timetableTab.ClientSize.Height - 117);
        dgvSegments.EnableHeadersVisualStyles = false;
        dgvSegments.BorderStyle = BorderStyle.FixedSingle;
        dgvSegments.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
        dgvSegments.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.Single;
        dgvSegments.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
        dgvSegments.ColumnHeadersHeight = 36;
        dgvSegments.ColumnHeadersDefaultCellStyle = new DataGridViewCellStyle
        {
            BackColor = Color.FromArgb(225, 239, 233), ForeColor = Color.FromArgb(16, 61, 47),
            Font = new Font(Font, FontStyle.Bold), Padding = new Padding(7, 0, 0, 0)
        };
        dgvSegments.DefaultCellStyle = new DataGridViewCellStyle
        {
            ForeColor = Color.FromArgb(28, 46, 40), SelectionBackColor = Color.FromArgb(209, 235, 223),
            SelectionForeColor = Color.FromArgb(13, 53, 36), Padding = new Padding(7, 0, 0, 0)
        };
        dgvSegments.AlternatingRowsDefaultCellStyle.BackColor = Color.FromArgb(247, 250, 249);
        dgvSegments.GridColor = Color.FromArgb(222, 233, 229);
        dgvSegments.RowTemplate.Height = 30;
        dgvSegments.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        foreach (var (property, label, width) in new[] {
            (nameof(Segment.Bus), "Bus", 68), (nameof(Segment.Stop), "Stop", 160),
            (nameof(Segment.NextStop), "Next stop", 160), (nameof(Segment.Departure), "Departure", 75),
            (nameof(Segment.Arrival), "Arrival", 75), (nameof(Segment.Fare), "Fare (GEL)", 70),
            (nameof(Segment.Service), "Service", 70) })
        {
            var style = new DataGridViewCellStyle { NullValue = "—" };
            if (property is nameof(Segment.Departure) or nameof(Segment.Arrival))
                style.Format = @"hh\:mm";
            if (property == nameof(Segment.Fare))
                style.Format = "0.00";
            dgvSegments.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "col" + property, DataPropertyName = property, HeaderText = label, FillWeight = width,
                DefaultCellStyle = style, SortMode = DataGridViewColumnSortMode.NotSortable
            });
        }

        lblStatus.SetBounds(16, timetableTab.ClientSize.Height - 35, timetableTab.ClientSize.Width - 32, 25);
        lblStatus.ForeColor = Color.FromArgb(51, 84, 72);
        lblStatus.TextAlign = ContentAlignment.MiddleLeft;
        lblStatus.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        timetableTab.Controls.AddRange([toolbar, dgvSegments, lblStatus]);
        txtSearch.TextChanged += (_, _) => ShowSegments();
        cmbService.SelectedIndexChanged += (_, _) => ShowSegments();
        dgvSegments.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) EditSegment(); };
    }

    private FlowLayoutPanel CreateToolbar(string name) => new()
    {
        Name = name, Location = new Point(16, 13), Size = new Size(timetableTab.ClientSize.Width - 32, 48),
        Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right, WrapContents = false,
        Padding = new Padding(8, 6, 0, 0), BackColor = Color.White
    };

    private static Label ToolbarLabel(string text) => new()
    {
        Text = text, AutoSize = true, Margin = new Padding(3, 8, 2, 0),
        ForeColor = Color.FromArgb(39, 66, 57)
    };

    private static Button CreateButton(string name, string text, EventHandler action, bool primary = false)
    {
        var button = new Button
        {
            Name = name, Text = text, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, FlatStyle = FlatStyle.Flat,
            Padding = new Padding(5, 1, 5, 1), Margin = new Padding(2, 0, 6, 0),
            MinimumSize = new Size(0, 31), UseVisualStyleBackColor = false,
            BackColor = primary ? Color.FromArgb(16, 104, 75) : Color.White,
            ForeColor = primary ? Color.White : Color.FromArgb(26, 62, 48)
        };
        button.FlatAppearance.BorderColor = primary ? button.BackColor : Color.FromArgb(188, 210, 201);
        button.FlatAppearance.MouseOverBackColor = primary ? Color.FromArgb(12, 83, 60) : Color.FromArgb(229, 243, 237);
        button.Click += action;
        return button;
    }

    private Segment? SelectedSegment => dgvSegments.CurrentRow?.DataBoundItem as Segment;

    private void ShowSegments(string message = "")
    {
        string query = txtSearch.Text.Trim();
        bool lineSearch = query.StartsWith("Bus ", StringComparison.OrdinalIgnoreCase);
        if (lineSearch)
            query = query[4..].Trim();
        bool? express = cmbService.SelectedIndex switch { 1 => true, 2 => false, _ => null };
        try
        {
            int? selected = SelectedSegment?.Id;
            var segments = repository.Search(query, express, lineSearch && mapRoutes.ContainsKey(query));
            dgvSegments.DataSource = segments;
            if (selected.HasValue)
            {
                int index = segments.FindIndex(segment => segment.Id == selected.Value);
                if (index >= 0)
                    dgvSegments.CurrentCell = dgvSegments.Rows[index].Cells[0];
            }
            string count = segments.Count == 0 ? "No matching segments." : $"{segments.Count} route segments";
            lblStatus.Text = message.Length == 0 ? count : $"{message}  {count}";
        }
        catch (System.Data.Common.DbException)
        {
            lblStatus.Text = "Can’t load the timetable. Run database.sql, then click Refresh.";
        }
    }

    private void AddRouteStops()
    {
        try
        {
            using var form = new SegmentForm(repository.Search("", null), SelectedSegment?.Route);
            if (form.ShowDialog(this) == DialogResult.OK)
                LoadSegments(form.AddedCount == 1 ? "Stop added." : "Two stops added.");
        }
        catch (System.Data.Common.DbException ex)
        {
            MessageBox.Show(this, ex.Message, "Can’t load bus lines", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void EditSegment()
    {
        Segment? selected = SelectedSegment;
        if (selected is null)
        {
            MessageBox.Show(this, "Select a segment first.", Text);
            return;
        }

        using var form = new SegmentForm(mapRoutes.Keys, selected);
        if (form.ShowDialog(this) != DialogResult.OK || form.CurrentSegment is not Segment saved)
            return;

        ApplyChange(() => repository.Update(selected, saved), "Segment updated.");
    }

    private void DeleteSegment()
    {
        if (SelectedSegment is not Segment segment)
        {
            MessageBox.Show(this, "Select a segment first.", Text);
            return;
        }
        string message = $"Remove “{segment.Stop}” from {segment.Bus}? The previous stop will be connected to {segment.NextStop}.";
        if (MessageBox.Show(this, message, "Remove stop", MessageBoxButtons.YesNo, MessageBoxIcon.Question,
            MessageBoxDefaultButton.Button2) == DialogResult.Yes)
            ApplyChange(() => repository.Delete(segment), "Stop removed and neighboring segments joined.");
    }

    private void ApplyChange(Action change, string message)
    {
        try
        {
            change();
            LoadSegments(message);
        }
        catch (Exception ex) when (ex is System.Data.Common.DbException or InvalidOperationException)
        {
            MessageBox.Show(this, ex.Message, "Timetable change failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void ExportRows()
    {
        if (dgvSegments.Rows.Count == 0)
        {
            MessageBox.Show(this, "There are no displayed segments to export.", Text);
            return;
        }
        using var dialog = new SaveFileDialog { Filter = "CSV files (*.csv)|*.csv", FileName = "kutaisi-timetable.csv" };
        if (dialog.ShowDialog(this) != DialogResult.OK)
            return;

        try
        {
            WriteDisplayedRows(dialog.FileName);
            lblStatus.Text = $"Exported {dgvSegments.Rows.Count} segments.";
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            MessageBox.Show(this, ex.Message, "Export failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    internal void WriteDisplayedRows(string filePath)
    {
        CultureInfo culture = CultureInfo.CurrentCulture;
        string separator = culture.TextInfo.ListSeparator;
        using var writer = new StreamWriter(filePath, false, new UTF8Encoding(true));
        writer.WriteLine(string.Join(separator, dgvSegments.Columns.Cast<DataGridViewColumn>()
            .Select(column => CsvField(column.HeaderText))));
        foreach (DataGridViewRow row in dgvSegments.Rows)
        {
            if (row.DataBoundItem is not Segment segment)
                continue;
            writer.WriteLine(string.Join(separator, new[]
            {
                segment.Bus, segment.Stop, segment.NextStop,
                segment.Departure?.ToString(@"hh\:mm") ?? "",
                segment.Arrival?.ToString(@"hh\:mm") ?? "",
                segment.Fare.ToString("0.00", culture), segment.Service
            }.Select(CsvField)));
        }
    }

    private static string CsvField(string value)
    {
        if (value.Length > 0 && "=+-@\t\r\n".Contains(value[0]))
            value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }
}
