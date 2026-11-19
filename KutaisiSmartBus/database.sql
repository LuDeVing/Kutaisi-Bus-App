IF DB_ID(N'KutaisiRouteTimetableDb') IS NULL
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
    (N'5', N'Aghmashenebeli Square', N'Korkia Street', '07:00', '07:04', 1, 18, 63),
    (N'5', N'Korkia Street', N'Music School', '07:05', '07:08', 2, 63, 92),
    (N'5', N'Music School', N'Karvasla', '07:09', '07:12', 3, 92, 116),
    (N'5', N'Karvasla', N'Circular Bus', '07:13', '07:18', 4, 116, 149),
    (N'5', N'Circular Bus', N'Aghmashenebeli Square', '07:19', '07:24', 5, NULL, NULL),
    (N'10', N'University', N'Korkia Street', '07:02', '07:04', 1, 176, 191),
    (N'10', N'Korkia Street', N'Music School', '07:05', '07:08', 2, 191, 219),
    (N'10', N'Music School', N'Balakhvani', '07:09', '07:12', 3, 219, 239),
    (N'10', N'Balakhvani', N'Train Station', '07:13', '07:22', 4, 239, 327),
    (N'10', N'Train Station', N'Circular Bus', '07:23', '07:29', 5, 327, 402),
    (N'10', N'Circular Bus', N'Aghmashenebeli Square', '07:30', '07:33', 6, 402, 423),
    (N'10', N'Aghmashenebeli Square', N'University', '07:34', '07:38', 7, NULL, NULL),
    (N'20', N'Train Station', N'University', '07:04', '07:06', 1, 8, 30),
    (N'20', N'University', N'Korkia Street', '07:07', '07:09', 2, 30, 45),
    (N'20', N'Korkia Street', N'Music School', '07:10', '07:13', 3, 45, 74),
    (N'20', N'Music School', N'Balakhvani', '07:14', '07:17', 4, 74, 94),
    (N'20', N'Balakhvani', N'School #12', '07:18', '07:20', 5, 94, 111),
    (N'20', N'School #12', N'Train Station', '07:21', '07:23', 6, NULL, NULL),
    (N'2', N'Bus 30 to Tskaltubo', N'Paliashvli', '07:06', '07:10', 1, 1, 33),
    (N'2', N'Paliashvli', N'Karvasla', '07:11', '07:13', 2, 33, 66),
    (N'2', N'Karvasla', N'Music School', '07:14', '07:17', 3, 66, 97),
    (N'2', N'Music School', N'Korkia Street', '07:18', '07:20', 4, 97, 114),
    (N'2', N'Korkia Street', N'Aghmashenebeli Square', '07:21', '07:48', 5, 114, 414),
    (N'2', N'Aghmashenebeli Square', N'Bus 30 to Tskaltubo', '07:49', '07:52', 6, NULL, NULL),
    (N'3', N'Aghmashenebeli Bridge', N'University', '07:08', '07:11', 1, 46, 79),
    (N'3', N'University', N'Balakhvani', '07:12', '07:14', 2, 79, 94),
    (N'3', N'Balakhvani', N'Auli Galaevi-Nizharadze', '07:15', '07:20', 3, 94, 148),
    (N'3', N'Auli Galaevi-Nizharadze', N'Tourist Information', '07:21', '07:23', 4, 148, 166),
    (N'3', N'Tourist Information', N'Karvasla', '07:24', '07:26', 5, 166, 184),
    (N'3', N'Karvasla', N'Music School', '07:27', '07:29', 6, 184, 199),
    (N'3', N'Music School', N'Circular Bus', '07:30', '07:36', 7, 199, 265),
    (N'3', N'Circular Bus', N'Aghmashenebeli Bridge', '07:37', '07:43', 8, NULL, NULL),
    (N'7', N'Chechelashvili', N'Tourist Information', '07:10', '07:19', 1, 20, 71),
    (N'7', N'Tourist Information', N'Karvasla', '07:20', '07:22', 2, 71, 89),
    (N'7', N'Karvasla', N'Music School', '07:23', '07:25', 3, 89, 104),
    (N'7', N'Music School', N'Korkia Street', '07:26', '07:28', 4, 104, 121),
    (N'7', N'Korkia Street', N'Circular Bus', '07:29', '07:34', 5, 121, 161),
    (N'7', N'Circular Bus', N'Chechelashvili', '07:35', '07:42', 6, NULL, NULL),
    (N'15', N'School #12', N'Train Station', '07:12', '07:16', 1, 85, 140),
    (N'15', N'Train Station', N'Circular Bus', '07:17', '07:31', 2, 140, 282),
    (N'15', N'Circular Bus', N'School #12', '07:32', '07:38', 3, NULL, NULL),
    (N'22', N'Train Station', N'Circular Bus', '07:14', '07:21', 1, 0, 80),
    (N'22', N'Circular Bus', N'Train Station', '07:22', '07:26', 2, NULL, NULL),
    (N'30', N'Korkia Street', N'Music School', '07:16', '07:18', 1, 248, 265),
    (N'30', N'Music School', N'Train Station', '07:19', '07:23', 2, NULL, NULL),
    (N'30', N'Train Station', N'Korkia Street', '07:24', '07:27', 3, 221, 248),
    (N'11', N'Train Station', N'University', '07:18', '07:28', 1, 104, 221),
    (N'11', N'University', N'Balakhvani', '07:29', '07:32', 2, 221, 253),
    (N'11', N'Balakhvani', N'School #12', '07:33', '07:35', 3, 253, 272),
    (N'11', N'School #12', N'Korkia Street', '07:36', '07:43', 4, 272, 342),
    (N'11', N'Korkia Street', N'Circular Bus', '07:44', '07:47', 5, 342, 358),
    (N'11', N'Circular Bus', N'Train Station', '07:48', '07:52', 6, NULL, NULL),
    (N'A', N'Pirosmani', N'Minerals Institute', '07:20', '07:26', 1, 0, 61),
    (N'A', N'Minerals Institute', N'Ice Palace', '07:27', '07:30', 2, 61, 97),
    (N'A', N'Ice Palace', N'Chonkadze', '07:31', '07:33', 3, 97, 104),
    (N'A', N'Chonkadze', N'Oghaskura', '07:34', '07:36', 4, 104, 124),
    (N'A', N'Oghaskura', N'Tskhinvali', '07:37', '07:40', 5, 124, 153),
    (N'A', N'Tskhinvali', N'Revenue Service', '07:41', '07:43', 6, 153, 171),
    (N'A', N'Revenue Service', N'Victory Square', '07:44', '07:46', 7, 171, 177),
    (N'A', N'Victory Square', N'Aslanikashvili Square', '07:47', '07:53', 8, 177, 245),
    (N'A', N'Aslanikashvili Square', N'Grishashvili-Dumbadze', '07:54', '07:57', 9, 245, 275),
    (N'A', N'Grishashvili-Dumbadze', N'Auli Galaevi-Nizharadze', '07:58', '08:01', 10, 275, 308),
    (N'A', N'Auli Galaevi-Nizharadze', N'Tourist Information', '08:02', '08:04', 11, 308, 328),
    (N'A', N'Tourist Information', N'Karvasla', '08:05', '08:07', 12, 328, 347),
    (N'A', N'Karvasla', N'Pirosmani', '08:08', '08:21', 13, NULL, NULL),
    (N'B', N'Chavchavadze Square', N'Parliament', '07:22', '07:26', 1, 0, 41),
    (N'B', N'Parliament', N'Public Service Hall', '07:27', '07:29', 2, 41, 51),
    (N'B', N'Public Service Hall', N'21st School', '07:30', '07:42', 3, 51, 148),
    (N'B', N'21st School', N'Garden of Glory', '07:43', '07:45', 4, 148, 168),
    (N'B', N'Garden of Glory', N'Tortladze', '07:46', '07:50', 5, 168, 198),
    (N'B', N'Tortladze', N'Parnavaz Mepe', '07:51', '07:56', 6, 198, 243),
    (N'B', N'Parnavaz Mepe', N'Aslanikashvili Square', '07:57', '08:01', 7, 243, 283),
    (N'B', N'Aslanikashvili Square', N'Grishashvili-Dumbadze', '08:02', '08:05', 8, 283, 313),
    (N'B', N'Grishashvili-Dumbadze', N'Aghmashenebeli Bridge', '08:06', '08:15', 9, 313, 420),
    (N'B', N'Aghmashenebeli Bridge', N'Music School', '08:16', '08:22', 10, 420, 477),
    (N'B', N'Music School', N'Chavchavadze Square', '08:23', '08:38', 11, NULL, NULL),
    (N'C', N'Youth Park', N'Autonomy', '07:24', '07:33', 1, 0, 70),
    (N'C', N'Autonomy', N'Nutsubidze', '07:34', '07:37', 2, 70, 95),
    (N'C', N'Nutsubidze', N'Tskhinvali', '07:38', '07:44', 3, 95, 150),
    (N'C', N'Tskhinvali', N'Revenue Service', '07:45', '07:47', 4, 150, 168),
    (N'C', N'Revenue Service', N'Victory Square', '07:48', '07:50', 5, 168, 182),
    (N'C', N'Victory Square', N'Oghaskura', '07:51', '07:56', 6, 182, 238),
    (N'C', N'Oghaskura', N'Minerals Institute', '07:57', '07:59', 7, 238, 261),
    (N'C', N'Minerals Institute', N'Pirosmani', '08:00', '08:08', 8, 261, 331),
    (N'C', N'Pirosmani', N'Shartava', '08:09', '08:13', 9, 331, 368),
    (N'C', N'Shartava', N'Kutaisi 2', '08:14', '08:17', 10, 368, 399),
    (N'C', N'Kutaisi 2', N'Youth Park', '08:18', '08:23', 11, NULL, NULL),
    (N'D', N'Suliko', N'Bukhaidze', '07:26', '07:28', 1, 0, 15),
    (N'D', N'Bukhaidze', N'Oghaskura', '07:29', '07:31', 2, 15, 31),
    (N'D', N'Oghaskura', N'Tortladze', '07:32', '07:38', 3, 31, 82),
    (N'D', N'Tortladze', N'21st School', '07:39', '07:43', 4, 82, 112),
    (N'D', N'21st School', N'Asatiani-Tabidze', '07:44', '07:48', 5, 112, 137),
    (N'D', N'Asatiani-Tabidze', N'Aghmashenebeli Bridge', '07:49', '07:51', 6, 137, 150),
    (N'D', N'Aghmashenebeli Bridge', N'University', '07:52', '07:55', 7, 150, 188),
    (N'D', N'University', N'Korkia Street', '07:56', '07:58', 8, 188, 203),
    (N'D', N'Korkia Street', N'Balakhvani', '07:59', '08:03', 9, 203, 243),
    (N'D', N'Balakhvani', N'School #12', '08:04', '08:06', 10, 243, 264),
    (N'D', N'School #12', N'Suliko', '08:07', '08:22', 11, NULL, NULL),
    (N'E', N'Train Station', N'School #12', '07:28', '07:30', 1, 0, 12),
    (N'E', N'School #12', N'Balakhvani', '07:31', '07:33', 2, 12, 38),
    (N'E', N'Balakhvani', N'University', '07:34', '07:36', 3, 38, 71),
    (N'E', N'University', N'Aghmashenebeli Bridge', '07:37', '07:41', 4, 71, 135),
    (N'E', N'Aghmashenebeli Bridge', N'Asatiani-Tabidze', '07:42', '07:44', 5, 135, 148),
    (N'E', N'Asatiani-Tabidze', N'Chechelashvili', '07:45', '07:47', 6, 148, 157),
    (N'E', N'Chechelashvili', N'Garden of Glory', '07:48', '07:51', 7, 157, 175),
    (N'E', N'Garden of Glory', N'21st School', '07:52', '07:55', 8, 175, 202),
    (N'E', N'21st School', N'Shartava', '07:56', '08:03', 9, 202, 254),
    (N'E', N'Shartava', N'Kutaisi 2', '08:04', '08:09', 10, 254, 311),
    (N'E', N'Kutaisi 2', N'Train Station', '08:10', '08:25', 11, NULL, NULL);

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
