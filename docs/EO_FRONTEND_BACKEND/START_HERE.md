# SABIC Energy Optimization — Local Integration Runbook

Everything below runs on **your Windows machine**. The configs are already wired up.

---

## 1. What's already configured for you

| File | What changed |
|---|---|
| `EO.NET +Selenium/EO .NET + Selenium/EO_Backend/EOWebMicroservice/appsettings.json` | Connection strings for the 3 restored DBs (Windows auth, `Server=localhost`). JWT key, rate-limit, and validation defaults filled in so the API can boot. |
| `EO.NET +Selenium/EO .NET + Selenium/EO_Backend/EOWebMicroservice/Properties/launchSettings.json` | Backend now listens on **http://localhost:8001** (matches frontend `.env`). |
| `EO_Frontend/.env` | All `EO_*` keys the React app reads are now present. |

The 4th database, **Manufacturing_Master**, is *not* restored on your machine. Its connection string is configured but pages that hit it (the `PEDataBaseConnection` branch in `CentralRepository.cs`) will throw a "cannot open database" error until you restore that `.bak` too. The rest of the dashboard will still work.

---

## 2. Verify SQL Server is reachable

Open **SSMS** and in Object Explorer confirm you can see all three DBs:

- `SABIC_DT_EnergyOptimization`
- `SABIC_DT_EnergyOptimization_WebUI`
- `SABIC_DT_MFG_EnergyOptimizer_WF`

**If the "Server name" you connect to in SSMS is NOT `localhost`** (e.g. it's `.\SQLEXPRESS`, `YOURPC\SQLDEV`, or `(localdb)\MSSQLLocalDB`), open `appsettings.json` and replace every `Server=localhost` with your actual server name. Example for SQL Express:

```
Server=.\SQLEXPRESS;Database=SABIC_DT_EnergyOptimization;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True
```

Quick sanity check from PowerShell (tests Windows-auth connection to your local DB):

```powershell
sqlcmd -S localhost -E -d SABIC_DT_EnergyOptimization -Q "SELECT TOP 1 name FROM sys.tables"
```

If that prints a table name, your connection string is correct.

---

## 3. Start the backend (.NET API)

Open a terminal in `EO.NET +Selenium/EO .NET + Selenium/EO_Backend/`:

```powershell
dotnet restore EOWebAPI.sln
dotnet build   EOWebAPI.sln -c Debug
cd EOWebMicroservice
dotnet run --launch-profile http
```

You should see:

```
Now listening on: http://localhost:8001
```

Open **http://localhost:8001/swagger** — you should see the EO API v1 / v2 Swagger UI. Try a simple endpoint (e.g. anything under `Config` or `Admin`) — if it returns 200 with JSON, the DB connection works.

### If you see a "cannot open database" error

- Confirm the DB name matches exactly (case-sensitive on some collations).
- Confirm your Windows user has access: in SSMS run `EXEC sp_who2` — you should see yourself listed. If not, run (as `sa` or DB owner):
  ```sql
  USE SABIC_DT_EnergyOptimization;
  CREATE USER [YOURDOMAIN\YourUser] FOR LOGIN [YOURDOMAIN\YourUser];
  ALTER ROLE db_datareader ADD MEMBER [YOURDOMAIN\YourUser];
  ALTER ROLE db_datawriter ADD MEMBER [YOURDOMAIN\YourUser];
  EXEC sp_addrolemember 'db_owner', 'YOURDOMAIN\YourUser';
  ```
  Repeat for each database.

---

## 4. Start the frontend (React + Vite)

Open a **second** terminal in `EO_Frontend/`:

```powershell
npm install     # only if node_modules is missing or stale
npm run dev
```

Vite will print:

```
Local:   http://localhost:3000/eo_ui/
```

Open that URL. The login / landing page should load. The browser DevTools Network tab will show XHRs going to `http://127.0.0.1:8001/api/v1/...` — those should return 200 with real data pulled from your restored databases.

---

## 5. What will work vs. not work on a first boot

**Works out of the box:**
- Authentication flow (JWT is generated locally with the dev key in appsettings.json).
- Every page whose data lives in the 3 restored DBs (Dashboard, Historical, Energy Management, Workflow, Admin, CCP, Favorites, Logging, etc.).

**Will error or return empty until you configure them later:**
- PI System live data (`PiDataServerURL`, `PiWebApiBaseURL` are blank).
- RapidMiner AIHub / What-If Optimization (those URLs are blank).
- ECM document workflow (Refine/Workflow credentials blank).
- BPM, Email, PE ODS external integrations.
- Anything that queries the **`PEDataBaseConnection`** path in `CentralRepository.cs` — until you restore `Manufacturing_Master.bak`.

These fail cleanly with a 500 from that specific endpoint; the rest of the dashboard keeps working.

---

## 6. Troubleshooting cheat sheet

| Symptom | Likely fix |
|---|---|
| `dotnet: command not found` | Install .NET 8 SDK from https://dotnet.microsoft.com/download |
| Build error about `1985449.cer` missing | That cert file in `EOWebMicroservice/Utility/` is used for SABIC's internal mTLS. For local-only DB work it's still loaded at startup — if it's actually missing, comment out the `new X509Certificate2(...)` block in `Program.cs` and the `AddHttpClient("namedClient")` / `"NTLMClient"` registrations that use it. |
| Frontend shows CORS errors | `Program.cs` allows `http://localhost:3000` — make sure Vite really is on 3000 (it is by default per `vite.config.js`). |
| Frontend shows "Network Error" on every call | Backend isn't running on 8001, or Windows Firewall is blocking. `curl http://localhost:8001/swagger/v1/swagger.json` from PowerShell to verify. |
| Login page loops / 401 everywhere | The `JwtSettings.Key` in appsettings.json must be ≥32 bytes — it already is. If you hand-edit it, keep it long. |
| "Too many requests" response | `ConfigSettings.EOLimit` / `TimeSpan` control the rate limiter; bump EOLimit higher for dev testing. |

---

## 7. When you're ready to restore Manufacturing_Master

In SSMS: right-click Databases → Restore Database → Device → add `Manufacturing_Master/Manufacturing_Master.bak` → OK. No config change needed afterwards — the connection string is already pointed at it.
