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
        [120, 'vollkornmehl|mandelmehl', 'vollkornmehl|mandelmehl'],
        [180, 'vollkornreis|naturreis', ''],
        [120, 'kokosraspel|trockenhefe|trocken-hefe|backhefe', ''],
        [180, 'sonnenblumenkern|kürbiskern|quinoa|hirse|amaranth|buchweizen', 'sonnenblumenkern|kürbiskern'],
        [180, 'chiasamen|leinsamen|sesam|mohn|panko|paniermehl|semmelbrösel|hefeflocken|röstzwiebel|sauerteig', 'brösel|leinsamen|chiasamen'],
        [180, 'mehl|backmischung|haferflocken|haferkleie|weizenkleie|dinkelflocken|reisflocken|granola|porridge|müsli', 'mehl|backmischung|haferflocken|müsli|porridge|kleie'],
        [365, 'backkakao|speisestärke|tortenguss|sahnesteif', ''],
        [270, 'schokotropfen|schokostreusel|bunte streusel|streusel|streudekor|streuseldekor|streudeko|zuckerperlen|schoko figuren|dekor', 'streusel|streudekor|streuseldekor|streudeko|dekor'],
        [365, 'glasur|kuvertüre|fondant|zuckerguss|zuckerschrift|lebkuchengewürz', 'glasur|kuvertüre|zuckerguss'],
        [365, 'backpulver', ''],
        [730, 'natron|vanillezucker|vanillinzucker|gelatine|speisefarbe|backfarbe|lebensmittelfarbe|back- und speisefarben', 'speisefarbe|backfarbe|lebensmittelfarbe'],
        [365, 'puddingpulver|pudding-pulver|vanille pudding|vanillepudding|götterspeise|soßenbinder|saucenbinder|dessertsauce pulver', ''],
        [365, 'kartoffelmehl|maisstärke|kartoffelstärke|backerbsen|suppeneinlage|frittaten|flädle|semmelknödel|knödelbrot|knödelpulver|kartoffelknödel pulver|kartoffelpüree pulver|püreeflocken|kartoffelflocken', 'backerbsen'],
        // Nudeln, Reis, Getreide, Hülsenfrüchte
        [365, 'nudel|pasta|teigwaren|spaghetti|fusilli|penne|makkaroni|tagliatelle|farfalle|lasagne|cannelloni|rigatoni|tortiglioni|linguine|bucatini|capellini|vermicelli|conchiglie|orecchiette|radiatori|rotelle|gemelli|cellentani|pipe rigate|farfalline|stelline|risoni|orzo|kritharaki|fregola|spätzle|spirelli|tortellini getrocknet|ramen|udon|soba|couscous|bulgur|polenta|grieß|graupen|dinkelkörner|weizenkörner|zartweizen|ebly', 'nudeln|nudel|pasta'],
        [365, 'reis|basmati|jasmin|risotto|arborio|carnaroli|sushi-reis|parboiled|milchreis|wildreis|langkorn|rundkorn', 'basmatireis|jasminreis|milchreis|risottoreis|parboiled'],
        [365, 'linsen|kichererbsen|trockenerbsen|trockenbohnen|erbsen getrocknet|bohnen getrocknet|mungbohnen|adzukibohnen|falafelmischung|belugalinsen|berglinsen|tellerlinsen', 'linsen'],
        // Getrocknetes und Eingelegtes
        [180, 'getrocknete tomaten in|tomaten in öl|sonnengetrocknete tomaten in', ''],
        [365, 'getrocknete tomaten|tomaten getrocknet|sonnengetrocknete', 'sonnengetrocknet'],
        [270, 'trockenfrüchte|rosinen|datteln|feigen getrocknet|aprikosen getrocknet|cranberries getrocknet|kokosflocken', 'trockenfrüchte'],
        [540, 'sauerkraut|preiselbeeren|essiggurken|gurken im glas|oliven(?!öl)|kapern|rote bete im glas|rotkohl im glas|pfefferoni|silberzwiebeln|peperoni im glas', 'sauerkraut'],
        // Konserven und Gläser
        [730, 'gehackte tomaten|passierte tomaten|stückige tomaten|geschälte tomaten|dosentomaten|pizzatomaten|tomatenpolpa|tomatenpüree|tomatenpassata|tomatenmark|tomaten in dosen|tomaten dose', 'passata|polpa'],
        [730, 'konserve|kidneybohnen|weiße bohnen|prinzessbohnen|brechbohnen|butterbohnen|kichererbsen dose|linsen dose|erbsen und möhren|champignons|gemüsemais|zuckermais|bambussprossen|wasserkastanien|artischockenherzen|palmherzen|mandarinen|ananas|pfirsiche|fruchtcocktail|apfelmus|apfelmark|kokosmilch|kokoscreme|kondensmilch|dosenmilch', 'konserve'],
        // Würzen
        [365, 'gemüsebrühe|brühe|brühwürfel|bouillon|fond|instantbrühe', 'brühe|brühwürfel'],
        [365, 'gewürz|pfeffer|masala|curry|paprikapulver|chilipulver|chiliflocken|zimt|kurkuma|oregano|basilikum|thymian|rosmarin|lorbeer|muskat|koriander|kreuzkümmel|kümmel|ingwerpulver|knoblauchgranulat|zwiebelpulver|petersilie getrocknet|majoran|salbei|dill getrocknet|kräuter der provence|italienische kräuter|pizzagewürz|paprika edelsüß|vanilleschote|sojasauce|worcestersauce|tabasco', 'gewürz|pfeffer|masala|curry'],
        [270, 'teriyaki|sriracha|sweet-chili|sweet chili|sambal|currypaste|tahin|sesampaste|ketchup|senf|bbq|grillsauce|currysauce|chilisauce|ajvar|harissa', 'ketchup|grillsauce'],
        [180, 'mayonnaise|mayo|pesto|salatsauce|dressing', 'mayonnaise|pesto'],
        [180, 'speiseöl|olivenöl|sonnenblumenöl|rapsöl|kokosöl|sesamöl|pflanzenöl', 'olivenöl|sonnenblumenöl|rapsöl|speiseöl'],
        [365, 'agavendicksaft|dicksaft', ''],
        [120, 'saft|zitronensaft|limettensaft|apfelsaft|orangensaft|multivitaminsaft|traubensaft', 'saft'],
        [365, 'nudelsauce|tomatensauce|pastasauce|bolognese glas|sirup|agavendicksaft|dicksaft|sodastream', 'nudelsauce|tomatensauce|sirup'],
        // Aufstriche, Süßes
        [365, 'marmelade|konfitüre|gelee|nuss-nougat|nutella|nussnougat|erdnussbutter|erdnusscreme|schokocreme|honigaufstrich|fruchtaufstrich', 'marmelade|konfitüre|nougatcreme'],
        [90, 'gemahlene nüsse|gemahlene mandeln|gemahlene haselnüsse|mandelmus|nussmus|haselnussmus', 'gemahlene'],
        [180, 'nüsse|mandeln|erdnüsse|cashew|walnuss|haselnuss|pistazien|studentenfutter', 'nüsse|mandeln'],
        [270, 'schokolade|kekse|keks|butterkekse|haferkekse|doppelkekse|löffelbiskuit|amarettini|cantuccini|spekulatius|lebkuchen|zimtsterne|gebäck|waffeln|riegel|müsliriegel|proteinriegel|fruchtriegel|bonbon|karamell|gummibär|fruchtgummi|weingummi|lakritz|marshmallow|schokoriegel|pralinen|bonbons|cracker|knäckebrot|zwieback|reiswaffeln|maiswaffeln|brausepulver', 'schokolade|kekse|riegel|gebäck'],
        [120, 'chips|snack|popcorn|salzstangen|salzbrezeln|brezeln|tortillachips|nachos|flips|erdnussflips', 'chips|flips'],
        [180, 'cornflakes|corn flakes|frühstückscerealien|cerealien|schokopops|knusper', 'cerealien'],
        // Suppen, Instant, Getränke
        [540, 'suppe|tütensuppe|instantsuppe|nudelsuppe|heiße zitrone|heiße himbeere|heiße kirsche|instanttee|teepulver|grießbrei|kindermüsli|kinderporridge|instant-grießbrei|erbsensuppe', 'suppe'],
        [540, 'tee|kräutertee|früchtetee|schwarztee|grüntee|rooibos|kakao|trinkschokolade|kakaopulver|getränkepulver|cappuccino|kaffeeweißer|milchpulver|instantkaffee|löslicher kaffee|kaffee|espresso|kaffeebohnen|kaffeekapseln|kaffeepads|pads', 'tee|kaffee|kakao'],
        [365, 'mineralwasser|tafelwasser|sprudelwasser|eistee|getränkesirup', ''],
        [1095, 'zucker|honig|essig|salz|puderzucker|meersalz|speisesalz|jodsalz|flor de sal', 'zucker|honig|essig|meersalz'],
        [90, 'h-milch|haltbare milch|haltbarmilch|uht|hafermilch|sojamilch|mandelmilch|reismilch|haferdrink|sojadrink|mandeldrink|reisdrink|kokosdrink|erbsendrink|cashewdrink|pflanzendrink', 'haferdrink|sojadrink|mandeldrink|reisdrink|kokosdrink|erbsendrink|cashewdrink|pflanzendrink'],
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
     * @param {string} [name] product name (and group): only this is checked for fresh goods, categories and tags often mention milk or meat
     * @returns {number} suggested shelf life in days, 0 if unknown
     */
    function guessShelfLife(text, name) {
        const t = String(text || '').toLowerCase();
        if (!t) {
            return 0;
        }
        const n = String(name === undefined ? t : name).toLowerCase();
        const soup = /suppe|brei(pulver)?\b|milchbrei/.test(n) && !/frisch|kühl|gekühlt/.test(n);
        if (!soup && EXCLUDE.test(n)) {
            return 0;
        }
        for (const [days, re] of RULES) {
            if (re.test(t)) {
                return days;
            }
        }
        return 0;
    }

    // Haltbarkeit nach dem Öffnen (Tage), Spezielles zuerst. Gleicher Aufbau wie oben, hier auch für Frisches.
    const OPENED = [
        [1, 'hackfleisch|hack|mett|tartar', ''],
        [2, 'fleisch|geflügel|hähnchen|hühnchen|steak|filet|fisch|lachs|garnelen|frischmilch|sahne|schlagsahne|tomaten dose|dosentomaten|passierte tomaten|gehackte tomaten|pizzatomaten|passata|mais dose|kichererbsen dose|bohnen dose|linsen dose|gemüsekonserve', 'passata'],
        [3, 'milch|h-milch|milch haltbar|kondensmilch|kokosmilch|quark|frischkäse|schmand|crème fraîche|creme fraiche|aufschnitt|schinken|wurst|salami|tofu|hummus|konserve|ananas|pfirsiche|mandarinen|fruchtcocktail|mozzarella', 'konserve|vollmilch|fettarme milch|laktosefreie milch'],
        [4, 'hafermilch|haferdrink|sojamilch|sojadrink|mandelmilch|mandeldrink|reismilch|reisdrink|kokosdrink|erbsendrink|cashewdrink|pflanzendrink', 'haferdrink|sojadrink|mandeldrink|reisdrink|kokosdrink|erbsendrink|cashewdrink|pflanzendrink'],
        [90, 'agavendicksaft|dicksaft|reissirup', ''],
        [5, 'pesto|joghurt|yoghurt|skyr|kefir|buttermilch|apfelmus|apfelmark|saft|nudelsauce|tomatensauce|pastasauce|bolognese|currysauce|sauce glas|suppe|erbsensuppe|gnocchi|pasta frisch|tortellini|fertiggericht', 'nudelsauce|tomatensauce|saft|pesto'],
        [7, 'oliven(?!öl)|sauerkraut|preiselbeeren|rotkohl|rote bete|kapern|champignons|artischocken|antipasti|getrocknete tomaten|käse|scheibenkäse|feta|salat|frischhefe|hefewürfel|frische hefe|kaffeeweißer', 'antipasti'],
        [14, 'essiggurken|gurken im glas|silberzwiebeln|pfefferoni|margarine|butter|dressing|salatsauce', ''],
        [30, 'marmelade|konfitüre|gelee|sirup|mayonnaise|mayo|remoulade|hefe|backhefe|grillsauce|bbq|chips|snack|popcorn|salzstangen|brezeln|nachos|flips|kekse|keks|gebäck|waffeln|kaffee|espresso|kaffeebohnen|kaffeepads', 'marmelade|konfitüre|chips|sirup'],
        [60, 'müsli|granola|cornflakes|flakes|porridge|haferflocken|knäckebrot|zwieback|reiswaffeln|maiswaffeln|cerealien|kindermüsli|kinderporridge|kakao|trinkschokolade|instantkaffee|milchpulver|brühe|brühwürfel|bouillon|backpulver|trockenhefe|nüsse|mandeln|erdnüsse|cashew|walnuss|haselnuss|studentenfutter|trockenfrüchte|rosinen|datteln', 'müsli|granola|nüsse'],
        [90, 'ketchup|senf|sojasauce|worcestersauce|teriyaki|sriracha|sambal|tabasco|ajvar|harissa|currypaste|nutella|nuss-nougat|nussnougat|erdnussbutter|erdnusscreme|tahin|schokocreme|honigaufstrich|speiseöl|olivenöl|sonnenblumenöl|rapsöl|kokosöl|sesamöl|pflanzenöl|schokolade|kuvertüre|schokotropfen|riegel|bonbon|gummibär|fruchtgummi|marshmallow|lakritz|pralinen|streusel|glasur|fondant|mehl|panko|paniermehl|sesam|leinsamen|chiasamen|kürbiskern|sonnenblumenkern|kokosraspel|kokosflocken', 'ketchup|senf'],
        [180, 'tee|kräutertee|früchtetee|schwarztee|grüntee|rooibos|gewürz|pfeffer|masala|curry|paprikapulver|zimt|kurkuma|oregano|basilikum|thymian|rosmarin|lorbeer|muskat|koriander|kümmel|majoran|salbei|vanille|speisestärke|maisstärke|kartoffelstärke|gelatine|puddingpulver|götterspeise', 'gewürz|tee'],
        [365, 'zucker|honig|essig|salz|nudel|pasta|reis|linsen|couscous|bulgur|quinoa|polenta|grieß|graupen|buchweizen|hirse|kichererbsen|trockenerbsen|trockenbohnen', 'zucker|honig|nudeln|reis'],
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
     * @returns {number} suggested shelf life after opening in days, 0 if unknown
     */
    function guessOpenedDays(text) {
        const t = String(text || '').toLowerCase();
        if (!t) {
            return 0;
        }
        for (const [days, re] of OPENED) {
            if (re.test(t)) {
                return days;
            }
        }
        return 0;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = { guessShelfLife, guessOpenedDays };
    } else {
        root.guessShelfLife = guessShelfLife;
        root.guessOpenedDays = guessOpenedDays;
    }
})(typeof window !== 'undefined' ? window : globalThis);
