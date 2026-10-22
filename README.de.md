# ioBroker.shelfmate

ShelfMate ist ein Haushalts-Vorratslager für ioBroker. Es läuft als installierbare Web-App (iPhone-Homescreen / Android), die direkt vom Adapter ausgeliefert wird. Die vollständige Beschreibung steht in der englischen [README.md](README.md).

## Funktionen

- Barcodes und QR-Codes der Lagerorte per Handykamera scannen
- Produktstammdaten (Open Food Facts), Lagerbereiche und Lagerorte mit druckbaren QR-Codes
- Bestand pro Lagerort, Verschieben, Historie, Offline-Warteschlange in der App
- Produktgruppen und Mindestbestand mit automatischem Eintrag auf die Einkaufsliste
- Suche mit Vorschlägen beim Tippen („Nut“ schlägt „Nutella“ vor)
- Mindesthaltbarkeit (MHD): aus / pro Produkt / pro Einlagerung, mit Warnung vor Ablauf
- Optional: Standard-Haltbarkeit, Haltbarkeit nach dem Öffnen, Geöffnet und Verdorben markieren, letzte Buchung rückgängig
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
3. Die Etikettengröße einmal unter **Einstellungen / Etiketten** eintragen (z. B. 50 × 30 mm). Für das große Regal-Etikett, das Boxen-Etikett und den vollflächigen Code stelle ich dort eine eigene Größe ein (A6, A5 oder A4). Dort wähle ich auch, ob Lagerort-Etiketten einen QR-Code oder einen Code-128-Strichcode tragen (oben der Name, darunter nur der Strichcode; der Lagerort muss vorher gespeichert sein). Welche Knöpfe die App zeigt, stellst du in den Adapter-Einstellungen ein.
4. Das Bild drucken (siehe „Etiketten drucken“) und an Regal oder Box kleben.

### Produkte ohne Barcode
Produkt von Hand anlegen und einen eigenen EAN-13-Code erzeugen lassen. Den Code als Etikett drucken und aufkleben. Ein eigenes Produktbild kann hochgeladen werden, es wird automatisch verkleinert.

### Mindestbestand und Einkaufsliste
1. Beim Produkt einen **Mindestbestand** eintragen. Bei Produkten einer Gruppe (z. B. alle Mehlsorten) an der Gruppe einstellen, der Bestand zählt gemeinsam.
2. In den Adapter-Einstellungen den Einkaufslisten-Modus wählen.
3. Fällt der Bestand auf den Mindestbestand, kommt das Produkt auf die Liste. Der Haken in der Übersicht zeigt, was auf der Liste steht; antippen nimmt es wieder herunter.

### Mindesthaltbarkeit
Für Trockenware wie Nudeln, Reis, Mehl, Konserven oder Süßes schlägt die App beim Einlagern automatisch eine Haltbarkeit aus einer eingebauten Liste vor (erkannt am Namen, an der Kategorie und an den Tags). Frische Ware wie Joghurt bekommt keine. In den Adapter-Einstellungen lässt sich das abschalten. „Haltbarkeit automatisch eintragen“ in den App-Einstellungen trägt den Vorschlag nachträglich bei allen vorhandenen Produkten ohne Wert ein. Im Modus „pro Einlagerung“ bekommt auch Bestand ohne MHD eins: der Tag der Einlagerung (aus der Historie) plus die Haltbarkeit. Ein MHD lässt sich auch nachträglich eintragen oder ändern (Modus „pro Einlagerung“): Auf der Produktseite hat jede Zeile einen Bearbeiten-Knopf. Bestand ohne Datum steht als „Ohne MHD“ da; antippen, bei Bedarf die Menge angeben und das Datum eintippen oder per Knopf wählen. Genauso lässt sich ein Datum korrigieren oder entfernen. Es steht in der Historie und lässt sich rückgängig machen. Im Modus „pro Produkt“ steht das MHD im Produktformular. Das MHD-Feld nimmt Kurzeingaben: `+3d` ist in 3 Tagen, `+2w` in 2 Wochen, `+1m` in einem Monat, `+1y` in einem Jahr, `12/26` ist Ende Dezember 2026 (wie auf vielen Packungen aufgedruckt), `2412` oder `24.12.` der nächste 24. Dezember, `24.12.26` ein volles Datum, `x` heißt kein Datum. Darunter zeigt eine Vorschau, was verstanden wurde. Knöpfe für +1 bis +14 Tage, +3w, +1m, +3m, +6m und +1y füllen es mit einem Tipp. Optional kannst du je Produkt eine Standard-Haltbarkeit in Tagen eintragen (MHD wird beim Einlagern damit vorbelegt, bei „pro Einlagerung“) und eine Haltbarkeit nach dem Öffnen. „Als geöffnet markieren“ auf der Produktseite trennt eine Packung ab, offene Packungen werden getrennt aufgeführt und zuerst verbraucht; „Öffnen rückgängig“ macht das wieder rückgängig. Beim Entnehmen kannst du „Verdorben“ statt „Verbraucht“ wählen, das zählt nicht in den Verbrauch. In der Historie macht ein Knopf die letzte Buchung rückgängig. In den Einstellungen setzt „Statistik zurücksetzen“ Verbrauch und Vorschläge auf null, die Historie bleibt.

Modus in den Adapter-Einstellungen wählen: pro Produkt oder pro Einlagerung. Bei „pro Einlagerung“ gibst du das Datum beim Einlagern an, beim Entnehmen wird immer das älteste zuerst verbraucht. Abgelaufene und bald ablaufende Produkte werden markiert und können per Benachrichtigung gemeldet werden.

### Ein ganzes Regal einräumen
1. **Lagerorte / Einräumen** öffnen.
2. Den QR-Code des Lagerorts scannen (oder in der Liste wählen), dann die Produkte nacheinander mit der Kamera, einem Scanner oder per Eintippen der EAN scannen. Jeder Scan zählt 1, die Liste zeigt die Mengen und ich kann sie korrigieren.
3. Denselben Lagerort-Code nochmal scannen (oder **Einlagern** tippen). Alles wird auf einmal eingelagert. Produkte nach Gewicht oder Volumen zählen als ganze Packungen und brauchen die Packungsgröße in g oder ml.
4. Ein Barcode, der noch nicht in der Liste ist, wird bei Open Food Facts gesucht, das Produkt wird angelegt und gleich mitgezählt. Kennen ihn die Datenbanken auch nicht, entsteht ein Produkt „Unbekanntes Produkt <Barcode>“, das ebenfalls zählt und als Vorschlag erscheint (Glühbirne, „Neue Produkte bearbeiten“), bis ich es bearbeitet und gespeichert habe.

### Inventur per Scan
1. **Lagerorte / Inventur** öffnen und die Variante **Scannen** wählen (Einstellungen oder auf der Seite).
2. Den QR-Code des Lagerorts scannen. „Inventur gestartet“ bestätigt das.
3. Alle Artikel dieses Lagerorts scannen; jeder Scan zählt +1 (zweimal derselbe Artikel heißt zwei).
4. **Denselben** Lagerort-QR nochmal scannen. Damit ist die Inventur des Lagerorts abgeschlossen: Der Bestand wird korrigiert, der Lagerort als erledigt markiert, und eine Zusammenfassung zeigt, was gezählt wurde (mit Sollmenge, wenn sie abweicht).
5. Zum Weitermachen den QR-Code des nächsten Lagerorts scannen. Ein anderer Lagerort wird erst angenommen, wenn der aktuelle abgeschlossen ist.

Die Seite zeigt auch, welche Lagerorte des Bereichs fertig und welche noch offen sind. Nicht gescannte Artikel zählen als 0. Lieber von Hand prüfen? Variante **Liste**: gezählte Menge eintippen oder ✓ für „stimmt“. Korrekturen stehen im Verlauf als „Inventur“. Eine Erinnerung im Intervall stellst du bei den Benachrichtigungen ein.

### Scanner-Modus (ohne App)

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

### Vorschläge (Glühbirne)
Die Glühbirne oben sammelt drei Arten von Hinweisen: Gruppen-Vorschläge (ähnliche Produkte, die gemeinsam zählen könnten; einzelne Produkte lassen sich herausnehmen, ein Vorschlag lässt sich ignorieren), Mindestbestand-Vorschläge (nur für regelmäßig verbrauchte Produkte; ✓ übernimmt, ✕ verwirft) und eine fällige Inventur. Ohne Antippen ändert sich nichts.

### Benachrichtigungen
In den Adapter-Einstellungen einen Benachrichtigungs-Adapter wählen, das Ziel eintragen (z. B. eine Chat-ID) und den Test-Knopf nutzen. Du kannst dich melden lassen, wenn der Mindestbestand erreicht ist, täglich zur gewählten Uhrzeit über abgelaufene und ablaufende Produkte, und alle N Tage an eine Inventur erinnern.

### Export und Backup
Unter **Einstellungen / Daten**: **JSON-Backup** (herunterladen und wieder importieren), **Bestand als CSV** (für Excel o. Ä.) und **Bestand als PDF** (druckbare Liste nach Lagerort; öffnet das Teilen-Menü zum Sichern oder Drucken).

### Offline nutzen
Sobald das Zertifikat vertraut ist, startet die App auch ohne Verbindung. Buchungen und Einkaufslisten-Einträge, die offline entstehen, werden gesammelt und automatisch gesendet, sobald die Verbindung wieder da ist.

### Zutaten-Prüfung

Hat ein Produkt einen Mindestbestand, rechne ich ihn mit ein: Einzukaufen ist die benötigte Menge minus Vorrat plus Mindestbestand. Bei 2 kg Zucker im Vorrat, 1 kg Mindestbestand und `Zucker, 3000 g` landet `Zucker, 2000g` auf der Liste. `check.request` wird nach jedem Lauf geleert.

Damit vergleiche ich die Zutaten meiner geplanten Rezepte mit dem, was ich zu Hause habe. ShelfMate kennt keine Rezepte, es bekommt nur eine Zutatenliste und sagt, was da ist.

1. Die Zutaten in `check.request` schreiben, eine pro Zeile (oder durch Semikolon getrennt) oder als JSON-Liste mit Texten oder `{"name","amount","unit"}`. In einer Zeile trennen Kommas Name, Zusatz und Menge, so wie meine Rezept-App sie liefert: `Zwiebeln, rot, 1`, `Cherrytomaten, bunt, 500g`, `Salz, 0.5 tl`, `Basilikum`. Eine Menge vor dem Namen (`380g Linguine`, `2EL Olivenöl`) oder dahinter (`Mehl 200g`) geht auch. `kg`, `g`, `l`, `ml`, `cl` und Stück werden verstanden, `EL`, `TL` und Ähnliches zählen nur als „vorhanden“. Gleiche Zutaten werden addiert.
2. Gefunden wird über Produktname, Gruppe oder Tag (ganze Wörter, keine Wortteile: `Cherrytomaten` wird nicht über `Tomaten` gefunden, ein Tag `Cherrytomaten` am Produkt lässt es zählen), `Mehl` zählt also alle Produkte der Gruppe Mehl zusammen. Bei Mengen in g oder ml wird der Bestand verglichen (500 g da, 200 g gebraucht: passt), Zählprodukte mit Packungsgröße wie `1 kg` werden umgerechnet. Ohne Menge reicht Bestand über null. Unbekannte Zutaten gelten als fehlend, damit auch Nicht-Lebensmittel auf der Liste landen.
3. `check.result` enthält das Ergebnis je Zutat, `check.available` und `check.missing` die Zeilen so, wie sie kamen, eine pro Zeile, `check.missing` kann also so direkt auf die Einkaufsliste, `check.allAvailable` ist `true`, wenn nichts fehlt.
4. Mit „Fehlende Zutaten auf die Einkaufsliste setzen“ in den Adapter-Einstellungen kommen die fehlenden nach jeder Prüfung auf die Einkaufsliste, jede Zeile so, wie sie kam. Im Modus „Bring Spezial“ erledigt das Zusammenführen der Spezifikation den Rest (`Cherrytomaten, bunt, 500g` zweimal wird zu `bunt 500g + 500g`), in den anderen Modi wird nur der Name geschrieben. Sonst schreibe ich `true` in `check.addMissing`, wenn ich sie auf der Liste haben will.

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

## Installation

Über den Admin (Adapter).
Danach eine Instanz anlegen und `https://<Host>:8120/` öffnen. Voraussetzungen: js-controller >= 6.0.11, admin >= 7.6.20, Node.js >= 22.

## Datenpunkte

`stats.products`, `stats.locations`, `stats.lowStockCount`, `stats.lowStockList`, `stats.inventory`, `stats.inventoryHtml`, `stats.consumption`, `stats.expiringCount`, `stats.expiring`, `stats.expiringHtml`, `shopping.addItem`, `check.request`, `check.result`, `check.available`, `check.missing`, `check.allAvailable`, `check.addMissing`, `scanner.active`, `scanner.input`, `scanner.lastCode`, `scanner.result`, `info.connection`.

## In Arbeit und geplant

ShelfMate wird aktiv weiterentwickelt. Geplant (ohne Zusage, ohne Reihenfolge):

- **Scanner-Anbindung**: Scanner mit seriellem Anschluss (USB-Kabel) und Bluetooth-Scanner direkt am Rechner

Ideen und Fehler gerne als [GitHub-Issue](https://github.com/backfisch88/ioBroker.shelfmate/issues) melden.

## Lizenz

MIT License, Copyright (c) 2026 Henrik Schoenhofen
