/* Standard-Haltbarkeit für typische Trockenware und Konserven (Tage ab Einlagern). Frische Ware steht bewusst nicht drin. */
(function (root) {
    const EXCLUDE = /frisch|salat|kühl|gekühlt|joghurt|yoghurt|quark|käse|wurst|schinken|fleisch|fisch|sahne|butter|ei(er)?\b|fertiggericht|teig(?!waren)|aufschnitt|hack/;
    const RULES = [
        [365, 'nudel|pasta|teigwaren|spaghetti|fusilli|penne|makkaroni|tagliatelle|farfalle|lasagne|spätzle|couscous|bulgur|quinoa|hirse|polenta|grieß'],
        [365, 'reis|linsen|kichererbsen|trockenerbsen|trockenbohnen|bohnen getrocknet'],
        [730, 'konserve|dose|dosen|passierte tomaten|gehackte tomaten|tomatenmark|mais|kidneybohnen|weiße bohnen|brühe|bouillon|fond|gewürz|backpulver|natron|vanillezucker|puddingpulver|speisestärke|gelatine'],
        [540, 'babygläschen|babynahrung|babybrei|gläschen|marmelade|konfitüre|gelee|nuss-nougat|nutella|tee|kakao|erdnussbutter|sirup|senf|essiggurken|gurken im glas|sauerkraut|oliven|kapern'],
        [365, 'mehl|haferflocken|müsli|cornflakes|flakes|knäckebrot|zwieback|toastbrot haltbar|speiseöl|olivenöl|sonnenblumenöl|rapsöl|ketchup|mayonnaise|sauce|soße|pesto|kaffee|espresso|kaffeebohnen|mineralwasser|wasser|saft|trockenfrüchte|rosinen|datteln|nudelsauce'],
        [1095, 'zucker|honig|essig|salz'],
        [270, 'schokolade|kekse|keks|gebäck|waffeln|riegel|bonbon|gummibär|nüsse|mandeln|erdnüsse|cashew|walnuss|haselnuss|studentenfutter|cracker'],
        [180, 'chips|snack|popcorn|salzstangen'],
        [120, 'h-milch|haltbare milch|haltbarmilch|hafermilch|sojamilch|mandelmilch|reismilch'],
    ].map(([days, words]) => [days, new RegExp(`(?:^|[^a-zäöüß])(?:${words})`)]);

    /**
     * @param {string} text product name, category, group and tags as one text
     * @returns {number} suggested shelf life in days, 0 if unknown
     */
    function guessShelfLife(text) {
        const t = String(text || '').toLowerCase();
        if (!t || EXCLUDE.test(t)) {
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
