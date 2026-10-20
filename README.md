![Logo](admin/shelfmate.png)

# ioBroker.shelfmate

ShelfMate is a household inventory for ioBroker. Scan a product barcode, scan the QR code of a storage location,
and ShelfMate knows what is where. It runs as an installable web app (iPhone home screen / Android) that is served
directly by the adapter.

## Features

- Product master data from Open Food Facts (name, brand, package size, Nutri-Score, categories), editable
- Storage areas and locations with printable QR codes
- Stock per location, history of all bookings, offline queue in the app
- Product groups: "Flour" from several brands counts as one item
- Minimum stock per product or group with automatic shopping-list entry
- Shopping list modes: **off**, **script** (via data points) or **directly via the Bring! adapter**
- Built-in HTTPS web server that uses the certificates of your ioBroker installation (self-signed, own or Let's Encrypt collections)
- Optional access key for the API

## Requirements

- js-controller >= 6.0.11, admin >= 7.0.23, Node.js >= 20
- A device with a camera in a secure context (HTTPS) if you want to scan with the phone camera

## Installation

Until the adapter is available in the official repository, install it from GitHub with the ioBroker admin UI (Adapters → "Install from custom URL") or:

```
iobroker url https://github.com/backfisch88/ioBroker.ShelfMate
```

Then add an instance in the admin UI and open `https://<host>:8120/`.

## Configuration

| Setting | Description |
| --- | --- |
| Port / bind address | Where the web server listens (default `8120`, all interfaces) |
| Use HTTPS | Uses the certificate selected below. The default is the self-signed ioBroker certificate |
| Certificates | Choose public / private / chained certificate of the ioBroker certificate store, or a certificate collection (for example from the `acme` adapter) |
| Access key | Optional. If set, the app asks for the key once per device |
| Shopping list mode | See below |

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

### Trusting the certificate on iPhone

Camera access and the offline mode need a certificate the phone trusts. With a self-signed certificate, download the ioBroker certificate in the app (Settings), install the profile and enable full trust. A certificate from a public CA (for example Let's Encrypt via the
`acme` adapter) needs no installation.

## Data points

| State | Description |
| --- | --- |
| `info.connection` | `true` while the web server is running |
| `stats.products`, `stats.locations` | Counts |
| `stats.lowStockCount`, `stats.lowStockList` | Items at or below the minimum stock |
| `shopping.addItem` | Write an item name (`ack=false`) to put it on the shopping list |

Inventory data is stored in the adapter data directory (`shelfmate.json`), not in the object database.
A JSON backup can be downloaded and imported in the app (Settings). An import replaces all data; the previous state is kept as `shelfmate.json.bak`.

## Changelog
### **WORK IN PROGRESS**
- (Henrik Schoenhofen) initial release

## License
MIT License

Copyright (c) 2026 Henrik Schoenhofen
