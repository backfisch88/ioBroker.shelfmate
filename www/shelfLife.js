/*
 * Standard-Haltbarkeit für typische Trockenware, Konserven und Haltbares (Tage ab Einlagern, geschätztes MHD).
 * Frische und gekühlte Ware steht bewusst nicht drin, im Zweifel gibt es lieber keinen Wert als einen falschen.
 *
 * Aufbau jeder Regel: [Tage, 'Wörter am Wortanfang', 'Wörter an beliebiger Stelle (Zusammensetzungen)'].
 * Wörter mit | trennen, Kleinbuchstaben. Es gilt die erste passende Regel, Spezielles steht also vor Allgemeinem.
 */
(function (root) {
    const L = 'a-zäöüß';
    // Frisches und Gekühltes: wird nie automatisch datiert
    const EXCLUDE = new RegExp(
        [
            `(?:^|[^${L}])(?:frisch|frische|frischer|gekühlt|kühl|kühlregal|teig(?!waren)|hack)(?![${L}])`,
            `(?:^|[^${L}])(?:eier|ei)(?![${L}])`,
            'joghurt|yoghurt|quark|käse|wurst|schinken|aufschnitt|hackfleisch|fischstäbchen|fertiggericht',
            '(?:^|[^a-zäöüß])(?:sahne|butter|margarine|milch|skyr|kefir|buttermilch)(?![a-zäöüß])(?!.*(?:pulver|h-|haltbar|uht))',
            'lachs|forelle|thunfisch|hering|sardine|makrele|salami|speck|fleisch(?!klöß)|salat|tofu|hummus',
        ].join('|'),
    );
    const RULES = [
        // Mehl, Backen
        [90, 'vollkornmehl|mandelmehl|vollkornreis|naturreis', 'vollkornmehl|mandelmehl'],
        [120, 'kokosraspel|sonnenblumenkern|kürbiskern|trockenhefe|trocken-hefe|backhefe', 'sonnenblumenkern|kürbiskern'],
        [180, 'chiasamen|leinsamen|sesam|mohn|panko|paniermehl|semmelbrösel|hefeflocken|röstzwiebel|sauerteig', 'brösel|leinsamen|chiasamen'],
        [180, 'mehl|backmischung|haferflocken|haferkleie|weizenkleie|dinkelflocken|reisflocken|granola|porridge|müsli', 'mehl|backmischung|haferflocken|müsli|porridge|kleie'],
        [270, 'backkakao|schokotropfen|schokostreusel|speisestärke|tortenguss|sahnesteif|bunte streusel|streusel|streudekor|streuseldekor|streudeko|zuckerperlen|schoko figuren|dekor', 'streusel|streudekor|streuseldekor|streudeko|dekor'],
        [365, 'glasur|kuvertüre|fondant|zuckerguss|zuckerschrift|lebkuchengewürz', 'glasur|kuvertüre|zuckerguss'],
        [730, 'backpulver|natron|vanillezucker|vanillinzucker|gelatine|speisefarbe|backfarbe|lebensmittelfarbe|back- und speisefarben', 'speisefarbe|backfarbe|lebensmittelfarbe'],
        [540, 'puddingpulver|pudding-pulver|vanille pudding|vanillepudding|götterspeise|soßenbinder|saucenbinder|dessertsauce pulver', ''],
        [365, 'kartoffelmehl|maisstärke|kartoffelstärke|backerbsen|suppeneinlage|semmelknödel|knödelbrot|knödelpulver|kartoffelknödel pulver|kartoffelpüree pulver|püreeflocken|kartoffelflocken', 'backerbsen'],
        // Nudeln, Reis, Getreide, Hülsenfrüchte
        [365, 'nudel|pasta|teigwaren|spaghetti|fusilli|penne|makkaroni|tagliatelle|farfalle|lasagne|cannelloni|rigatoni|tortiglioni|linguine|bucatini|capellini|vermicelli|conchiglie|orecchiette|radiatori|rotelle|gemelli|cellentani|pipe rigate|farfalline|stelline|risoni|orzo|kritharaki|fregola|spätzle|spirelli|tortellini getrocknet|ramen|udon|soba|couscous|bulgur|quinoa|hirse|polenta|grieß|graupen|buchweizen|amaranth|dinkelkörner|weizenkörner|zartweizen|ebly', 'nudeln|nudel|pasta'],
        [365, 'reis|basmati|jasmin|risotto|arborio|carnaroli|sushi-reis|parboiled|milchreis|wildreis|langkorn|rundkorn', 'basmatireis|jasminreis|milchreis|risottoreis|parboiled'],
        [365, 'linsen|kichererbsen|trockenerbsen|trockenbohnen|erbsen getrocknet|bohnen getrocknet|mungbohnen|adzukibohnen|falafelmischung|belugalinsen|berglinsen|tellerlinsen', 'linsen'],
        // Getrocknetes und Eingelegtes
        [365, 'getrocknete tomaten|tomaten getrocknet|sonnengetrocknete', 'sonnengetrocknet'],
        [270, 'trockenfrüchte|rosinen|datteln|feigen getrocknet|aprikosen getrocknet|cranberries getrocknet|kokosflocken', 'trockenfrüchte'],
        [540, 'sauerkraut|preiselbeeren|essiggurken|gurken im glas|oliven|kapern|rote bete im glas|rotkohl im glas|pfefferoni|silberzwiebeln|peperoni im glas', 'sauerkraut'],
        // Konserven und Gläser
        [730, 'gehackte tomaten|passierte tomaten|stückige tomaten|geschälte tomaten|dosentomaten|pizzatomaten|tomatenpolpa|tomatenpüree|tomatenpassata|tomatenmark|tomaten in dosen|tomaten dose', 'passata|polpa'],
        [730, 'konserve|kidneybohnen|weiße bohnen|prinzessbohnen|brechbohnen|butterbohnen|kichererbsen dose|linsen dose|erbsen und möhren|champignons|gemüsemais|zuckermais|bambussprossen|wasserkastanien|artischockenherzen|palmherzen|mandarinen|ananas|pfirsiche|fruchtcocktail|apfelmus|apfelmark|kokosmilch|kokoscreme|kondensmilch|dosenmilch', 'konserve'],
        // Würzen
        [540, 'gemüsebrühe|brühe|brühwürfel|bouillon|fond|instantbrühe', 'brühe|brühwürfel'],
        [365, 'gewürz|pfeffer|masala|curry|paprikapulver|chilipulver|chiliflocken|zimt|kurkuma|oregano|basilikum|thymian|rosmarin|lorbeer|muskat|koriander|kreuzkümmel|kümmel|ingwerpulver|knoblauchgranulat|zwiebelpulver|petersilie getrocknet|majoran|salbei|dill getrocknet|kräuter der provence|italienische kräuter|pizzagewürz|paprika edelsüß|vanilleschote|sojasauce|worcestersauce|tabasco', 'gewürz|pfeffer|masala|curry'],
        [270, 'teriyaki|sriracha|sweet-chili|sweet chili|sambal|currypaste|tahin|sesampaste|ketchup|mayonnaise|mayo|senf|bbq|grillsauce|currysauce|chilisauce|ajvar|harissa|pesto|salatsauce|dressing', 'ketchup|mayonnaise|grillsauce'],
        [365, 'speiseöl|olivenöl|sonnenblumenöl|rapsöl|kokosöl|sesamöl|pflanzenöl|öl|sauce|soße|nudelsauce|tomatensauce|pastasauce|bolognese glas|saft|zitronensaft|limettensaft|sirup|sodastream', 'öl|nudelsauce|tomatensauce|saft|sirup'],
        // Aufstriche, Süßes
        [540, 'marmelade|konfitüre|gelee|nuss-nougat|nutella|nussnougat|erdnussbutter|erdnusscreme|schokocreme|honigaufstrich|fruchtaufstrich', 'marmelade|konfitüre|nougatcreme'],
        [270, 'schokolade|kekse|keks|butterkekse|haferkekse|doppelkekse|löffelbiskuit|amarettini|cantuccini|spekulatius|lebkuchen|zimtsterne|gebäck|waffeln|riegel|müsliriegel|proteinriegel|fruchtriegel|bonbon|karamell|gummibär|fruchtgummi|weingummi|lakritz|marshmallow|schokoriegel|pralinen|bonbons|nüsse|mandeln|erdnüsse|cashew|walnuss|haselnuss|pistazien|studentenfutter|cracker|knäckebrot|zwieback|reiswaffeln|maiswaffeln|brausepulver', 'schokolade|kekse|riegel|nüsse|mandeln|gebäck'],
        [60, 'amerikaner|mini amerikaner|muffins|donuts|berliner', ''],
        [180, 'chips|snack|popcorn|salzstangen|salzbrezeln|brezeln|tortillachips|nachos|flips|erdnussflips|cornflakes|corn flakes|frühstückscerealien|cerealien|schokopops|knusper', 'chips|flips|cerealien'],
        // Suppen, Instant, Getränke
        [540, 'suppe|tütensuppe|instantsuppe|nudelsuppe|heiße zitrone|heiße himbeere|heiße kirsche|instanttee|teepulver|milchbrei|breipulver|babynahrung pulver|grießbrei|kindermüsli|kinderporridge|instant-grießbrei|erbsensuppe', 'suppe|milchbrei'],
        [540, 'tee|kräutertee|früchtetee|schwarztee|grüntee|rooibos|kakao|trinkschokolade|kakaopulver|getränkepulver|cappuccino|kaffeeweißer|milchpulver|instantkaffee|löslicher kaffee|kaffee|espresso|kaffeebohnen|kaffeekapseln|kaffeepads|pads', 'tee|kaffee|kakao'],
        [365, 'mineralwasser|wasser|eistee|apfelsaft|orangensaft|multivitaminsaft|traubensaft|getränkesirup', 'saft'],
        [1095, 'zucker|honig|essig|salz|puderzucker|meersalz|speisesalz|jodsalz|flor de sal', 'zucker|honig|essig|meersalz'],
        [120, 'h-milch|haltbare milch|haltbarmilch|uht|hafermilch|sojamilch|mandelmilch|reismilch|haferdrink|sojadrink|mandeldrink|reisdrink|kokosdrink|erbsendrink|cashewdrink|barista', 'drink'],
    ].map(([days, start, anywhere]) => {
        const parts = [];
        if (start) {
            parts.push(`(?:^|[^${L}])(?:${start})`);
        }
        if (anywhere) {
            parts.push(`(?:${anywhere})`);
        }
        return [days, new RegExp(parts.join('|'))];
    });

    /**
     * @param {string} text product name, category, group and tags as one text
     * @returns {number} suggested shelf life in days, 0 if unknown
     */
    function guessShelfLife(text) {
        const t = String(text || '').toLowerCase();
        if (!t) {
            return 0;
        }
        const soup = /suppe|brei(pulver)?\b|milchbrei/.test(t) && !/frisch|kühl|gekühlt/.test(t);
        if (!soup && EXCLUDE.test(t)) {
            return 0;
        }
        for (const [days, re] of RULES) {
            if (re.test(t)) {
                return days;
            }
        }
        return 0;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = { guessShelfLife };
    } else {
        root.guessShelfLife = guessShelfLife;
    }
})(typeof window !== 'undefined' ? window : globalThis);
