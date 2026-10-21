<p align="center"><img src="admin/shelfmate.png" alt="ShelfMate" width="160"></p>

[![NPM version](https://img.shields.io/npm/v/iobroker.shelfmate.svg)](https://www.npmjs.com/package/iobroker.shelfmate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# ioBroker.shelfmate

Household inventory for ioBroker, served as an installable web app (iPhone home screen / Android) directly by the adapter.
Know what is where, get warned at minimum stock and put missing items on your shopping list automatically.

German short description: [README.de.md](README.de.md)

---

## Features

- Scan product barcodes and storage location QR codes with the phone camera
- Products without a barcode: create your own EAN-13 code and print the label; upload your own product image (compressed automatically)
- Printable EAN and QR labels in your own label size (Settings, e.g. 50 × 30 mm)
- Product master data from Open Food Facts (name, brand, package size, Nutri-Score, categories), editable
- Storage areas and locations with printable QR codes
- Stock per location, history of all bookings, offline queue in the app
- Product groups: "Flour" from several brands counts as one item
- Optional best-before date (MHD) per product or per stocking, with warning before expiry
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
5. When the stock falls to the minimum, the product is put on the shopping list. In the overview the check mark shows which products are on the list; tapping it removes the product again (see below).

## Configuration

| Setting | Description |
| --- | --- |
| Port / bind address | Where the web server listens (default `8120`, all interfaces) |
| Use HTTPS | Uses the certificate selected below. The default is the self-signed ioBroker certificate |
| Create self-signed certificate | Button: creates a certificate for this server (host name and IP addresses, valid 825 days), stores it in the ioBroker certificates and selects it. Restart the instance afterwards |
| Certificates | Choose public / private / chained certificate of the ioBroker certificate store, or a certificate collection (for example from the `acme` adapter) |
| Access key | Optional. If set, the app asks for the key once per device |
| Shopping list mode | See below |
| Best-before date | **Off**, **per product** (one date on each product) or **per stocking** (a date for every booking of stock; removing uses the oldest date first) |
| Notification adapter | Installed instance for messages (telegram, telegrammenu2, pushover, signal, whatsapp, matrix, email). Optional recipient (chat ID or e-mail address), the area for telegrammenu2, a test button, and the options "minimum stock reached" and "daily message about expired products" with its time |
| Label buttons | Which label buttons the app shows (EAN, QR, QR only, large shelf label, box label, "opened on", freezer label) |
| Stocktaking reminder | Optional message every N days when no stocktaking was done in that time (0 = off), sent at the time of the daily message |
| Warn before expiry | Days before the date from which products are marked and listed in the data points |

### Best-before date

Choose the mode in the settings:

- **Off**: no best-before handling.
- **Per product**: each product has one optional date (product form). Products at or after the date are marked in the overview and detail view.
- **Per stocking**: when you book stock in you can enter a date. Several dates per product and location are kept; booking out and moving always use the oldest date first.

Products that are expired or expire within the configured warning period get a badge ("expires in 3 days" / "expired") and are listed in the data points `stats.expiring*`.

### Shopping list

- **Off**: nothing is sent.
- **Script**: the item name is written (`ack=false`) to the state you select. Optionally select a state that holds the
  current list (JSON array of objects with a `name`) so ShelfMate does not add duplicates and can show which items are already on the list.
  Optionally select a state that receives the name of items to remove (`ack=false`). Then tapping the tick in the app and the option "Remove from the list when the stock is refilled" work in this mode too.
- **Bring special**: like Bring, but an item that is already on the list is not skipped. Its quantity is counted up or merged into the specification (`Flour` → `Flour, 2` → `Flour, 3`; `Feta, 200g` and `Feta, herbs` become separate variants). Items are written one after another, and the next one waits until the Bring! adapter has reloaded the list.
- **Directly via Bring!**: choose the list in the settings (the lists of the Bring! adapter are found automatically, or type the channel such as `bring.0.<list-id>`). ShelfMate reads
  `<list>.content` and writes new items to `<list>.saveItem`, but only if the item is not already on the list.

With Bring, Bring special or Script (with a remove state) there are two independent options. Items are only removed if they are on the list, and are written to `<list>.removeItem`:

- **Remove from the list when the stock is refilled**: when the stock rises above the minimum again, the item is taken off the list (default: off).
- **Remove from the list when I untick the check mark in the app**: tapping the check mark of a listed item in the app also removes it from the list (default: on). If disabled, only the mark in the app is cleared.

## Tutorials

Short walk-throughs of the main functions. All of them are done in the app.

### Book stock in and out
1. Tap **Scan** and hold the barcode in front of the camera (or type it in).
2. A known product opens directly; an unknown one is looked up on Open Food Facts and pre-filled. Check it and save.
3. Choose **Stock in**, **Take out** or **Move**, set the quantity and the storage location, and save.
4. Tip: scan the QR code of the shelf instead of choosing the location from the list.

### Storage locations and labels
1. Open **Locations**, create an area (for example "Pantry") and a location ("Shelf 1").
2. Open the location. Its QR code is shown there; the label buttons create the label as an image (QR only, large shelf label, box label with contents).
3. Set your label size under **Settings / Labels** once (for example 50 × 30 mm). In the adapter settings you choose which label buttons the app shows.
4. Print the image (see "Printing labels") and attach it to the shelf or box.

### Products without a barcode
Create the product by hand and let the app generate its own EAN-13 code. Print that code as a label and stick it on the item. Upload your own product image if you like; it is compressed automatically.

### Minimum stock and shopping list
1. Open a product and set a **minimum stock**. For products from one group (for example all kinds of flour) set it on the group; the stock counts together.
2. Choose the shopping-list mode in the adapter settings (see "Shopping list").
3. When the stock falls to the minimum, the product is put on the list. The check mark in the overview shows what is on the list; tap it to take the product off again.

### Best-before date
Choose the mode in the adapter settings: per product or per stocking. With "per stocking" you enter the date when you book stock in, and taking out always uses the oldest date first. Expired and soon expiring products are marked and can be reported by notification.

### Stocktaking by scanning
1. Open **Locations / Stocktaking** and choose the variant **Scan** (settings or on the page).
2. Scan the QR code of the location. "Stocktaking started" confirms it.
3. Scan every item of that location; each scan counts +1 (the same item twice means two).
4. Scan the **same** location QR code again. The stocktaking of that location is finished: the stock is corrected, the location is marked as done, and a summary shows what was counted (with the expected quantity where it differs).
5. Scan the QR code of the next location to continue. Another location is only accepted after the current one is finished.

The page also shows which locations of the area are done and which are still open. Items you did not scan count as 0. Prefer to check by hand? Use the variant **List**: type the counted quantity or tap ✓ for "correct". Corrections appear in the history as "Stocktaking". A reminder interval can be set in the notification settings.

### Suggestions (bulb icon)
The bulb in the header collects three kinds of hints: group suggestions (similar products that could count together; you can drop single products from a suggestion or have it ignored), minimum stock suggestions (only for products you use regularly; ✓ applies, ✕ dismisses) and a due stocking. Nothing is changed without a tap.

### Notifications
Select a notification adapter in the adapter settings, enter the target (for example a chat ID) and use the test button. You can be told when the minimum stock is reached, get a daily message about expired and expiring products at a time of your choice, and be reminded of a stocktaking every N days.

### Export and backup
Under **Settings / Data**: **JSON backup** (download and import again), **Stock as CSV** (for Excel and similar) and **Stock as PDF** (a printable list grouped by location; it opens the share sheet so you can save or print it).

### Offline use
After the certificate is trusted (see below), the app also starts without a connection. Bookings and shopping-list entries made offline are queued and sent automatically when the connection is back.

### Certificate and installing it on the phone

Camera access and the offline mode need HTTPS with a certificate the phone trusts.

1. In the adapter settings switch on **Use HTTPS** and choose a certificate. The easiest way is the button **Create self-signed certificate**: it creates a certificate for the host name and the IP addresses of the ioBroker host, stores it in the ioBroker certificates and selects it. Save the settings; the instance restarts. Alternatively select your own certificate or a certificate collection (for example Let's Encrypt).
2. A certificate from a public CA (for example Let's Encrypt via the `acme` adapter) needs no installation on the phone. Skip the next steps.
3. With a self-signed certificate on **iPhone** (tested):
   1. Open `https://<host>:8120/` in Safari and go to **Settings / Offline mode** in the app. Tap **Load ioBroker certificate** (the file is also available directly at `https://<host>:8120/iobrokerZertifikat.cer`) and choose "Allow".
   2. iPhone **Settings / General / VPN & Device Management**: tap the downloaded profile and **Install**.
   3. iPhone **Settings / General / About / Certificate Trust Settings**: switch the certificate on.
   4. Close the app and open it again. Under **Offline mode** tap **Check again**.
4. **Android and other systems** are not tested. The certificate can be downloaded the same way (`https://<host>:8120/iobrokerZertifikat.cer`) and is normally installed as a CA certificate in the system settings (security / credentials). The menu names differ between devices and versions.

## Printing labels

The labels are created as PNG images in the label size you set in the app, and are shared or saved from the phone. I print them on a Niimbot B1 label printer that I set up as an AirPrint printer through CUPS on a Linux machine, so the phone can print straight to it. Setting up a printer is not part of this adapter; search for "Niimbot CUPS AirPrint" if you want to do the same.

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

Inventory data is stored in the adapter data directory (`shelfmate.json`), not in the object database.
A JSON backup can be downloaded and imported in the app (Settings). An import or "Delete all data" replaces all data; the previous state is kept as `shelfmate.json.bak`.

## Work in progress and roadmap

ShelfMate is under active development. Planned features (no promises, no order):

- **External barcode scanner** (USB or Bluetooth, keyboard mode): configurable prefix and suffix, scans are told apart from typing by their speed, control barcodes such as "stock in" / "take out" to work without the display

Ideas and bug reports are welcome as [GitHub issues](https://github.com/backfisch88/ioBroker.shelfmate/issues).

## Changelog
### 0.1.12 (2026-10-21)
- Fix: the product list no longer flickers (it was redrawn every few seconds, even without changes); expanded groups span the full row on wide screens
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
