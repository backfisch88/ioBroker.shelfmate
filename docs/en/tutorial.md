# ShelfMate – Guide

With ShelfMate you manage your pantry directly in ioBroker. This guide shows you how to create products, manage stock, scan barcodes and use the different functions.

You find all settings, requirements and data points in the [README](../../README.md).

Deutsche Version: [Anleitung](../de/tutorial.md)

---

## Contents

1. [The app at a glance](#the-app-at-a-glance)
2. [Editing products](#editing-products)
3. [Automatic shelf life and the sparkle symbol](#automatic-shelf-life-and-the-sparkle-symbol)
4. [Refreshing product data](#refreshing-product-data)
5. [Stock in, take out and move](#stock-in-take-out-and-move)
6. [Creating storage locations](#creating-storage-locations)
7. [Products without a barcode](#products-without-a-barcode)
8. [Minimum stock and shopping list](#minimum-stock-and-shopping-list)
9. [Best-before date](#best-before-date)
10. [Shopping list modes](#shopping-list-modes)
11. [Checking ingredients](#checking-ingredients)
12. [Stocking a whole shelf](#stocking-a-whole-shelf)
13. [Doing a stocktaking](#doing-a-stocktaking)
14. [Scanner mode without the app](#scanner-mode-without-the-app)
15. [Suggestions](#suggestions)
16. [Notifications](#notifications)
17. [Export and backup](#export-and-backup)
18. [Offline mode](#offline-mode)
19. [HTTPS and certificates](#https-and-certificates)
20. [Printing labels](#printing-labels)

---

## The app at a glance

### Overview

On the start page you see your products and their stock.

With the search you find products by name, brand or tag. Matching suggestions appear while you type. Tap × to reset the search.

There are also several filters:

- Area: shows only products from one storage area.
- Location: filters by a single shelf, cupboard or compartment.
- Category: shows products of one category.
- Status: filters by opened, expiring soon, expired, to-buy or empty products.
- Tags: frequently used search terms can be picked directly.

Tapping an active status or tag again removes that filter.

Product groups are shown together. Tap the small triangle to unfold the products inside.

When you come back from a product page, you land at your previous position in the overview.

### Product page

On the product page you find the total stock, the storage locations and, if turned on, the shelf life data.

Expired and soon-to-expire products are highlighted in colour.

If standard values exist, ShelfMate shows for example:

`Standard shelf life 365 days · after opening 90 days`

Below that, the actions are always in the same order:

1. Stock in / take out
2. Move / open / undo open, if available
3. To shopping list – with a check mark if the product is already on it
4. Print labels – which buttons appear is set in the instance settings in the ioBroker admin under "Labels"
5. Edit / delete

---

## Editing products

Tap Edit to open the product settings.

When you create a product by hand, ShelfMate suggests matching products from a ready-made list while you type the name. If you enter `Sch`, for example, chocolate (Schokolade) appears among others. Tapping a suggestion takes over the name and sets the category if you have not chosen one yet. There are no suggestions for products from Open Food Facts, because the name comes from there.

The form is split into five sections that you can unfold. Closed sections show a short summary, for example `Packung · 400g · min 1`.

| Section | Settings |
| --- | --- |
| Basics | Product name, brand, image and category |
| Stock | Piece, weight or volume, unit, package size and minimum stock |
| Group & tags | Product group and extra search terms |
| Shelf life | Best-before date, standard shelf life and shelf life after opening |
| More | Barcode, own EAN, Nutri-Score, image link and Open Food Facts |

Basics is open by default, and for new products the Stock section as well.

### Product groups

Several products can be combined into one group.

Example: wheat flour from REWE, Edeka and Kaufland belongs to the shared group Flour.

ShelfMate adds up the stock of these products and takes it into account for the minimum stock.

If a product has no standard shelf life of its own, the value of its group can be used.

### Nutri-Score

You choose the Nutri-Score under More with the coloured buttons A to E.

Tapping the selected value again removes it.

---

## Automatic shelf life and the sparkle symbol

ShelfMate can suggest or fill in shelf life values automatically.

This includes:

- The standard shelf life of a product
- The shelf life after opening
- Best-before dates calculated automatically when stocking in

### What does the sparkle symbol mean?

The small ✨ sparkle symbol on the product page marks values that were taken over automatically.

It appears, for example, when the shelf life comes from the built-in food list or from a product group, or when a best-before date was calculated automatically.

Values you enter yourself always win.

If you change a date that was suggested automatically, it counts as a manual value from then on. The symbol disappears as soon as no automatic values are left.

The symbol is shown only on the product page, not in the overview.

ShelfMate can recognise older automatically calculated dates when you run "Fill in shelf life automatically" again, if they are exactly the stocking date plus the standard shelf life.

### When is the shelf life filled in?

You set this in the adapter settings.

| Setting | Behaviour |
| --- | --- |
| Always | The app suggests a date when stocking in. Scanner mode and data points fill it in automatically |
| Only without the app | Filled in automatically only through scanner mode and data points |
| Never | No automatic filling in and no automatic suggestions |

With Never, the function "Fill in shelf life automatically" can still be used by hand.

### Which values are used?

There are two choices:

**All with a standard shelf life**

Takes into account your own values on the product, the values of the product group and the built-in list.

**Only dry goods from the built-in list**

Uses only the stored standard values for typical pantry products. Your own product and group values are then not filled in automatically.

The built-in list contains, for example, pasta, rice, flour, tins and sweets.

Fresh and chilled products such as milk, meat, sausage, cheese, eggs or yoghurt deliberately get no automatically calculated standard value.

Important: automatic shelf lives are guide values, not an actual manufacturer's best-before date. A printed or manually entered date wins. Opening a package also never extends an earlier date.

### Managing shelf life values

Under Settings → Shelf life → Manage shelf lives you find all products with their own shelf life values.

There you can edit values, remove them one by one with × or delete them all at once with Remove all own values.

Changes apply immediately.

---

## Refreshing product data

Products with a known barcode can get their information from Open Food Facts.

In the product editor you find "Reload from Open Food Facts" under More.

These details are refreshed:

- Name and brand
- Package size
- Product image
- Category
- Nutri-Score
- Additional tags

Tags you created yourself are kept.

Changes only apply once you tap Save product. So you can check the result first and close the form without saving if you like.

For products from Open Food Facts the barcode is locked in the editor.

---

## Stock in, take out and move

This is how a normal booking works:

1. Choose Scan and capture the barcode with the camera or type it in.
2. For known products the product page opens.
3. Unknown barcodes are looked up on Open Food Facts. You can check and save what was found.
4. Choose Stock in, Take out or Move.
5. Set the amount and the storage location and save the booking.

You can pick the storage location from the list or scan its QR code directly.

All bookings are saved in the history.

---

## Creating storage locations

ShelfMate distinguishes between storage areas and storage locations.

Example:

- Area: Pantry
- Location: Shelf 1

Under Locations you can create and edit both.

### QR codes for storage locations

Every storage location gets its own code.

Open the location and choose the label you want:

- QR code only
- Large shelf label
- Box label with contents

Alternatively you can create location labels with a Code 128 barcode. This is especially handy for scanners without QR code support.

You choose the code type under Settings → Labels.

### Label size

You set the label size once, for example 50 × 30 mm.

For large shelf labels, box labels and full-page codes, your own formats such as A6, A5 or A4 are possible too.

Which label buttons are shown in the app, you choose in the instance settings in the ioBroker admin under "Label buttons in the app". You set the label size directly in the app settings.

After creating it, you can save the label as an image or print it directly.

---

## Products without a barcode

Products without a manufacturer barcode can be managed as well.

1. Create the product by hand.
2. In the editor, choose Generate EAN.
3. Print the own EAN-13 code as a label.
4. Stick the label on the product or the container.

After that, the product can be scanned like any other.

You can also upload your own product image. ShelfMate scales it down automatically.

---

## Minimum stock and shopping list

You can set a minimum stock for every product.

Example: you always want at least two packs of pasta in stock.

As soon as the stock falls to two packs or less, ShelfMate can put the pasta on your shopping list automatically.

For product groups, the stock of the products in the group is counted together.

In the overview, a check mark shows which products are already on the shopping list. Tapping it removes the entry again, if the matching settings are active.

The connection to the shopping list is set up in the adapter settings.

---

## Best-before date

ShelfMate supports three modes.

| Mode | Description |
| --- | --- |
| Off | No best-before management |
| Per product | One shared best-before date for the product |
| Per stocking | Every stocking can have its own best-before date |

### Best-before date per stocking

When stocking in, every package can get its own date.

Several best-before dates are stored separately per product and location.

When taking out or moving, the stock with the oldest best-before date is used first.

If a date is missing, ShelfMate can calculate one from the standard shelf life. For this, the stocking date from the history is used.

### Opening a package

With Open you can mark a single package as opened.

ShelfMate then keeps this package separately and uses it first when taking out.

If a shelf life after opening is stored, a new date is calculated from it. An earlier existing best-before date stays.

With Undo open you can reset it.

### Spoiled products

When taking out, you can distinguish between Used and Spoiled.

Spoiled products do not count towards normal consumption. In the history they are summarised for 30 days.

### Undoing bookings

In the history you can undo the last booking.

In scanner mode the control code `SM:UNDO` is available for this.

It does not work there for moves and stocktakings.

### Changing a best-before date later

In the mode Per stocking, "Edit best-before date" shows all packages one by one – opened ones too.

You can enter a date by hand or use the quick buttons:

- +1 day
- +3 days
- +5 days
- +10 days
- No date

Save applies all changes. The changes appear in the history and can be undone.

In scanner mode you can set a new best-before date for all unopened stock with `SM:DATE:<days>` followed by scanning the product.

`SM:DATE:0` removes the date.

### Entering a date quickly

Besides normal dates, ShelfMate understands short forms.

| Input | Meaning |
| --- | --- |
| +3d | In 3 days |
| +2w | In 2 weeks |
| +1m | In one month |
| +1y | In one year |
| 12/26 | End of December 2026 |
| 2412 | Next 24 December |
| 24.12. | Next 24 December |
| 24.12.26 | 24 December 2026 |
| x | No date |

Below the input field a preview of the recognised date appears.

There are also quick buttons for +1 to +14 days, +3 weeks, +1 month, +3 months, +6 months and +1 year.

### Expiry warnings

Products that expire soon or have expired are marked in the app, for example with:

- "Expires in 3 days"
- "Expired"

The information is also available in the data points `stats.expiring*`.

Under Date format you can choose between 31.10.2026, 31/10/2026 and 2026-10-31.

---

## Shopping list modes

ShelfMate supports four ways to put products on a shopping list.

### Off

No products are passed to a shopping list automatically.

### Script

ShelfMate writes the item name with `ack=false` into a data point of your choice.

Optionally you can also name a data point with the current shopping list. A JSON array of objects is expected, each with a `name`. The content has to look like this:

```json
[
  { "name": "Mehl" },
  { "name": "Milch" },
  { "name": "Feta" }
]
```

With it, ShelfMate recognises products that are already there and avoids duplicate entries.

For removing items you can set one more data point. The item name is written there with `ack=false` as well.

Only with this data point do removing via the check mark in the app and automatic removal after refilling work.

### Bring!

ShelfMate can work directly with the Bring! adapter.

The available lists are detected automatically. Alternatively you can enter the channel by hand, for example:

```
bring.0.<list-id>
```

ShelfMate reads the list content through `<Liste>.content` and adds new products through `<Liste>.saveItem`.

Products that are already on the list are not entered again.

For an entry with a comma, only the item name before the first comma is used.

### Bring! special

This mode also takes quantities and variants into account.

Examples:

- `Mehl` → `Mehl, 2` → `Mehl, 3`
- `Feta, 200g` and then `Feta, Kräuter` give **one** entry: `Feta, Kräuter, 200g`. So you can see: one feta with 200 g and one feta as the herb variant
- If another `Feta, Kräuter` is added, the entry reads `Feta, Kräuter 2, 200g`

So existing items are not simply skipped. Instead, ShelfMate raises the quantity or adds the variant.

The entries are processed one after the other. The next item is only passed on once the Bring! adapter has updated its list.

This is especially helpful for the ingredient check.

### Data point shopping.addItem

With `shopping.addItem` you can put products on the shopping list independently of the app.

The currently selected shopping list mode is always used.

### Removing products automatically

With Bring!, Bring! special and script with a remove data point set up, there are two independent options:

**Take off the list when refilled**

As soon as the stock rises above the minimum stock again, the product is removed from the shopping list.

Off by default.

**Take off the list when the check mark is removed**

A tap on the check mark in the app also removes the product from the connected shopping list.

If the function is turned off, only the mark in ShelfMate disappears.

On by default.

Only items that are really on the list are removed. With Bring! the removal goes through `<Liste>.removeItem`.

---

## Checking ingredients

ShelfMate can compare a list of ingredients with your current stock.

The recipes themselves are not stored in ShelfMate. Instead you hand over a list of ingredients, for example from a recipe app.

### Handing over ingredients

Write the ingredients into the data point `check.request` with `ack=false`.

Possible formats:

- One ingredient per line
- Ingredients separated by semicolons
- A JSON array of texts
- A JSON array of objects with `name`, `amount` and `unit`

Examples:

```
Zwiebeln, rot, 1
Cherrytomaten, bunt, 500g
Salz, 0.5 tl
Basilikum
```

These spellings are recognised too:

```
380g Linguine
2EL Olivenöl
Mehl 200g
```

Supported units are kg, g, l, ml, cl and pieces.

Specifications such as EL or TL (tablespoon, teaspoon) are only checked for presence.

Identical ingredients are added up.

### How the comparison works

ShelfMate searches through product names, groups and tags.

Whole words are compared.

Example: Cherrytomaten is not recognised as Tomaten automatically. A matching tag on the product is enough, though.

For products by weight or volume, the actual stock is used.

Example: 500 g flour in stock, 200 g needed – the ingredient is available.

Package sizes such as 1 kg are converted accordingly.

For ingredients without an amount, positive stock is enough.

Unknown ingredients count as missing. This way, other shopping items can be taken over too.

### Result

After every check, these data points are available:

| Data point | Content |
| --- | --- |
| `check.result` | Result for every single ingredient as JSON |
| `check.available` | Ingredients in stock |
| `check.missing` | Missing ingredients |
| `check.allAvailable` | true if everything is in stock |

The lists contain the original ingredient lines, one per line.

With `check.addMissing` you can put the missing ingredients on the shopping list.

Alternatively, turn on "Put missing ingredients on the shopping list" in the adapter settings. Then they are passed on automatically after every check.

Bring! special also takes quantities and variants into account, while the other modes pass on only the item name.

### Taking the minimum stock into account

When comparing ingredients, ShelfMate can also include the minimum stock you want.

Example:

- Stock: 2 kg sugar
- Minimum stock: 1 kg
- Needed: 3 kg sugar

2 kg sugar end up on the shopping list, so that the minimum stock is kept after cooking.

After every check, `check.request` is emptied automatically.

---

## Stocking a whole shelf

With Locations → Stock in you can capture several products one after the other and book them in together.

1. Scan the QR code of the location or pick it from the list.
2. Scan the products one after the other – with the camera, an external scanner or by typing the EAN.
3. Every scan raises the amount by 1.
4. Correct amounts in the list if needed.
5. To finish, scan the same location code again or choose Stock in.

All captured products are booked in together.

For products by weight or volume, every scan counts as one whole package. The package size in g or ml must be stored for this.

### Unknown products

If a barcode is not known yet, ShelfMate asks Open Food Facts for the product data and creates the product.

If nothing is found there, ShelfMate temporarily creates an entry like:

```
Unbekanntes Produkt 1234567890123
```

The product is counted anyway.

Via the light bulb, the hint "Edit new products" then appears until the entry has been completed and saved.

---

## Doing a stocktaking

With a stocktaking you check whether the stored stock matches what you really have.

There are two variants: Scan and List.

### Stocktaking by scan

1. Under Locations → Stocktaking choose the variant Scan.
2. Scan the QR code of the location.
3. Scan all products there one after the other.
4. Every scan counts one piece. The same barcode can be scanned several times.
5. To finish, scan the same location QR again.

ShelfMate compares the counted amounts with the stored stock and shows a summary.

Differences are shown with expected and counted amounts.

Products that were not scanned are counted as 0.

After that, you can continue with the next location. A new location is only accepted once the previous one is finished.

In the overview you see which locations have been checked and which are still open.

### Stocktaking by list

Alternatively, you can check the existing products directly in a list.

- Enter the actual amount
- Confirm with ✓ if the stock is right

Stock corrections are saved in the history as Stocktaking.

A regular stocktaking reminder can be turned on in the adapter settings.

---

## Scanner mode without the app

ShelfMate supports stocking in and out with an external barcode scanner, without the web app having to be open.

Scanner mode is turned on with `scanner.active`.

Scans can be handed over through `scanner.input` with `ack=false` or received from a scanner connected directly to the ioBroker host.

### Scan sequences

| Scan sequence | Action |
| --- | --- |
| Product → location | Stock in 1 piece |
| Product → product | Take out 1 piece |
| Product → product → location | Take out 1 piece from a specific location |
| Location | Start stocking mode |
| Location again | End stocking mode |
| Another location | Switch location in stocking mode |

If no location is given when taking out, ShelfMate uses the stock with the shortest best-before date.

If there is no best-before date, the location with the largest amount is used.

### Stocking mode

First scan the location code.

After that you can scan as many products as you like. Every product scan books one piece into the selected location right away.

To end it, scan the same location code again.

Another location code switches the location directly.

After five minutes without a scan, the mode ends automatically.

### Control codes

There are special codes for further actions:

| Code | Function |
| --- | --- |
| `SM:UNDO` | Undo the last supported booking |
| `SM:SPOIL` | Take out the next product as spoiled |
| `SM:OPEN` | Mark the next product as opened |
| `SM:DATE:<days>` | Set the best-before date for the unopened stock |
| `SM:DATE:0` | Remove the best-before date |
| `SM:QTY:5` | Make the next booking with amount 5 |
| `SM:CANCEL` | Cancel a waiting scan |

The control codes can be printed as a PDF from the settings.

### Time between two scans

In the adapter settings you can set how long ShelfMate waits for the next code.

Possible are 3 to 120 seconds.

Default: 10 seconds.

### Connecting an external wireless scanner

Intended, for example, is the Tera HW0009 with a 2.4 GHz dongle.

1. Plug the USB dongle into the ioBroker computer.
2. Set the scanner to 2.4 GHz mode.
3. Pair the scanner with the dongle following the manufacturer's manual.
4. Set the keyboard layout to US and the end of the code to Enter.
5. In the ShelfMate adapter settings, choose the scanner device.
6. Turn on scanner mode through `scanner.active`.

The scanner is recognised as a USB keyboard. An extra driver is normally not needed.

For ioBroker to access the input device, the user needs the right permissions:

```
sudo adduser iobroker input
```

Then restart the instance.

If the scanner uses a prefix or suffix, the matching settings in ShelfMate must be the same.

Every recognised code is stored in `scanner.lastCode`. The result is in `scanner.result`.

### Short location codes

Because some scanners work with a US keyboard layout, special characters or umlauts can cause problems.

For this, ShelfMate offers short location codes.

In the location editor choose "Use short scanner code", save and print the label again.

Existing labels stay valid.

The short code has the format:

```
SM:L:<8 characters>
```

### Scanners without QR code support

Simple scanners that read only barcodes can be used too.

For this, choose the option Barcode under Settings → Labels.

ShelfMate then creates Code 128 barcodes instead of QR codes for locations and control codes.

This also applies to box and shelf labels.

The location must be saved first so that its short ID can be used.

The codes fit, for example, on labels of 50 × 30 mm.

Note: the scanner itself needs no display. The result of every scan is output in `scanner.result`.

A stocktaking still takes place in the web app, because it needs a display.

---

## Suggestions

Via the light bulb in the header you find different hints from ShelfMate.

They include:

### Product groups

ShelfMate recognises similarly named products and suggests combining them into a group.

Single products can be removed from a suggestion. Whole suggestions can also be ignored.

### Minimum stock

Based on the consumption of the last 30 days, ShelfMate can suggest a fitting minimum stock.

This considers regularly used products.

With ✓ you accept the suggestion, with × you reject it.

### Stocktaking

If a stocktaking is due, a hint appears as well.

Important: ShelfMate never applies suggestions by itself. Changes are only made after you confirm.

---

## Notifications

ShelfMate can send messages automatically for important events.

In the adapter settings you choose a supported notification adapter and the recipient you want.

Supported are:

- Telegram
- telegrammenu2
- Pushover
- Signal
- WhatsApp
- Matrix
- E-mail

With Test you can check whether the connection works.

These notifications are possible:

### Minimum stock reached

A message as soon as a product reaches or falls below its minimum stock.

### Best-before warning

A daily summary of products that expire soon and have already expired.

The time can be set.

### Stocktaking reminder

A reminder after a set number of days without a stocktaking.

With the value 0 the reminder is off.

---

## Export and backup

Under Settings → Data there are several options.

### JSON backup

Creates a complete backup of your ShelfMate data.

A previously saved backup can be imported again later.

### CSV export

Exports the stock as a CSV file, for example for use in Excel.

### PDF export

Creates a printable stock list, sorted by storage location.

The PDF can be saved or printed through the share menu.

### Data storage

ShelfMate stores the stock data in the file:

```
shelfmate.json
```

It is in the adapter's data directory and not in the ioBroker object database.

When you import a backup or delete all data, the previous state is saved as `shelfmate.json.bak`.

---

## Offline mode

ShelfMate can also be used when the connection is briefly interrupted, as long as the web app was set up before and a trusted HTTPS certificate exists.

Stock-ins, take-outs and shopping list entries are kept in a queue while offline.

As soon as the connection is back, ShelfMate sends the waiting actions automatically.

This way, bookings are not lost when the connection drops for a short time.

---

## HTTPS and certificates

For the camera and offline mode, ShelfMate needs HTTPS with a certificate that the device you use trusts.

### Setting up HTTPS

1. In the adapter settings, turn on Use HTTPS.
2. Choose an existing certificate or create a new one.
3. Save the settings and restart the instance.

With Create self-signed certificate, ShelfMate creates a certificate for the host name and the IP addresses of the ioBroker computer.

The certificate is stored in the ioBroker certificate store, selected automatically and valid for 825 days.

Alternatively you can use your own certificates or a certificate collection, for example through the ioBroker adapter acme.

A publicly trusted certificate, for example from Let's Encrypt, normally does not have to be installed on the phone additionally, as long as the host name you open matches it.

### Installing a self-signed certificate on the iPhone

These steps were tested on the iPhone:

1. Open ShelfMate in Safari: `https://<Host>:8120/`
2. In the app open Settings → Offline mode.
3. Choose "Load ioBroker certificate" and allow the download.

Alternatively the certificate file is available at this address:

`https://<Host>:8120/iobrokerZertifikat.cer`

Then on the iPhone:

1. Open Settings → General → VPN & Device Management.
2. Select the downloaded profile and install it.
3. Open Settings → General → About → Certificate Trust Settings.
4. Turn on trust for the installed certificate.
5. Open ShelfMate again.
6. Check the connection under Offline mode → Check again.

Only install and trust certificates whose origin you know.

### Android

Setup on Android has not been tested so far.

The certificate file can also be downloaded at `https://<Host>:8120/iobrokerZertifikat.cer`.

Depending on the Android version, a CA certificate is installed through the security or credentials settings.

Menu names and behaviour can differ by manufacturer and version.

### Adding to the home screen

iPhone: open ShelfMate in Safari, choose the share menu and tap Add to Home Screen.

Android: open ShelfMate in the browser and choose Add to Home screen or Install app from the browser menu.

After that, ShelfMate starts like a normal app.

---

## Printing labels

ShelfMate creates labels as PNG images in the set size.

You can save them on your phone, share them or print them directly.

Supported are, among others:

- EAN labels
- QR labels
- QR-only labels
- Large shelf labels
- Box labels with contents
- "Opened on" labels
- Freezer labels

Which label types are available, you choose in the instance settings in the ioBroker admin under "Label buttons in the app".

### Example: Niimbot B1

The labels can be printed, for example, with a Niimbot B1.

For this, the printer can be set up through CUPS on a Linux computer as an AirPrint printer. Then you can print directly from the iPhone.

Setting up the printer is not part of ShelfMate.

For more information, search for "Niimbot CUPS AirPrint".

---

## Questions, ideas or bugs?

If something does not work or you have an idea for ShelfMate, feel free to open an issue on GitHub:

[GitHub – ShelfMate Issues](https://github.com/backfisch88/ioBroker.shelfmate/issues)
