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
- JSON-Backup: Download und Import in der App
- App und HTML-Datenpunkte nutzen die ioBroker-Systemsprache (11 Sprachen)
- Eigener HTTPS-Server mit den ioBroker-Zertifikaten, optionaler Zugriffsschlüssel

## Installation

Über den Admin (Adapter).
Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen. Voraussetzungen: js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.

## Datenpunkte

`stats.products`, `stats.locations`, `stats.lowStockCount`, `stats.lowStockList`, `stats.inventory`, `stats.inventoryHtml`, `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml`, `shopping.addItem`, `info.connection`.

## In Arbeit und geplant

ShelfMate wird aktiv weiterentwickelt. Geplant bzw. denkbar (ohne Zusage, ohne Reihenfolge):

- **Externer Barcode-Scanner** (geplant): USB- oder Bluetooth-Handscanner am Regal, um ohne Handy ein- und auszubuchen
- Inventurmodus: tatsächlichen Bestand zählen und in einem Durchgang korrigieren
- Benachrichtigung bei ablaufenden oder knappen Produkten (Datenpunkt und/oder Nachrichten-Adapter wie Telegram)
- Verbrauchsstatistik und Vorschlag für den Mindestbestand anhand des Verlaufs
- CSV-Import und -Export zusätzlich zum JSON-Backup
- Mehrere Benutzer mit eigenen Einträgen im Verlauf
- Weitere Etiketten-Vorlagen (z. B. mit MHD)

Ideen und Fehler gerne als [GitHub-Issue](https://github.com/backfisch88/ioBroker.shelfmate/issues) melden.

## Lizenz

MIT License, Copyright (c) 2026 Henrik Schoenhofen
