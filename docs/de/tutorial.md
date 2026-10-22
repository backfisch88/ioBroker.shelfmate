# ShelfMate Anleitung

Schritt-für-Schritt-Anleitungen für alles, was ich mit ShelfMate mache. Die Kurzbeschreibung, die Einstellungen und die Datenpunkte stehen in der [README](../../README.de.md). Eine englische Fassung dieser Anleitung liegt in [docs/en/tutorial.md](../en/tutorial.md).

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

**Übersicht.** Oben steht das Suchfeld. Beim Tippen erscheinen direkt darunter Vorschläge (Produktnamen, Marken, Tags); ich tippe einen an und er wird übernommen. Das **×** rechts leert das Feld. Unter der Suche stehen drei Auswahlfelder (Bereich, Lagerort, Kategorie), die Status-Chips und die Tags:

- Die Status-Chips heißen **Geöffnet**, **MHD bald**, **Abgelaufen**, **nachkaufen** und **Leer**. Die beiden MHD-Chips gibt es nur, wenn das Mindesthaltbarkeitsdatum eingeschaltet ist. Ein Tipp auf einen Chip filtert die Liste, ein zweiter schaltet ihn wieder aus.
- Die Tags sind die am häufigsten verwendeten Suchbegriffe. Ein Tipp sucht danach und hebt den Tag hervor, ein zweiter löscht die Suche.
- Produkte einer Gruppe erscheinen als eine Zeile mit einem kleinen Dreieck; ein Tipp klappt die Gruppe auf. Ein Tipp auf ein Produkt öffnet seine Seite, und **Zurück** bringt mich genau an die Stelle der Liste, an der ich war.

**Produktseite.** Die Karte oben zeigt den Gesamtbestand. Ist das MHD eingeschaltet, stehen dort auch alle Haltbarkeitsdaten, abgelaufene und bald ablaufende farbig, und, wenn es eine Standard-Haltbarkeit gibt, eine Zeile „Standard-Haltbarkeit 365 Tage · nach dem Öffnen 90 Tage“. Die Knöpfe darunter stehen immer in derselben Reihenfolge:

1. **Einlagern** und **Entnehmen**
2. **Verschieben** und **Öffnen** (oder **Öffnen rückgängig**), nur wenn es für dieses Produkt Sinn ergibt
3. **Zur Einkaufsliste**: setzt das Produkt auf die Liste; steht es schon drauf, zeigt derselbe Knopf einen Haken, und ein Tipp nimmt es wieder herunter
4. Die Etiketten-Knöpfe (nur die, die ich in den Adapter-Einstellungen eingeschaltet habe)
5. **Bearbeiten** und **Löschen**, immer in der letzten Zeile

## Ein Produkt bearbeiten

**Bearbeiten** öffnet das Formular. Es hat fünf Abschnitte, die sich auf- und zuklappen lassen. Ein geschlossener Abschnitt zeigt rechts eine kurze Zusammenfassung, zum Beispiel `Packung · 400g · min 1`, ich sehe den Inhalt also, ohne ihn zu öffnen. Ich öffne nur, was ich ändern will:

| Abschnitt | Inhalt |
| --- | --- |
| **Grunddaten** (offen) | Name, Marke, Bild (hochladen oder entfernen, mit Vorschau), Kategorie |
| **Bestand** (bei einem neuen Produkt offen) | Bestandsart (Stück, Gewicht, Volumen), Einheit für Stückware neben dem Packungsinhalt, Mindestbestand |
| **Gruppe & Tags** | Produkttyp oder Gruppe (mehrere Marken zählen zusammen, zum Beispiel „Mehl“), Tags (Suchbegriffe, mit Komma getrennt) |
| **Haltbarkeit** | Nur sichtbar, wenn das MHD eingeschaltet ist. MHD (im Modus „pro Produkt“), Standard-Haltbarkeit in Tagen und Haltbarkeit nach dem Öffnen in Tagen |
| **Mehr** | Barcode mit „EAN erzeugen“ und dem Etikett, Nutri-Score als Reihe farbiger Knöpfe (A bis E, nochmal tippen wählt eine andere Stufe), Bild-Link und bei Produkten von Open Food Facts der Knopf zum Neuladen |

Das Feld „Einheit“ erscheint nur bei Produkten, die in Stück gezählt werden. Produkte mit einer Gruppe zählen beim Mindestbestand zusammen und übernehmen die Standard-Haltbarkeit der Gruppe, wenn sie keine eigene haben.

## Automatische Werte und das Funken-Symbol

ShelfMate kann Daten eintragen, die ich sonst tippen müsste: das MHD beim Einlagern, die Standard-Haltbarkeit und die Haltbarkeit nach dem Öffnen. Damit klar bleibt, was von mir stammt, zeigt die Produktseite am Ende der Zeile „Standard-Haltbarkeit … · nach dem Öffnen …“ ein kleines **Funken-Symbol**, sobald etwas an diesem Produkt **nicht von mir getippt** wurde. Das heißt:

- die Standard-Haltbarkeit oder die Haltbarkeit nach dem Öffnen kommt aus der eingebauten Liste (Trockenware wie Nudeln, Reis, Mehl, Konserven, Süßes) oder aus der Produktgruppe statt vom Produkt selbst,
- ein MHD wurde beim Einlagern automatisch gesetzt (Standard-Haltbarkeit ab dem Tag der Einlagerung) oder durch „Haltbarkeit automatisch eintragen“ in den App-Einstellungen.

Das Symbol steht nur auf der Produktseite, nicht in der Übersicht. Ein Wert, den ich selbst eingebe, gewinnt immer: Sobald ich ein Datum tippe oder ändere, zählt es nicht mehr als automatisch, und das Symbol verschwindet, wenn nichts Automatisches mehr übrig ist. Früher eingetragene Daten werden wiedererkannt, wenn ich „Haltbarkeit automatisch eintragen“ noch einmal ausführe (ein Datum, das genau Einlagerungstag plus Haltbarkeit ist, gilt als automatisch).

**Wann wird etwas eingetragen?** Das stelle ich in den Adapter-Einstellungen unter „Haltbarkeit automatisch eintragen“ ein:

| Einstellung | Bedeutung |
| --- | --- |
| Immer (Standard) | Die App füllt das Datum beim Einlagern vor, Scanner-Modus und Datenpunkte tragen es selbst ein |
| Nur ohne App | Nur Scanner-Modus und Datenpunkte tragen ein, weil dort niemand ein Datum tippen kann. Die App lässt das Feld leer |
| Nie | Nichts automatisch, auch keine Vorschläge aus der Liste. Der Knopf „Haltbarkeit automatisch eintragen“ in der App funktioniert trotzdem, wenn ich ihn selbst drücke |

**Was wird eingetragen?** Die zweite Einstellung „Was automatisch eingetragen wird“ schränkt es ein: entweder **alles mit Standard-Haltbarkeit** (eigene Werte, Gruppenwerte und die Liste) oder **nur Trockenware aus der eingebauten Liste**. Mit der zweiten Wahl bekommt ein Brot mit einer von mir getippten Standard-Haltbarkeit von 5 Tagen kein automatisches Datum, Nudeln schon.

Frische und gekühlte Ware (Milch, Joghurt, Käse, Wurst, Fleisch, Eier, Salat und Ähnliches) steht nie in der eingebauten Liste und bekommt kein automatisches Datum. Die Werte sind Vorschläge zum Prüfen, nicht das aufgedruckte Datum des Herstellers. Ein aufgedrucktes oder von mir eingegebenes Datum ersetzt das automatische immer, und das Öffnen einer Packung macht das Datum nie später als das aufgedruckte.

**Die Werte verwalten.** Unter **Einstellungen / Haltbarkeit** (nur sichtbar, wenn das MHD eingeschaltet ist) zeigt der Knopf **Haltbarkeiten verwalten** jedes Produkt mit eigenem Wert. Dort ändere ich einen Wert, entferne ihn mit dem ✕ oder entferne mit **Alle eigenen Werte entfernen** oben alle eigenen Werte. Die Liste aktualisiert sich sofort.

## Ein Produkt neu von Open Food Facts laden

Bei einem Produkt, das von Open Food Facts stammt, zeigt der Editor den Barcode gesperrt. Unter **Mehr** holt der Knopf **Von Open Food Facts neu laden** Name, Marke, Packungsinhalt, Bild, Kategorie und Nutri-Score noch einmal und ergänzt neue Tags zu meinen (meine eigenen Tags bleiben). Gespeichert wird erst mit **Produkt speichern**, ich kann mir das Ergebnis also ansehen oder das Formular einfach verlassen.

## Ein- und Auslagern

1. **Scannen** antippen und den Barcode vor die Kamera halten (oder eintippen).
2. Bekannte Produkte öffnen sich sofort, unbekannte werden bei Open Food Facts gesucht und vorausgefüllt. Prüfen und speichern.
3. **Einlagern**, **Entnehmen** oder **Verschieben** wählen, Menge und Lagerort einstellen, speichern.
4. Tipp: Statt den Lagerort aus der Liste zu wählen, den QR-Code des Regals scannen.

## Lagerorte und Etiketten

1. Unter **Lagerorte** einen Bereich (z. B. „Speisekammer“) und einen Lagerort („Regal 1“) anlegen.
2. Den Lagerort öffnen: Dort steht sein QR-Code, die Etiketten-Knöpfe erzeugen das Etikett als Bild (nur QR, großes Regal-Etikett, Boxen-Etikett mit Inhalt).
3. Die Etikettengröße einmal unter **Einstellungen / Etiketten** eintragen (z. B. 50 × 30 mm). Für das große Regal-Etikett, das Boxen-Etikett und den vollflächigen Code stelle ich dort eine eigene Größe ein (A6, A5 oder A4). Dort wähle ich auch, ob Lagerort-Etiketten einen QR-Code oder einen Code-128-Strichcode tragen (oben der Name, darunter nur der Strichcode; der Lagerort muss vorher gespeichert sein). Welche Knöpfe die App zeigt, stellst du in den Adapter-Einstellungen ein.
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
- **Pro Produkt**: Jedes Produkt hat ein optionales Datum (im Produktformular). Produkte am oder nach dem Datum werden in der Übersicht und auf der Produktseite markiert.
- **Pro Einlagerung**: Beim Einlagern kann ich ein Datum angeben. Mehrere Daten pro Produkt und Lagerort bleiben erhalten; Entnehmen und Verschieben nehmen immer zuerst das älteste.
- **Standard-Haltbarkeit** (optional, pro Produkt; Gruppenprodukte übernehmen den Wert ihrer Gruppe): füllt das MHD beim Einlagern vor (Nudeln zum Beispiel ein Jahr voraus). Im Modus „pro Einlagerung“ bekommt auch Bestand ohne Datum eins: der Tag der Einlagerung (aus der Historie) plus die Haltbarkeit. Wann und was automatisch eingetragen wird und was das Funken-Symbol bedeutet, steht unter [Automatische Werte und das Funken-Symbol](#automatische-werte-und-das-funken-symbol).
- **Geöffnet** (optional, pro Produkt): „Öffnen“ auf der Produktseite trennt eine Packung ab. Habe ich eine Haltbarkeit nach dem Öffnen eingetragen, bekommt sie dieses Datum (oder das frühere MHD). Geöffnete Packungen werden getrennt aufgeführt und zuerst verbraucht.
- „Öffnen rückgängig“ auf der Produktseite macht aus einer geöffneten Packung wieder eine normale.
- **Verdorben**: Beim Entnehmen wähle ich „Verdorben“ statt „Verbraucht“. Das zählt nicht in den Verbrauch und wird in der Historie 30 Tage lang zusammengefasst.
- **Rückgängig**: In der Historie macht ein Knopf die letzte Buchung rückgängig, und der Scanner hat dafür den Code `SM:UNDO`.
- **Ein MHD später eintragen oder ändern** (pro Einlagerung): Auf der Produktseite klappt „MHD bearbeiten“ jede Packung, auch geöffnete, in einer eigenen Zeile mit Datumsfeld (Kurzeingabe wie unten) und den Knöpfen +1, +3, +5, +10 Tage und „keins“ auf. Speichern übernimmt alle Zeilen auf einmal, erscheint in der Historie und lässt sich rückgängig machen. Geöffnete Packungen haben eine eigene Zeile mit „Geöffnet“. Ohne App scanne ich `SM:DATE:<Tage>` und danach das Produkt, um den gesamten ungeöffneten Bestand auf einmal zu datieren.
- **Kurzeingabe**: Das MHD-Feld nimmt Kurzeingaben: `+3d` ist in 3 Tagen, `+2w` in 2 Wochen, `+1m` in einem Monat, `+1y` in einem Jahr, `12/26` ist Ende Dezember 2026 (wie auf vielen Packungen aufgedruckt), `2412` oder `24.12.` der nächste 24. Dezember, `24.12.26` ein volles Datum, `x` heißt kein Datum. Darunter zeigt eine Vorschau, was verstanden wurde. Knöpfe für +1 bis +14 Tage, +3w, +1m, +3m, +6m und +1y füllen es mit einem Tipp.

Produkte, die abgelaufen sind oder innerhalb der eingestellten Warnzeit ablaufen, bekommen ein Abzeichen („läuft in 3 Tagen ab“ / „abgelaufen“) und stehen in den Datenpunkten `stats.expiring*`. Wie das Datum angezeigt wird (`31.10.2026`, `31/10/2026` oder `2026-10-31`), stelle ich im Admin unter „Datumsformat“ ein.

## Einkaufslisten-Modi

- **Aus**: Es wird nichts gesendet.
- **Script**: Der Artikelname wird mit `ack=false` in den gewählten Datenpunkt geschrieben. Optional wähle ich einen Datenpunkt, der die aktuelle Liste enthält (JSON-Array aus Objekten mit `name`), damit ShelfMate keine Duplikate einträgt und anzeigen kann, was schon auf der Liste steht. Optional wähle ich einen Datenpunkt, der den Namen zu entfernender Artikel bekommt (`ack=false`). Dann funktionieren auch das Abhaken in der App und die Option „Von der Liste nehmen, wenn wieder aufgefüllt“.
- **Direkt über Bring!**: Ich wähle die Liste in den Einstellungen (die Listen des Bring!-Adapters werden automatisch gefunden, oder ich tippe den Kanal wie `bring.0.<list-id>`). ShelfMate liest `<Liste>.content` und schreibt neue Artikel nach `<Liste>.saveItem`, aber nur, wenn der Artikel nicht schon auf der Liste steht. Es wird dabei nur der Name übernommen (alles nach dem ersten Komma entfällt).
- **Bring Spezial**: wie Bring, aber ein Artikel, der schon auf der Liste steht, wird nicht übersprungen. Seine Menge wird hochgezählt oder in die Spezifikation einsortiert (`Mehl` → `Mehl, 2` → `Mehl, 3`; `Feta, 200g` und `Feta, Kräuter` werden getrennte Varianten). Die Artikel werden nacheinander geschrieben, und der nächste wartet, bis der Bring!-Adapter die Liste neu geladen hat. Dieser Modus ist nötig, wenn ich Mengen und Zusätze auf der Liste haben will (zum Beispiel aus der Zutaten-Prüfung).

`shopping.addItem` nutzt immer den gewählten Modus: Im Modus „Bring Spezial“ läuft alles, was dort hineingeschrieben wird, durch die Mengen-Logik, im Modus „Bring“ nur der Name.

Bei Bring, Bring Spezial oder Script (mit Entfern-Datenpunkt) gibt es zwei unabhängige Optionen. Artikel werden nur entfernt, wenn sie auf der Liste stehen, und nach `<Liste>.removeItem` geschrieben:

- **Von der Liste nehmen, wenn wieder aufgefüllt**: Steigt der Bestand wieder über den Mindestbestand, wird der Artikel von der Liste genommen (Standard: aus).
- **Von der Liste nehmen, wenn ich den Haken in der App entferne**: Der Tipp auf den Haken eines gelisteten Artikels in der App nimmt ihn auch von der Liste (Standard: an). Ist das ausgeschaltet, wird nur die Markierung in der App gelöscht.

## Zutaten-Prüfung

Damit vergleiche ich die Zutaten meiner geplanten Rezepte mit dem, was ich zu Hause habe. ShelfMate kennt keine Rezepte, es bekommt nur eine Zutatenliste und sagt, was da ist.

1. Die Zutaten in `check.request` schreiben, eine pro Zeile (oder durch Semikolon getrennt) oder als JSON-Liste mit Texten oder `{"name","amount","unit"}`. In einer Zeile trennen Kommas Name, Zusatz und Menge, so wie meine Rezept-App sie liefert: `Zwiebeln, rot, 1`, `Cherrytomaten, bunt, 500g`, `Salz, 0.5 tl`, `Basilikum`. Eine Menge vor dem Namen (`380g Linguine`, `2EL Olivenöl`) oder dahinter (`Mehl 200g`) geht auch. `kg`, `g`, `l`, `ml`, `cl` und Stück werden verstanden, `EL`, `TL` und Ähnliches zählen nur als „vorhanden“. Gleiche Zutaten werden addiert.
2. Gefunden wird über Produktname, Gruppe oder Tag (ganze Wörter, keine Wortteile: `Cherrytomaten` wird nicht über `Tomaten` gefunden, ein Tag `Cherrytomaten` am Produkt lässt es zählen), `Mehl` zählt also alle Produkte der Gruppe Mehl zusammen. Bei Mengen in g oder ml wird der Bestand verglichen (500 g da, 200 g gebraucht: passt), Zählprodukte mit Packungsgröße wie `1 kg` werden umgerechnet. Ohne Menge reicht Bestand über null. Unbekannte Zutaten gelten als fehlend, damit auch Nicht-Lebensmittel auf der Liste landen.
3. `check.result` enthält das Ergebnis je Zutat, `check.available` und `check.missing` die Zeilen so, wie sie kamen, eine pro Zeile, `check.missing` kann also so direkt auf die Einkaufsliste, `check.allAvailable` ist `true`, wenn nichts fehlt.
4. Mit „Fehlende Zutaten auf die Einkaufsliste setzen“ in den Adapter-Einstellungen kommen die fehlenden nach jeder Prüfung auf die Einkaufsliste, jede Zeile so, wie sie kam. Im Modus „Bring Spezial“ erledigt das Zusammenführen der Spezifikation den Rest (`Cherrytomaten, bunt, 500g` zweimal wird zu `bunt 500g + 500g`), in den anderen Modi wird nur der Name geschrieben. Sonst schreibe ich `true` in `check.addMissing`, wenn ich sie auf der Liste haben will.

Hat ein Produkt einen Mindestbestand, rechne ich ihn mit ein: Einzukaufen ist die benötigte Menge minus Vorrat plus Mindestbestand. Bei 2 kg Zucker im Vorrat, 1 kg Mindestbestand und `Zucker, 3000 g` landet `Zucker, 2000g` auf der Liste. `check.request` wird nach jedem Lauf geleert.

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

Die Seite zeigt auch, welche Lagerorte des Bereichs fertig und welche noch offen sind. Nicht gescannte Artikel zählen als 0. Lieber von Hand prüfen? Variante **Liste**: gezählte Menge eintippen oder ✓ für „stimmt“. Korrekturen stehen im Verlauf als „Inventur“. Eine Erinnerung im Intervall stellst du bei den Benachrichtigungen ein.

## Scanner-Modus (ohne App)

Ein- und Auslagern mit gescannten Codes, ohne die App zu öffnen. Eingeschaltet wird er mit dem Datenpunkt `scanner.active`, die Codes kommen in `scanner.input` an, oder direkt von einem Scanner, der am ioBroker-Rechner steckt und dort als Tastatur erscheint (siehe unten).

- Produkt, dann Lagerort-Code: lagert 1 an diesem Lagerort ein.
- Produkt zweimal: entnimmt 1. Kommt kein Lagerort, wird dort entnommen, wo der Artikel das kürzeste MHD hat (ohne MHD: wo am meisten liegt).
- Produkt zweimal, dann Lagerort-Code: entnimmt 1 genau an diesem Lagerort.
- Lagerort-Code allein: startet den Einräum-Modus. Jedes danach gescannte Produkt wird an diesem Lagerort eingelagert (je 1, sofort gebucht). Derselbe Lagerort-Code beendet ihn, ein anderer wechselt zu diesem Lagerort, und nach 5 Minuten ohne Scan endet er von selbst. Praktisch für ein ganzes Regal, zum Beispiel mit Babygläschen.
- `SM:UNDO` macht die letzte Buchung rückgängig (außer Verschieben und Inventur). `SM:SPOIL` und danach das Produkt entnimmt 1 als verdorben, `SM:OPEN` und danach das Produkt markiert 1 Stück als geöffnet. `SM:DATE:<Tage>` und danach das Produkt setzt das MHD des gesamten ungeöffneten Bestands auf heute plus die Tage (`SM:DATE:0` entfernt es). Die Codes stehen auf der zweiten Seite des Steuer-Code-PDFs.
- `SM:QTY:5` und danach die Buchung: Die nächste Buchung zählt 5 statt 1. `SM:CANCEL` verwirft einen wartenden Scan.
- Die Zeit zwischen den Codes stellst du in den Adapter-Einstellungen ein (3 bis 120 Sekunden, Standard 10).

Die Inventur bleibt in der App, sie braucht das Display.

**Funk-Scanner anschließen (vorgesehen: Tera HW0009 mit 2.4G-Dongle).** Ich stecke den Dongle in den ioBroker-Rechner, der ihn als Tastatur erkennt, ein Treiber ist nicht nötig. Am Scanner wähle ich den 2.4G-Modus und koppele ihn mit den Barcodes aus der Anleitung mit dem Dongle. Das Tastaturlayout lasse ich auf US und das Ende des Codes auf Enter. In den Adapter-Einstellungen wähle ich bei „Scanner“ das Gerät aus und schalte den Modus über `scanner.active` ein. Der ioBroker-Benutzer braucht Zugriff auf das Gerät: `sudo adduser iobroker input` und die Instanz neu starten. Den Rest übernimmt der Adapter. Hat der Scanner einen Prefix oder Suffix, trage ich denselben Text in den beiden Einstellungen ein. Jeder Code landet auch in `scanner.lastCode`.

Weil der Scanner mit US-Tastaturlayout tippt, können Umlaute und manche Sonderzeichen verloren gehen. Für Lagerorte nutze ich deshalb den kurzen Scanner-Code: Im Lagerort-Editor tippe ich „Kurzen Scanner-Code verwenden“, speichere und drucke das Etikett neu (alte Etiketten gelten weiter). Unter Einstellungen druckt „Steuer-Codes als PDF“ die Mengen-Codes und den Abbrechen-Code. Der Scanner hat kein Display, das Ergebnis jedes Scans steht in `scanner.result`.

**Scanner ohne 2D (nur Strichcode).** Für einen Scanner, der nur 1D-Codes liest, stelle ich „Code auf Lagerort-Etiketten“ auf „Strichcode“. Alle Lagerort-Etiketten (auch Box- und Regal-Etikett) zeigen dann oben den Namen und darunter nur einen Code-128-Strichcode, das Steuer-Code-Blatt wird ebenfalls als Strichcodes gedruckt. Der Lagerort muss vorher gespeichert sein, weil der Code seine kurze ID enthält (`SM:L:<8 Zeichen>`). Das passt auf ein Etikett mit 50 × 30 mm.

## Vorschläge (Glühbirne)

Die Glühbirne oben sammelt drei Arten von Hinweisen: Gruppen-Vorschläge (ähnliche Produkte, die gemeinsam zählen könnten; einzelne Produkte lassen sich herausnehmen, ein Vorschlag lässt sich ignorieren), Mindestbestand-Vorschläge (nur für regelmäßig verbrauchte Produkte; ✓ übernimmt, ✕ verwirft) und eine fällige Inventur. Ohne Antippen ändert sich nichts.

## Benachrichtigungen

In den Adapter-Einstellungen einen Benachrichtigungs-Adapter wählen, das Ziel eintragen (z. B. eine Chat-ID) und den Test-Knopf nutzen. Du kannst dich melden lassen, wenn der Mindestbestand erreicht ist, täglich zur gewählten Uhrzeit über abgelaufene und ablaufende Produkte, und alle N Tage an eine Inventur erinnern.

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
