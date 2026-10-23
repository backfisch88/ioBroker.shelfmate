<p align="center">
  <img src="admin/shelfmate.png" alt="ShelfMate" width="160">
</p>

[![NPM version](https://img.shields.io/npm/v/iobroker.shelfmate.svg)](https://www.npmjs.com/package/iobroker.shelfmate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# ioBroker.shelfmate

**ShelfMate – your pantry at a glance.**

ShelfMate is a pantry manager for ioBroker. It tells you at any time which food you have at home, where it is stored and what needs to be bought again.

Scan products by barcode, manage them on shelves and in cupboards, and put them on your shopping list automatically when needed. Minimum stock, best-before dates and consumption are taken into account as well.

You use it through a web app that you open on your phone and add to the home screen. A separate app is not needed.

**Deutsch:** [README.de.md](README.de.md)  
**Guides:** [English](docs/en/tutorial.md) · [Deutsch](docs/de/tutorial.md)

---

## Features

### Products and storage locations

- Add products by barcode or by hand, with name suggestions and a matching category when creating by hand
- Load product data from Open Food Facts automatically (name, brand, package size, Nutri-Score and categories)
- Edit and refresh product data at any time
- Create your own EAN-13 barcodes for products without a barcode
- Upload your own product images (scaled down automatically)
- Create storage areas and locations, for example kitchen, pantry or cellar
- Select storage locations with QR codes
- Stock in, take out and move stock between locations
- Follow every booking in a history
- Find products quickly with the search, including suggestions while you type
- Combine products of different brands into groups, for example flour or sugar

### Minimum stock and shopping list

- Set a minimum stock for single products or whole product groups
- Put products on the shopping list automatically when the minimum stock is reached
- Manage the shopping list through data points, Bring! or Bring! special
- With Bring! special, quantities and variants are merged on the same entry instead of creating duplicates
- Remove products from the shopping list automatically when the stock is refilled
- Optionally write the missing quantity on the shopping list
- List the stock of consumables locations (for example the fridge) in data points
- Evaluate the consumption of the last 30 days
- Suggest a fitting minimum stock based on past consumption

### Shelf life and best-before date

- Store the best-before date (MHD) optionally per product or per stocking
- Warn about products that expire soon or have expired
- Suggest a standard shelf life for many foods automatically
- Take the shelf life after opening into account
- Mark products as opened or spoiled
- Recognise automatically filled-in values by the sparkle symbol
- Set your own shelf life values for products and groups

### Check ingredients

Want to cook something and know whether all ingredients are at home?
ShelfMate can compare a list of ingredients, for example from a recipe app, with your stock.
Missing ingredients can be put on the shopping list directly. What is already in stock is not added again.

### Scanning and labels

- Capture barcodes with the phone camera or a scanner
- Create and print QR codes for storage locations
- Print EAN and QR labels in your own sizes, for example 50 × 30 mm
- Labels for shelves, boxes, the freezer and opened products
- Choose which labels the app offers
- Scanner mode for stocking in and out without the web app open
- Do a stocktaking by product list or by scanner

### Overview and notifications

- Show the whole stock by storage location
- Warnings for minimum stock and expiring products
- Notifications through Telegram, telegrammenu2, Pushover, Signal, WhatsApp, Matrix or e-mail
- Daily summary of products that expire soon or have expired
- Stocktaking reminders
- Suggestions for product groups and minimum stock
- Data points for VIS or your own scripts
- JSON backups and export as CSV or PDF

### Web app

- Runs directly in the browser on phone, tablet and PC
- Can be added to the iPhone or Android home screen
- Offline queue for bookings when the connection is lost
- Give each device a name so bookings can be told apart in the history
- Undo the last booking
- HTTPS with your own or automatically created certificates
- Optional access key for the API
- Multilingual: German, English, Russian, Portuguese, Dutch, French, Italian, Spanish, Polish, Ukrainian and Chinese

---

## Requirements

- ioBroker js-controller >= 6.0.11
- Admin >= 7.6.20
- Node.js >= 22.12
- HTTPS with a certificate your phone trusts (for the camera and the offline functions)

## Installation

ShelfMate is installed like any other ioBroker adapter.

1. Install the adapter **shelfmate** in the ioBroker admin.
2. Create an instance.
3. Open the web app at `https://<host>:8120/`.
4. Optionally add the page to the home screen.

The default port is `8120` and can be changed in the settings.

## Getting started

1. **Create storage locations:** Create your storage areas and locations, for example Kitchen → Pantry → Shelf 1.
2. **Print QR codes:** Attach the matching QR codes to your storage locations.
3. **Add products:** Scan a barcode or create a product by hand. Much of the product data is loaded from Open Food Facts automatically.
4. **Stock in:** Select the location by QR code and book in the amount.
5. **Set a minimum stock:** ShelfMate can put products on your shopping list automatically when the stock gets low.

A detailed description is in the [guide](docs/en/tutorial.md).

---

## Settings

The most important functions can be adjusted directly in the adapter configuration.

| Setting | Description |
| --- | --- |
| Port / bind address | Port and network interface of the web server (default: 8120) |
| HTTPS | Turn on HTTPS and choose the certificates |
| Create certificate | Creates a self-signed certificate for the host name and IP addresses, valid for 825 days. Restart the instance afterwards |
| Certificates | Use certificates from ioBroker or, for example, from the acme adapter |
| Access key | Optional protection for API access, entered once per device |
| Shopping list | Off, script, Bring! or Bring! special |
| Best-before management | Off, per product or per stocking |
| Date format | DD.MM.YYYY, DD/MM/YYYY or YYYY-MM-DD |
| Notifications | Choose the adapter, the recipient and the messages you want |
| Fill in shelf life automatically | Enter standard values always, only in scanner mode or never |
| Which standard values | All stored shelf lives or only the built-in dry goods list |
| Expiry warning | How many days before expiry to warn |
| Ingredient check | Put missing ingredients on the shopping list automatically |
| Scanner mode | Set the scanner device, time gaps, prefix, suffix and the QR code type |
| Labels | Choose the available label types and print options |
| Stocktaking reminder | Reminder after a set number of days without a stocktaking |

### Best-before date

There are three modes for the best-before management:

- **Off:** No best-before management.
- **Per product:** One shared best-before date for the product.
- **Per stocking:** Every stocking can have its own best-before date. When taking out, the oldest stock is used first.

ShelfMate can also fill in standard shelf lives automatically. Values you enter yourself always win.

### Shopping list

ShelfMate supports four modes:

- **Off:** No automatic shopping list.
- **Script:** Handed over through ioBroker data points.
- **Bring!:** Products are added to the Bring! shopping list.
- **Bring! special:** Existing entries are not skipped. Quantities are counted up and variants are added (for example `Feta, Kräuter, 200g`).

Optionally, products are removed from the list again when the stock is refilled.

More details are in the [guide to the shopping list](docs/en/tutorial.md#shopping-list-modes).

### Notifications

Messages can be sent through these adapters:

- Telegram and telegrammenu2
- Pushover
- Signal
- WhatsApp
- Matrix
- E-mail

You choose whether ShelfMate notifies you about low stock, expiring products or a stocktaking that is due.
For the daily expiry message you can set a fixed time.

---

## Data points

ShelfMate provides important information and functions as ioBroker data points.

### Stock and statistics

| Data point | Description |
| --- | --- |
| `info.connection` | Web server is running |
| `stats.products` | Number of products |
| `stats.locations` | Number of storage locations |
| `stats.inventory` | Whole stock as JSON |
| `stats.inventoryHtml` | Stock as an HTML table for VIS |
| `stats.lowStockCount` | Number of products with low stock |
| `stats.lowStockList` | List of products with low stock |
| `stats.consumption` | Consumption of the last 30 days |
| `stats.expiringCount` | Number of products that expire soon or have expired |
| `stats.expiring` | Expiring products as JSON |
| `stats.expiringHtml` | Expiring products as an HTML table |

### Shopping list and ingredients

| Data point | Description |
| --- | --- |
| `shopping.addItem` | Add a product to the shopping list (`ack=false`) |
| `check.request` | Hand over a list of ingredients to check (`ack=false`) |
| `check.result` | Result of the last ingredient check as JSON |
| `check.available` | Ingredients in stock |
| `check.missing` | Missing ingredients |
| `check.allAvailable` | `true` if all ingredients are in stock |
| `check.addMissing` | Put the missing ingredients on the shopping list |

### Scanner mode

| Data point | Description |
| --- | --- |
| `scanner.active` | Turn scanner mode on or off |
| `scanner.input` | Hand over a barcode or QR code (`ack=false`) |
| `scanner.lastCode` | Last scanned code |
| `scanner.result` | Result of the last scan |

Example for `scanner.result`:

`Fusilli ×1 stocked in at Shelf 1`

More information: [Scanner mode without the app](docs/en/tutorial.md#scanner-mode-without-the-app)

---

## Backup

All stock data is stored in the file `shelfmate.json` in the adapter's data directory.
In the web app you can:

- Download a JSON backup
- Restore an existing backup
- Export the stock as CSV or PDF
- Delete all data

When you import a backup or delete the data, the previous state is saved as `shelfmate.json.bak`.

---

## Documentation

A detailed guide with examples and explanations:

- [Guide in English](docs/en/tutorial.md)
- [Anleitung auf Deutsch](docs/de/tutorial.md)

It explains the web app, storage locations, product groups, minimum stock, best-before date, scanner mode, labels, shopping list and stocktaking, among other things.

---

## Planned

ShelfMate is developed continuously.
Next up is the direct connection of serial (USB) and Bluetooth scanners on the ioBroker host.
Ideas, wishes or bugs are welcome as a [GitHub issue](https://github.com/backfisch88/ioBroker.shelfmate/issues).

## Changelog
### 0.2.0 (2026-10-23)
- New: optional quantity on the shopping list ("Flour, 2"): the missing amount (minimum stock minus stock) is written when the minimum is reached, and only the difference when the stock keeps falling (Bring! special and script mode)
- New: mark a storage location as consumables (for example the fridge); its stock appears in the data points `stats.consumables` (JSON, with opened amount and nearest best-before date) and `stats.consumablesText` (one line per product)
- New: headless scanner creates unknown products (Open Food Facts lookup, tags, shown under "edit new products" when incomplete)
- New: wording of the expiry message can be changed (title, line with placeholders for brand, days and amount)
- New: the short scanner code of a location can be switched back to the normal QR code
- Changed: the shopping button sits flush with the tab menu on the phone
- Fixed: product groups can be collapsed while searching or filtering by tag, and the list keeps its position when a group is opened or closed
- Fixed: hints are synchronised between devices, long group keys are no longer cut off
- Fixed: a doubled adapter start no longer resets `info.connection` of the running process
- New: when creating a product by hand, the name field suggests products from a ready-made list (about 1,200) and sets the category
- Changed: documentation split into a short README and a guide (English and German); the Bring! special examples now show how quantities and variants merge on one entry
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
