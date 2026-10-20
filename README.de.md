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
- Eigener HTTPS-Server mit den ioBroker-Zertifikaten, optionaler Zugriffsschlüssel

## Installation

Über den Admin ("Aus eigener URL installieren") mit `https://github.com/backfisch88/ioBroker.shelfmate`.
Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen. Voraussetzungen: js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.

## Datenpunkte

`stats.products`, `stats.locations`, `stats.lowStockCount`, `stats.lowStockList`, `stats.inventory`, `stats.inventoryHtml`, `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml`, `shopping.addItem`, `info.connection`.

## Lizenz

MIT License, Copyright (c) 2026 Henrik Schoenhofen
