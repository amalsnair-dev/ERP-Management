# Aurix Data Synchronization & Day-End Reset Lifecycle

**Component:** `aurixwebapi`  
**Ecosystem:** Blogtec Software LLP — Aurix Suite  
**Author:** Blogtec Software Engineering Team  
**Last Updated:** October 2026  

---

## 🏛️ 1. Architecture & Global Data Flow

The Aurix synchronization pipeline connects on-premises jewelry store terminals to executive mobile dashboards through a multi-stage data bridge:

```mermaid
flowchart TD
    subgraph OnPremisePOS ["Branch POS / Billing Terminal"]
        BS["BillSoft Desktop ERP<br/>(Java Swing)"]
        NA["AspNumberAnalysis.java<br/>(Day-End Closing & Reset)"]
        SNA["AspSyncNumberAnalysis.java<br/>(Snapshot Builder)"]
        LocalDB[("PostgreSQL: billsoft")]
        
        BS --> NA
        NA -->|1. Create Snapshot| SNA
        SNA -->|INSERT INTO temp_numanacathead| LocalDB
        SNA -->|2. POST /api/sync/trigger| AWA
        NA -->|3. reset()| LocalDB
    end

    subgraph BranchBackend ["Local Branch Server"]
        AWA["aurixwebapi<br/>(Spring Boot :8080)"]
        AWA -->|Query Summary & Temp Tables| LocalDB
        AWA -->|DELETE temp_numanacathead on 2xx| LocalDB
    end

    subgraph CentralCloud ["Central Cloud Server"]
        AOA["aurixownersapi<br/>(Spring Boot :8082)"]
        CloudDB[("PostgreSQL: owners_db")]
        AOA <--> CloudDB
    end

    subgraph MobileExecutive ["Executive Clients"]
        APP["Aurix_Owners Mobile App<br/>(React Native / Expo SDK 57)"]
    end

    AWA -->|"POST /api/sync/daily-summary<br/>(HTTP Basic Auth)"| AOA
    AOA -->|"WebSocket Broadcast<br/>broadcastReload()"| APP
    APP <-->|"JWT REST API<br/>/api/owner/dashboard"| AOA
```

---

## 🔄 2. Day-End Number Analysis & Reset Workflow

In **BillSoft** desktop POS, daily closing is performed inside [`AspNumberAnalysis.java`](file:///D:/Software/Kairaliworkspace/BillSoftKairali/BillSoft/src/asp/frames/AspNumberAnalysis.java):

```java
if (p.no2) // Verified authorization
{
    // Step 1: Snapshot active category head and splitup balances
    new AspSyncNumberAnalysis(conn, date_field.getText(), shopcode);
    
    // Step 2: Reset daily figures for the next business day
    reset();
}
```

### 2.1 The Snapshot Step (`AspSyncNumberAnalysis`)
Before `reset()` zeroes out daily transactions:
1. Verifies that cashier cashmarking exists: `SELECT counter_code FROM cashmarkings`.
2. Creates temporary staging tables if not present: `temp_numanacathead` and `temp_splituptable`.
3. Copies the live stock and transaction state:
   ```sql
   DELETE FROM temp_numanacathead;
   INSERT INTO temp_numanacathead SELECT date'...' as transdate, * FROM numanacathead;
   ```
4. Calls `POST http://localhost:8080/aurixwebapi/api/sync/trigger`.

### 2.2 The Reset Step (`reset()`)
1. Verifies idempotency: `SELECT reset FROM goldrate`. If already `1`, warns `"Reset Already Done"`.
2. Clears breakups and resets `numanacathead`:
   - `salgwt=0, salnos=0, rctgwt=0, rctnos=0, shortgwt=0, shortnos=0, barrctwt=0, barisswt=0`
   - Rollovers closing balance to tomorrow's opening balance: `opgwt = closingwt`, `opnos = closingnos`.
3. Marks the day officially closed in database:
   ```sql
   UPDATE goldrate SET reset = 1;
   ```
4. Adds collected cashier drawer cash to opening balance in `lastno` (`opbal = opbal + cash_collected`).
5. Calls `ClearEstimate` and `updateAccounts`.

---

## 🚨 3. The Race Condition & Stale Sync Problem (Resolved)

Prior to this update, two critical flaws existed in the sync pipeline:

| Flaw | Root Cause | Impact |
| :--- | :--- | :--- |
| **Race Condition** | `/api/sync/trigger` only called `resetSyncTime()`, waiting for the next 30s schedule tick. Meanwhile, `reset()` completed in ~1 second in a background thread. | By the time the scheduler ran, `numanacathead` had already been zeroed out, and business dates could mismatch. |
| **Infinite Stale Sync Loop** | Ledger tables (`sbillmstr`, `cashmarkings`) are permanent accounting records and are NOT deleted on reset. `temp_numanacathead` was never cleared after delivery. | Every 30 seconds (even throughout the night after store close), `aurixwebapi` repeatedly pulled the closed day's sales and re-pushed them to `aurixownersapi`, creating endless cloud database updates and unnecessary WebSocket mobile reload pings. |

---

## 🛡️ 4. The Smart Synchronization Engine

The upgraded engine in [`SyncDailySummaryService.java`](file:///d:/SOFTWARE%20DEV/aurixwebapi/src/main/java/com/blogtec/aurixwebapi/sync/SyncDailySummaryService.java) and [`SyncTriggerController.java`](file:///d:/SOFTWARE%20DEV/aurixwebapi/src/main/java/com/blogtec/aurixwebapi/controller/SyncTriggerController.java) implements four layers of protection:

### 4.1 Immediate Synchronous Push on Trigger
When `AspSyncNumberAnalysis` fires `/api/sync/trigger`, `aurixwebapi` does NOT defer to the 30-second timer:
```java
@PostMapping("/trigger")
public ResponseEntity<String> triggerSync() {
    return syncDailySummaryService.executeImmediateSync();
}
```
The exact snapshot in `temp_numanacathead` is captured and sent immediately before `reset()` finishes.

### 4.2 Reset Lock (`isDayReset()`)
Checks `goldrate.reset == 1`:
```java
public boolean isDayReset() {
    Integer reset = jdbcTemplate.queryForObject("SELECT reset FROM goldrate LIMIT 1", Integer.class);
    return reset != null && reset == 1;
}
```
* Once a day's final closing sync is successfully received by `aurixownersapi`, `lastClosedSyncedDate` is recorded.
* The 30-second background scheduler **skips** redundant auto-sync runs for that date:
  ```java
  if (dayReset && currentDate != null && currentDate.equals(lastClosedSyncedDate)) {
      logger.debug("Business date {} is already reset/closed and synced. Skipping 30s auto-sync.", currentDate);
      return;
  }
  ```
* When the store re-opens next morning and new gold rates are entered, `goldrate.reset` reverts to `0`, automatically re-enabling regular daytime sync.

### 4.3 Daytime Change Fingerprinting (`computeDataFingerprint`)
During active store hours (`reset == 0`), sync only occurs if transactions actually changed:
```java
Long billCount = jdbcTemplate.queryForObject("SELECT count(*) FROM sbillmstr WHERE est_dte = ?", Long.class, sqlDate);
Long cashCount = jdbcTemplate.queryForObject("SELECT count(*) FROM cashmarkings WHERE marking_date = ?", Long.class, sqlDate);
Double cashTotal = jdbcTemplate.queryForObject("SELECT coalesce(sum(cash_collected),0) FROM cashmarkings WHERE marking_date = ?", Double.class, sqlDate);
String currentFingerprint = billCount + "_" + cashCount + "_" + cashTotal;
```
If `currentFingerprint.equals(lastSyncedFingerprint)`, redundant sync is skipped.

### 4.4 Staging Table Auto-Purge
Upon receiving a `2xx Successful` HTTP response from `aurixownersapi`:
```sql
DELETE FROM public.temp_numanacathead;
DELETE FROM public.temp_splituptable;
```
Stale closing snapshots are cleanly purged, preventing old numbers from persisting into subsequent days.

---

## 🔌 5. Configuration & Endpoints Reference

### 5.1 Local Configuration: `config/sync.json`
```json
{
  "projectsyncapi": {
    "username": "SRG",
    "password": "YOUR_SYNC_PASSWORD",
    "context": "aurixownersapi",
    "location": "http://localhost/",
    "server_port": 8082,
    "timeoutSeconds": 30
  }
}
```

### 5.2 Core Endpoints
| Endpoint | Method | Caller | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/sync/trigger` | `POST` | BillSoft `AspSyncNumberAnalysis` | Triggers immediate synchronous payload compilation and cloud push. |
| `/api/sync/sync-daily-summary` | `POST` | Internal / Admin UI | Explicit sync request with custom company/branch/date payload. |
| `POST /aurixownersapi/api/sync/daily-summary` | `POST` | `aurixwebapi` | Central cloud endpoint receiving daily summaries (HTTP Basic Auth). |
