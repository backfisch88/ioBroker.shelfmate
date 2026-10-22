<p align="center"><img src="admin/shelfmate.png" alt="ShelfMate" width="160"></p>

# ioBroker.shelfmate

Vorratsverwaltung für zu Hause in ioBroker. Der Adapter liefert sie als Web-App aus, die man aufs Handy legen kann (iPhone-Homescreen / Android).
Ich sehe, was wo liegt, werde bei Mindestbestand gewarnt, und was fehlt, kommt automatisch auf die Einkaufsliste.

English version: [README.md](README.md)

Anleitungen: [Anleitung](docs/de/tutorial.md) (Deutsch), [Tutorial](docs/en/tutorial.md) (English)

---

## Funktionen

- Barcodes und QR-Codes der Lagerorte per Handykamera scannen
- Produkte ohne Barcode: eigenen EAN-13-Code erzeugen und das Etikett drucken, eigenes Produktbild hochladen (wird automatisch verkleinert)
- Druckbare EAN- und QR-Etiketten in der eigenen Etikettengröße (Einstellungen, zum Beispiel 50 × 30 mm)
- Produktdaten von Open Food Facts (Name, Marke, Packungsgröße, Nutri-Score, Kategorien), änderbar und jederzeit neu ladbar
- Lagerbereiche und Lagerorte mit druckbaren QR-Codes
- Bestand pro Lagerort, Historie aller Buchungen, Offline-Warteschlange in der App
- Suche mit Vorschlägen beim Tippen („Nut“ schlägt „Nutella“ vor)
- Produktgruppen: „Mehl“ mehrerer Marken zählt als ein Artikel
- Optionales Mindesthaltbarkeitsdatum (MHD) pro Produkt oder pro Einlagerung, mit Warnung vor Ablauf
- Optional: Standard-Haltbarkeit und Haltbarkeit nach dem Öffnen, auf Wunsch automatisch eingetragen (ein kleines Funken-Symbol zeigt, was ich nicht selbst getippt habe), Geöffnet und Verdorben markieren, letzte Buchung rückgängig
- Zutaten-Prüfung: vergleicht eine Zutatenliste (zum Beispiel aus einer Rezept-App) mit dem Bestand und setzt nur das Fehlende auf die Einkaufsliste
- Mindestbestand pro Produkt oder Gruppe mit automatischem Eintrag auf die Einkaufsliste
- Einkaufsliste: **Aus**, **Script** (Datenpunkte), **Bring!** oder **Bring! Spezial** (zählt Mengen hoch statt Duplikate zu überspringen)
- Optional: Artikel von der Liste nehmen, wenn wieder aufgefüllt, und/oder wenn der Haken in der App entfernt wird
- Der ganze Bestand als Datenpunkte (JSON und HTML-Tabelle für VIS)
- Benachrichtigungen über Telegram, telegrammenu2, Pushover, Signal, WhatsApp, Matrix oder E-Mail: Mindestbestand erreicht, tägliche Meldung zu abgelaufenen und bald ablaufenden Produkten
- Verbrauch der letzten 30 Tage pro Produkt mit Vorschlag für den Mindestbestand, den ich mit einem Tipp übernehme oder ablehne
- Eine Glühbirne in der Kopfzeile sammelt alle Vorschläge (Gruppen, Mindestbestand, fällige Inventur)
- Gerätename pro Handy, in der Historie bei jeder Buchung zu sehen
- Inventur pro Lagerort als Liste oder per Scan (Lagerort-QR, dann die Produkte, dann nochmal denselben QR), mit Kamera oder Tastatur-Scanner
- Gruppen-Vorschläge für ähnlich benannte Produkte
- Etiketten: „Geöffnet am“, Gefrierfach, großes Regal-Etikett, Boxen-Etikett mit Inhalt, nur QR. Welche Knöpfe die App zeigt, stelle ich im Adapter ein
- Scanner-Modus ohne App: Ein- und Auslagern mit gescannten Codes über Datenpunkte
- JSON-Backup, Export als CSV oder PDF
- Eigener HTTPS-Server mit den Zertifikaten der ioBroker-Installation (selbstsigniert, eigene oder Let's Encrypt)
- Optionaler Zugriffsschlüssel für die API
- App und HTML-Datenpunkte nutzen die ioBroker-Systemsprache (de, en, ru, pt, nl, fr, it, es, pl, uk, zh-cn)

## Voraussetzungen

- js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.12
- HTTPS mit einem Zertifikat, dem das Handy vertraut (wird für die Kamera und den Offline-Modus gebraucht)

## Installation

Ganz normal über den Adapter-Reiter im ioBroker-Admin installieren. Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen.

## Schnellstart

1. `https://<Host>:8120/` am Handy öffnen und die Seite zum Homescreen hinzufügen.
2. Lagerbereiche und Lagerorte anlegen (Einstellungen / Lagerorte). Den QR-Code eines Lagerorts drucken und ins Regal kleben.
3. Produkte anlegen: Barcode scannen (Name, Marke, Größe und Nutri-Score kommen von Open Food Facts) oder von Hand eingeben. Optional Produktgruppe, Mindestbestand und MHD setzen.
4. Bestand pro Lagerort ein- und auslagern oder verschieben. Den QR-Code des Lagerorts scannen, um ihn auszuwählen.
5. Fällt der Bestand auf den Mindestbestand, kommt das Produkt auf die Einkaufsliste. In der Übersicht zeigt der Haken, was auf der Liste steht; ein Tipp darauf nimmt es wieder herunter (siehe [Anleitung](docs/de/tutorial.md)).

## Einstellungen

| Einstellung | Beschreibung |
| --- | --- |
| Port / Bind-Adresse | Auf welchem Port und welcher Adresse der Webserver läuft (Standard `8120`, alle Schnittstellen) |
| HTTPS verwenden | Nutzt das unten gewählte Zertifikat. Standard ist das selbstsignierte ioBroker-Zertifikat |
| Selbstsigniertes Zertifikat erzeugen | Knopf: erzeugt ein Zertifikat für diesen Server (Hostname und IP-Adressen, 825 Tage gültig), legt es in den ioBroker-Zertifikaten ab und wählt es aus. Danach die Instanz neu starten |
| Zertifikate | Öffentliches / privates / Chain-Zertifikat aus dem ioBroker-Zertifikatsspeicher oder eine Zertifikatssammlung (zum Beispiel vom `acme`-Adapter) |
| Zugriffsschlüssel | Optional. Ist einer gesetzt, fragt die App einmal pro Gerät danach |
| Einkaufslisten-Modus | Aus, Script, Bring oder Bring Spezial, siehe [Anleitung](docs/de/tutorial.md#einkaufslisten-modi) |
| Mindesthaltbarkeit | **Aus**, **pro Produkt** (ein Datum am Produkt) oder **pro Einlagerung** (ein Datum bei jeder Einlagerung; beim Entnehmen zuerst das älteste) |
| Datumsformat | Wie Daten in der App angezeigt werden: `31.10.2026`, `31/10/2026` oder `2026-10-31` |
| Benachrichtigungs-Adapter | Installierte Instanz für Nachrichten (telegram, telegrammenu2, pushover, signal, whatsapp, matrix, email). Optional Empfänger (Chat-ID oder E-Mail-Adresse), der Bereich für telegrammenu2, ein Test-Knopf und die Optionen „Mindestbestand erreicht“ und „tägliche Meldung zu abgelaufenen Produkten“ mit Uhrzeit |
| Haltbarkeit automatisch eintragen | Wann die Standard-Haltbarkeit als MHD eingetragen wird: **immer**, **nur ohne App** (Scanner-Modus und Datenpunkte, wo niemand ein Datum tippen kann) oder **nie** (dann auch keine Vorschläge) |
| Was automatisch eingetragen wird | **Alles mit Standard-Haltbarkeit** oder **nur Trockenware aus der eingebauten Liste** (eigene und Gruppenwerte werden dann nie automatisch eingetragen) |
| Fehlende Zutaten auf die Einkaufsliste | Nach jeder Zutaten-Prüfung kommen die fehlenden Zeilen auf die Einkaufsliste |
| Scanner-Modus | Zeit zwischen zwei Codes, das Scanner-Gerät am Host, Präfix und Suffix, Codeart auf den Lagerort-Etiketten. Details in der [Anleitung](docs/de/tutorial.md#scanner-modus-ohne-app) |
| Etiketten-Knöpfe | Welche Etiketten-Knöpfe die App zeigt (EAN, QR, Nur-QR, großes Regal-Etikett, Boxen-Etikett, „Geöffnet am“, Gefrierfach) |
| Inventur-Erinnerung | Optional eine Nachricht alle N Tage, wenn in dieser Zeit keine Inventur gemacht wurde (0 = aus), gesendet zur Zeit der täglichen Meldung |
| Vor Ablauf warnen | Tage vor dem Datum, ab denen Produkte markiert und in den Datenpunkten aufgeführt werden |

## Dokumentation

- [Anleitung (Deutsch)](docs/de/tutorial.md): die App im Überblick, Produkte bearbeiten, automatische Werte und das Funken-Symbol, Mindesthaltbarkeit, Einkaufsliste, Zutaten-Prüfung, Scanner-Modus, Inventur, Etiketten und Zertifikat
- [Tutorial (English)](docs/en/tutorial.md): dasselbe auf Englisch

## Datenpunkte

| Datenpunkt | Beschreibung |
| --- | --- |
| `info.connection` | `true`, solange der Webserver läuft |
| `stats.products`, `stats.locations` | Anzahlen |
| `stats.lowStockCount`, `stats.lowStockList` | Artikel am oder unter dem Mindestbestand |
| `stats.inventory` | Alles im Bestand als JSON (Name, Menge, Einheit, Minimum, Niedrig-Flag, Lagerorte) |
| `stats.inventoryHtml` | Dasselbe als einfache HTML-Tabelle, zum Beispiel für ein VIS-HTML-Widget |
| `stats.consumption` | Verbrauch der letzten 30 Tage pro Produkt (JSON, Verschieben zählt nicht) |
| `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml` | Abgelaufene und bald ablaufende Produkte (Anzahl, JSON, HTML-Tabelle) |
| `shopping.addItem` | Einen Artikelnamen schreiben (`ack=false`), um ihn auf die Einkaufsliste zu setzen |
| `check.request` | Zutaten hierher schreiben (`ack=false`), um sie mit dem Bestand zu vergleichen, siehe [Anleitung](docs/de/tutorial.md#zutaten-prüfung) |
| `check.result`, `check.available`, `check.missing`, `check.allAvailable` | Ergebnis der letzten Prüfung (JSON je Zutat, Listen mit einer Zeile je Zutat, true wenn alles da ist) |
| `check.addMissing` | Knopf: die fehlenden Zutaten der letzten Prüfung auf die Einkaufsliste setzen |
| `scanner.active` | Schalter für den Scanner-Modus (siehe [Anleitung](docs/de/tutorial.md#scanner-modus-ohne-app)) |
| `scanner.input` | Hier einen gescannten Code hineinschreiben (`ack=false`); ein am Host angeschlossener Scanner macht das später selbst |
| `scanner.lastCode`, `scanner.result` | Letzter Code und Ergebnis des letzten Scans im Scanner-Modus (zum Beispiel „Fusilli ×1 eingelagert in Regal 1“) |

Die Bestandsdaten liegen im Datenverzeichnis des Adapters (`shelfmate.json`), nicht in der Objektdatenbank.
Ein JSON-Backup kann ich in der App herunterladen und wieder einspielen (Einstellungen). Ein Import oder „Alle Daten löschen“ ersetzt alle Daten. Der alte Stand bleibt als `shelfmate.json.bak` erhalten.

## In Arbeit und Ausblick

ShelfMate entwickle ich weiter. Geplant ist (ohne Gewähr und ohne feste Reihenfolge):

- **Scanner-Anbindung**: serielle (USB-Kabel) und Bluetooth-Scanner direkt am Host

Ideen und Fehler gern als [GitHub-Issues](https://github.com/backfisch88/ioBroker.shelfmate/issues).

## Änderungsverlauf

Der Änderungsverlauf steht in der englischen [README.md](README.md#changelog).

## Lizenz

MIT-Lizenz, Copyright (c) 2026 Henrik Schoenhofen <henrik.schoenhofen@icloud.com>. Der volle Text steht in [LICENSE](LICENSE).
