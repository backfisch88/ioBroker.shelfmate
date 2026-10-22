<p align="center"><img src="admin/shelfmate.png" alt="ShelfMate" width="160"></p>

[![NPM version](https://img.shields.io/npm/v/iobroker.shelfmate.svg)](https://www.npmjs.com/package/iobroker.shelfmate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# ioBroker.shelfmate

Household inventory for ioBroker, served as an installable web app (iPhone home screen / Android) directly by the adapter.
Know what is where, get warned at minimum stock and put missing items on your shopping list automatically.

Deutsche Fassung: [README.de.md](README.de.md)

Step-by-step guides: [Tutorial](docs/en/tutorial.md) (English), [Anleitung](docs/de/tutorial.md) (Deutsch)

---

## Features

- Scan product barcodes and storage location QR codes with the phone camera
- Products without a barcode: create your own EAN-13 code and print the label; upload your own product image (compressed automatically)
- Printable EAN and QR labels in your own label size (Settings, e.g. 50 × 30 mm)
- Product master data from Open Food Facts (name, brand, package size, Nutri-Score, categories), editable
- Storage areas and locations with printable QR codes
- Stock per location, history of all bookings, offline queue in the app
- Search with suggestions while typing ("Nut" suggests "Nutella")
- Product groups: "Flour" from several brands counts as one item
- Optional best-before date (MHD) per product or per stocking, with warning before expiry
- Optional standard shelf life and shelf life after opening, filled in automatically when you want it (a small sparkle symbol shows which values were not typed by hand), opened and spoiled marking, undo of the last booking
- Ingredient check: compares a list of ingredients (for example from a recipe app) with the stock and puts only what is missing on the shopping list
- Minimum stock per product or group with automatic shopping-list entry
- Shopping list modes: **off**, **script** (via data points), **Bring!** or **Bring! special** (counts quantities up instead of skipping duplicates)
- Optional removal from the shopping list when the stock is refilled and/or when the check mark is removed in the app
- Overview of everything in stock as data points (JSON and HTML table for VIS)
- Notifications through Telegram, telegrammenu2, Pushover, Signal, WhatsApp, Matrix or e-mail: minimum stock reached, daily message about expired and expiring products
- Consumption of the last 30 days per product with a suggestion for the minimum stock that you can apply or dismiss with one tap
- A bulb icon in the header collects all suggestions (group suggestions, minimum stock) in one place
- Device name per phone, shown in the history for every booking
- Stocktaking per storage location: as a list (expected quantity; type the counted quantity or tap ✓) or by scanning (scan the location QR, then every item, then the same QR again to finish; works with the camera or a keyboard-style scanner). Product images are shown, a summary confirms each finished location, and corrections appear in the history as "Stocktaking"
- Group suggestions: products with similar names ("Flour", "Flour (Type 405)") can be combined into one group; single products can be removed from a suggestion
- Label templates: "opened on", freezer label, large shelf label, box label with contents list, QR-only label. The adapter settings let you choose which label buttons the app shows
- JSON backup: download and import in the app
- Built-in HTTPS web server that uses the certificates of your ioBroker installation (self-signed, own or Let's Encrypt collections)
- Optional access key for the API
- The app and the HTML data points use the ioBroker system language (de, en, ru, pt, nl, fr, it, es, pl, uk, zh-cn)

## Requirements

- js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.12
- HTTPS with a certificate the phone trusts (needed for the camera scanner and the offline mode)

## Installation

Install via the ioBroker Admin UI (Adapters). Then add an instance and open `https://<host>:8120/`.

## Usage

1. Open `https://<host>:8120/` on your phone and add the page to the home screen.
2. Create storage areas and locations (Settings / Locations). Print the QR code of a location and attach it to the shelf.
3. Add products: scan the barcode (name, brand, size and Nutri-Score come from Open Food Facts) or enter them by hand. Optionally set a product group, a minimum stock and a best-before date.
4. Book stock in and out per location, or move it between locations. Scan the location QR code to select the location.
5. When the stock falls to the minimum, the product is put on the shopping list. In the overview the check mark shows which products are on the list; tapping it removes the product again (see the [tutorial](docs/en/tutorial.md)).

## Configuration

| Setting | Description |
| --- | --- |
| Port / bind address | Where the web server listens (default `8120`, all interfaces) |
| Use HTTPS | Uses the certificate selected below. The default is the self-signed ioBroker certificate |
| Create self-signed certificate | Button: creates a certificate for this server (host name and IP addresses, valid 825 days), stores it in the ioBroker certificates and selects it. Restart the instance afterwards |
| Certificates | Choose public / private / chained certificate of the ioBroker certificate store, or a certificate collection (for example from the `acme` adapter) |
| Access key | Optional. If set, the app asks for the key once per device |
| Shopping list mode | Off, script, Bring or Bring special, see the [tutorial](docs/en/tutorial.md) |
| Best-before date | **Off**, **per product** (one date on each product) or **per stocking** (a date for every booking of stock; removing uses the oldest date first) |
| Date format | How all dates in the web app are shown: `31.10.2026`, `31/10/2026` or `2026-10-31` |
| Notification adapter | Installed instance for messages (telegram, telegrammenu2, pushover, signal, whatsapp, matrix, email). Optional recipient (chat ID or e-mail address), the area for telegrammenu2, a test button, and the options "minimum stock reached" and "daily message about expired products" with its time |
| Fill in shelf life automatically | When the standard shelf life is entered as best-before date: **always**, **only without the app** (scanner mode and data points, where nobody can type a date) or **never** (no suggestions either) |
| What is filled in automatically | **Everything with a standard shelf life**, or **only dry goods from the built-in list** (own and group values are then never entered automatically) |
| Put missing ingredients on the shopping list | After every ingredient check the missing lines go to the shopping list |
| Scanner mode | Time between the two codes, the scanner device on the host, prefix and suffix, code type on location labels. Details in the [tutorial](docs/en/tutorial.md) |
| Label buttons | Which label buttons the app shows (EAN, QR, QR only, large shelf label, box label, "opened on", freezer label) |
| Stocktaking reminder | Optional message every N days when no stocktaking was done in that time (0 = off), sent at the time of the daily message |
| Warn before expiry | Days before the date from which products are marked and listed in the data points |

## Documentation

- [Tutorial (English)](docs/en/tutorial.md): the app at a glance, editing products, automatic values, best-before date, shopping list, ingredient check, scanner mode, stocktaking, labels, certificate and the settings in detail
- [Anleitung (Deutsch)](docs/de/tutorial.md): dasselbe auf Deutsch

## Datapoints

| State | Description |
| --- | --- |
| `info.connection` | `true` while the web server is running |
| `stats.products`, `stats.locations` | Counts |
| `stats.lowStockCount`, `stats.lowStockList` | Items at or below the minimum stock |
| `stats.inventory` | Everything in stock as JSON (name, amount, unit, minimum, low flag, locations) |
| `stats.inventoryHtml` | Same as a simple HTML table, e.g. for a VIS html widget |
| `stats.consumption` | Consumption of the last 30 days per product (JSON, moves between locations do not count) |
| `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml` | Products that are expired or expire within the warning period (count, JSON, HTML table) |
| `shopping.addItem` | Write an item name (`ack=false`) to put it on the shopping list |
| `check.request` | Write ingredients here (`ack=false`) to compare them with the stock, see the [tutorial](docs/en/tutorial.md) |
| `check.result`, `check.available`, `check.missing`, `check.allAvailable` | Result of the last check (JSON per ingredient, lists with one line per ingredient, true if everything is in stock) |
| `check.addMissing` | Button: put the missing ingredients of the last check on the shopping list |
| `scanner.active` | Switch for the scanner mode (see the [tutorial](docs/en/tutorial.md)) |
| `scanner.input` | Write a scanned code here (`ack=false`); a scanner connected to the host will do this later |
| `scanner.lastCode`, `scanner.result` | Last code and the result of the last scan in scanner mode (for example "Fusilli ×1 stocked in at Shelf 1") |

Inventory data is stored in the adapter data directory (`shelfmate.json`), not in the object database.
A JSON backup can be downloaded and imported in the app (Settings). An import or "Delete all data" replaces all data; the previous state is kept as `shelfmate.json.bak`.

## Work in progress and roadmap

ShelfMate is under active development. Planned features (no promises, no order):

- **Scanner connection**: a serial (USB cable) scanner and Bluetooth scanners directly on the host

Ideas and bug reports are welcome as [GitHub issues](https://github.com/backfisch88/ioBroker.shelfmate/issues).

## Changelog
### **WORK IN PROGRESS**
- Changed: documentation split into a short README and a tutorial (English and German)
- New: product editor in collapsible sections (basics, stock, group and tags, shelf life, more) with a short summary on every closed section, Nutri-Score as a coloured row of buttons, package size next to the unit
- New: product page with a tidier button layout (stock in / take out, move / open, shopping list, edit / delete)
- New: a small sparkle symbol on the product page shows that the standard shelf life, the shelf life after opening or a best-before date was filled in automatically; earlier automatic dates are recognised when "Fill in shelf life automatically" runs again
- New: option for when the standard shelf life is filled in automatically (always, only without the app, never) and what is filled in (everything with a standard shelf life or only dry goods from the built-in list)
- New: "Reload from Open Food Facts" in the product editor for products that came from there
- New: best-before dates of opened packages can be edited as well
- New: search field with a clear button; suggestions can be tapped on the phone
- New: ingredient check now reserves the minimum stock (needed amount minus stock plus minimum stock) and prefers products that are named like the ingredient; `check.request` is emptied after every run
- Improved: standard shelf life list with stricter values (for example oils, juices, nuts, pesto, dressings, wholemeal flour), no standard value for fresh baked goods and baby porridge powder, more precise matching for drinks, oils, yeast and sauces
- Fixed: going back from a product that is part of a unfolded group keeps the scroll position; removing shelf lives in the settings list updates at once
- New: status filters on the overview (opened, best before soon, expired, reorder, empty), search suggestions as a dropdown under the search field, expired and soon-to-expire batches highlighted
- New: a product without its own shelf life takes the one of its product group; settings list to review, change and remove all own shelf lives
- New: option for when the standard shelf life is filled in automatically (always, only without the app, never)
- New: shelf life after opening is suggested automatically as well (own value, product group, then the list); same switch as the standard shelf life
- Improved: much larger standard shelf life list (specific words first, compound words, soups, spices, baking, drinks), fixed wrongly excluded products such as milk porridge and chopped tomatoes
- New: ingredient check: write ingredients to `check.request`, get what is in stock and what is missing as datapoints, optionally put the missing ones on the shopping list
- New: date format setting (31.10.2026, 31/10/2026 or 2026-10-31) applied to all dates in the web app
- New: set the best-before date of every package of existing stock on its own line on the product page, or headless for all unopened stock with the scanner codes `SM:DATE:<days>` (undoable)
- New: quick date input for the best-before date (`+3d`, `+2w`, `+1m`, `+1y`, `12/26`, `2412`, `24.12.26`, `tomorrow`, `x` = no date), with a live preview
- New: suggestions while typing in the search (product names, brands, tags)
- New: suggested shelf life for dry goods from a built-in list (can be switched off)
- Fixed: white screen when the app is opened without a connection to the server (barcode script now comes from the cache and no longer blocks the page)
- Changed: the access key is now stored encrypted; if you had set one, enter it again once in the adapter settings
- Fixed: missing translations (loading texts, opened lines)
- Changed: all emojis in the app replaced by one consistent set of flat, multicolour SVG icons
- New: opened products carry a 📭 symbol in the overview
- Fixed: product, location and history lists no longer flicker on background updates
- Changed: the tab menu stays visible on every page
- New: "Reset statistics" button in the settings (history is kept)
- New: optional standard shelf life and shelf life after opening per product
- New: mark a unit as opened, mark stock as spoiled, undo the last booking (app and scanner codes)
- New: scanner mode: book stock in and out with scanned codes through data points (`scanner.input`, `scanner.active`, `scanner.result`), without the app
- New: a wireless scanner whose dongle sits in the ioBroker host (keyboard device) is read directly, with prefix and suffix
- New: own label size for the shelf label, the box label and the full-page code (A6, A5, A4), the small label size stays the default
- New: unknown barcodes are created from Open Food Facts while stocking; products without data show up as a suggestion to edit
- New: stocking page in the app (location, products, location again) for whole shelves
- New: stocking mode for the scanner: scan a location, then all products, then the location again (for example a shelf of baby food jars)
- New: setting for location labels: QR code or Code 128 barcode (for scanners without 2D)
- New: short scanner code for locations (`SM:L:<id>`) and a printable sheet with quantity and cancel codes

### 0.1.13 (2026-10-21)
- New: area filter in the overview; the location filter then only offers the locations of that area
- Fix: the camera is switched off reliably when you leave the scanner while it is still starting (the camera indicator stayed on)
- Fix: the product list no longer flickers (it was redrawn every few seconds, even without changes); expanded groups span the full row on wide screens
- Fix: stocktaking rows keep the input field and check mark side by side, also with long product names

### 0.1.12 (2026-10-21)
- New: on wide screens (tablet, desktop) products, storage locations and the history are shown in two or three columns; the phone layout is unchanged

### 0.1.11 (2026-10-21)
- New: notifications through any installed notification adapter (Telegram, telegrammenu2, Pushover, Signal, WhatsApp, Matrix, e-mail): minimum stock reached and a daily message about expired / expiring products, with a test button
- New: consumption of the last 30 days per product in the app and as data point `stats.consumption`, with a suggestion for the minimum stock
- New: stocktaking per storage location (list or scan variant, chosen in the settings)
- New: stocktaking reminder (interval in days) in the notification settings; a stocktaking without differences also counts as done and shows "Last stocktaking" per location
- New: bulb icon in the header with all suggestions; group suggestions show product images and package sizes and keep the scroll position
- New: device name in the settings, shown in the history for every booking
- New: export of the stock as CSV or as a PDF in the settings under "Data"
- Change: minimum stock suggestions only for regularly used products (removals on at least 4 days in at least 3 different weeks)
- New: tutorials for the main functions in the README
- Change: stocktaking by scanning shows product images and a summary per finished location; a location is finished only by scanning its own QR code again
- New: stocktaking by scanning: scan a location QR, then its products, then the same location QR again to finish it (also with the camera); a summary shows which locations of the area are done
- Chore: non-critical Dependabot updates are merged automatically after the checks
- New: group suggestions (Settings / Data): products with similar names can be combined into one group with one tap
- New: more label templates ("opened on", freezer, large shelf, box with contents, QR only); the adapter settings choose which label buttons the app shows

### 0.1.10 (2026-10-21)
- Maintenance: repository checker fixes (Node 26 in the test matrix, workflow, metadata, Node.js >= 22.12); the certificate collection is chosen from a drop-down list

### 0.1.9 (2026-10-21)
- New: adding to or removing from the shopping list works offline; the change is queued and sent once the connection is back

### 0.1.8 (2026-10-21)
- New: "Delete all data" button in the settings (two confirmations; the previous state is kept as `shelfmate.json.bak`)
- New: a new installation (and "Delete all data") starts with an example area and location (e.g. "Pantry · Shelf 1") in the ioBroker system language and the Barilla Fusilli No. 98 from Open Food Facts as example product
- Fix: confirmation dialogs are now translated

### 0.1.7 (2026-10-20)
- New: the brand is printed on the EAN label in front of the product name (long names wrap to two lines)
- Change: "Generate EAN" no longer asks for confirmation

### 0.1.6 (2026-10-20)
- New: products with the same product type (group, e.g. flour) are grouped in the overview and can be expanded; the "reorder" mark appears once for the group

### 0.1.5 (2026-10-20)
- New: label size (width × height in mm) in the app settings; EAN and QR labels follow its aspect ratio, the QR code fills the label
- New: the barcode of products taken from Open Food Facts is locked (greyed out); the label can still be printed
- Fix: the Nutri-Score letter A was shown as "Nach" because of a translation lookup error

### 0.1.4 (2026-10-20)
- New: "New product" button in the scanner
- New: own EAN-13 codes for products without a barcode, with a label preview and a printable label
- New: upload your own product image (scaled down and compressed automatically)
- Chore: merged the unpublished 0.1.1 entry into 0.1.2

### 0.1.3 (2026-10-20)
- New: the app and the HTML data points follow the ioBroker system language (11 languages)
- New: Open Food Facts lookups use the app language (English as fallback)
- New: button in the settings that creates a self-signed certificate

Older entries: [CHANGELOG_OLD.md](CHANGELOG_OLD.md)

## License
MIT License

Copyright (c) 2026 Henrik Schoenhofen <henrik.schoenhofen@icloud.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
