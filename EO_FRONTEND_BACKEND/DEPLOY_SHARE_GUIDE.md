# EO Dashboard — Public Share-Link Deployment (Complete Step-by-Step)

**Outcome:** A single public HTTPS URL you can paste into chat/email. Anyone who clicks it sees your EO dashboard running off your laptop.

**Stack that stays where it is:** SQL Server Express (on your laptop), .NET 8 backend (`:8001`), Vite React frontend (`:3000`). No Docker. No cloud migration. No DB move.

**What makes it public:** ngrok, a secure tunnel service. You reserve two static subdomains on ngrok's free tier once; from then on every time you start the stack you get the same public URLs back.

**Time:** ~25-30 minutes the first time. ~30 seconds every subsequent start.

**Conventions used below:**
- `PowerShell` = Windows PowerShell running as your normal user, **not** admin (unless stated).
- Paths assume your repo lives at `C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND`. If yours is different, substitute accordingly.
- Placeholder domains in examples: `eo-api-xxx.ngrok-free.app` (backend) and `eo-dash-xxx.ngrok-free.app` (frontend). Replace with whatever ngrok actually gives you.

---

## PART A — Prerequisites (verify, don't skip)

### Step A1. Confirm local stack works

Open PowerShell and run:

```powershell
cd "C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND"
.\run-stack.ps1
```

Wait ~30 seconds. In a browser open:

```
http://localhost:3000/eo_ui
```

You should see the login page → login as Dev/Local admin → tiles populate with Energy Balance 5.83%, Opportunity $333.80/HR, Energy Efficiency 89.94%, Carbon Neutrality 10.06%.

**If this doesn't work, stop.** The tunnel only exposes what already runs. Fix local first per `EO_Integration_Runbook.md` §11.

Stop both processes (Ctrl-C in each terminal) once you've verified, then continue.

### Step A2. Confirm ngrok is installed

```powershell
ngrok --version
```

Expected: something like `ngrok version 3.x.x`.

If it prints "not recognized as a cmdlet", install it:

```powershell
winget install ngrok.ngrok --accept-source-agreements --accept-package-agreements
```

Close and reopen PowerShell, re-run `ngrok --version` to confirm.

---

## PART B — ngrok account & token

### Step B1. Sign up (if you haven't)

1. Open browser → https://dashboard.ngrok.com/signup
2. Sign up with your email (you can use `Tnigam@ingenero.com`).
3. Verify the email, log in.

### Step B2. Rotate the auth token

(Needed because the previous token was shared in chat.)

1. Open https://dashboard.ngrok.com/get-started/your-authtoken
2. Click **Regenerate** (it will warn that the old one stops working — that's what you want).
3. Click **Copy** on the new token.

### Step B3. Save the new token on your laptop

In PowerShell (replace `<NEW_TOKEN>` with the token you just copied):

```powershell
ngrok config add-authtoken <NEW_TOKEN>
ngrok config check
```

Expected:

```
Authtoken saved to configuration file: C:\Users\tnigam\AppData\Local\ngrok\ngrok.yml
Valid configuration file at C:\Users\tnigam\AppData\Local\ngrok\ngrok.yml
```

**Do not paste the new token anywhere else.** Not into chat, not into a file, not into a Slack message. It lives on your laptop only.

---

## PART C — Claim two static domains

You need two: one for the backend tunnel (`:8001`), one for the frontend tunnel (`:3000`). Static = same URL every restart (the whole point).

### Step C1. Claim the first static domain (frontend)

1. Open https://dashboard.ngrok.com/domains
2. Click **+ New Domain** (top-right).
3. ngrok auto-suggests a name like `happy-otter-1234.ngrok-free.app`. Click **Create domain** (or change it first if you want something memorable; free tier allows the auto-generated style only).
4. Copy the domain. **Write it down as FRONTEND DOMAIN.** Example: `eo-dash-2a3b.ngrok-free.app`.

### Step C2. Claim the second static domain (backend)

Free ngrok gives **one static domain per account**. You have two options for the second:

**Option 1 — Second free account (recommended, zero cost):**

1. Open an incognito window (`Ctrl+Shift+N` in Chrome).
2. Go to https://dashboard.ngrok.com/signup.
3. Sign up with a second email (e.g., a personal Gmail).
4. In that new account, repeat Step C1 to claim a backend static domain. Example: `eo-api-5c6d.ngrok-free.app`. **Write it down as BACKEND DOMAIN.**
5. Copy that account's auth token from https://dashboard.ngrok.com/get-started/your-authtoken.

You now have **two tokens and two domains**. In Part D you'll merge them into one ngrok config.

**Option 2 — Upgrade to ngrok Personal ($10/mo):**

1. In your existing account → Billing → Personal plan.
2. You then get up to 3 static domains on one account. Claim a second via Step C1 again.
3. Skip the second-account part of Part D.

The rest of this guide assumes Option 1 (two free accounts). If you went with Option 2, ignore the "authtokens (2)" step in D2 and just put your single authtoken in.

---

## PART D — Configure the tunnel

### Step D1. Open the ngrok config file

```powershell
notepad "$env:LOCALAPPDATA\ngrok\ngrok.yml"
```

Right now (after Step B3) it should look roughly like:

```yaml
version: "3"
agent:
  authtoken: <your_frontend_account_token>
```

### Step D2. Replace its contents with this template

Select all, delete, paste the block below. Then edit the two domain lines and (if using Option 1) the second authtoken line.

```yaml
version: "3"
agent:
  authtokens:
    - <TOKEN_FROM_ACCOUNT_1_FRONTEND>
    - <TOKEN_FROM_ACCOUNT_2_BACKEND>

tunnels:
  eo-frontend:
    proto: http
    addr: 3000
    domain: eo-dash-2a3b.ngrok-free.app    # <-- YOUR FRONTEND DOMAIN from C1

  eo-backend:
    proto: http
    addr: 8001
    domain: eo-api-5c6d.ngrok-free.app     # <-- YOUR BACKEND DOMAIN from C2
```

> If you went with **Option 2 (paid, single account)**, use:
> ```yaml
> agent:
>   authtoken: <your_only_token>
> ```
> instead of the `authtokens:` list.

Save and close Notepad.

### Step D3. Validate

```powershell
ngrok config check
```

Expected: `Valid configuration file at C:\Users\tnigam\AppData\Local\ngrok\ngrok.yml`.

If it complains about YAML syntax, the most common causes are: missing two-space indent before `proto:`/`addr:`/`domain:`; using tabs instead of spaces; missing `- ` in front of an authtoken in the list.

---

## PART E — Wire the frontend and backend to the public URLs

Both pieces of code currently assume `localhost`. The frontend needs to call the **public** backend URL, and the backend needs to let the **public** frontend domain through CORS.

### Step E1. Update `EO_Frontend\.env`

Open it:

```powershell
notepad "C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND\EO_Frontend\.env"
```

Find the `EO_BASEURL` line and change it from:

```
EO_BASEURL = http://127.0.0.1:8001/api/v1
```

to:

```
EO_BASEURL = https://eo-api-5c6d.ngrok-free.app/api/v1
```

(Use your **backend** domain from C2. Note: **https**, not http. Note: keep the trailing `/api/v1`.)

Leave the other 12 `EO_*` keys alone.

Save and close.

### Step E2. Update backend CORS

Open:

```powershell
notepad "C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND\EO.NET +Selenium\EO .NET + Selenium\EO_Backend\EOWebMicroservice\Program.cs"
```

Search (`Ctrl+F`) for `AddCors`. You'll find an existing block. Replace it with this (preserving your variable names if they differ):

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://eo-dash-2a3b.ngrok-free.app"   // <-- YOUR FRONTEND DOMAIN
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
```

Then also search for `app.UseCors`. Make sure the line exists and is placed **before** `app.UseAuthentication()` / `app.UseAuthorization()`. If `app.UseCors()` doesn't exist yet, add it right after `app.UseRouting()`:

```csharp
app.UseRouting();
app.UseCors();              // <-- add if missing
app.UseAuthentication();
app.UseAuthorization();
```

Save and close.

### Step E3. Rebuild the backend

```powershell
cd "C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND\EO.NET +Selenium\EO .NET + Selenium\EO_Backend"
dotnet build EOWebAPI.sln -c Debug
```

Expected: `Build succeeded. 0 Error(s)`.

If it errors, the most likely cause is a typo in the CORS block you pasted. Fix and rebuild.

---

## PART F — Make the laptop a reliable host

### Step F1. Disable sleep while the link is live

Run as **admin** PowerShell (right-click PowerShell → Run as administrator):

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
```

That prevents sleep on AC and on battery. Revert later by changing `0` to e.g. `30` (minutes).

### Step F2. Allow inbound connections (one-time Windows Firewall OK)

The first time you run `dotnet run`, Windows will pop up *"Allow on Private / Public networks?"*. Check **both** boxes and allow. If you already dismissed it without ticking, run (admin PowerShell):

```powershell
New-NetFirewallRule -DisplayName "EO Backend 8001"  -Direction Inbound -LocalPort 8001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "EO Frontend 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

(ngrok technically tunnels out through 443, so this is mostly belt-and-braces. But it removes a class of weird "works from laptop, not from phone" issues.)

---

## PART G — First launch

You need three PowerShell windows running simultaneously. Keep them all open.

### Step G1. Window 1 — Backend

```powershell
cd "C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND\EO.NET +Selenium\EO .NET + Selenium\EO_Backend\EOWebMicroservice"
dotnet run --urls "http://localhost:8001"
```

Wait for: `Now listening on: http://localhost:8001` (≈10-20 seconds).

### Step G2. Window 2 — Frontend

New PowerShell window:

```powershell
cd "C:\Users\tnigam\Desktop\optimizer_eo\EO_FRONTEND_BACKEND\EO_Frontend"
npm run dev
```

Wait for: `Local: http://localhost:3000/eo_ui` (≈5 seconds).

### Step G3. Window 3 — ngrok (both tunnels)

New PowerShell window:

```powershell
ngrok start --all
```

You should see output with two `Forwarding` lines:

```
Forwarding   https://eo-dash-2a3b.ngrok-free.app   -> http://localhost:3000
Forwarding   https://eo-api-5c6d.ngrok-free.app    -> http://localhost:8001
```

If you see only one, you're on a single-account setup and the second tunnel failed — check the `authtokens:` list in `ngrok.yml`.

---

## PART H — Verify from the outside

Critical step. "Works on my laptop" does not mean "works for your viewers."

### Step H1. Verify backend tunnel

On your **phone** (turn off Wi-Fi → use cellular, so you're definitely not hitting your home network), open:

```
https://eo-api-5c6d.ngrok-free.app/api/v1/WinAuth/authenticate
```

First time ngrok will show a blue "You are about to visit…" warning page — click **Visit Site**. Your viewers will see this page once per device too; it's harmless, just click through.

Expected: a JSON blob. If you see `502 Bad Gateway`, the backend isn't running in Window 1. If you see `ERR_NGROK_3200`, the static domain isn't actually reserved.

### Step H2. Verify frontend

On your phone, open:

```
https://eo-dash-2a3b.ngrok-free.app/eo_ui
```

Click through the ngrok warning → the EO login page should render → click Login → dashboard with real tile numbers.

If the shell renders but every tile errors, the browser console will show CORS errors. Go back and double-check Step E2.

If the login button does nothing / network errors, the frontend `.env` didn't pick up your edit — go to Window 2, Ctrl-C, `npm run dev` again.

---

## PART I — Share

Send this URL to anyone:

```
https://eo-dash-2a3b.ngrok-free.app/eo_ui
```

They'll see:
1. The ngrok interstitial (click "Visit Site").
2. The EO login page (click Login → auto-admin bypass).
3. The dashboard.

That's the entire user journey. Nothing to install on their side.

---

## PART J — Stop / restart

### Stop

Ctrl-C in each of the three windows (or just close them). The link immediately starts returning 502. Your static domains stay reserved on your ngrok account indefinitely; you don't lose them.

### Restart (every subsequent time)

Either: repeat Steps G1-G3 in three PowerShell windows (≈30 seconds).

Or: double-click `START_SHARE.ps1` in the workspace folder — it launches all three windows for you.

Same URL every time. No reconfiguration.

---

## PART K — Read-before-sharing caveats

1. **Your laptop IS the server.** Every viewer click hits your SQL Express. ~2-3 concurrent users is comfortable; 10+ will feel slow.

2. **ngrok free rate limit.** ~40 requests/minute per tunnel. A normal dashboard session uses 10-20 requests, so 2 people at once is fine; a demo to 10 people at once may hit the cap and spit `429 Too Many Requests`.

3. **No access control.** The auth bypass (runbook §5) logs everyone in as Dev/Local admin. If the link leaks to someone unintended they see everything. For at-least-a-password protection, add basic auth to the frontend tunnel — open `ngrok.yml` and change the frontend block to:

   ```yaml
   eo-frontend:
     proto: http
     addr: 3000
     domain: eo-dash-2a3b.ngrok-free.app
     basic_auth:
       - "demo:PickAGoodPassword"
   ```

   Viewers will then see a browser-native username/password prompt before the dashboard loads.

4. **Sleep = broken link.** If the laptop sleeps, shuts, or loses Wi-Fi, the link returns 502 until you bring it back. Part F handles sleep; the Wi-Fi part is on you.

5. **This is not an always-on deployment.** If you later need 24/7 availability without your laptop on, you'll have to migrate backend to Azure App Service (or similar) and DB to Azure SQL. Different project — ask and I can draft a plan.

---

## PART L — Troubleshooting quick table

| What you see                                                 | Most likely cause                                                          | Fix                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------- |
| `502 Bad Gateway` on share URL                               | Backend (`dotnet run`) or frontend (`npm run dev`) isn't running.          | Start Window 1 / 2 again.    |
| Blue ngrok "Visit Site" page every time                      | Normal on free tier. Click through.                                        | (not a bug)                  |
| Dashboard shell loads but every tile shows an error          | CORS — frontend domain not whitelisted in `Program.cs`.                    | Step E2, rebuild, restart.   |
| Login button does nothing / `ERR_CONNECTION_REFUSED`         | Frontend `.env` still pointing at `127.0.0.1:8001`.                        | Step E1, restart `npm run dev`. |
| `ERR_NGROK_3200` (domain not claimed)                        | The static domain in `ngrok.yml` isn't reserved on the token's account.    | Re-check accounts → tokens → domains mapping in Part D. |
| `ERR_NGROK_4018` (authentication failed)                     | Token mismatch.                                                            | `ngrok config add-authtoken <fresh>` and reload. |
| `429 Too Many Requests` during a demo                        | Free tier rate limit.                                                      | Wait a minute, or upgrade.   |
| Link works for you, 502 for remote viewers                   | You're testing from the same laptop (loopback). Test from phone on cellular. | Retest from phone.        |
| `ngrok start --all` only starts one tunnel                   | `authtokens:` list is missing the second token, or YAML indent wrong.      | Re-check Part D.             |
| Backend crashes after ~60s                                   | Cron job re-enabled somewhere. Runbook §6.1.                               | Re-disable cron.             |
| `SqlTimeoutException` on heavy widgets                       | Runbook §9.1 — `commandTime=300` not applied.                              | Rebuild after verifying.     |

---

## PART M — Reference: file changes made by this guide

| File                                                                      | Change                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `%LOCALAPPDATA%\ngrok\ngrok.yml`                                          | Two authtokens, two static-domain tunnel definitions.          |
| `EO_Frontend\.env`                                                        | `EO_BASEURL` → public HTTPS backend URL.                       |
| `EO_Backend\EOWebMicroservice\Program.cs`                                 | CORS `WithOrigins` includes frontend static domain.            |
| (no DB changes; no schema changes; no code in `EO_Backend` beyond CORS)   |                                                                |

Everything else — SP rewrites, run_info timestamp, GSR stubs, auth bypass, timeout tuning — was already in place per the integration runbook. This guide only adds the public-exposure layer on top.

---

## Done.

From here: every future demo is just `START_SHARE.ps1` → share the frontend URL. No further setup unless you regenerate tokens or claim new domains.
