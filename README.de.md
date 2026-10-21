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
- Verbrauch der letzten 30 Tage mit Vorschlag für den Mindestbestand (nur für regelmäßig verbrauchte Produkte), Gerätename im Verlauf
- Glühbirne mit allen Vorschlägen (Gruppen, Mindestbestand, fällige Inventur)
- Inventur per Scan: Lagerort-QR scannen, dann die Produkte, dann denselben Lagerort-QR nochmal, der die Inventur abschließt (auch mit der Kamera); eine Übersicht zeigt, welche Lagerorte des Bereichs erledigt sind
- Export des Bestands als CSV oder PDF
- Gruppen-Vorschläge für ähnlich benannte Produkte, mit Bildern und Packungsgrößen
- Etiketten: EAN, QR, Nur-QR, großes Regal-Etikett, Boxen-Etikett mit Inhalt, „Geöffnet am“, Gefrierfach – welche Knöpfe die App zeigt, stellst du im Adapter ein
- JSON-Backup: Download und Import in der App
- App und HTML-Datenpunkte nutzen die ioBroker-Systemsprache (11 Sprachen)
- Eigener HTTPS-Server mit den ioBroker-Zertifikaten, optionaler Zugriffsschlüssel

## Anleitungen

Kurze Abläufe zu den wichtigsten Funktionen, alles in der App.

### Ein- und Auslagern
1. **Scannen** antippen und den Barcode vor die Kamera halten (oder eintippen).
2. Bekannte Produkte öffnen sich sofort, unbekannte werden bei Open Food Facts gesucht und vorausgefüllt. Prüfen und speichern.
3. **Einlagern**, **Entnehmen** oder **Verschieben** wählen, Menge und Lagerort einstellen, speichern.
4. Tipp: Statt den Lagerort aus der Liste zu wählen, den QR-Code des Regals scannen.

### Lagerorte und Etiketten
1. Unter **Lagerorte** einen Bereich (z. B. „Speisekammer“) und einen Lagerort („Regal 1“) anlegen.
2. Den Lagerort öffnen: Dort steht sein QR-Code, die Etiketten-Knöpfe erzeugen das Etikett als Bild (nur QR, großes Regal-Etikett, Boxen-Etikett mit Inhalt).
3. Die Etikettengröße einmal unter **Einstellungen / Etiketten** eintragen (z. B. 50 × 30 mm). Welche Knöpfe die App zeigt, stellst du in den Adapter-Einstellungen ein.
4. Das Bild drucken (siehe „Etiketten drucken“) und an Regal oder Box kleben.

### Produkte ohne Barcode
Produkt von Hand anlegen und einen eigenen EAN-13-Code erzeugen lassen. Den Code als Etikett drucken und aufkleben. Ein eigenes Produktbild kann hochgeladen werden, es wird automatisch verkleinert.

### Mindestbestand und Einkaufsliste
1. Beim Produkt einen **Mindestbestand** eintragen. Bei Produkten einer Gruppe (z. B. alle Mehlsorten) an der Gruppe einstellen, der Bestand zählt gemeinsam.
2. In den Adapter-Einstellungen den Einkaufslisten-Modus wählen.
3. Fällt der Bestand auf den Mindestbestand, kommt das Produkt auf die Liste. Der Haken in der Übersicht zeigt, was auf der Liste steht; antippen nimmt es wieder herunter.

### Mindesthaltbarkeit
Modus in den Adapter-Einstellungen wählen: pro Produkt oder pro Einlagerung. Bei „pro Einlagerung“ gibst du das Datum beim Einlagern an, beim Entnehmen wird immer das älteste zuerst verbraucht. Abgelaufene und bald ablaufende Produkte werden markiert und können per Benachrichtigung gemeldet werden.

### Inventur per Scan
1. **Lagerorte / Inventur** öffnen und die Variante **Scannen** wählen (Einstellungen oder auf der Seite).
2. Den QR-Code des Lagerorts scannen. „Inventur gestartet“ bestätigt das.
3. Alle Artikel dieses Lagerorts scannen; jeder Scan zählt +1 (zweimal derselbe Artikel heißt zwei).
4. **Denselben** Lagerort-QR nochmal scannen. Damit ist die Inventur des Lagerorts abgeschlossen: Der Bestand wird korrigiert, der Lagerort als erledigt markiert, und eine Zusammenfassung zeigt, was gezählt wurde (mit Sollmenge, wenn sie abweicht).
5. Zum Weitermachen den QR-Code des nächsten Lagerorts scannen. Ein anderer Lagerort wird erst angenommen, wenn der aktuelle abgeschlossen ist.

Die Seite zeigt auch, welche Lagerorte des Bereichs fertig und welche noch offen sind. Nicht gescannte Artikel zählen als 0. Lieber von Hand prüfen? Variante **Liste**: gezählte Menge eintippen oder ✓ für „stimmt“. Korrekturen stehen im Verlauf als „Inventur“. Eine Erinnerung im Intervall stellst du bei den Benachrichtigungen ein.

### Vorschläge (Glühbirne)
Die Glühbirne oben sammelt drei Arten von Hinweisen: Gruppen-Vorschläge (ähnliche Produkte, die gemeinsam zählen könnten; einzelne Produkte lassen sich herausnehmen, ein Vorschlag lässt sich ignorieren), Mindestbestand-Vorschläge (nur für regelmäßig verbrauchte Produkte; ✓ übernimmt, ✕ verwirft) und eine fällige Inventur. Ohne Antippen ändert sich nichts.

### Benachrichtigungen
In den Adapter-Einstellungen einen Benachrichtigungs-Adapter wählen, das Ziel eintragen (z. B. eine Chat-ID) und den Test-Knopf nutzen. Du kannst dich melden lassen, wenn der Mindestbestand erreicht ist, täglich zur gewählten Uhrzeit über abgelaufene und ablaufende Produkte, und alle N Tage an eine Inventur erinnern.

### Export und Backup
Unter **Einstellungen / Daten**: **JSON-Backup** (herunterladen und wieder importieren), **Bestand als CSV** (für Excel o. Ä.) und **Bestand als PDF** (druckbare Liste nach Lagerort; öffnet das Teilen-Menü zum Sichern oder Drucken).

### Offline nutzen
Sobald das Zertifikat vertraut ist, startet die App auch ohne Verbindung. Buchungen und Einkaufslisten-Einträge, die offline entstehen, werden gesammelt und automatisch gesendet, sobald die Verbindung wieder da ist.

## Etiketten drucken

Die Etiketten entstehen als PNG-Bilder in der eingestellten Etikettengröße und werden vom Handy geteilt oder gespeichert. Der Autor druckt sie auf einem Niimbot B1, der über CUPS auf einem Linux-Rechner als AirPrint-Drucker eingerichtet ist, sodass das Handy direkt drucken kann. Die Druckereinrichtung gehört nicht zum Adapter; Stichwort zum Suchen: „Niimbot CUPS AirPrint“.

## Installation

Über den Admin (Adapter).
Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen. Voraussetzungen: js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.

## Datenpunkte

`stats.products`, `stats.locations`, `stats.lowStockCount`, `stats.lowStockList`, `stats.inventory`, `stats.inventoryHtml`, `stats.consumption`, `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml`, `shopping.addItem`, `info.connection`.

## In Arbeit und geplant

ShelfMate wird aktiv weiterentwickelt. Geplant (ohne Zusage, ohne Reihenfolge):

- **Externer Barcode-Scanner** (USB oder Bluetooth, Tastaturmodus): Prefix und Suffix einstellbar, Scan wird am Tempo vom Tippen unterschieden, Steuer-Barcodes wie „Einlagern“ / „Entnehmen“ zum Arbeiten ohne Display

Ideen und Fehler gerne als [GitHub-Issue](https://github.com/backfisch88/ioBroker.shelfmate/issues) melden.

## Lizenz

MIT License, Copyright (c) 2026 Henrik Schoenhofen
