# ShelfMate Anleitung

So benutze ich ShelfMate, Schritt für Schritt. Die Kurzbeschreibung, die Einstellungen und die Datenpunkte stehen in der [README](../../README.de.md). Die englische Fassung ist [docs/en/tutorial.md](../en/tutorial.md).

## Inhalt

1. [Die App im Überblick](#die-app-im-überblick)
2. [Ein Produkt bearbeiten](#ein-produkt-bearbeiten)
3. [Automatische Werte und das Funken-Symbol](#automatische-werte-und-das-funken-symbol)
4. [Ein Produkt neu von Open Food Facts laden](#ein-produkt-neu-von-open-food-facts-laden)
5. [Ein- und Auslagern](#ein--und-auslagern)
6. [Lagerorte und Etiketten](#lagerorte-und-etiketten)
7. [Produkte ohne Barcode](#produkte-ohne-barcode)
8. [Mindestbestand und Einkaufsliste](#mindestbestand-und-einkaufsliste)
9. [Mindesthaltbarkeit](#mindesthaltbarkeit)
10. [Einkaufslisten-Modi](#einkaufslisten-modi)
11. [Zutaten-Prüfung](#zutaten-prüfung)
12. [Ein ganzes Regal einräumen](#ein-ganzes-regal-einräumen)
13. [Inventur per Scan](#inventur-per-scan)
14. [Scanner-Modus (ohne App)](#scanner-modus-ohne-app)
15. [Vorschläge (Glühbirne)](#vorschläge-glühbirne)
16. [Benachrichtigungen](#benachrichtigungen)
17. [Export und Backup](#export-und-backup)
18. [Offline nutzen](#offline-nutzen)
19. [Zertifikat und Installation auf dem Handy](#zertifikat-und-installation-auf-dem-handy)
20. [Etiketten drucken](#etiketten-drucken)

## Die App im Überblick

**Übersicht.** Oben ist die Suche. Beim Tippen kommen Vorschläge (Produkte, Marken, Tags). Ich tippe einen an, und er wird übernommen. Mit dem **×** leere ich das Feld. Darunter sind drei Auswahlfelder (Bereich, Lagerort, Kategorie), die Status-Chips und die Tags:

- Status-Chips: **Geöffnet**, **MHD bald**, **Abgelaufen**, **nachkaufen** und **Leer**. Die beiden MHD-Chips gibt es nur, wenn das MHD eingeschaltet ist. Ein Tipp filtert die Liste, ein zweiter schaltet den Filter wieder aus.
- Tags: die am häufigsten benutzten Suchbegriffe. Ein Tipp sucht danach, ein zweiter löscht die Suche.
- Produkte einer Gruppe stehen in einer Zeile mit einem kleinen Dreieck. Ein Tipp klappt die Gruppe auf. Ein Tipp auf ein Produkt öffnet seine Seite, und mit **Zurück** lande ich wieder genau dort in der Liste, wo ich war.

**Produktseite.** Oben steht der Gesamtbestand. Ist das MHD an, stehen dort auch die Haltbarkeitsdaten (abgelaufene und bald ablaufende farbig). Gibt es eine Standard-Haltbarkeit, steht eine Zeile wie „Standard-Haltbarkeit 365 Tage · nach dem Öffnen 90 Tage“ dabei. Die Knöpfe darunter sind immer in dieser Reihenfolge:

1. **Einlagern** und **Entnehmen**
2. **Verschieben** und **Öffnen** (oder **Öffnen rückgängig**), wenn es für das Produkt passt
3. **Zur Einkaufsliste**. Steht das Produkt schon drauf, zeigt der Knopf einen Haken, und ein Tipp nimmt es wieder runter
4. Die Etiketten-Knöpfe (nur die, die ich in den Adapter-Einstellungen eingeschaltet habe)
5. **Bearbeiten** und **Löschen**, immer ganz unten

## Ein Produkt bearbeiten

**Bearbeiten** öffnet das Formular mit fünf Abschnitten, die ich auf- und zuklappen kann. Ist ein Abschnitt zu, zeigt er rechts eine kurze Zusammenfassung, zum Beispiel `Packung · 400g · min 1`. Ich öffne nur, was ich ändern will:

| Abschnitt | Inhalt |
| --- | --- |
| **Grunddaten** (offen) | Name, Marke, Bild (hochladen oder entfernen), Kategorie |
| **Bestand** (bei neuen Produkten offen) | Bestandsart (Stück, Gewicht, Volumen), Einheit bei Stückware, Packungsinhalt, Mindestbestand |
| **Gruppe & Tags** | Gruppe (mehrere Marken zählen zusammen, zum Beispiel „Mehl“) und Tags (Suchbegriffe, mit Komma getrennt) |
| **Haltbarkeit** | Nur sichtbar, wenn das MHD an ist. MHD (im Modus „pro Produkt“), Standard-Haltbarkeit in Tagen und Haltbarkeit nach dem Öffnen in Tagen |
| **Mehr** | Barcode (mit „EAN erzeugen“ und Etikett), Nutri-Score als farbige Knöpfe (A bis E, nochmal tippen wählt ihn ab), Bild-Link und bei Produkten von Open Food Facts der Knopf zum Neuladen |

Produkte mit einer Gruppe zählen beim Mindestbestand zusammen. Haben sie keine eigene Standard-Haltbarkeit, nehmen sie die der Gruppe.

## Automatische Werte und das Funken-Symbol

ShelfMate kann Werte selbst eintragen, die ich sonst tippen müsste: das MHD beim Einlagern, die Standard-Haltbarkeit und die Haltbarkeit nach dem Öffnen. Damit ich weiß, was von mir ist und was nicht, zeigt die Produktseite am Ende der Zeile „Standard-Haltbarkeit … · nach dem Öffnen …“ ein kleines **Funken-Symbol**. Es erscheint, sobald an diesem Produkt etwas **nicht von mir getippt** wurde:

- Die Standard-Haltbarkeit oder die Haltbarkeit nach dem Öffnen kommt aus der eingebauten Liste (Trockenware wie Nudeln, Reis, Mehl, Konserven, Süßes) oder von der Gruppe, nicht vom Produkt selbst.
- Ein MHD wurde automatisch gesetzt: beim Einlagern (Einlagerungstag plus Standard-Haltbarkeit) oder über „Haltbarkeit automatisch eintragen“.

Das Symbol gibt es nur auf der Produktseite, nicht in der Übersicht. Was ich selbst eintippe, gewinnt immer. Sobald ich ein Datum ändere, gilt es nicht mehr als automatisch, und das Symbol verschwindet, wenn nichts Automatisches mehr übrig ist. Ältere automatische Daten erkennt ShelfMate wieder, wenn ich „Haltbarkeit automatisch eintragen“ noch einmal ausführe (ein Datum, das genau Einlagerungstag plus Haltbarkeit ist, gilt als automatisch).

**Wann wird etwas eingetragen?** Das stelle ich in den Adapter-Einstellungen bei „Haltbarkeit automatisch eintragen“ ein:

| Einstellung | Bedeutung |
| --- | --- |
| Immer (Standard) | Die App füllt das Datum beim Einlagern schon aus. Scanner-Modus und Datenpunkte tragen es selbst ein |
| Nur ohne App | Nur Scanner-Modus und Datenpunkte tragen ein, weil dort niemand ein Datum tippen kann. In der App bleibt das Feld leer |
| Nie | Nichts automatisch, auch keine Vorschläge aus der Liste. Der Knopf „Haltbarkeit automatisch eintragen“ funktioniert trotzdem, wenn ich ihn selbst drücke |

**Was wird eingetragen?** Das legt „Was automatisch eingetragen wird“ fest: entweder **alles mit Standard-Haltbarkeit** (eigene Werte, Gruppenwerte und die Liste) oder **nur Trockenware aus der eingebauten Liste**. Bei der zweiten Wahl bekommt ein Brot, dem ich selbst 5 Tage eingetragen habe, kein automatisches Datum, Nudeln schon.

Frische und gekühlte Ware (Milch, Joghurt, Käse, Wurst, Fleisch, Eier, Salat und so weiter) steht nicht in der Liste und bekommt nie ein automatisches Datum. Die Werte sind Richtwerte, nicht das Datum vom Hersteller. Ein aufgedrucktes oder von mir eingetragenes Datum ersetzt das automatische immer. Und das Öffnen einer Packung schiebt das Datum nie hinter das aufgedruckte.

**Werte verwalten.** Unter **Einstellungen / Haltbarkeit** (nur sichtbar, wenn das MHD an ist) zeigt **Haltbarkeiten verwalten** jedes Produkt mit eigenem Wert. Dort kann ich einen Wert ändern, mit dem ✕ entfernen oder oben mit **Alle eigenen Werte entfernen** alle auf einmal löschen. Die Liste ändert sich sofort.

## Ein Produkt neu von Open Food Facts laden

Bei Produkten von Open Food Facts ist der Barcode im Editor gesperrt. Unter **Mehr** holt **Von Open Food Facts neu laden** Name, Marke, Packungsinhalt, Bild, Kategorie und Nutri-Score noch einmal und fügt neue Tags zu meinen hinzu (meine eigenen bleiben). Gespeichert wird erst mit **Produkt speichern**. Ich kann mir das Ergebnis also ansehen oder das Formular einfach schließen.

## Ein- und Auslagern

1. **Scannen** antippen und den Barcode vor die Kamera halten (oder eintippen).
2. Bekannte Produkte öffnen sich sofort, unbekannte werden bei Open Food Facts gesucht und vorausgefüllt. Prüfen und speichern.
3. **Einlagern**, **Entnehmen** oder **Verschieben** wählen, Menge und Lagerort einstellen, speichern.
4. Tipp: Statt den Lagerort aus der Liste zu wählen, den QR-Code des Regals scannen.

## Lagerorte und Etiketten

1. Unter **Lagerorte** einen Bereich (z. B. „Speisekammer“) und einen Lagerort („Regal 1“) anlegen.
2. Den Lagerort öffnen: Dort steht sein QR-Code, die Etiketten-Knöpfe erzeugen das Etikett als Bild (nur QR, großes Regal-Etikett, Boxen-Etikett mit Inhalt).
3. Die Etikettengröße einmal unter **Einstellungen / Etiketten** eintragen (z. B. 50 × 30 mm). Für das große Regal-Etikett, das Boxen-Etikett und den vollflächigen Code stelle ich dort eine eigene Größe ein (A6, A5 oder A4). Dort wähle ich auch, ob Lagerort-Etiketten einen QR-Code oder einen Code-128-Strichcode tragen (oben der Name, darunter nur der Strichcode; der Lagerort muss vorher gespeichert sein). Welche Knöpfe die App zeigt, stelle ich in den Adapter-Einstellungen ein.
4. Das Bild drucken (siehe „Etiketten drucken“) und an Regal oder Box kleben.

## Produkte ohne Barcode

Produkt von Hand anlegen und einen eigenen EAN-13-Code erzeugen lassen. Den Code als Etikett drucken und aufkleben. Ein eigenes Produktbild kann hochgeladen werden, es wird automatisch verkleinert.

## Mindestbestand und Einkaufsliste

1. Beim Produkt einen **Mindestbestand** eintragen. Bei Produkten einer Gruppe (z. B. alle Mehlsorten) an der Gruppe einstellen, der Bestand zählt gemeinsam.
2. In den Adapter-Einstellungen den Einkaufslisten-Modus wählen.
3. Fällt der Bestand auf den Mindestbestand, kommt das Produkt auf die Liste. Der Haken in der Übersicht zeigt, was auf der Liste steht; antippen nimmt es wieder herunter.

## Mindesthaltbarkeit

Den Modus wähle ich in den Adapter-Einstellungen:

- **Aus**: keine Haltbarkeitsfunktionen.
- **Pro Produkt**: Jedes Produkt hat ein optionales Datum (im Produktformular). Ist es erreicht, wird das Produkt in der Übersicht und auf der Produktseite markiert.
- **Pro Einlagerung**: Beim Einlagern kann ich ein Datum angeben. Pro Produkt und Lagerort bleiben mehrere Daten erhalten. Entnehmen und Verschieben nehmen immer zuerst das älteste.
- **Standard-Haltbarkeit** (optional, pro Produkt; bei Gruppenprodukten gilt der Wert der Gruppe): trägt das MHD beim Einlagern vor, bei Nudeln zum Beispiel ein Jahr. Im Modus „pro Einlagerung“ bekommt auch Bestand ohne Datum eins: Einlagerungstag (aus der Historie) plus Haltbarkeit. Wann und was eingetragen wird und was das Funken-Symbol heißt, steht unter [Automatische Werte und das Funken-Symbol](#automatische-werte-und-das-funken-symbol).
- **Geöffnet** (optional, pro Produkt): **Öffnen** auf der Produktseite trennt eine Packung ab. Habe ich eine Haltbarkeit nach dem Öffnen eingetragen, bekommt sie dieses Datum (oder das frühere MHD, falls das eher abläuft). Geöffnete Packungen stehen extra und werden zuerst verbraucht. **Öffnen rückgängig** macht aus einer geöffneten wieder eine normale.
- **Verdorben**: Beim Entnehmen wähle ich „Verdorben“ statt „Verbraucht“. Das zählt nicht zum Verbrauch und wird in der Historie 30 Tage lang zusammengefasst.
- **Rückgängig**: In der Historie macht ein Knopf die letzte Buchung rückgängig. Im Scanner-Modus geht das mit dem Code `SM:UNDO`.
- **MHD nachtragen oder ändern** (pro Einlagerung): Auf der Produktseite zeigt „MHD bearbeiten“ jede Packung in einer eigenen Zeile, auch geöffnete. Dort gibt es ein Datumsfeld (Kurzeingabe siehe unten) und Knöpfe für +1, +3, +5, +10 Tage und „keins“. Speichern übernimmt alle Zeilen auf einmal, die Änderung steht in der Historie und lässt sich rückgängig machen. Ohne App scanne ich `SM:DATE:<Tage>` und danach das Produkt, dann bekommt der ganze ungeöffnete Bestand dieses Datum.
- **Kurzeingabe**: Im MHD-Feld geht zum Beispiel `+3d` (in 3 Tagen), `+2w` (in 2 Wochen), `+1m` (in einem Monat), `+1y` (in einem Jahr), `12/26` (Ende Dezember 2026, so steht es oft auf der Packung), `2412` oder `24.12.` (der nächste 24. Dezember), `24.12.26` (volles Datum) und `x` (kein Datum). Eine Vorschau darunter zeigt, was verstanden wurde. Die Knöpfe für +1 bis +14 Tage, +3w, +1m, +3m, +6m und +1y füllen das Feld mit einem Tipp.

Produkte, die abgelaufen sind oder bald ablaufen, bekommen ein Abzeichen („läuft in 3 Tagen ab“ oder „abgelaufen“) und stehen in den Datenpunkten `stats.expiring*`. Wie Daten angezeigt werden (`31.10.2026`, `31/10/2026` oder `2026-10-31`), stelle ich unter „Datumsformat“ ein.

## Einkaufslisten-Modi

- **Aus**: Es wird nichts gesendet.
- **Script**: Der Artikelname wird mit `ack=false` in einen Datenpunkt geschrieben, den ich auswähle. Optional wähle ich einen Datenpunkt mit der aktuellen Liste (JSON-Array aus Objekten mit `name`). Dann trägt ShelfMate keine Duplikate ein und zeigt an, was schon auf der Liste steht. Optional wähle ich auch einen Datenpunkt, in den der Name eines zu entfernenden Artikels geschrieben wird (`ack=false`). Erst dann funktionieren das Abhaken in der App und „Von der Liste nehmen, wenn wieder aufgefüllt“.
- **Direkt über Bring!**: Ich wähle die Liste in den Einstellungen (die Listen des Bring!-Adapters werden automatisch gefunden, oder ich tippe den Kanal wie `bring.0.<list-id>` ein). ShelfMate liest `<Liste>.content` und schreibt neue Artikel nach `<Liste>.saveItem`, aber nur, wenn sie nicht schon auf der Liste stehen. Übernommen wird nur der Name (alles nach dem ersten Komma fällt weg).
- **Bring Spezial**: wie Bring, aber ein Artikel, der schon auf der Liste steht, wird nicht übersprungen. Seine Menge wird hochgezählt oder in den Zusatz einsortiert (`Mehl` → `Mehl, 2` → `Mehl, 3`; `Feta, 200g` und `Feta, Kräuter` bleiben getrennte Einträge). Die Artikel werden nacheinander geschrieben, und der nächste wartet, bis der Bring!-Adapter die Liste neu geladen hat. Diesen Modus brauche ich, wenn Mengen und Zusätze auf der Liste landen sollen, zum Beispiel aus der Zutaten-Prüfung.

`shopping.addItem` nutzt immer den gewählten Modus. Bei „Bring Spezial“ geht alles, was ich dort hineinschreibe, durch die Mengen-Logik, bei „Bring“ wird nur der Name übernommen.

Bei Bring, Bring Spezial und Script (mit Datenpunkt zum Entfernen) gibt es zwei unabhängige Optionen. Entfernt wird nur, was wirklich auf der Liste steht, geschrieben wird nach `<Liste>.removeItem`:

- **Von der Liste nehmen, wenn wieder aufgefüllt**: Steigt der Bestand wieder über den Mindestbestand, kommt der Artikel von der Liste (Standard: aus).
- **Von der Liste nehmen, wenn ich den Haken in der App entferne**: Tippe ich in der App auf den Haken eines Artikels, der auf der Liste steht, wird er auch dort entfernt (Standard: an). Ist die Option aus, verschwindet nur die Markierung in der App.

## Zutaten-Prüfung

Damit vergleiche ich die Zutaten geplanter Rezepte mit dem, was ich zu Hause habe. ShelfMate kennt keine Rezepte. Es bekommt eine Zutatenliste und sagt mir, was da ist und was fehlt.

1. Ich schreibe die Zutaten in `check.request`, eine pro Zeile (oder mit Semikolon getrennt), oder als JSON-Liste aus Texten oder `{"name","amount","unit"}`. In einer Zeile trennen Kommas Name, Zusatz und Menge, so wie meine Rezept-App es liefert: `Zwiebeln, rot, 1`, `Cherrytomaten, bunt, 500g`, `Salz, 0.5 tl`, `Basilikum`. Die Menge darf auch vor dem Namen stehen (`380g Linguine`, `2EL Olivenöl`) oder dahinter (`Mehl 200g`). Verstanden werden `kg`, `g`, `l`, `ml`, `cl` und Stück. `EL`, `TL` und Ähnliches zählen nur als „vorhanden“. Gleiche Zutaten werden zusammengezählt.
2. Gefunden wird über Produktname, Gruppe oder Tag, jeweils als ganzes Wort. `Cherrytomaten` wird also nicht über `Tomaten` gefunden, aber ein Tag `Cherrytomaten` am Produkt reicht. `Mehl` zählt alle Produkte der Gruppe Mehl zusammen. Bei Mengen in g oder ml wird der Bestand verglichen (500 g da, 200 g gebraucht: passt). Zählprodukte mit Packungsgröße wie `1 kg` werden umgerechnet. Ohne Menge reicht ein Bestand über null. Unbekannte Zutaten gelten als fehlend, damit auch Nicht-Lebensmittel auf der Liste landen.
3. `check.result` enthält das Ergebnis je Zutat. `check.available` und `check.missing` enthalten die Zeilen so, wie sie kamen, eine pro Zeile, `check.missing` kann ich also direkt auf die Einkaufsliste übernehmen. `check.allAvailable` ist `true`, wenn nichts fehlt.
4. Mit „Fehlende Zutaten auf die Einkaufsliste setzen“ in den Adapter-Einstellungen kommen die fehlenden Zeilen nach jeder Prüfung automatisch auf die Liste, jede so, wie sie kam. Bei „Bring Spezial“ fügt ShelfMate die Zusätze selbst zusammen (`Cherrytomaten, bunt, 500g` zweimal wird zu `bunt 500g + 500g`), in den anderen Modi wird nur der Name geschrieben. Ohne die Einstellung schreibe ich `true` in `check.addMissing`, wenn ich sie auf der Liste haben will.

Hat ein Produkt einen Mindestbestand, rechne ich ihn mit: Einzukaufen ist die benötigte Menge minus Vorrat plus Mindestbestand. Bei 2 kg Zucker im Vorrat, 1 kg Mindestbestand und `Zucker, 3000 g` landet `Zucker, 2000g` auf der Liste. `check.request` wird nach jedem Lauf geleert.

## Ein ganzes Regal einräumen

1. **Lagerorte / Einräumen** öffnen.
2. Den QR-Code des Lagerorts scannen (oder in der Liste wählen), dann die Produkte nacheinander mit der Kamera, einem Scanner oder per Eintippen der EAN scannen. Jeder Scan zählt 1, die Liste zeigt die Mengen und ich kann sie korrigieren.
3. Denselben Lagerort-Code nochmal scannen (oder **Einlagern** tippen). Alles wird auf einmal eingelagert. Produkte nach Gewicht oder Volumen zählen als ganze Packungen und brauchen die Packungsgröße in g oder ml.
4. Ein Barcode, der noch nicht in der Liste ist, wird bei Open Food Facts gesucht, das Produkt wird angelegt und gleich mitgezählt. Kennen ihn die Datenbanken auch nicht, entsteht ein Produkt „Unbekanntes Produkt <Barcode>“, das ebenfalls zählt und als Vorschlag erscheint (Glühbirne, „Neue Produkte bearbeiten“), bis ich es bearbeitet und gespeichert habe.

## Inventur per Scan

1. **Lagerorte / Inventur** öffnen und die Variante **Scannen** wählen (Einstellungen oder auf der Seite).
2. Den QR-Code des Lagerorts scannen. „Inventur gestartet“ bestätigt das.
3. Alle Artikel dieses Lagerorts scannen; jeder Scan zählt +1 (zweimal derselbe Artikel heißt zwei).
4. **Denselben** Lagerort-QR nochmal scannen. Damit ist die Inventur des Lagerorts abgeschlossen: Der Bestand wird korrigiert, der Lagerort als erledigt markiert, und eine Zusammenfassung zeigt, was gezählt wurde (mit Sollmenge, wenn sie abweicht).
5. Zum Weitermachen den QR-Code des nächsten Lagerorts scannen. Ein anderer Lagerort wird erst angenommen, wenn der aktuelle abgeschlossen ist.

Die Seite zeigt auch, welche Lagerorte des Bereichs fertig und welche noch offen sind. Nicht gescannte Artikel zählen als 0. Lieber von Hand prüfen? Variante **Liste**: gezählte Menge eintippen oder ✓ für „stimmt“. Korrekturen stehen im Verlauf als „Inventur“. Eine Erinnerung im festen Abstand stelle ich bei den Benachrichtigungen ein.

## Scanner-Modus (ohne App)

Ein- und Auslagern mit gescannten Codes, ohne die App zu öffnen. Eingeschaltet wird er mit dem Datenpunkt `scanner.active`, die Codes kommen in `scanner.input` an, oder direkt von einem Scanner, der am ioBroker-Rechner steckt und dort als Tastatur erscheint (siehe unten).

- Produkt, dann Lagerort-Code: lagert 1 an diesem Lagerort ein.
- Produkt zweimal: entnimmt 1. Kommt kein Lagerort, wird dort entnommen, wo der Artikel das kürzeste MHD hat (ohne MHD: wo am meisten liegt).
- Produkt zweimal, dann Lagerort-Code: entnimmt 1 genau an diesem Lagerort.
- Lagerort-Code allein: startet den Einräum-Modus. Jedes danach gescannte Produkt wird an diesem Lagerort eingelagert (je 1, sofort gebucht). Derselbe Lagerort-Code beendet ihn, ein anderer wechselt zu diesem Lagerort, und nach 5 Minuten ohne Scan endet er von selbst. Praktisch für ein ganzes Regal, zum Beispiel mit Babygläschen.
- `SM:UNDO` macht die letzte Buchung rückgängig (außer Verschieben und Inventur). `SM:SPOIL` und danach das Produkt entnimmt 1 als verdorben, `SM:OPEN` und danach das Produkt markiert 1 Stück als geöffnet. `SM:DATE:<Tage>` und danach das Produkt setzt das MHD des gesamten ungeöffneten Bestands auf heute plus die Tage (`SM:DATE:0` entfernt es). Die Codes stehen auf der zweiten Seite des Steuer-Code-PDFs.
- `SM:QTY:5` und danach die Buchung: Die nächste Buchung zählt 5 statt 1. `SM:CANCEL` verwirft einen wartenden Scan.
- Die Zeit zwischen den Codes stelle ich in den Adapter-Einstellungen ein (3 bis 120 Sekunden, Standard 10).

Die Inventur bleibt in der App, sie braucht das Display.

**Funk-Scanner anschließen (vorgesehen: Tera HW0009 mit 2.4G-Dongle).** Ich stecke den Dongle in den ioBroker-Rechner, der ihn als Tastatur erkennt, ein Treiber ist nicht nötig. Am Scanner wähle ich den 2.4G-Modus und koppele ihn mit den Barcodes aus der Anleitung mit dem Dongle. Das Tastaturlayout lasse ich auf US und das Ende des Codes auf Enter. In den Adapter-Einstellungen wähle ich bei „Scanner“ das Gerät aus und schalte den Modus über `scanner.active` ein. Der ioBroker-Benutzer braucht Zugriff auf das Gerät: `sudo adduser iobroker input` und die Instanz neu starten. Den Rest übernimmt der Adapter. Hat der Scanner einen Prefix oder Suffix, trage ich denselben Text in den beiden Einstellungen ein. Jeder Code landet auch in `scanner.lastCode`.

Weil der Scanner mit US-Tastaturlayout tippt, können Umlaute und manche Sonderzeichen verloren gehen. Für Lagerorte nutze ich deshalb den kurzen Scanner-Code: Im Lagerort-Editor tippe ich „Kurzen Scanner-Code verwenden“, speichere und drucke das Etikett neu (alte Etiketten gelten weiter). Unter Einstellungen druckt „Steuer-Codes als PDF“ die Mengen-Codes und den Abbrechen-Code. Der Scanner hat kein Display, das Ergebnis jedes Scans steht in `scanner.result`.

**Scanner ohne 2D (nur Strichcode).** Für einen Scanner, der nur 1D-Codes liest, stelle ich „Code auf Lagerort-Etiketten“ auf „Strichcode“. Alle Lagerort-Etiketten (auch Box- und Regal-Etikett) zeigen dann oben den Namen und darunter nur einen Code-128-Strichcode, das Steuer-Code-Blatt wird ebenfalls als Strichcodes gedruckt. Der Lagerort muss vorher gespeichert sein, weil der Code seine kurze ID enthält (`SM:L:<8 Zeichen>`). Das passt auf ein Etikett mit 50 × 30 mm.

## Vorschläge (Glühbirne)

Die Glühbirne oben sammelt drei Arten von Hinweisen: Gruppen-Vorschläge (ähnliche Produkte, die gemeinsam zählen könnten; einzelne Produkte lassen sich herausnehmen, ein Vorschlag lässt sich ignorieren), Mindestbestand-Vorschläge (nur für regelmäßig verbrauchte Produkte; ✓ übernimmt, ✕ verwirft) und eine fällige Inventur. Ohne Antippen ändert sich nichts.

## Benachrichtigungen

In den Adapter-Einstellungen einen Benachrichtigungs-Adapter wählen, das Ziel eintragen (z. B. eine Chat-ID) und den Test-Knopf nutzen. Ich lasse mich melden, wenn der Mindestbestand erreicht ist, täglich zur gewählten Uhrzeit über abgelaufene und ablaufende Produkte, und alle N Tage an eine Inventur erinnern.

## Export und Backup

Unter **Einstellungen / Daten**: **JSON-Backup** (herunterladen und wieder importieren), **Bestand als CSV** (für Excel o. Ä.) und **Bestand als PDF** (druckbare Liste nach Lagerort; öffnet das Teilen-Menü zum Sichern oder Drucken).

## Offline nutzen

Sobald das Zertifikat vertraut ist, startet die App auch ohne Verbindung. Buchungen und Einkaufslisten-Einträge, die offline entstehen, werden gesammelt und automatisch gesendet, sobald die Verbindung wieder da ist.

## Zertifikat und Installation auf dem Handy

Kamera und Offline-Modus brauchen HTTPS mit einem Zertifikat, dem das Handy vertraut.

1. In den Adapter-Einstellungen **HTTPS verwenden** einschalten und ein Zertifikat wählen. Am einfachsten geht das mit dem Knopf **Selbstsigniertes Zertifikat erstellen**: Er erzeugt ein Zertifikat für Hostnamen und IP-Adressen des ioBroker-Rechners, legt es in den ioBroker-Zertifikaten ab und wählt es aus. Einstellungen speichern, die Instanz startet neu. Alternativ ein eigenes Zertifikat oder eine Zertifikatssammlung (z. B. Let's Encrypt) wählen.
2. Ein Zertifikat einer öffentlichen Stelle (z. B. Let's Encrypt über den Adapter `acme`) muss auf dem Handy nicht installiert werden. Dann die nächsten Schritte überspringen.
3. Selbstsigniertes Zertifikat auf dem **iPhone** (getestet):
   1. `https://<Host>:8120/` in Safari öffnen, in der App **Einstellungen / Offline-Modus** aufrufen und **ioBroker-Zertifikat laden** tippen (die Datei gibt es auch direkt unter `https://<Host>:8120/iobrokerZertifikat.cer`), „Zulassen“ wählen.
   2. iPhone **Einstellungen / Allgemein / VPN & Geräteverwaltung**: das heruntergeladene Profil antippen und **Installieren**.
   3. iPhone **Einstellungen / Allgemein / Info / Zertifikatsvertrauenseinstellungen**: das Zertifikat einschalten.
   4. App schließen und neu öffnen. Unter **Offline-Modus** auf **Erneut prüfen** tippen.
4. **Android und andere Systeme** sind nicht getestet. Das Zertifikat lässt sich genauso laden (`https://<Host>:8120/iobrokerZertifikat.cer`) und wird normalerweise in den Systemeinstellungen (Sicherheit / Anmeldedaten) als CA-Zertifikat installiert. Die Menünamen unterscheiden sich je nach Gerät und Version.

## Etiketten drucken

Die Etiketten entstehen als PNG-Bilder in der eingestellten Etikettengröße und werden vom Handy geteilt oder gespeichert. Ich drucke sie auf einem Niimbot B1, den ich über CUPS auf einem Linux-Rechner als AirPrint-Drucker eingerichtet habe, sodass das Handy direkt drucken kann. Die Druckereinrichtung gehört nicht zum Adapter; Stichwort zum Suchen: „Niimbot CUPS AirPrint“.
