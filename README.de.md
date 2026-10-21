# ioBroker.shelfmate

ShelfMate ist ein Haushalts-Vorratslager für ioBroker. Es läuft als installierbare Web-App (iPhone-Homescreen / Android), die direkt vom Adapter ausgeliefert wird. Die vollständige Beschreibung steht in der englischen [README.md](README.md).

## Funktionen

- Barcodes und QR-Codes der Lagerorte per Handykamera scannen
- Produktstammdaten (Open Food Facts), Lagerbereiche und Lagerorte mit druckbaren QR-Codes
- Bestand pro Lagerort, Verschieben, Historie, Offline-Warteschlange in der App
- Produktgruppen und Mindestbestand mit automatischem Eintrag auf die Einkaufsliste
- Mindesthaltbarkeit (MHD): aus / pro Produkt / pro Einlagerung, mit Warnung vor Ablauf
- Einkaufsliste: **Aus**, **Script** (Datenpunkte), **Bring** oder **Bring Spezial** (zählt Mengen hoch statt Duplikate)
- Optional: Artikel von der Liste entfernen, wenn wieder aufgefüllt, und/oder wenn der Haken in der App entfernt wird
- Lagerübersicht und ablaufende Produkte als Datenpunkte (JSON und HTML-Tabelle für VIS)
- Benachrichtigungen über Telegram, telegrammenu2, Pushover, Signal, WhatsApp, Matrix oder E-Mail (Mindestbestand erreicht, tägliche Meldung zu ablaufenden Produkten)
- Verbrauch der letzten 30 Tage mit Vorschlag für den Mindestbestand, Gerätename im Verlauf
- Inventur pro Lagerort (Liste oder Scan-Variante, in den Einstellungen wählbar), Korrekturen erscheinen im Verlauf als „Inventur“
- Gruppen-Vorschläge für ähnlich benannte Produkte
- Etiketten: EAN, QR, Nur-QR, großes Regal-Etikett, Boxen-Etikett mit Inhalt, „Geöffnet am“, Gefrierfach – welche Knöpfe die App zeigt, stellst du im Adapter ein
- JSON-Backup: Download und Import in der App
- App und HTML-Datenpunkte nutzen die ioBroker-Systemsprache (11 Sprachen)
- Eigener HTTPS-Server mit den ioBroker-Zertifikaten, optionaler Zugriffsschlüssel

## Installation

Über den Admin (Adapter).
Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen. Voraussetzungen: js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.

## Datenpunkte

`stats.products`, `stats.locations`, `stats.lowStockCount`, `stats.lowStockList`, `stats.inventory`, `stats.inventoryHtml`, `stats.consumption`, `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml`, `shopping.addItem`, `info.connection`.

## In Arbeit und geplant

ShelfMate wird aktiv weiterentwickelt. Geplant (ohne Zusage, ohne Reihenfolge):

- **Inventur für einen ganzen Bereich**: alle Lagerorte eines Bereichs nacheinander durchgehen
- **Externer Barcode-Scanner** (USB oder Bluetooth, Tastaturmodus): Prefix und Suffix einstellbar, Scan wird am Tempo vom Tippen unterschieden, Steuer-Barcodes wie „Einlagern“ / „Entnehmen“ zum Arbeiten ohne Display
- **Export** des Bestands als CSV und als druckbares PDF

Ideen und Fehler gerne als [GitHub-Issue](https://github.com/backfisch88/ioBroker.shelfmate/issues) melden.

## Lizenz

MIT License, Copyright (c) 2026 Henrik Schoenhofen
