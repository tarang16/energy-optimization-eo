/* =====================================================================
   Shift all model_output + run_info timestamps forward so the local
   dataset (which physically only covers 2026-03-24 .. 2026-03-31)
   reads as ending ~1 hour ago relative to GETDATE().

   SAFE TO RERUN. The shift is computed each run against the *current*
   MAX timestamp in model_output, so running twice in a row after no new
   data arrives either becomes a no-op or a small re-freshen.

   Run in SSMS, F5. Completes in a few seconds on ~330k rows.

   Reverts: there is no automatic undo. If you need to go back to the
   original March 31 dates, restore from the Energy_Optimization .bak.
   ===================================================================== */

USE Energy_Optimization;
SET NOCOUNT ON;

------------------------------------------------------------------
-- BEFORE snapshot
------------------------------------------------------------------
DECLARE @beforeMaxModel    DATETIME = (SELECT MAX(time_stamp)       FROM model_output);
DECLARE @beforeMaxRunInfo  DATETIME = (SELECT MAX(last_data_update) FROM run_info);

PRINT '===== BEFORE =====';
PRINT 'model_output MAX(time_stamp)       : ' + CONVERT(VARCHAR(25), @beforeMaxModel,   120);
PRINT 'run_info     MAX(last_data_update) : ' + CONVERT(VARCHAR(25), @beforeMaxRunInfo, 120);

------------------------------------------------------------------
-- Compute the shift (whole days, so hour-of-day patterns stay intact)
-- Target = "~1 hour ago" so the shifted data never looks future-dated.
------------------------------------------------------------------
DECLARE @target     DATETIME = DATEADD(HOUR, -1, GETDATE());
DECLARE @shiftDays  INT      = DATEDIFF(DAY, @beforeMaxModel, @target);

PRINT '';
PRINT 'Target "latest timestamp"          : ' + CONVERT(VARCHAR(25), @target, 120);
PRINT 'Computed shift (days)              : ' + CAST(@shiftDays AS VARCHAR(10));

IF @shiftDays <= 0
BEGIN
    PRINT '';
    PRINT 'Data already current (or ahead of target). Nothing to do.';
    RETURN;
END;

------------------------------------------------------------------
-- Apply the shift atomically
------------------------------------------------------------------
BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE model_output
    SET    time_stamp = DATEADD(DAY, @shiftDays, time_stamp);
    DECLARE @moRows INT = @@ROWCOUNT;

    UPDATE run_info
    SET    last_data_update = DATEADD(DAY, @shiftDays, last_data_update),
           last_run_time    = DATEADD(DAY, @shiftDays, last_run_time);
    DECLARE @riRows INT = @@ROWCOUNT;

    COMMIT;

    PRINT '';
    PRINT 'Rows shifted in model_output        : ' + CAST(@moRows AS VARCHAR(20));
    PRINT 'Rows shifted in run_info            : ' + CAST(@riRows AS VARCHAR(20));
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    THROW;
END CATCH;

------------------------------------------------------------------
-- AFTER snapshot
------------------------------------------------------------------
DECLARE @afterMaxModel    DATETIME = (SELECT MAX(time_stamp)       FROM model_output);
DECLARE @afterMaxRunInfo  DATETIME = (SELECT MAX(last_data_update) FROM run_info);
DECLARE @afterMinModel    DATETIME = (SELECT MIN(time_stamp)       FROM model_output);

PRINT '';
PRINT '===== AFTER =====';
PRINT 'model_output MIN(time_stamp)       : ' + CONVERT(VARCHAR(25), @afterMinModel,   120);
PRINT 'model_output MAX(time_stamp)       : ' + CONVERT(VARCHAR(25), @afterMaxModel,   120);
PRINT 'run_info     MAX(last_data_update) : ' + CONVERT(VARCHAR(25), @afterMaxRunInfo, 120);
PRINT '';
PRINT 'Dashboard should now show ~8 days of data ending ~1 hour ago.';
PRINT 'Refresh the browser tab (Ctrl+F5) to see the new timestamps.';
