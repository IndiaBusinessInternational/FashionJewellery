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

**It already starts automatically at logon** — `IBI-FashionJewellery-Server.lnk` in the
Startup folder runs `Backend\start-hidden.vbs` (no admin rights needed, the same trick IBI
Social Flow uses). Delete that shortcut to stop it starting by itself.

There is **no `npm install`** and no `node_modules`. The server is plain Node with zero
dependencies, so there is nothing to reinstall or break.

## Settings — `Backend\config.json`

Written with blanks on first start. Edit it, then restart the server.

| Key | What it does |
|---|---|
| `port` | 3100 by default (3000 belongs to IBI Social Flow) |
| `accessPin` | **Blank = this laptop only.** The server *refuses* every remote caller while it is blank, so it cannot be left open by accident. Set it before using Wi-Fi or the tunnel. |

**One PIN.** `accessPin` is the whole permission model (server v1.6 / app v2.5). There used to
be a second `ownerPin` in front of delete, Recently Deleted and the baseline; it was removed at
the owner's instruction. Signing in — or sitting at this laptop — is enough for everything.
Delete stays safe because it moves the product to *Recently Deleted*, not to nowhere.

**Saving the PIN in a browser.** The sign-in page carries a real username field, pre-filled
`IBI-Jewellery`, so a password manager files this app under its own name. Without a username
field the browser reuses whatever username it already knows for the account — every IBI app
collapses into one `iINTELLIGENCEi` entry and there is no telling which saved password
belongs to which app. Give each app a distinct username (`IBI-Jewellery`, `IBI-SocialFlow`,
`IBI-ERP`, …) and the right password is offered on the right site.

Two details that make the prompt actually appear: the password input is
`autocomplete="current-password"` (**`autocomplete="off"` is precisely what suppresses the
save prompt**), and the page only navigates on a *successful* sign-in — a wrong PIN must not
reload, or the browser offers to save the wrong password.

Both PINs are rate-limited: **six wrong answers from one address pauses that address for 15
minutes**, and while paused even the correct PIN is refused. This is what makes a short PIN
safe to expose — a 4-digit code is only 10,000 guesses, which is minutes of work without a
lockout. The counter lives in memory, so restarting the server clears it. Behind Cloudflare
the caller is identified by `cf-connecting-ip`, which Cloudflare sets at its edge and refuses
to let a client forge (it rejects such requests with error 1000).
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
otherwise start matching its name and drain it. Menu → *Reset Sale-Sync Baseline*
re-draws the line at today.

**Matching** is case/punctuation-insensitive on the product name, then SKU, then the
`Aliases` field (marketplace titles, separated by `|`), and finally an *unambiguous*
containment match — anything ambiguous is left alone rather than guessed at. Order
Processing's product picker is fed from this register, so exact matches are the norm.
Stock never goes below zero; an oversell is clamped and flagged in the log.

## Reaching it from outside the laptop — already set up

`https://jewellery.indiabusinessinternational.online` is live, carried by the **existing
`ibi-socialflow` Cloudflare Tunnel** (one tunnel, several hostnames — nothing new to create
or autostart). The ingress lives in `C:\Users\ADMIN\.cloudflared\config.yml`;
`Backend\cloudflared-config-SAMPLE.yml` documents the block and the `tunnel route dns`
command in case it ever needs rebuilding.

Opening it asks for the **access PIN**, then remembers the device for 12 hours.

⚠ **A loopback socket does not mean "someone at this laptop."** `cloudflared` runs on this
machine and connects to the server *from* `127.0.0.1`, so every tunnel request looks local.
The server therefore also checks for Cloudflare's `cf-connecting-ip` / `cf-ray` headers
before treating a caller as local. Without that check the PIN gate is bypassed by the whole
internet — it was, until testing against the real tunnel caught it. Keep that check if you
ever touch `isLocal()`.

The social-preview banner, favicon and manifest stay public even with a PIN set, so a
shared link still shows a proper card.

⚠ **Never mark a gated response `Cache-Control: public`.** Cloudflare is a shared cache and
will happily store anything so labelled, then serve it to callers who never passed the PIN —
straight from its edge, without the request ever reaching this laptop. Product photos were
sent as `public, max-age=31536000, immutable` and were being served unauthenticated with
`cf-cache-status: HIT`. They are now `private, max-age=86400`: the phone's own browser still
caches them (which matters on mobile data), but no shared cache may. Everything else the
server hands out defaults to `private, no-store`; only `PUBLIC_PATHS` is `public`.
**If a photo URL was ever served as `public`, the copy already sitting in Cloudflare's edge
survives the header change** — purge it once from the Cloudflare dashboard
(Caching → Configuration → Purge Everything), or it keeps being served until its TTL expires.

**The push key is never committed.** This repo and Order Processing's are both public, so
the key is stored per device in `localStorage` instead: in Order Processing, tap the version
badge to unlock Owner Mode and it offers to link the device once. A device without the key
simply does not push — and loses nothing, because the laptop polls anyway. To change it,
clear `ibi_fj_push_key` in that browser and unlock Owner Mode again.

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
