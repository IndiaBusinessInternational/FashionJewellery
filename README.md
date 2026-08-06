# IBI Fashion Jewellery

Imitation / fashion jewellery stock register for **India Business International** —
photos, quantities and wholesale prices, with stock **deducted automatically when a
sale is processed in [IBI Order Processing](https://orders.indiabusinessinternational.online/)**.

**The laptop is the server.** There is no cloud backend and no database service: a small
Node server in `Backend\` serves the app and keeps every record on the machine under
`Backend\data\`. Same arrangement as IBI Social Flow.

---

## Running it

Double-click **`START-JEWELLERY.bat`**. It opens the app and leaves a black window running —
**closing that window stops the server.**

| Where | URL |
|---|---|
| On the laptop | `http://localhost:3100` |
| Another device on the same Wi-Fi | `http://<laptop-ip>:3100` — needs `accessPin` |
| Anywhere | `https://jewellery.indiabusinessinternational.online` — needs the Cloudflare Tunnel |

**Start it automatically at logon:** put a shortcut to `Backend\start-hidden.vbs` in
`C:\Users\ADMIN\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
(no admin rights needed — the same trick IBI Social Flow uses).

There is **no `npm install`** and no `node_modules`. The server is plain Node with zero
dependencies, so there is nothing to reinstall or break.

## Settings — `Backend\config.json`

Written with blanks on first start. Edit it, then restart the server.

| Key | What it does |
|---|---|
| `port` | 3100 by default (3000 belongs to IBI Social Flow) |
| `accessPin` | **Blank = this laptop only.** The server *refuses* every remote caller while it is blank, so it cannot be left open by accident. Set it before using Wi-Fi or the tunnel. |
| `ownerPin` | Needed to delete a product or redraw the sale-sync baseline. Blank = those are refused. |
| `pushKey` | The shared key IBI Order Processing sends with its instant push. Blank = the push is off; the poll below still applies every sale. |
| `pollMinutes` | How often the laptop checks Order Processing for new sales (5) |

⚠ `config.json` holds the PINs and is never served over HTTP (the whole `Backend\` folder
is blocked), and `Backend\` is `.gitignore`d so none of it reaches GitHub.

## Where the data lives

```
Backend\data\products.json    the register
Backend\data\stocklog.json    every movement, with the reason and the order it came from
Backend\data\syncstate.json   which sales have already been applied
Backend\data\images\          product photos
Backend\data\backups\         one dated snapshot per day, kept 60 days
```

Plain JSON you can open, read and copy. Writes are atomic (temp file + rename), so a crash
or a power cut can never leave a half-written register. Menu → **Open Data Folder** jumps
straight there. To back up, copy `Backend\data\` anywhere.

## Fields kept per product

Product Name · Image · Quantity in Stock · Wholesale Price · Retail/MRP · SKU (auto `FJ-0001`) ·
Category · Material/Finish · Colour · Size · Weight · Reorder Level · HSN · GST % ·
Supplier · Purchase Date · Storage Location · Aliases · Notes · Created / Last-Updated stamps.

Photos are shrunk to 1000 px in the browser before upload, so the folder stays small.

## How the automatic stock deduction works

Two paths, both idempotent on `<order serial>|<normalised product name>` — the same sale can
never be deducted twice.

1. **Poll (the reliable one).** The laptop reads Order Processing's Orders feed every
   `pollMinutes` and applies anything sold. This is **outbound only**: it works with no
   tunnel, needs nothing configured on the other side, and catches up by itself after the
   laptop has been off.
2. **Push (the instant one).** When Order Processing saves an order it calls this server
   directly, so the packer sees the new stock level immediately. Needs the tunnel and a
   matching `pushKey`. If it fails, path 1 still gets it.

**Baseline.** The first run deducts nothing; it records the highest order Serial Number and
later runs ignore everything at or below it. A cutoff rather than a list of applied keys
matters — add a product to the register *next month* and months of old orders would
otherwise start matching its name and drain it. Owner Mode → *Reset Sale-Sync Baseline*
re-draws the line at today.

**Matching** is case/punctuation-insensitive on the product name, then SKU, then the
`Aliases` field (marketplace titles, separated by `|`), and finally an *unambiguous*
containment match — anything ambiguous is left alone rather than guessed at. Order
Processing's product picker is fed from this register, so exact matches are the norm.
Stock never goes below zero; an oversell is clamped and flagged in the log.

## Reaching it from outside the laptop

1. Set `accessPin` in `Backend\config.json` and restart. (Until you do, remote callers are
   refused — deliberately.)
2. Add the hostname to the existing Cloudflare Tunnel: see
   `Backend\cloudflared-config-SAMPLE.yml` for the exact command and ingress block.
3. Set `pushKey` too, then put the same URL and key into IBI Order Processing's
   `index.html` (`FJ_API_URL`, `FJ_PUSH_KEY`) so the instant push works.

The social-preview banner, favicon and manifest stay public even with a PIN set, so a
shared link still shows a proper card.

## What is in the repo vs on the laptop

The GitHub repo (`IndiaBusinessInternational/FashionJewellery`) holds only the front end —
`index.html`, `manifest.json`, `sw.js`, `og-banner.png`. The whole `Backend\` folder, the
data and the PINs stay on the laptop. The GitHub Pages copy has no server behind it and
will just say so; the real app is the one the laptop serves.

`Backend\unused-google-apps-script\` is the earlier cloud version, kept as a fallback. It is
not running — do not deploy it alongside this, or the two stores would drift apart.

## Versioning

The badge at the top-left is the release marker. Bump it on **every** change —
`.ver-badge`, the footer line, the drawer "Version" line, `APP_VERSION`, and `CACHE` in
`sw.js`. `SERVER_VERSION` in `Backend\server.js` is tracked separately.
