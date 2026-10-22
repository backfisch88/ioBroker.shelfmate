# ShelfMate tutorial

Step-by-step guides for everything I do with ShelfMate. The short description, the settings and the datapoints are in the [README](../../README.md). A German version of this tutorial is in [docs/de/tutorial.md](../de/tutorial.md).

## Contents

1. [The app at a glance](#the-app-at-a-glance)
2. [Editing a product](#editing-a-product)
3. [Automatic values and the sparkle symbol](#automatic-values-and-the-sparkle-symbol)
4. [Reloading a product from Open Food Facts](#reloading-a-product-from-open-food-facts)
5. [Book stock in and out](#book-stock-in-and-out)
6. [Storage locations and labels](#storage-locations-and-labels)
7. [Products without a barcode](#products-without-a-barcode)
8. [Minimum stock and shopping list](#minimum-stock-and-shopping-list)
9. [Best-before date](#best-before-date)
10. [Shopping list modes](#shopping-list-modes)
11. [Ingredient check](#ingredient-check)
12. [Stocking a whole shelf by scanning](#stocking-a-whole-shelf-by-scanning)
13. [Stocktaking by scanning](#stocktaking-by-scanning)
14. [Scanner mode (without the app)](#scanner-mode-without-the-app)
15. [Suggestions (bulb icon)](#suggestions-bulb-icon)
16. [Notifications](#notifications)
17. [Export and backup](#export-and-backup)
18. [Offline use](#offline-use)
19. [Certificate and installing it on the phone](#certificate-and-installing-it-on-the-phone)
20. [Printing labels](#printing-labels)

## The app at a glance

**Overview.** At the top is the search field. While I type, suggestions (product names, brands, tags) appear right under it; I tap one to take it over. The **×** on the right clears the field. Below the search I find three dropdowns (area, location, category), the status chips and the tags:

- The status chips are **Opened**, **Best before soon**, **Expired**, **reorder** and **Empty**. The two best-before chips only exist when the best-before date is switched on. A tap on a chip filters the list, a second tap switches it off again.
- The tags are the most used search words. A tap searches for it and highlights it, a second tap clears the search.
- Products of one group appear as one line with a small triangle; a tap unfolds the group. A tap on a product opens its page, and **Back** returns to exactly the place in the list where I was.

**Product page.** The card at the top shows the total stock. With the best-before date on it also shows every best-before date, expired and soon-expiring ones in colour, and, if there is a standard shelf life, one line "Standard shelf life 365 days · after opening 90 days". The buttons below are always in the same order:

1. **Stock in** and **Take out**
2. **Move** and **Open** (or **Undo opening**), only when they make sense for this product
3. **To shopping list**: puts the product on the list; if it is listed already, the same button shows a check mark and a tap takes it off again
4. The label buttons (only those I switched on in the adapter settings)
5. **Edit** and **Delete**, always in the last row

## Editing a product

**Edit** opens the form. It has five sections that fold open and shut. A closed section shows a short summary on the right, for example `Pack · 400g · min 1`, so I see the content without opening it. I open only what I want to change:

| Section | What is in it |
| --- | --- |
| **Basics** (open) | Name, brand, picture (upload or remove, a preview is shown), category |
| **Stock** (open for a new product) | Stock type (pieces, weight, volume), the unit for pieces next to the package size, minimum stock |
| **Group and tags** | Product type or group (several brands counted together, for example "Flour"), tags (search words, separated by commas) |
| **Shelf life** | Only visible when the best-before date is on. Best-before date (per product mode), standard shelf life in days and shelf life after opening in days |
| **More** | Barcode with "Generate EAN" and the label, Nutri-Score as a row of coloured buttons (A to E, tap again to choose another), picture link, and for products from Open Food Facts the reload button |

The unit field only appears for products counted in pieces. Products with a group count together for the minimum stock and take over the standard shelf life of the group when they have none of their own.

## Automatic values and the sparkle symbol

ShelfMate can fill in dates that I would otherwise have to type: the best-before date when stocking in, the standard shelf life and the shelf life after opening. To keep this honest, the product page shows a small **sparkle symbol** at the end of the line "Standard shelf life … · after opening …" as soon as something on that product was **not typed by me**. That means:

- the standard shelf life or the shelf life after opening comes from the built-in list (dry goods such as pasta, rice, flour, tins, sweets) or from the product group instead of from the product itself,
- a best-before date was set automatically when stocking in (standard shelf life added to the day of stocking), or by "Fill in shelf life automatically" in the app settings.

The symbol is only on the product page, not in the overview. A value I enter myself always wins: as soon as I type or change a date, that date no longer counts as automatic and the symbol disappears once nothing automatic is left. Dates that were filled in earlier are recognised again when I run "Fill in shelf life automatically" once more (a date that is exactly the stocking day plus the shelf life counts as automatic).

**When is something filled in?** The adapter settings decide, under "Fill in shelf life automatically":

| Setting | Meaning |
| --- | --- |
| Always (default) | The app pre-fills the date when stocking in; scanner mode and data points enter it themselves |
| Only without the app | Only scanner mode and data points enter it, because nobody can type a date there. The app leaves the field empty |
| Never | Nothing automatic, no suggestions from the list either. The button "Fill in shelf life automatically" in the app still works when I press it |

**What is filled in?** The second setting "What is filled in automatically" limits it: either **everything with a standard shelf life** (own values, group values and the list) or **only dry goods from the built-in list**. With the second choice a loaf of bread with a standard shelf life of 5 days that I typed myself is not dated automatically, pasta is.

Fresh and chilled goods (milk, yoghurt, cheese, sausage, meat, eggs, salad and similar) are never in the built-in list and get no automatic date. The values are suggestions for checking, not the printed date of the manufacturer. A date that is printed on the pack, or that I enter, always replaces the automatic one, and opening a pack never makes the date later than the printed one.

**Managing the values.** Under **Settings / Shelf life** (only visible when the best-before date is on) the button **Manage shelf lives** lists every product with its own value. I can change a value there, remove it with the ✕, or remove all own values with **Remove all own values** at the top. The list updates immediately.

## Reloading a product from Open Food Facts

For a product that came from Open Food Facts the editor shows the barcode as locked. Under **More** the button **Reload from Open Food Facts** fetches name, brand, package size, picture, category and Nutri-Score again, and adds new tags to mine (my own tags stay). Nothing is saved until I tap **Save product**, so I can look at the result first or simply leave the form.

## Book stock in and out
1. Tap **Scan** and hold the barcode in front of the camera (or type it in).
2. A known product opens directly; an unknown one is looked up on Open Food Facts and pre-filled. Check it and save.
3. Choose **Stock in**, **Take out** or **Move**, set the quantity and the storage location, and save.
4. Tip: scan the QR code of the shelf instead of choosing the location from the list.

## Storage locations and labels
1. Open **Locations**, create an area (for example "Pantry") and a location ("Shelf 1").
2. Open the location. Its QR code is shown there; the label buttons create the label as an image (QR only, large shelf label, box label with contents).
3. Set your label size under **Settings / Labels** once (for example 50 × 30 mm). For the shelf label, the box label and the full-page code I can choose a separate size there (A6, A5 or A4). I also choose there whether location labels carry a QR code or a Code 128 barcode (name on top, only the barcode below; the location has to be saved first). In the adapter settings you choose which label buttons the app shows.
4. Print the image (see "Printing labels") and attach it to the shelf or box.

## Products without a barcode
Create the product by hand and let the app generate its own EAN-13 code. Print that code as a label and stick it on the item. Upload your own product image if you like; it is compressed automatically.

## Minimum stock and shopping list
1. Open a product and set a **minimum stock**. For products from one group (for example all kinds of flour) set it on the group; the stock counts together.
2. Choose the shopping-list mode in the adapter settings (see "Shopping list").
3. When the stock falls to the minimum, the product is put on the list. The check mark in the overview shows what is on the list; tap it to take the product off again.

## Best-before date

Choose the mode in the settings:

- **Off**: no best-before handling.
- **Per product**: each product has one optional date (product form). Products at or after the date are marked in the overview and detail view.
- **Standard shelf life** (optional, per product; group products take over the value of their group): pre-fills the best-before date when I stock in (pasta, for example, a year ahead). In per-stocking mode, stock without a date also gets one: the day it was stocked in (from the history) plus the shelf life. When and what is filled in automatically, and what the sparkle symbol means, is explained in [Automatic values and the sparkle symbol](#automatic-values-and-the-sparkle-symbol).
- **Opened** (optional, per product): "Open" on the product page splits one package off. If you entered a shelf life after opening, it gets that date (or the earlier best-before date). Opened packages are listed separately and used first.
- "Undo opening" on the product page turns one opened package back into a normal one.
- **Spoiled**: when taking out, choose "Spoiled" instead of "Used". It leaves the consumption statistics and is summed up in the history for 30 days.
- **Undo**: the history has a button that reverts the last booking, and the scanner has the code `SM:UNDO`.
- **Adding or changing a date later** (per stocking): on the product page "Edit best-before dates" unfolds every package, opened ones too, on its own line with a date field (quick input as below) and the buttons +1, +3, +5, +10 days. Save applies all lines at once, shows up in the history and can be undone. Opened packages get their own line labelled "Opened". Headless, scan `SM:DATE:<days>` and then the product to date all unopened stock at once.
- **Quick date input**: the best-before field is a text field. `+3d` is in 3 days, `+2w` in 2 weeks, `+1m` in a month, `+1y` in a year, `12/26` is the end of December 2026 (as printed on many packs), `2412` or `24.12.` is the next 24 December, `24.12.26` a full date, `x` means no date. A preview below the field shows what was understood. Buttons for +1 to +14 days, +3w, +1m, +3m, +6m and +1y fill it with one tap.
- **Per stocking**: when you book stock in you can enter a date. Several dates per product and location are kept; booking out and moving always use the oldest date first.

Products that are expired or expire within the configured warning period get a badge ("expires in 3 days" / "expired") and are listed in the data points `stats.expiring*`.

## Shopping list modes

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

## Ingredient check

When a product has a minimum stock, I reserve it: what I need to buy is the wanted amount minus what I have plus the minimum stock. With 2 kg sugar in stock, a minimum of 1 kg and `Zucker, 3000 g` requested, `Zucker, 2000g` goes to the list. `check.request` is emptied after each run.

I use this to compare the ingredients of my planned recipes with what I have at home. ShelfMate does not know any recipes, it only gets a list of ingredients and says what is there.

1. Write the ingredients to `check.request`, one per line (or separated by semicolons), or as a JSON array of texts or `{"name","amount","unit"}`. Within a line commas separate name, qualifier and amount, in the form my recipe app delivers them: `Zwiebeln, rot, 1`, `Cherrytomaten, bunt, 500g`, `Salz, 0.5 tl`, `Basilikum`. An amount in front of the name (`380g Linguine`, `2EL Olivenöl`) or behind it (`Mehl 200g`) works too. `kg`, `g`, `l`, `ml`, `cl` and pieces are understood, `EL`, `TL` and the like only count as "present". The same ingredient twice is added up.
2. An ingredient is found by product name, product group or tag (whole words, no compound parts: `Cherrytomaten` is not found by `Tomaten`, add the tag `Cherrytomaten` to a product to make it count), so `Mehl` adds up all products of the group Mehl. With an amount in g or ml the stock is compared (500 g in stock, 200 g needed: fine); a counted product with a package size like `1 kg` is converted. Without an amount, stock above zero is enough. Unknown ingredients count as missing, so things that are not food still end up on the list.
3. `check.result` holds the result per ingredient (wanted, have, ok, missing amount), `check.available` and `check.missing` hold the lines as they came, one per line, so `check.missing` can go to the shopping list as it is, `check.allAvailable` is `true` if nothing is missing.
4. With "Put missing ingredients on the shopping list" in the adapter settings the missing ones go to the shopping list after every check, each line as it came. In the Bring special mode the merging of the specification does the rest (`Cherrytomaten, bunt, 500g` twice becomes `bunt 500g + 500g`), in the other modes only the name is written. Otherwise write `true` to `check.addMissing` when I want them on the list.

## Stocking a whole shelf by scanning
1. Open **Locations / Stocking**.
2. Scan the QR code of the location (or choose it in the list), then scan the products one after another with the camera, a scanner or by typing the EAN. Every scan counts 1, the list shows the quantities and I can correct them.
3. Scan the same location code again (or tap **Stock in**). Everything is booked in at once. Products by weight or volume count as whole packages and need the package size in g or ml.
4. A barcode that is not in the list yet is looked up in Open Food Facts and the product is created and counted right away. If the databases do not know it either, I get a product called "Unknown product <barcode>" that counts too, and it shows up as a suggestion (light bulb, "Edit new products") until I have edited and saved it.

## Stocktaking by scanning
1. Open **Locations / Stocktaking** and choose the variant **Scan** (settings or on the page).
2. Scan the QR code of the location. "Stocktaking started" confirms it.
3. Scan every item of that location; each scan counts +1 (the same item twice means two).
4. Scan the **same** location QR code again. The stocktaking of that location is finished: the stock is corrected, the location is marked as done, and a summary shows what was counted (with the expected quantity where it differs).
5. Scan the QR code of the next location to continue. Another location is only accepted after the current one is finished.

The page also shows which locations of the area are done and which are still open. Items you did not scan count as 0. Prefer to check by hand? Use the variant **List**: type the counted quantity or tap ✓ for "correct". Corrections appear in the history as "Stocktaking". A reminder interval can be set in the notification settings.

## Scanner mode (without the app)

Books stock in and out with scanned codes, without opening the app. It is switched on with the data point `scanner.active`. Codes arrive in `scanner.input`, or directly from a scanner that is plugged into the ioBroker host and shows up there as a keyboard (see below).

| Setting | Description |
| --- | --- |
| Time between product and location | Seconds (3 to 120, default 10) in which the second code has to follow the first |
| Scanner (keyboard device on the server) | The device of the scanner's USB dongle, chosen from a list |
| Prefix / suffix of the scanner | Text that the scanner puts before or after every code and that I remove again (optional) |

| Scan | Result |
| --- | --- |
| product, then location code | stocks in 1 at that location |
| product twice | takes out 1, from the location with the nearest best-before date (without dates: the biggest stock) when no location follows in time |
| product twice, then location code | takes out 1 from exactly that location |
| location code alone | starts stocking mode: every product scanned afterwards is stocked in at that location (1 each, booked right away); the same location code again finishes it, another location code switches to that location, and after 5 minutes without a scan it ends by itself |
| `SM:QTY:5`, then the above | the next booking counts 5 instead of 1 |
| `SM:CANCEL` | forgets the waiting scan |
| `SM:UNDO` | undoes the last booking (not moves and stocktakes) |
| `SM:SPOIL`, then the product | takes out 1 as spoiled instead of used |
| `SM:OPEN`, then the product | marks 1 unit as opened |
| `SM:DATE:<days>`, then the product | sets the best-before date of all unopened stock to today plus the days (`SM:DATE:0` removes it) |

Products by weight or volume are booked in whole packages (the package size has to be given in g, kg, ml or l). The stocktaking stays in the app, it needs the display.

**Connecting a wireless scanner (intended: Tera HW0009 with its 2.4G dongle).** I plug the dongle into the ioBroker host. The host sees it as a keyboard, so no driver is needed. On the scanner I select the 2.4G mode and pair it with the dongle using the barcodes from its manual, and I leave the keyboard layout on US and the end of the code on Enter. In the adapter settings I choose the device in "Scanner", and I switch the mode on with `scanner.active`. The ioBroker user needs access to the device: `sudo adduser iobroker input` and a restart of the instance. The adapter reads the device itself, a scanner that was set to prefix or suffix only needs the same text in the two settings. Every code is also written to `scanner.lastCode`.

Because the scanner types with a US keyboard layout, umlauts and some special characters can get lost. For locations I therefore use the short scanner code: in the location editor I tap "Use the short scanner code", save, and print the label again (old labels keep working). In the settings the button "Control codes as PDF" prints the quantity codes and the cancel code. The scanner has no display, the result of every scan is in `scanner.result`.

**Scanner without 2D (barcode only).** For a scanner that reads 1D codes only, I switch the setting "Code on location labels" to "Barcode". All location labels (also the box and shelf labels) then show the name on top and only a Code 128 barcode below, and the control codes sheet is printed as barcodes too. The location has to be saved first, because the code contains its short id (`SM:L:<8 characters>`). It fits a 50 × 30 mm label.

## Suggestions (bulb icon)
The bulb in the header collects three kinds of hints: group suggestions (similar products that could count together; you can drop single products from a suggestion or have it ignored), minimum stock suggestions (only for products you use regularly; ✓ applies, ✕ dismisses) and a due stocking. Nothing is changed without a tap.

## Notifications
Select a notification adapter in the adapter settings, enter the target (for example a chat ID) and use the test button. You can be told when the minimum stock is reached, get a daily message about expired and expiring products at a time of your choice, and be reminded of a stocktaking every N days.

## Export and backup
Under **Settings / Data**: **JSON backup** (download and import again), **Stock as CSV** (for Excel and similar) and **Stock as PDF** (a printable list grouped by location; it opens the share sheet so you can save or print it).

## Offline use
After the certificate is trusted (see below), the app also starts without a connection. Bookings and shopping-list entries made offline are queued and sent automatically when the connection is back.

## Certificate and installing it on the phone

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
