# Older changes

### 0.1.2 (2026-10-20)
- New: data points `stats.inventory` (JSON) and `stats.inventoryHtml` (table for VIS) with everything in stock
- New: separate options to remove items from the shopping list when refilled and when unticked in the app
- Fix: an item removed from the list in the app is no longer marked again until Bring! reports the change
- New: best-before date (off / per product / per stocking) with warning and data points `stats.expiring*`
- Fix: moving stock between locations keeps the best-before dates

### 0.1.0 (2026-10-20)
- New: initial release (inventory, barcode / QR scanner, shopping list via script / Bring! / Bring special, JSON backup)
