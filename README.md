# IBI Fashion Jewellery

Imitation / fashion jewellery stock register for **India Business International** —
photos, quantities and wholesale prices, with stock **deducted automatically when a
sale is processed in [IBI Order Processing](https://orders.indiabusinessinternational.online/)**.

**Live:** https://jewellery.indiabusinessinternational.online/

---

## What is where

| Path | What it is |
|---|---|
| `index.html` | The whole app — single file, PWA, no build step |
| `manifest.json`, `sw.js` | PWA install + offline shell |
| `og-banner.png` | 1200×630 social preview |
| `CNAME` | Custom domain for GitHub Pages |
| `Backend/IBIFashionJewellery_GAS.gs` | **Apps Script backend — LOCAL MIRROR, never committed** |
| `Backend/IBIFashionJewellery_appsscript.json` | Manifest for that Apps Script project |

> ⚠ **The `.gs` must never be committed.** GitHub Pages serves every file in the repo,
> so a published backend would expose the owner PIN. `Backend/` and `*.gs` are in
> `.gitignore`. Edit the mirror here, then paste it into the Apps Script editor.

## Fields kept per product

Product Name · Image · Quantity in Stock · Wholesale Price · Retail/MRP · SKU (auto `FJ-0001`) ·
Category · Material/Finish · Colour · Size · Weight · Reorder Level · HSN · GST % ·
Supplier · Purchase Date · Storage Location · Aliases · Notes · Created / Last-Updated stamps.

Product photos are shrunk to 1000 px in the browser and stored in the Drive folder
**IBI Fashion Jewellery Images**; the sheet holds the shareable thumbnail URL.

## How the automatic stock deduction works

Two independent paths, both idempotent on the key `<Order Serial>|<normalised product name>`
recorded in the `SyncState` tab — so the same sale can never be deducted twice.

1. **Push (instant).** When IBI Order Processing saves an order, it calls this backend's
   `deductStock` with the product name, quantity and serial number. If the name matches a
   jewellery item, its stock drops and the movement is logged with the order ID, platform
   and buyer.
2. **Pull (catch-up).** The ↻ button — and a quiet pass a few seconds after the app opens —
   runs `syncOrders`, which re-reads the Orders feed and applies anything the push missed.
   Optional hourly automation: run `fjInstallSyncTrigger` once in the Apps Script editor.

**Baseline.** The very first sync deducts nothing; it just records the highest order
Serial Number as `SYNC_MAX_SERIAL`, and later runs ignore everything at or below it. So
switching the link on does not wipe the register with months of history — and, importantly,
a product added to the register *next month* does not suddenly match old orders and
retro-deduct them. Owner Mode → *Reset Sale-Sync Baseline* re-draws the line at today.

**Matching** is case/punctuation-insensitive on the product name, then SKU, then the
`Aliases` field (marketplace titles, separated by `|`), and finally an *unambiguous*
containment match. Anything ambiguous is left alone rather than guessed at. Names entered
in Order Processing come from a picker that includes this register, so exact matches are
the norm. Stock never goes below zero — an oversell is clamped and flagged in the log.

## Setup (once)

1. script.google.com → new project → paste `Backend/IBIFashionJewellery_GAS.gs` → Save.
2. Run `fjSetup` → Allow. It creates the Sheet and the Drive image folder and logs both links.
3. Project Settings → Script Properties → `OWNER_PIN` = a **new** PIN (never `8899`).
4. Deploy → New deployment → Web app → *Execute as* **Me**, *Access* **Anyone** → copy the `/exec` URL.
5. Open the app → Menu → **Backend Connection** → paste the URL.
6. Press ↻ once to set the baseline.
7. Tell IBI Order Processing about it: paste the same `/exec` URL into `FJ_GAS_URL` in
   its `index.html` (it is already wired to call `deductStock`).

After **any** edit to the `.gs`: paste it back, then **Deploy → Manage deployments → Edit →
New version**. That keeps the same `/exec` URL. Verify with `<exec-url>?action=ping`.

## Versioning

The badge at the top-left is the release marker. Bump it on **every** deploy —
`.ver-badge`, the footer line, the drawer "Version" line, `APP_VERSION`, and `CACHE` in `sw.js`.
