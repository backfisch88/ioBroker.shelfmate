<p align="center">
  <img src="admin/shelfmate.png" alt="ShelfMate" width="160">
</p>

# ioBroker.shelfmate

**ShelfMate – deine Vorräte im Blick.**

ShelfMate ist ein Vorratsmanager für ioBroker. Damit weißt du jederzeit, welche Lebensmittel du zu Hause hast, wo sie liegen und was nachgekauft werden muss.

Produkte lassen sich per Barcode scannen, in Regalen oder Schränken verwalten und bei Bedarf automatisch auf die Einkaufsliste setzen. Auch Mindestbestände, Haltbarkeitsdaten und der Verbrauch werden berücksichtigt.

Die Bedienung erfolgt über eine Web-App, die du auf dem Smartphone öffnen und zum Homescreen hinzufügen kannst. Eine separate App ist nicht nötig.

**English:** [README.md](README.md)  
**Anleitungen:** [Deutsch](docs/de/tutorial.md) · [English](docs/en/tutorial.md)

---

## Funktionen

### Produkte und Lagerorte

- Produkte per Barcode oder manuell hinzufügen
- Produktdaten automatisch über Open Food Facts laden (Name, Marke, Packungsgröße, Nutri-Score und Kategorien)
- Produktdaten jederzeit bearbeiten und aktualisieren
- Eigene EAN-13-Barcodes für Produkte ohne Barcode erstellen
- Eigene Produktbilder hochladen (werden automatisch verkleinert)
- Lagerbereiche und Lagerorte anlegen, zum Beispiel Küche, Vorratsschrank oder Keller
- Lagerorte über QR-Codes auswählen
- Bestände einlagern, entnehmen und zwischen Lagerorten verschieben
- Alle Buchungen in einer Historie nachvollziehen
- Produkte schnell über die Suche finden, inklusive Vorschlägen während der Eingabe
- Produkte verschiedener Marken zu Gruppen zusammenfassen, zum Beispiel Mehl oder Zucker

### Mindestbestand und Einkaufsliste

- Mindestbestand für einzelne Produkte oder ganze Produktgruppen festlegen
- Produkte automatisch auf die Einkaufsliste setzen, sobald der Mindestbestand erreicht ist
- Einkaufslisten über Datenpunkte, Bring! oder Bring! Spezial verwalten
- Bei Bring! Spezial werden Mengen und Zusätze auf demselben Eintrag zusammengeführt, statt doppelte Einträge anzulegen
- Produkte beim Auffüllen automatisch von der Einkaufsliste entfernen
- Verbrauch der letzten 30 Tage auswerten
- Passenden Mindestbestand anhand des bisherigen Verbrauchs vorschlagen

### Haltbarkeit und MHD

- Mindesthaltbarkeitsdatum optional pro Produkt oder pro Einlagerung speichern
- Vor bald ablaufenden und abgelaufenen Produkten warnen
- Standard-Haltbarkeit für viele Lebensmittel automatisch vorschlagen
- Haltbarkeit nach dem Öffnen berücksichtigen
- Produkte als geöffnet oder verdorben markieren
- Automatisch eingetragene Werte am Funken-Symbol erkennen
- Eigene Haltbarkeitswerte für Produkte und Gruppen festlegen

### Zutaten prüfen

Du möchtest etwas kochen und wissen, ob alle Zutaten vorhanden sind?

ShelfMate kann eine Zutatenliste, zum Beispiel aus einer Rezept-App, mit deinem Vorrat vergleichen.

Fehlende Zutaten lassen sich direkt auf die Einkaufsliste setzen. Was bereits vorhanden ist, wird nicht erneut hinzugefügt.

### Scannen und Etiketten

- Barcodes mit der Smartphone-Kamera oder einem Scanner erfassen
- QR-Codes für Lagerorte erstellen und drucken
- EAN- und QR-Etiketten in eigenen Größen drucken, zum Beispiel 50 × 30 mm
- Etiketten für Regale, Boxen, Gefrierfach und geöffnete Produkte
- Einstellen, welche Etiketten in der App angeboten werden
- Scanner-Modus für das Ein- und Auslagern ohne geöffnete Web-App
- Inventur per Produktliste oder Scanner durchführen

### Übersicht und Benachrichtigungen

- Gesamten Bestand nach Lagerort anzeigen
- Warnungen bei Mindestbestand und ablaufenden Produkten
- Benachrichtigungen über Telegram, telegrammenu2, Pushover, Signal, WhatsApp, Matrix oder E-Mail
- Tägliche Übersicht über bald ablaufende und abgelaufene Produkte
- Inventur-Erinnerungen
- Vorschläge für Produktgruppen und Mindestbestände
- Datenpunkte für die Einbindung in VIS oder eigene Skripte
- JSON-Backups sowie Export als CSV oder PDF

### Web-App

- Läuft direkt im Browser auf Smartphone, Tablet und PC
- Kann auf dem iPhone- oder Android-Homescreen abgelegt werden
- Offline-Warteschlange für Buchungen bei Verbindungsproblemen
- Gerätenamen vergeben, damit Buchungen in der Historie zugeordnet werden können
- Letzte Buchung rückgängig machen
- HTTPS-Unterstützung mit eigenen oder automatisch erstellten Zertifikaten
- Optionaler Zugriffsschlüssel für die API
- Mehrsprachig: Deutsch, Englisch, Russisch, Portugiesisch, Niederländisch, Französisch, Italienisch, Spanisch, Polnisch, Ukrainisch und Chinesisch

---

## Voraussetzungen

- ioBroker js-controller >= 6.0.11
- Admin >= 7.6.20
- Node.js >= 22.12
- HTTPS mit einem Zertifikat, dem das Smartphone vertraut (für Kamera und Offline-Funktionen)

## Installation

ShelfMate wird wie jeder andere ioBroker-Adapter installiert.

1. Im ioBroker-Admin den Adapter **shelfmate** installieren.
2. Eine Instanz anlegen.
3. Die Web-App über `https://<Host>:8120/` öffnen.
4. Optional die Seite zum Homescreen hinzufügen.

Der Standardport ist `8120` und kann in den Einstellungen geändert werden.

## Erste Schritte

1. **Lagerorte anlegen:** Erstelle deine Lagerbereiche und Lagerorte, zum Beispiel Küche → Vorratsschrank → Fach 1.
2. **QR-Codes drucken:** Bringe die passenden QR-Codes an deinen Lagerorten an.
3. **Produkte hinzufügen:** Scanne einen Barcode oder lege ein Produkt manuell an. Viele Produktdaten werden automatisch von Open Food Facts geladen.
4. **Vorräte einlagern:** Wähle den Lagerort per QR-Code aus und buche die gewünschte Menge ein.
5. **Mindestbestand festlegen:** ShelfMate kann Produkte automatisch auf deine Einkaufsliste setzen, sobald der Vorrat knapp wird.

Eine ausführliche Beschreibung findest du in der [Anleitung](docs/de/tutorial.md).

---

## Einstellungen

Die wichtigsten Funktionen lassen sich direkt in der Adapterkonfiguration anpassen.

| Einstellung | Beschreibung |
| --- | --- |
| Port / Bind-Adresse | Port und Netzwerkschnittstelle des Webservers (Standard: 8120) |
| HTTPS | HTTPS aktivieren und Zertifikate auswählen |
| Zertifikat erstellen | Erstellt ein selbstsigniertes Zertifikat für Hostname und IP-Adressen, gültig für 825 Tage. Danach die Instanz neu starten |
| Zertifikate | Zertifikate aus ioBroker oder zum Beispiel vom acme-Adapter verwenden |
| Zugriffsschlüssel | Optionaler Schutz für den API-Zugriff, einmalige Eingabe pro Gerät |
| Einkaufsliste | Aus, Script, Bring! oder Bring! Spezial |
| MHD-Verwaltung | Aus, pro Produkt oder pro Einlagerung |
| Datumsformat | TT.MM.JJJJ, TT/MM/JJJJ oder JJJJ-MM-TT |
| Benachrichtigungen | Adapter, Empfänger und gewünschte Meldungen auswählen |
| Automatische Haltbarkeit | Standardwerte immer, nur im Scanner-Modus oder nie eintragen |
| Standardwerte verwenden | Alle hinterlegten Haltbarkeiten oder nur die eingebaute Trockenwarenliste |
| Ablaufwarnung | Festlegen, wie viele Tage vor Ablauf gewarnt wird |
| Zutaten-Prüfung | Fehlende Zutaten automatisch auf die Einkaufsliste setzen |
| Scanner-Modus | Scanner-Gerät, Zeitabstände, Präfix, Suffix und QR-Code-Art einstellen |
| Etiketten | Verfügbare Etikettentypen und Druckoptionen auswählen |
| Inventur-Erinnerung | Erinnerung nach einer festgelegten Anzahl von Tagen ohne Inventur |

### Mindesthaltbarkeit

Für die MHD-Verwaltung gibt es drei Möglichkeiten:

- **Aus:** Keine MHD-Verwaltung.
- **Pro Produkt:** Ein gemeinsames MHD für das Produkt.
- **Pro Einlagerung:** Jede Einlagerung kann ein eigenes MHD haben. Bei der Entnahme wird zuerst der älteste Bestand berücksichtigt.

ShelfMate kann außerdem Standard-Haltbarkeiten automatisch eintragen. Selbst eingetragene Werte haben Vorrang.

### Einkaufsliste

ShelfMate unterstützt vier Modi:

- **Aus:** Keine automatische Einkaufsliste.
- **Script:** Übergabe über ioBroker-Datenpunkte.
- **Bring!:** Produkte werden zur Bring!-Einkaufsliste hinzugefügt.
- **Bring! Spezial:** Vorhandene Einträge werden nicht übersprungen. Mengen werden hochgezählt, Zusätze ergänzt (zum Beispiel `Feta, Kräuter, 200g`).

Optional können Produkte beim Auffüllen wieder von der Liste entfernt werden.

Weitere Informationen findest du in der [Anleitung zu den Einkaufslisten](docs/de/tutorial.md#einkaufslisten-modi).

### Benachrichtigungen

Meldungen können über folgende Adapter gesendet werden:

- Telegram und telegrammenu2
- Pushover
- Signal
- WhatsApp
- Matrix
- E-Mail

Du kannst auswählen, ob ShelfMate bei niedrigem Bestand, bei ablaufenden Produkten oder bei einer fälligen Inventur benachrichtigen soll.

Für die tägliche Ablaufmeldung lässt sich eine feste Uhrzeit einstellen.

---

## Datenpunkte

ShelfMate stellt wichtige Informationen und Funktionen als ioBroker-Datenpunkte bereit.

### Bestand und Statistiken

| Datenpunkt | Beschreibung |
| --- | --- |
| `info.connection` | Webserver läuft |
| `stats.products` | Anzahl der Produkte |
| `stats.locations` | Anzahl der Lagerorte |
| `stats.inventory` | Gesamter Bestand als JSON |
| `stats.inventoryHtml` | Bestand als HTML-Tabelle für VIS |
| `stats.lowStockCount` | Anzahl der Produkte mit niedrigem Bestand |
| `stats.lowStockList` | Liste der Produkte mit niedrigem Bestand |
| `stats.consumption` | Verbrauch der letzten 30 Tage |
| `stats.expiringCount` | Anzahl bald ablaufender und abgelaufener Produkte |
| `stats.expiring` | Ablaufende Produkte als JSON |
| `stats.expiringHtml` | Ablaufende Produkte als HTML-Tabelle |

### Einkaufsliste und Zutaten

| Datenpunkt | Beschreibung |
| --- | --- |
| `shopping.addItem` | Produkt zur Einkaufsliste hinzufügen (`ack=false`) |
| `check.request` | Zutatenliste zur Prüfung übergeben (`ack=false`) |
| `check.result` | Ergebnis der letzten Zutaten-Prüfung als JSON |
| `check.available` | Vorhandene Zutaten |
| `check.missing` | Fehlende Zutaten |
| `check.allAvailable` | `true`, wenn alle Zutaten vorhanden sind |
| `check.addMissing` | Fehlende Zutaten auf die Einkaufsliste setzen |

### Scanner-Modus

| Datenpunkt | Beschreibung |
| --- | --- |
| `scanner.active` | Scanner-Modus ein- oder ausschalten |
| `scanner.input` | Barcode oder QR-Code übergeben (`ack=false`) |
| `scanner.lastCode` | Zuletzt gescannter Code |
| `scanner.result` | Ergebnis des letzten Scans |

Beispiel für `scanner.result`:

`Fusilli ×1 eingelagert in Regal 1`

Weitere Informationen: [Scanner-Modus ohne App](docs/de/tutorial.md#scanner-modus-ohne-app)

---

## Datensicherung

Alle Bestandsdaten werden in der Datei `shelfmate.json` im Datenverzeichnis des Adapters gespeichert.

Über die Web-App kannst du:

- Ein JSON-Backup herunterladen
- Ein vorhandenes Backup wiederherstellen
- Bestände als CSV oder PDF exportieren
- Alle Daten löschen

Beim Import eines Backups oder beim Löschen der Daten wird der vorherige Stand als `shelfmate.json.bak` gesichert.

---

## Dokumentation

Eine ausführliche Anleitung mit Beispielen und Erklärungen gibt es hier:

- [Anleitung auf Deutsch](docs/de/tutorial.md)
- [Tutorial in English](docs/en/tutorial.md)

Darin werden unter anderem die Bedienung der Web-App, Lagerorte, Produktgruppen, Mindestbestand, MHD, Scanner-Modus, Etiketten, Einkaufsliste und Inventur erklärt.

---

## Geplant

ShelfMate wird laufend weiterentwickelt.

Als Nächstes ist die direkte Anbindung serieller Scanner (USB) und Bluetooth-Scanner am ioBroker-Host geplant.

Ideen, Wünsche oder Fehler können gerne als [GitHub-Issue](https://github.com/backfisch88/ioBroker.shelfmate/issues) gemeldet werden.

## Änderungsverlauf

Den vollständigen Änderungsverlauf findest du in der [englischen README](README.md#changelog).

## Lizenz

MIT-Lizenz

Copyright (c) 2026 Henrik Schoenhofen  
[LICENSE](LICENSE)
