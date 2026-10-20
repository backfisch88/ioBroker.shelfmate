# ioBroker.shelfmate

ShelfMate ist ein Haushalts-Vorratslager für ioBroker. Es läuft als installierbare Web-App (iPhone-Homescreen / Android), die direkt vom Adapter ausgeliefert wird.

## Funktionen

- Barcodes und QR-Codes der Lagerorte per Handykamera scannen
- Produktstammdaten (Open Food Facts), Lagerbereiche und Lagerorte mit QR-Codes
- Bestand pro Lagerort, Historie, Offline-Warteschlange in der App
- Produktgruppen und Mindestbestand mit automatischem Eintrag auf die Einkaufsliste
- Einkaufsliste: **Aus**, **Script** (Datenpunkte), **Bring** oder **Bring Spezial** (zählt Mengen hoch statt Duplikate)
- Eigener HTTPS-Server mit den ioBroker-Zertifikaten, optionaler Zugriffsschlüssel
- Optional: Artikel von der Liste entfernen, wenn wieder aufgefüllt, und/oder wenn der Haken in der App entfernt wird

## Installation

Per Admin ("Aus eigener URL installieren") oder `iobroker url https://github.com/backfisch88/ioBroker.shelfmate`.
Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen. Die vollständige Beschreibung steht in der englischen [README.md](README.md).

## Lizenz

MIT License, Copyright (c) 2026 Henrik Schoenhofen
