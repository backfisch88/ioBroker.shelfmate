# ShelfMate – Anleitung

Mit ShelfMate verwaltest du deine Vorräte direkt in ioBroker. Diese Anleitung zeigt dir, wie du Produkte anlegst, Bestände verwaltest, Barcodes scannst und die verschiedenen Funktionen nutzt.

Alle Einstellungen, Voraussetzungen und Datenpunkte findest du in der [README](../../README.de.md).

English version: [Tutorial](../en/tutorial.md)

---

## Inhalt

1. [Die App im Überblick](#die-app-im-überblick)
2. [Produkte bearbeiten](#produkte-bearbeiten)
3. [Automatische Haltbarkeit und Funken-Symbol](#automatische-haltbarkeit-und-funken-symbol)
4. [Produktdaten aktualisieren](#produktdaten-aktualisieren)
5. [Einlagern, entnehmen und verschieben](#einlagern-entnehmen-und-verschieben)
6. [Lagerorte anlegen](#lagerorte-anlegen)
7. [Produkte ohne Barcode](#produkte-ohne-barcode)
8. [Mindestbestand und Einkaufsliste](#mindestbestand-und-einkaufsliste)
9. [Mindesthaltbarkeit](#mindesthaltbarkeit)
10. [Einkaufslisten-Modi](#einkaufslisten-modi)
11. [Zutaten prüfen](#zutaten-prüfen)
12. [Ein ganzes Regal einräumen](#ein-ganzes-regal-einräumen)
13. [Inventur durchführen](#inventur-durchführen)
14. [Scanner-Modus ohne App](#scanner-modus-ohne-app)
15. [Vorschläge](#vorschläge)
16. [Benachrichtigungen](#benachrichtigungen)
17. [Export und Backup](#export-und-backup)
18. [Offline-Modus](#offline-modus)
19. [HTTPS und Zertifikate](#https-und-zertifikate)
20. [Etiketten drucken](#etiketten-drucken)

---

## Die App im Überblick

### Übersicht

Auf der Startseite siehst du deine Produkte und deren Bestand.

Über die Suche findest du Produkte anhand von Namen, Marken oder Tags. Bereits während der Eingabe erscheinen passende Vorschläge. Mit × kannst du die Suche zurücksetzen.

Zusätzlich stehen verschiedene Filter zur Verfügung:

- Bereich: Zeigt nur Produkte aus einem bestimmten Lagerbereich.
- Lagerort: Filtert nach einem einzelnen Regal, Schrank oder Fach.
- Kategorie: Zeigt Produkte einer bestimmten Kategorie.
- Status: Filtert nach geöffneten, bald ablaufenden, abgelaufenen, nachzukaufenden oder leeren Produkten.
- Tags: Häufig verwendete Suchbegriffe lassen sich direkt auswählen.

Ein erneuter Tipp auf einen aktiven Status oder Tag hebt den jeweiligen Filter wieder auf.

Produktgruppen werden zusammengefasst dargestellt. Über das kleine Dreieck kannst du die enthaltenen Produkte aufklappen.

Beim Zurückkehren von einer Produktseite landest du wieder an deiner vorherigen Position in der Übersicht.

### Produktseite

Auf der Produktseite findest du den Gesamtbestand, die Lagerorte und – sofern aktiviert – die Haltbarkeitsdaten.

Abgelaufene und bald ablaufende Produkte werden farblich hervorgehoben.

Sind Standardwerte vorhanden, zeigt ShelfMate beispielsweise:

Standard-Haltbarkeit 365 Tage · nach dem Öffnen 90 Tage

Darunter stehen die verfügbaren Aktionen in fester Reihenfolge:

1. Einlagern / Entnehmen
2. Verschieben / Öffnen / Öffnen rückgängig, sofern verfügbar
3. Zur Einkaufsliste – bei bereits eingetragenen Produkten mit Haken
4. Etiketten drucken – welche Knöpfe erscheinen, stellst du in den Instanz-Einstellungen im ioBroker-Admin unter „Etiketten“ ein
5. Bearbeiten / Löschen

---

## Produkte bearbeiten

Über Bearbeiten öffnest du die Produkteinstellungen.

Wenn du ein Produkt von Hand anlegst, schlägt ShelfMate beim Tippen des Namens passende Produkte aus einer fertigen Liste vor. Wenn du zum Beispiel `Sch` eingibst, erscheint unter anderem Schokolade. Ein Tipp auf den Vorschlag übernimmt den Namen und setzt die Kategorie, falls du noch keine gewählt hast. Bei Produkten aus Open Food Facts gibt es keine Vorschläge, dort kommt der Name von dort.

Das Formular ist in fünf aufklappbare Bereiche unterteilt. Geschlossene Bereiche zeigen eine kurze Zusammenfassung, beispielsweise `Packung · 400g · min 1`.

| Bereich | Einstellungen |
| --- | --- |
| Grunddaten | Produktname, Marke, Bild und Kategorie |
| Bestand | Stück, Gewicht oder Volumen, Einheit, Packungsinhalt und Mindestbestand |
| Gruppe & Tags | Produktgruppe und zusätzliche Suchbegriffe |
| Haltbarkeit | MHD, Standard-Haltbarkeit und Haltbarkeit nach dem Öffnen |
| Mehr | Barcode, eigene EAN, Nutri-Score, Bild-Link und Open Food Facts |

Die Grunddaten sind standardmäßig geöffnet, bei neuen Produkten zusätzlich der Bereich „Bestand“.

### Produktgruppen

Mehrere Produkte lassen sich zu einer Gruppe zusammenfassen.

Beispiel: Weizenmehl von REWE, Edeka und Kaufland gehört zur gemeinsamen Gruppe Mehl.

ShelfMate zählt den Bestand dieser Produkte zusammen und berücksichtigt ihn beim Mindestbestand.

Hat ein Produkt keine eigene Standard-Haltbarkeit, kann der Wert der Gruppe verwendet werden.

### Nutri-Score

Der Nutri-Score lässt sich im Bereich Mehr über die farbigen Knöpfe A bis E auswählen.

Ein erneuter Tipp auf den ausgewählten Wert entfernt ihn wieder.

---

## Automatische Haltbarkeit und Funken-Symbol

ShelfMate kann Haltbarkeitswerte automatisch vorschlagen oder eintragen.

Dazu gehören:

- Standard-Haltbarkeit eines Produkts
- Haltbarkeit nach dem Öffnen
- Automatisch berechnete Haltbarkeitsdaten beim Einlagern

### Was bedeutet das Funken-Symbol?

Das kleine ✨ Funken-Symbol auf der Produktseite kennzeichnet automatisch übernommene Werte.

Es erscheint beispielsweise, wenn die Haltbarkeit aus der eingebauten Lebensmittelliste oder einer Produktgruppe stammt oder ein MHD automatisch berechnet wurde.

Selbst eingetragene Werte haben immer Vorrang.

Änderst du ein automatisch vorgeschlagenes Datum selbst, gilt es anschließend als manueller Wert. Das Symbol verschwindet, sobald keine automatischen Werte mehr vorhanden sind.

Das Symbol wird nur auf der Produktseite angezeigt, nicht in der Übersicht.

Ältere automatisch berechnete Daten kann ShelfMate beim erneuten Ausführen von Haltbarkeit automatisch eintragen wieder erkennen, wenn sie genau dem Einlagerungsdatum plus Standard-Haltbarkeit entsprechen.

### Wann wird die Haltbarkeit eingetragen?

Das legst du in den Adapter-Einstellungen fest.

| Einstellung | Verhalten |
| --- | --- |
| Immer | Die App schlägt beim Einlagern ein Datum vor. Scanner-Modus und Datenpunkte tragen es automatisch ein |
| Nur ohne App | Automatische Eintragung nur über Scanner-Modus und Datenpunkte |
| Nie | Keine automatische Eintragung und keine automatischen Vorschläge |

Bei Nie bleibt die Funktion Haltbarkeit automatisch eintragen weiterhin manuell nutzbar.

### Welche Werte werden verwendet?

Zusätzlich gibt es zwei Möglichkeiten:

**Alles mit Standard-Haltbarkeit**

Berücksichtigt eigene Werte am Produkt, Werte der Produktgruppe und die eingebaute Liste.

**Nur Trockenware aus der eingebauten Liste**

Verwendet ausschließlich die hinterlegten Standardwerte für typische Vorratsprodukte. Eigene Produkt- und Gruppenwerte werden dabei nicht automatisch eingetragen.

Die eingebaute Liste enthält beispielsweise Nudeln, Reis, Mehl, Konserven und Süßwaren.

Frische und gekühlte Produkte wie Milch, Fleisch, Wurst, Käse, Eier oder Joghurt erhalten bewusst keinen automatisch berechneten Standardwert.

Wichtig: Automatische Haltbarkeiten sind Richtwerte und kein tatsächliches Hersteller-MHD. Ein aufgedrucktes oder manuell eingetragenes Datum hat Vorrang. Auch durch das Öffnen einer Packung wird ein früheres Datum niemals verlängert.

### Haltbarkeitswerte verwalten

Unter Einstellungen → Haltbarkeit → Haltbarkeiten verwalten findest du alle Produkte mit eigenen Haltbarkeitswerten.

Dort kannst du Werte bearbeiten, einzeln über × entfernen oder über Alle eigenen Werte entfernen gesammelt löschen.

Änderungen werden direkt übernommen.

---

## Produktdaten aktualisieren

Produkte mit einem bekannten Barcode können ihre Informationen von Open Food Facts beziehen.

Im Produkteditor findest du unter Mehr die Funktion Von Open Food Facts neu laden.

Dabei werden folgende Angaben aktualisiert:

- Name und Marke
- Packungsinhalt
- Produktbild
- Kategorie
- Nutri-Score
- Zusätzliche Tags

Bereits selbst angelegte Tags bleiben erhalten.

Die Änderungen werden erst mit Produkt speichern übernommen. Du kannst das Ergebnis also vorher prüfen und das Formular bei Bedarf ohne Speichern schließen.

Bei Produkten aus Open Food Facts ist der Barcode im Editor gesperrt.

---

## Einlagern, entnehmen und verschieben

So funktioniert eine normale Buchung:

1. Scannen auswählen und den Barcode mit der Kamera erfassen oder manuell eingeben.
2. Bei bekannten Produkten öffnet sich die Produktseite.
3. Unbekannte Barcodes werden über Open Food Facts gesucht. Die gefundenen Angaben können geprüft und gespeichert werden.
4. Einlagern, Entnehmen oder Verschieben auswählen.
5. Menge und Lagerort festlegen und die Buchung speichern.

Den Lagerort kannst du entweder aus der Liste auswählen oder direkt über seinen QR-Code scannen.

Alle Buchungen werden in der Historie gespeichert.

---

## Lagerorte anlegen

ShelfMate unterscheidet zwischen Lagerbereichen und Lagerorten.

Beispiel:

- Bereich: Speisekammer
- Lagerort: Regal 1

Unter Lagerorte kannst du beides anlegen und bearbeiten.

### QR-Codes für Lagerorte

Jeder Lagerort bekommt einen eigenen Code.

Öffne den Lagerort und wähle das gewünschte Etikett:

- Nur QR-Code
- Großes Regal-Etikett
- Boxen-Etikett mit Inhalt

Alternativ kannst du Lagerort-Etiketten auch mit einem Code-128-Strichcode erstellen. Das ist besonders praktisch für Scanner ohne QR-Code-Unterstützung.

Die Codeart lässt sich unter Einstellungen → Etiketten auswählen.

### Etikettengröße

Die Größe der Etiketten legst du einmalig fest, beispielsweise auf 50 × 30 mm.

Für große Regal-Etiketten, Boxen-Etiketten und vollflächige Codes sind auch eigene Formate wie A6, A5 oder A4 möglich.

Welche Etiketten-Knöpfe in der App angezeigt werden, wählst du in den Instanz-Einstellungen im ioBroker-Admin unter „Etiketten-Knöpfe in der App“. Die Etikettengröße stellst du direkt in den App-Einstellungen ein.

Nach dem Erstellen kannst du das Etikett als Bild speichern oder direkt drucken.

---

## Produkte ohne Barcode

Auch Produkte ohne Herstellerbarcode lassen sich verwalten.

1. Produkt manuell anlegen.
2. Im Editor EAN erzeugen auswählen.
3. Den eigenen EAN-13-Code als Etikett drucken.
4. Etikett auf das Produkt oder den Behälter kleben.

Anschließend lässt sich das Produkt wie jedes andere scannen.

Zusätzlich kannst du ein eigenes Produktbild hochladen. ShelfMate verkleinert es automatisch.

---

## Mindestbestand und Einkaufsliste

Für jedes Produkt kannst du einen Mindestbestand festlegen.

Beispiel: Du möchtest immer mindestens zwei Packungen Nudeln im Vorrat haben.

Sobald der Bestand auf zwei Packungen oder weniger fällt, kann ShelfMate die Nudeln automatisch auf deine Einkaufsliste setzen.

Bei Produktgruppen werden die Bestände der zugehörigen Produkte gemeinsam berücksichtigt.

In der Übersicht zeigt ein Haken an, welche Produkte bereits auf der Einkaufsliste stehen. Durch Antippen kann der Eintrag wieder entfernt werden, sofern die entsprechenden Einstellungen aktiv sind.

Die Verbindung zur Einkaufsliste wird in den Adapter-Einstellungen eingerichtet.

---

## Mindesthaltbarkeit

ShelfMate unterstützt drei Modi.

| Modus | Beschreibung |
| --- | --- |
| Aus | Keine MHD-Verwaltung |
| Pro Produkt | Ein gemeinsames MHD für das Produkt |
| Pro Einlagerung | Jede Einlagerung kann ein eigenes MHD haben |

### MHD pro Einlagerung

Beim Einlagern kann jeder Packung ein eigenes Datum zugewiesen werden.

Mehrere Haltbarkeitsdaten werden pro Produkt und Lagerort getrennt gespeichert.

Beim Entnehmen oder Verschieben wird zuerst der Bestand mit dem ältesten MHD berücksichtigt.

Fehlt ein Datum, kann ShelfMate anhand der Standard-Haltbarkeit automatisch eines berechnen. Dafür wird das Einlagerungsdatum aus der Historie verwendet.

### Packung öffnen

Mit Öffnen kannst du eine einzelne Packung als geöffnet markieren.

ShelfMate führt diese Packung anschließend separat und berücksichtigt sie bei der Entnahme zuerst.

Ist eine Haltbarkeit nach dem Öffnen hinterlegt, wird daraus ein neues Datum berechnet. Ein früheres vorhandenes MHD bleibt bestehen.

Mit Öffnen rückgängig kannst du den Vorgang zurücksetzen.

### Verdorbene Produkte

Beim Entnehmen kannst du zwischen Verbraucht und Verdorben unterscheiden.

Verdorbene Produkte zählen nicht zum normalen Verbrauch. In der Historie werden sie für 30 Tage zusammengefasst.

### Buchungen rückgängig machen

Über die Historie kannst du die letzte Buchung rückgängig machen.

Im Scanner-Modus steht dafür der Steuer-Code `SM:UNDO` zur Verfügung.

Dort gilt die Funktion nicht für Verschiebungen und Inventuren.

### MHD nachträglich ändern

Im Modus Pro Einlagerung zeigt MHD bearbeiten alle Packungen einzeln an – auch geöffnete.

Du kannst ein Datum manuell eingeben oder die Schnellwahl verwenden:

- +1 Tag
- +3 Tage
- +5 Tage
- +10 Tage
- Kein Datum

Mit Speichern werden alle Änderungen übernommen. Die Anpassungen erscheinen in der Historie und lassen sich rückgängig machen.

Im Scanner-Modus kannst du mit `SM:DATE:<Tage>` und anschließendem Produktscan ein neues MHD für den gesamten ungeöffneten Bestand setzen.

`SM:DATE:0` entfernt das Datum.

### Datum schnell eingeben

ShelfMate versteht neben normalen Datumsangaben auch Kurzformen.

| Eingabe | Bedeutung |
| --- | --- |
| +3d | In 3 Tagen |
| +2w | In 2 Wochen |
| +1m | In einem Monat |
| +1y | In einem Jahr |
| 12/26 | Ende Dezember 2026 |
| 2412 | Nächster 24. Dezember |
| 24.12. | Nächster 24. Dezember |
| 24.12.26 | 24. Dezember 2026 |
| x | Kein Datum |

Unter dem Eingabefeld erscheint eine Vorschau des erkannten Datums.

Zusätzlich gibt es Schnellwahl-Knöpfe für +1 bis +14 Tage, +3 Wochen, +1 Monat, +3 Monate, +6 Monate und +1 Jahr.

### Ablaufwarnungen

Bald ablaufende und abgelaufene Produkte werden in der App gekennzeichnet, beispielsweise mit:

- „Läuft in 3 Tagen ab“
- „Abgelaufen“

Die Informationen stehen außerdem in den Datenpunkten `stats.expiring*` bereit.

Unter Datumsformat kannst du zwischen 31.10.2026, 31/10/2026 und 2026-10-31 wählen.

---

## Einkaufslisten-Modi

ShelfMate unterstützt vier Möglichkeiten, Produkte auf eine Einkaufsliste zu setzen.

### Aus

Es werden keine Produkte automatisch an eine Einkaufsliste übertragen.

### Script

ShelfMate schreibt den Artikelnamen mit `ack=false` in einen frei wählbaren Datenpunkt.

Optional kannst du zusätzlich einen Datenpunkt mit der aktuellen Einkaufsliste angeben. Erwartet wird ein JSON-Array mit Objekten, die jeweils einen `name` enthalten. So muss der Inhalt aussehen:

```json
[
  { "name": "Mehl" },
  { "name": "Milch" },
  { "name": "Feta" }
]
```

Damit erkennt ShelfMate bereits vorhandene Produkte und vermeidet doppelte Einträge.

Für das Entfernen von Artikeln lässt sich ein weiterer Datenpunkt festlegen. Auch dort wird der Artikelname mit `ack=false` geschrieben.

Erst mit diesem Datenpunkt funktionieren das Entfernen über den Haken in der App und die automatische Entfernung nach dem Auffüllen.

### Bring!

ShelfMate kann direkt mit dem Bring!-Adapter zusammenarbeiten.

Die verfügbaren Listen werden automatisch erkannt. Alternativ kannst du den Kanal manuell eintragen, beispielsweise:

```
bring.0.<list-id>
```

ShelfMate liest den Listeninhalt über `<Liste>.content` und fügt neue Produkte über `<Liste>.saveItem` hinzu.

Produkte, die bereits auf der Liste stehen, werden nicht erneut eingetragen.

Bei einem Eintrag mit Komma wird nur der Artikelname vor dem ersten Komma übernommen.

### Bring! Spezial

Dieser Modus berücksichtigt zusätzlich Mengen und Zusätze.

Beispiele:

- `Mehl` → `Mehl, 2` → `Mehl, 3`
- `Feta, 200g` und danach `Feta, Kräuter` ergeben **einen** Eintrag: `Feta, Kräuter, 200g`. Du siehst also: ein Feta mit 200 g und ein Feta als Kräutervariante
- Kommt noch ein `Feta, Kräuter` dazu, steht dort `Feta, Kräuter 2, 200g`

Bereits vorhandene Artikel werden also nicht einfach übersprungen. Stattdessen erhöht ShelfMate die Menge oder ergänzt den Zusatz.

Die Einträge werden nacheinander verarbeitet. Der nächste Artikel wird erst übertragen, wenn der Bring!-Adapter seine Liste aktualisiert hat.

Das ist besonders bei der Zutaten-Prüfung hilfreich.

### Datenpunkt shopping.addItem

Über `shopping.addItem` kannst du unabhängig von der App Produkte auf die Einkaufsliste setzen.

Dabei wird immer der aktuell eingestellte Einkaufslisten-Modus verwendet.

### Produkte automatisch entfernen

Bei Bring!, Bring! Spezial und Script mit eingerichtetem Entfernen-Datenpunkt stehen zwei unabhängige Optionen zur Verfügung:

**Von der Liste nehmen, wenn wieder aufgefüllt**

Sobald der Bestand wieder über den Mindestbestand steigt, wird das Produkt von der Einkaufsliste entfernt.

Standardmäßig ausgeschaltet.

**Von der Liste nehmen, wenn der Haken entfernt wird**

Ein Tipp auf den Haken in der App entfernt das Produkt auch von der verbundenen Einkaufsliste.

Ist die Funktion deaktiviert, verschwindet nur die Markierung in ShelfMate.

Standardmäßig eingeschaltet.

Entfernt werden nur Artikel, die tatsächlich auf der Liste stehen. Bei Bring! erfolgt die Entfernung über `<Liste>.removeItem`.

---

## Zutaten prüfen

ShelfMate kann eine Zutatenliste mit deinem aktuellen Vorrat vergleichen.

Die Rezepte selbst werden nicht in ShelfMate gespeichert. Stattdessen übergibst du eine Zutatenliste, beispielsweise aus einer Rezept-App.

### Zutaten übergeben

Schreibe die Zutaten in den Datenpunkt `check.request` mit `ack=false`.

Möglich sind:

- Eine Zutat pro Zeile
- Zutaten mit Semikolon getrennt
- Ein JSON-Array aus Texten
- Ein JSON-Array aus Objekten mit name, amount und unit

Beispiele:

```
Zwiebeln, rot, 1
Cherrytomaten, bunt, 500g
Salz, 0.5 tl
Basilikum
```

Auch diese Schreibweisen werden erkannt:

```
380g Linguine
2EL Olivenöl
Mehl 200g
```

Unterstützte Mengeneinheiten sind kg, g, l, ml, cl und Stück.

Angaben wie EL oder TL werden nur auf Vorhandensein geprüft.

Gleiche Zutaten werden zusammengerechnet.

### So funktioniert der Abgleich

ShelfMate sucht über Produktnamen, Gruppen und Tags.

Dabei werden ganze Wörter verglichen.

Beispiel: Cherrytomaten wird nicht automatisch als Tomaten erkannt. Ein entsprechender Tag am Produkt reicht jedoch aus.

Bei Produkten mit Gewicht oder Volumen wird der tatsächliche Bestand berücksichtigt.

Beispiel: 500 g Mehl vorhanden, 200 g benötigt – die Zutat ist verfügbar.

Packungsgrößen wie 1 kg werden entsprechend umgerechnet.

Bei Zutaten ohne Mengenangabe reicht ein positiver Bestand.

Unbekannte Zutaten gelten als fehlend. Dadurch können auch andere Einkaufsartikel übernommen werden.

### Ergebnis

Nach jeder Prüfung stehen folgende Datenpunkte bereit:

| Datenpunkt | Inhalt |
| --- | --- |
| `check.result` | Ergebnis für jede einzelne Zutat als JSON |
| `check.available` | Vorhandene Zutaten |
| `check.missing` | Fehlende Zutaten |
| `check.allAvailable` | true, wenn alles vorhanden ist |

Die Listen enthalten die ursprünglichen Zutatenzeilen, jeweils eine pro Zeile.

Mit `check.addMissing` kannst du die fehlenden Zutaten auf die Einkaufsliste setzen.

Alternativ aktivierst du in den Adapter-Einstellungen Fehlende Zutaten auf die Einkaufsliste setzen. Dann erfolgt die Übertragung automatisch nach jeder Prüfung.

Bring! Spezial berücksichtigt dabei auch Mengen und Zusätze, während die anderen Modi nur den Artikelnamen übertragen.

### Mindestbestand berücksichtigen

ShelfMate kann beim Zutatenabgleich auch den gewünschten Mindestbestand einrechnen.

Beispiel:

- Vorrat: 2 kg Zucker
- Mindestbestand: 1 kg
- Benötigt: 3 kg Zucker

Auf der Einkaufsliste landen 2 kg Zucker, damit nach dem Kochen der Mindestbestand erhalten bleibt.

Nach jeder Prüfung wird `check.request` automatisch geleert.

---

## Ein ganzes Regal einräumen

Über Lagerorte → Einräumen kannst du mehrere Produkte nacheinander erfassen und gemeinsam einlagern.

1. Lagerort per QR-Code scannen oder aus der Liste auswählen.
2. Produkte nacheinander scannen, mit Kamera, externem Scanner oder durch Eingabe der EAN.
3. Jeder Scan erhöht die Menge um 1.
4. Mengen bei Bedarf in der Liste korrigieren.
5. Zum Abschließen denselben Lagerort-Code erneut scannen oder Einlagern auswählen.

Alle erfassten Produkte werden gemeinsam eingebucht.

Bei Produkten nach Gewicht oder Volumen zählt jeder Scan als ganze Packung. Dafür muss die Packungsgröße in g oder ml hinterlegt sein.

### Unbekannte Produkte

Ist ein Barcode noch nicht bekannt, fragt ShelfMate die Produktdaten bei Open Food Facts ab und legt das Produkt an.

Wird dort nichts gefunden, erstellt ShelfMate vorläufig einen Eintrag wie:

```
Unbekanntes Produkt 1234567890123
```

Das Produkt wird trotzdem mitgezählt.

Über die Glühbirne erscheint anschließend der Hinweis Neue Produkte bearbeiten, bis der Eintrag ergänzt und gespeichert wurde.

---

## Inventur durchführen

Mit der Inventur kannst du überprüfen, ob der gespeicherte Bestand mit dem tatsächlichen Vorrat übereinstimmt.

Es gibt zwei Varianten: Scannen und Liste.

### Inventur per Scan

1. Unter Lagerorte → Inventur die Variante Scannen auswählen.
2. QR-Code des Lagerorts scannen.
3. Alle vorhandenen Produkte nacheinander scannen.
4. Jeder Scan zählt ein Stück. Derselbe Barcode kann mehrfach gescannt werden.
5. Zum Abschluss denselben Lagerort-QR erneut scannen.

ShelfMate gleicht die gezählten Mengen mit dem gespeicherten Bestand ab und zeigt eine Zusammenfassung.

Abweichungen werden mit Soll- und Istmenge angezeigt.

Nicht gescannte Produkte werden mit Bestand 0 gezählt.

Anschließend kannst du mit dem nächsten Lagerort weitermachen. Ein neuer Lagerort wird erst angenommen, wenn der vorherige abgeschlossen ist.

In der Übersicht siehst du, welche Lagerorte bereits geprüft wurden und welche noch offen sind.

### Inventur über die Liste

Alternativ kannst du die vorhandenen Produkte direkt in einer Liste prüfen.

- Tatsächliche Menge eingeben
- Mit ✓ bestätigen, wenn der Bestand stimmt

Bestandskorrekturen werden in der Historie als Inventur gespeichert.

Eine regelmäßige Inventur-Erinnerung lässt sich in den Adapter-Einstellungen aktivieren.

---

## Scanner-Modus ohne App

ShelfMate unterstützt das Ein- und Auslagern über einen externen Barcode-Scanner, ohne dass die Web-App geöffnet sein muss.

Der Scanner-Modus wird über `scanner.active` aktiviert.

Scans können über `scanner.input` mit `ack=false` übergeben oder von einem direkt am ioBroker-Host angeschlossenen Scanner empfangen werden.

### Scanabläufe

| Scanfolge | Aktion |
| --- | --- |
| Produkt → Lagerort | 1 Stück einlagern |
| Produkt → Produkt | 1 Stück entnehmen |
| Produkt → Produkt → Lagerort | 1 Stück aus einem bestimmten Lagerort entnehmen |
| Lagerort | Einräum-Modus starten |
| Lagerort erneut | Einräum-Modus beenden |
| Anderer Lagerort | Im Einräum-Modus den Lagerort wechseln |

Wird beim Entnehmen kein Lagerort angegeben, wählt ShelfMate den Bestand mit dem kürzesten MHD.

Ist kein MHD vorhanden, wird der Lagerort mit der größten Menge verwendet.

### Einräum-Modus

Scanne zuerst den Lagerort-Code.

Anschließend kannst du beliebig viele Produkte scannen. Jeder Produktscan bucht sofort ein Stück in den ausgewählten Lagerort ein.

Zum Beenden denselben Lagerort-Code erneut scannen.

Ein anderer Lagerort-Code wechselt direkt den Lagerort.

Nach fünf Minuten ohne Scan endet der Modus automatisch.

### Steuer-Codes

Für weitere Aktionen gibt es spezielle Codes:

| Code | Funktion |
| --- | --- |
| `SM:UNDO` | Letzte unterstützte Buchung rückgängig machen |
| `SM:SPOIL` | Nächstes Produkt als verdorben entnehmen |
| `SM:OPEN` | Nächstes Produkt als geöffnet markieren |
| `SM:DATE:<Tage>` | MHD für den ungeöffneten Bestand setzen |
| `SM:DATE:0` | MHD entfernen |
| `SM:QTY:5` | Nächste Buchung mit Menge 5 durchführen |
| `SM:CANCEL` | Wartenden Scan abbrechen |

Die Steuer-Codes lassen sich über die Einstellungen als PDF drucken.

### Zeit zwischen zwei Scans

Unter den Adapter-Einstellungen kannst du festlegen, wie lange ShelfMate auf den nächsten Code wartet.

Möglich sind 3 bis 120 Sekunden.

Standard: 10 Sekunden.

### Externen Funk-Scanner anschließen

Vorgesehen ist beispielsweise der Tera HW0009 mit 2,4-GHz-Dongle.

1. Den USB-Dongle am ioBroker-Rechner anschließen.
2. Den Scanner auf 2,4-GHz-Modus einstellen.
3. Scanner anhand der Herstelleranleitung mit dem Dongle koppeln.
4. Tastaturlayout auf US und Code-Ende auf Enter einstellen.
5. Unter den ShelfMate-Adapter-Einstellungen das Scanner-Gerät auswählen.
6. Den Scanner-Modus über `scanner.active` aktivieren.

Der Scanner wird als USB-Tastatur erkannt. Ein zusätzlicher Treiber ist normalerweise nicht nötig.

Damit ioBroker auf das Eingabegerät zugreifen kann, muss der Benutzer die passenden Rechte haben:

```
sudo adduser iobroker input
```

Anschließend die Instanz neu starten.

Falls der Scanner mit einem Präfix oder Suffix arbeitet, müssen die entsprechenden Einstellungen in ShelfMate übereinstimmen.

Jeder erkannte Code wird in `scanner.lastCode` gespeichert. Das Ergebnis steht in `scanner.result`.

### Scanner per Bluetooth anschließen

Wenn der Scanner weit weg vom ioBroker-Rechner stehen soll (zum Beispiel in der Küche), koppelst du ihn direkt per Bluetooth. Die Ladestation dient dann nur zum Laden.

1. Am Scanner die Codes „Bluetooth HID" und danach „Koppelung" scannen (Handbuch des Tera HW0009, Seite 4).
2. Auf dem ioBroker-Rechner `bluetoothctl` starten und nacheinander `scan on`, `pair <Adresse>`, `trust <Adresse>` und `connect <Adresse>` eingeben. Der Scanner heißt „BarCode Scanner HID".
3. In den ShelfMate-Einstellungen das Gerät mit dem Zusatz „(Bluetooth)" auswählen.

ShelfMate sucht das Gerät über den Namen. Es findet den Scanner deshalb auch wieder, wenn er nach dem Energiesparmodus neu verbindet. Ein Druck auf den Auslöser weckt ihn.

### Kurze Lagerort-Codes

Da einige Scanner mit US-Tastaturlayout arbeiten, können Sonderzeichen oder Umlaute Probleme verursachen.

Dafür bietet ShelfMate kurze Lagerort-Codes an.

Im Lagerort-Editor Kurzen Scanner-Code verwenden auswählen, speichern und das Etikett neu drucken.

Bereits vorhandene Etiketten bleiben gültig.

Der kurze Code hat das Format:

```
SM:L:<8 Zeichen>
```

### Scanner ohne QR-Code-Unterstützung

Auch einfache Scanner, die nur Strichcodes lesen, können verwendet werden.

Dazu unter Einstellungen → Etiketten die Option Strichcode auswählen.

ShelfMate erzeugt dann Code-128-Strichcodes statt QR-Codes für Lagerorte und Steuer-Codes.

Das gilt auch für Boxen- und Regal-Etiketten.

Der Lagerort muss vorher gespeichert sein, damit seine kurze ID verwendet werden kann.

Die Codes passen beispielsweise auf Etiketten mit 50 × 30 mm.

Hinweis: Der Scanner selbst benötigt kein Display. Das Ergebnis jedes Scans wird in `scanner.result` ausgegeben.

Eine Inventur findet weiterhin über die Web-App statt, da dafür eine Anzeige benötigt wird.

---

## Vorschläge

Über die Glühbirne in der Kopfzeile findest du verschiedene Hinweise von ShelfMate.

Dazu gehören:

### Produktgruppen

ShelfMate erkennt ähnlich benannte Produkte und schlägt vor, sie zu einer Gruppe zusammenzufassen.

Einzelne Produkte können aus einem Vorschlag entfernt werden. Ganze Vorschläge lassen sich auch ignorieren.

### Mindestbestand

Anhand des Verbrauchs der letzten 30 Tage kann ShelfMate einen passenden Mindestbestand vorschlagen.

Die Funktion berücksichtigt regelmäßig verbrauchte Produkte.

Mit ✓ übernimmst du den Vorschlag, mit × verwirfst du ihn.

### Inventur

Ist eine Inventur fällig, erscheint ebenfalls ein Hinweis.

Wichtig: ShelfMate übernimmt keine Vorschläge automatisch. Erst nach deiner Bestätigung werden Änderungen vorgenommen.

---

## Benachrichtigungen

ShelfMate kann bei wichtigen Ereignissen automatisch Nachrichten verschicken.

Unter den Adapter-Einstellungen wählst du einen unterstützten Benachrichtigungs-Adapter und den gewünschten Empfänger aus.

Unterstützt werden:

- Telegram
- telegrammenu2
- Pushover
- Signal
- WhatsApp
- Matrix
- E-Mail

Über Test kannst du prüfen, ob die Verbindung funktioniert.

Folgende Benachrichtigungen sind möglich:

### Mindestbestand erreicht

Meldung, sobald ein Produkt seinen Mindestbestand erreicht oder unterschreitet.

### MHD-Warnung

Tägliche Übersicht über bald ablaufende und bereits abgelaufene Produkte.

Die Uhrzeit lässt sich einstellen.

### Inventur-Erinnerung

Erinnerung nach einer festgelegten Anzahl von Tagen ohne Inventur.

Mit dem Wert 0 ist die Erinnerung ausgeschaltet.

---

## Export und Backup

Unter Einstellungen → Daten stehen mehrere Möglichkeiten zur Verfügung.

### JSON-Backup

Erstellt eine vollständige Sicherung deiner ShelfMate-Daten.

Ein zuvor gespeichertes Backup kann später wieder importiert werden.

### CSV-Export

Exportiert den Bestand als CSV-Datei, beispielsweise zur Verwendung in Excel.

### PDF-Export

Erstellt eine druckbare Bestandsliste, sortiert nach Lagerorten.

Die PDF kann über das Teilen-Menü gespeichert oder gedruckt werden.

### Datenspeicherung

ShelfMate speichert die Bestandsdaten in der Datei:

```
shelfmate.json
```

Sie liegt im Datenverzeichnis des Adapters und nicht in der ioBroker-Objektdatenbank.

Beim Import eines Backups oder beim Löschen aller Daten wird der vorherige Stand als `shelfmate.json.bak` gesichert.

---

## Offline-Modus

ShelfMate kann auch bei kurzzeitig unterbrochener Verbindung genutzt werden, sofern die Web-App zuvor eingerichtet wurde und ein vertrauenswürdiges HTTPS-Zertifikat vorhanden ist.

Einlagerungen, Entnahmen und Einkaufslisten-Einträge werden offline zwischengespeichert.

Sobald die Verbindung wieder verfügbar ist, überträgt ShelfMate die wartenden Aktionen automatisch.

So gehen Buchungen bei einem kurzfristigen Verbindungsabbruch nicht verloren.

---

## HTTPS und Zertifikate

Für die Kamera und den Offline-Modus benötigt ShelfMate HTTPS mit einem Zertifikat, dem das verwendete Gerät vertraut.

### HTTPS einrichten

1. In den Adapter-Einstellungen HTTPS verwenden aktivieren.
2. Ein vorhandenes Zertifikat auswählen oder ein neues erstellen.
3. Einstellungen speichern und die Instanz neu starten.

Über Selbstsigniertes Zertifikat erstellen erzeugt ShelfMate ein Zertifikat für den Hostnamen und die IP-Adressen des ioBroker-Rechners.

Das Zertifikat wird im ioBroker-Zertifikatsspeicher abgelegt, automatisch ausgewählt und ist 825 Tage gültig.

Alternativ kannst du eigene Zertifikate oder eine Zertifikatssammlung verwenden, beispielsweise über den ioBroker-Adapter acme.

Ein öffentlich vertrauenswürdiges Zertifikat, etwa von Let’s Encrypt, muss normalerweise nicht zusätzlich auf dem Smartphone installiert werden, sofern der aufgerufene Hostname dazu passt.

### Selbstsigniertes Zertifikat auf dem iPhone installieren

Diese Schritte wurden auf dem iPhone getestet:

1. ShelfMate in Safari öffnen: `https://<Host>:8120/`
2. In der App Einstellungen → Offline-Modus öffnen.
3. ioBroker-Zertifikat laden auswählen und den Download erlauben.

Alternativ steht die Zertifikatsdatei unter folgender Adresse bereit:

`https://<Host>:8120/iobrokerZertifikat.cer`

Anschließend auf dem iPhone:

1. Einstellungen → Allgemein → VPN & Geräteverwaltung öffnen.
2. Das heruntergeladene Profil auswählen und installieren.
3. Einstellungen → Allgemein → Info → Zertifikatsvertrauenseinstellungen öffnen.
4. Das installierte Zertifikat als vertrauenswürdig aktivieren.
5. ShelfMate neu öffnen.
6. Unter Offline-Modus → Erneut prüfen die Verbindung kontrollieren.

Installiere und vertraue nur Zertifikaten, deren Herkunft du kennst.

### Android

Die Einrichtung auf Android wurde bisher nicht getestet.

Die Zertifikatsdatei kann ebenfalls unter `https://<Host>:8120/iobrokerZertifikat.cer` heruntergeladen werden.

Je nach Android-Version wird ein eigenes CA-Zertifikat über die Sicherheits- oder Anmeldedateneinstellungen installiert.

Die Menünamen und das Verhalten können je nach Hersteller und Version abweichen.

### Zum Homescreen hinzufügen

iPhone: ShelfMate in Safari öffnen, das Teilen-Menü auswählen und Zum Home-Bildschirm antippen.

Android: ShelfMate im Browser öffnen und über das Browsermenü Zum Startbildschirm hinzufügen oder App installieren auswählen.

Danach lässt sich ShelfMate wie eine normale App starten.

---

## Etiketten drucken

ShelfMate erstellt Etiketten als PNG-Bilder in der eingestellten Größe.

Diese lassen sich auf dem Smartphone speichern, teilen oder direkt drucken.

Unterstützt werden unter anderem:

- EAN-Etiketten
- QR-Etiketten
- Nur-QR-Etiketten
- Große Regal-Etiketten
- Boxen-Etiketten mit Inhalt
- „Geöffnet am“-Etiketten
- Gefrierfach-Etiketten

Welche Etikettentypen verfügbar sind, wählst du in den Instanz-Einstellungen im ioBroker-Admin unter „Etiketten-Knöpfe in der App“.

### Beispiel: Niimbot B1

Die Etiketten lassen sich beispielsweise mit einem Niimbot B1 drucken.

Dafür kann der Drucker über CUPS auf einem Linux-Rechner als AirPrint-Drucker eingerichtet werden. Anschließend ist der Druck direkt vom iPhone möglich.

Die Einrichtung des Druckers ist kein Bestandteil von ShelfMate.

Weitere Informationen findest du unter dem Suchbegriff Niimbot CUPS AirPrint.

---

## Fragen, Ideen oder Fehler?

Falls etwas nicht funktioniert oder du eine Idee für ShelfMate hast, kannst du gerne ein Issue auf GitHub erstellen:

[GitHub – ShelfMate Issues](https://github.com/backfisch88/ioBroker.shelfmate/issues)
