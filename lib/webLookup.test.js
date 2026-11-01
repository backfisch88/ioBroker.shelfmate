'use strict';

const { expect } = require('chai');
const { webLookup, looksEnglish, nameLang, localeOf, looksForeign, pageLang, dmCategories, rossmannCat, pharmacyCat, gate, apothekeFind, vitalityFind, catInfo, catSegments, searchLinks, searchResults, pageInfo, cleanTitle, eanSiteName, imageSearch, openGtinName, dmMcp, dmFromAnswer, eanSucheName, eanSucheProduct, eanApiName, countryOf, nameImages } = require('./webLookup');

const EAN = '4006000218939';

const ddg = `<div class="result"><a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.dm.de%2Fnivea-pflegedusche-p4006000218939.html&amp;rut=abc">NIVEA</a></div>
<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D1">video</a></div>
<div class="result"><a class="result__a" href="https://shop.example.at/duschgel">Duschgel</a></div>`;

const dm = `<html><head><title>NIVEA - Pflegedusche Derma Control Sensitive, 250 ml | dm.de</title>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"NIVEA - Pflegedusche Derma Control Sensitive, 250 ml","brand":{"@type":"Brand","name":"NIVEA"},"gtin13":"${EAN}","image":["/img/a.jpg","http://insecure.example/b.jpg"]}</script></head><body></body></html>`;

const og = `<html><head><meta property="og:title" content="Duschgel Creme Sensitive 250 ml - Kastner Shop"><meta content="https://shop.example.at/p.jpg" property="og:image"></head><body>EAN ${EAN}</body></html>`;

const other = '<html><head><title>Something else</title></head><body>EAN 1234567890123</body></html>';

/**
 * @param {Record<string, string>} pages url fragment to body
 * @returns {typeof fetch} fake fetch
 */
function fake(pages) {
    return async url => {
        if (/\.(jpg|png)(\?|$)/.test(String(url))) {
            return { ok: true, headers: { get: h => (h === 'content-type' ? 'image/jpeg' : '20000') }, text: async () => '' };
        }
        const key = Object.keys(pages).find(k => String(url).includes(k));
        return key
            ? { ok: true, headers: { get: () => 'text/html' }, text: async () => pages[key], json: async () => JSON.parse(pages[key]) }
            : { ok: false, headers: { get: () => '' }, text: async () => '' };
    };
}

describe('webLookup', () => {
    it('reads the result links and skips video and search sites', () => {
        expect(searchLinks(ddg)).to.deep.equal([
            'https://www.dm.de/nivea-pflegedusche-p4006000218939.html',
            'https://shop.example.at/duschgel',
        ]);
    });

    it('splits brand, name and size out of a shop title', () => {
        expect(cleanTitle('NIVEA - Pflegedusche Derma Control Sensitive, 250 ml | dm.de', '')).to.deep.equal({
            name: 'Pflegedusche Derma Control Sensitive',
            brand: 'NIVEA',
            packageSize: '250 ml',
        });
        expect(cleanTitle('Duschgel Creme Sensitive 250 ml - Kastner Shop', '')).to.deep.equal({
            name: 'Duschgel Creme Sensitive',
            brand: '',
            packageSize: '250 ml',
        });
    });

    it('takes product data from JSON-LD, keeps https images only and resolves relative ones', () => {
        const r = pageInfo(dm, 'https://www.dm.de/x.html', EAN);
        expect(r.name).to.equal('Pflegedusche Derma Control Sensitive');
        expect(r.brand).to.equal('NIVEA');
        expect(r.images).to.deep.equal(['https://www.dm.de/img/a.jpg']);
        expect(r.source).to.equal('dm.de');
    });

    it('falls back to the Open Graph tags', () => {
        const r = pageInfo(og, 'https://shop.example.at/duschgel', EAN);
        expect(r.name).to.equal('Duschgel Creme Sensitive');
        expect(r.images).to.deep.equal(['https://shop.example.at/p.jpg']);
    });

    it('ignores pages that do not show the barcode', () => {
        expect(pageInfo(other, 'https://x.example/', EAN)).to.equal(null);
    });

    it('finds the product through the search and collects pictures with their source', async () => {
        const r = await webLookup(EAN, {
            fetch: fake({ 'html.duckduckgo.com': ddg, 'dm.de/nivea': dm, 'shop.example.at': og }),
        });
        expect(r.reached).to.equal(true);
        expect(r.product.name).to.equal('Pflegedusche Derma Control Sensitive');
        expect(r.product.brand).to.equal('NIVEA');
        expect(r.product.packageSize).to.equal('250 ml');
        expect(r.product.source).to.equal('dm.de');
        expect(r.product.images.map(i => i.source)).to.deep.equal(['dm.de', 'shop.example.at']);
        expect(r.product.image).to.equal('https://www.dm.de/img/a.jpg');
    });

    it('reads title and snippet of the hits', () => {
        const r = searchResults(
            `<a rel="nofollow" class="result__a" href="https://www.dm.de/p">NIVEA - Pflegedusche, 250 ml</a><a class="result__snippet" href="x">EAN ${EAN} Pflege</a>` +
                `<a href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fshop.example.at%2Fa" class='result-link'>Duschgel</a><td class='result-snippet'>nichts</td>`,
        );
        expect(r).to.deep.equal([
            { url: 'https://www.dm.de/p', title: 'NIVEA - Pflegedusche, 250 ml', snippet: `EAN ${EAN} Pflege` },
            { url: 'https://shop.example.at/a', title: 'Duschgel', snippet: 'nichts' },
        ]);
    });

    it('uses the search snippet when the shops block the page', async () => {
        const page = `<a class="result__a" href="https://www.dm.de/p">NIVEA - Pflegedusche Derma, 250 ml | dm.de</a><a class="result__snippet" href="x">EAN ${EAN} Duschpflege</a>`;
        const r = await webLookup(EAN, { fetch: fake({ 'html.duckduckgo.com': page }) });
        expect(r.product).to.include({ name: 'Pflegedusche Derma', brand: 'NIVEA', packageSize: '250 ml' });
        expect(r.product.source).to.equal('dm.de');
    });

    it('never takes a hit for the product when nothing shows the barcode', async () => {
        const page = `<a class="result__a" href="https://de.wikipedia.org/x">EAN-Code Lexikon</a><a class="result__a" href="https://www.shop.example/p">Duschgel Creme Sensitive 250 ml</a>`;
        const r = await webLookup(EAN, { fetch: fake({ 'html.duckduckgo.com': page }) });
        expect(r.reached).to.equal(true);
        expect(r.product).to.equal(null);
    });

    it('says so when nothing matches or nothing can be reached', async () => {
        const junk = '<a class="result__a" href="https://www.shop.example/p">Barcode Generator</a>';
        const none = await webLookup(EAN, { fetch: fake({ 'html.duckduckgo.com': junk }) });
        expect(none.reached).to.equal(true);
        expect(none.product).to.equal(null);
        const down = await webLookup(EAN, { fetch: fake({}) });
        expect(down.reached).to.equal(false);
        expect(down.product).to.equal(null);
        expect(down.trace).to.contain('no answer');
    });

    it('reads the name from the barcode database and looks for pictures of that name', async () => {
        const site = `<h2><b>Product name for EAN 4066447276800:</b></h2><p><a href="/x">Balea Bio-Körperöl, 100 ml</a> (*)</p>`;
        const json = JSON.stringify({ results: [{ image: 'https://www.dm.de/balea.jpg', title: 'Balea Bio-Körperöl 100 ml', url: 'https://www.dm.de/p' }, { image: 'https://x.example/f.jpg', title: 'Foto', url: 'https://x.example' }] });
        expect(eanSiteName(site, '4066447276800')).to.equal('Balea Bio-Körperöl, 100 ml');
        const r = await webLookup('4066447276800', {
            fetch: fake({ 'ean-suche.net': '{"found":false}', 'ean-search.org': site, 'duckduckgo.com/?q': 'vqd="4-1"', 'duckduckgo.com/i.js': json }),
        });
        expect(r.product).to.include({ name: 'Balea Bio-Körperöl', packageSize: '100 ml', source: 'ean-search.org', image: 'https://www.dm.de/balea.jpg' });
        expect(r.product.images).to.deep.equal([{ url: 'https://www.dm.de/balea.jpg', source: 'dm.de' }]);
    });

    it('knows an unknown barcode of the database by its missing name', () => {
        expect(eanSiteName('<p>No product found for EAN 4066447276800</p><title>EAN-Search</title>', '4066447276800')).to.equal('');
    });

    it('reads name and brand from Open EAN', async () => {
        const body = 'error=0\n---\nname=Balea Bio-Körperöl\ndetailname=Balea Bio-Körperöl 100 ml\nvendor=Balea\n---';
        expect(await openGtinName(EAN, 'key', fake({ 'opengtindb.org': body }), 1000)).to.deep.equal({ name: 'Balea Bio-Körperöl 100 ml', brand: 'Balea' });
        expect(await openGtinName(EAN, 'key', fake({ 'opengtindb.org': 'error=1\n---' }), 1000)).to.deep.equal({ name: '', brand: '' });
        const r = await webLookup(EAN, { openGtinKey: 'key', fetch: fake({ 'opengtindb.org': body }) });
        expect(r.product).to.include({ name: 'Bio-Körperöl', brand: 'Balea', packageSize: '100 ml', source: 'opengtindb.org' });
        expect(r.trace).to.contain('ean-suche.net: unknown');
    });

    it('uses the official ean-search interface when a token is set, not the web page', async () => {
        const f = fake({ 'api.ean-search.org': JSON.stringify([{ ean: EAN, name: 'Balea Bio-Körperöl, 100 ml', issuingCountry: 'DE' }]), 'bing.com/images': '' });
        expect(await eanApiName(EAN, 'tok', f, 1000)).to.equal('Balea Bio-Körperöl, 100 ml');
        const r = await webLookup(EAN, { fetch: f, eanSearchToken: 'tok' });
        expect(r.product).to.include({ name: 'Balea Bio-Körperöl', packageSize: '100 ml', source: 'ean-search.org' });
        expect(r.trace).to.contain('ean-search API');
    });

    it('names the country of the barcode prefix', () => {
        expect(countryOf('4260401414769')).to.equal('Deutschland');
        expect(countryOf('9002490100070')).to.equal('Österreich');
        expect(countryOf('7611234567890')).to.equal('Schweiz');
        expect(countryOf('012345678905')).to.equal('USA');
        expect(countryOf('6291041500213')).to.equal('');
    });

    it('searches with ean, the barcode in quotes and the country', async () => {
        const calls = [];
        await webLookup('4260401414769', {
            fetch: async (u, o) => {
                calls.push({ url: String(u), body: String(o?.body || '') });
                return { ok: false, headers: { get: () => '' }, text: async () => '' };
            },
        });
        const duck = calls.find(c => c.url.includes('html.duckduckgo.com'));
        expect(decodeURIComponent(duck.body)).to.contain('q=ean "4260401414769" Deutschland');
        expect(decodeURIComponent(calls.find(c => c.url.includes('bing.com')).url)).to.contain('q=ean "4260401414769" Deutschland');
    });

    it('takes the product of the barcode from a page with several products', () => {
        const html = `<html><head><title>Shop</title><script type="application/ld+json">[{"@type":"Product","name":"Other","gtin13":"4000000000000","image":"https://a.example/other.jpg"},{"@type":"Product","name":"Mine, 250 ml","gtin13":"${EAN}","image":"https://a.example/mine.jpg"}]</script></head><body>${EAN}</body></html>`;
        const r = pageInfo(html, 'https://a.example/p', EAN);
        expect(r.name).to.equal('Mine');
        expect(r.images).to.deep.equal(['https://a.example/mine.jpg']);
        const none = html.replace(`"gtin13":"${EAN}"`, '"gtin13":"4111111111111"');
        expect(pageInfo(none, 'https://a.example/p', EAN).images).to.deep.equal([]);
    });

    it('reads the name from ean-suche.net and respects its limit', async () => {
        const hit = JSON.stringify({ ok: true, found: true, product_name: 'STABILO BOSS Textmarker gelb' });
        const miss = JSON.stringify({ ok: true, found: false, product_name: null });
        expect(await eanSucheName(EAN, fake({ 'ean-suche.net/api/produkt/': hit }), 1000)).to.equal('STABILO BOSS Textmarker gelb');
        expect(await eanSucheName(EAN, fake({ 'ean-suche.net/api/produkt/': miss }), 1000)).to.equal('');
        let calls = 0;
        const limited = async () => {
            calls++;
            return { ok: false, status: 429, headers: { get: () => '' } };
        };
        expect(await eanSucheName(EAN, limited, 1000)).to.equal('');
        expect(await eanSucheName(EAN, limited, 1000)).to.equal('');
        expect(calls).to.equal(1);
    });

    it('ignores pages of other countries, as a Polish shop sells the same Rossmann brand', async () => {
        const hits = '<a class="result__a" href="https://www.rossmann.pl/isana">ISANA</a><a class="result__a" href="https://www.dm.de/isana-p">ISANA</a>';
        const pl = `<html lang="pl"><head><title>ISANA ODŻYWKA 200 ml</title></head><body>${EAN}</body></html>`;
        const de = `<html lang="de"><head><title>ISANA Pflegespülung 200 ml | dm.de</title></head><body>${EAN}</body></html>`;
        const r = await webLookup(EAN, { fetch: fake({ 'html.duckduckgo.com': hits, 'rossmann.pl': pl, 'dm.de/isana-p': de }) });
        expect(r.product.name).to.contain('Pflegespülung');
        const only = await webLookup(EAN, { fetch: fake({ 'html.duckduckgo.com': hits.slice(0, hits.indexOf('<a class="result__a" href="https://www.dm')), 'rossmann.pl': pl }) });
        expect(only.product).to.equal(null);
    });

    it('takes the name of a Rossmann hit from the search result when the closed page cannot show it', async () => {
        const url = 'https://www.rossmann.de/de/pflege-und-duft-sunozon-kids-sonnenspray-lsf-30/p/4305615827759';
        const hits = `<a class="result__a" href="${url}">Sunozon Kids Sonnenspray LSF 30, 250 ml | ROSSMANN</a>`;
        const challenge = '<html><head><title>Client Challenge</title></head><body></body></html>';
        const r = await webLookup('4305615827759', { fetch: fake({ 'html.duckduckgo.com': hits, 'rossmann.de/de/pflege': challenge }) });
        expect(r.product).to.include({ name: 'Sunozon Kids Sonnenspray LSF 30', packageSize: '250 ml', source: 'rossmann.de' });
        expect(r.product).to.deep.include({ tags: ['Pflege & Duft'], category: 'Drogerie' });
        // without a usable title the name comes from the address
        const bare = `<a class="result__a" href="${url}">ROSSMANN</a>`;
        const b = await webLookup('4305615827759', { fetch: fake({ 'html.duckduckgo.com': bare, 'rossmann.de/de/pflege': challenge }) });
        expect(b.product.name).to.equal('Sunozon kids sonnenspray lsf 30');
        // a Rossmann address of another barcode does not count
        const wrong = `<a class="result__a" href="${url.replace('4305615827759', '4305615827768')}">Sunozon Kids | ROSSMANN</a>`;
        expect((await webLookup('4305615827759', { fetch: fake({ 'html.duckduckgo.com': wrong, 'rossmann.de/de/pflege': challenge }) })).product).to.equal(null);
    });

    it('takes an INCI Beauty hit of the barcode search although its page does not show the number', async () => {
        const hit = (url, title, snippet) => `<li class="b_algo"><h2><a href="${url}">${title}</a></h2><p>${snippet}</p></li>`;
        const title = 'Milch &amp; Honig Cremeseife für Normale und Trockene Haut - 1 Liter';
        const bing = hit('https://incibeauty.com/en/produit/milch-honig', title, `Bevola ${title} - Rating: 9.8 / 20`);
        const r = await webLookup('5902357008706', { fetch: fake({ 'site%3Aincibeauty.com': bing, 'incibeauty.com/en/produit': '<html><head><title>INCI</title><meta property="og:image" content="https://incibeauty.com/p/bevola.jpg"></head><body>Composition</body></html>' }) });
        expect(r.product.image).to.equal('https://incibeauty.com/p/bevola.jpg');
        expect(r.product).to.deep.include({ name: 'Milch & Honig Cremeseife für Normale und Trockene Haut', brand: 'Bevola', packageSize: '1 l', source: 'incibeauty.com' });
        // another site for the same search does not count
        const other = hit('https://shop.example.com/x', 'Irgendein Shop', 'ohne Nummer');
        expect((await webLookup('5902357008706', { fetch: fake({ 'site%3Aincibeauty.com': other }) })).product).to.equal(null);
    });

    it('finds an article of dm under its old barcode through the other countries and its article number', async () => {
        const OLD = '4066447756951';
        const item = (gtin, title) => ({ gtin: Number(gtin), dan: 1045994, brandName: 'Balea', title, tileData: { trackingData: { categories: ['Körper-, Dusch- & Badpflege', 'Badezusätze & Co.'] }, images: [{ tileSrc: 'https://products.dm-static.com/fuss.jpg' }] } });
        const answer = p => JSON.stringify({ products: p });
        const pages = {
            [`/sk/search?query=${OLD}`]: answer([item(OLD, 'Soľ do kúpeľa na nohy Vital, 450 g')]),
            '/de/search?query=1045994': answer([item('4066447970494', 'Fußbad Vital-Bad, 450 g')]),
        };
        const r = await webLookup(OLD, { fetch: fake(pages), dmOnly: true, dmDeep: true });
        expect(r.product).to.deep.include({ name: 'Fußbad Vital-Bad', brand: 'Balea', packageSize: '450 g', source: 'dm.de', category: 'Drogerie' });
        expect(r.trace).to.contain('article 1045994 found in sk, listed in de with barcode 4066447970494');
        // the search does not know the article number, the page of the article does
        const page = '<html lang="de"><head><title>Balea Fußbad Vital-Bad, 450 g online kaufen | dm.de</title><script type="application/ld+json">{"@type":"Product","name":"Balea Fußbad Vital-Bad, 450 g","brand":{"name":"Balea"},"image":["https://products.dm-static.com/p/1.jpg"]}</script><script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"position":2,"name":"Badezusätze & Co."},{"position":1,"name":"Körper-, Dusch- & Badpflege"}]}</script></head><body>/p/d/1045994</body></html>';
        const viaPage = await webLookup(OLD, { fetch: fake({ [`/sk/search?query=${OLD}`]: pages[`/sk/search?query=${OLD}`], 'www.dm.de/p/d/1045994': page }), dmOnly: true, dmDeep: true });
        expect(viaPage.product).to.deep.include({ name: 'Fußbad Vital-Bad', brand: 'Balea', source: 'dm.de' });
        expect(viaPage.product.tags).to.deep.equal(['Körper-, Dusch- & Badpflege', 'Badezusätze & Co.']);
        // the quick question at the start of a search does not go through the other countries
        const quick = await webLookup(OLD, { fetch: fake(pages), dmOnly: true });
        expect(quick.product).to.equal(null);
        expect(quick.trace).to.not.contain('other countries');
        // known in another country, but not in Germany or Austria any more: nothing is taken
        const gone = await webLookup(OLD, { fetch: fake({ [`/sk/search?query=${OLD}`]: pages[`/sk/search?query=${OLD}`] }), dmOnly: true, dmDeep: true });
        expect(gone.product).to.equal(null);
        expect(gone.trace).to.contain('not in de or at');
    });

    it('takes the product from the dm search when the MCP server does not know the barcode', async () => {
        const EAN = '4066447756951';
        const body = JSON.stringify({ products: [{ gtin: Number(EAN), dan: 1045994, brandName: 'Balea', title: 'Fußbad Vitalbad pflegende Erfrischung, 500 g', tileData: { trackingData: { categories: ['Körper-, Dusch- & Badpflege', 'Badezusätze & Co.'] }, images: [{ tileSrc: 'https://products.dm-static.com/a.jpg' }, { tileSrc: 'https://products.dm-static.com/b.jpg', isAiGenerated: true }] } }] });
        const r = await webLookup(EAN, { fetch: fake({ 'product-search.services.dmtech.com': body }) });
        expect(r.product).to.deep.include({ name: 'Fußbad Vitalbad pflegende Erfrischung', brand: 'Balea', packageSize: '500 g', source: 'dm.de', category: 'Drogerie' });
        expect(r.product.tags).to.include('Badezusätze & Co.');
        expect(r.product.images.map(i => i.url)).to.deep.equal(['https://products.dm-static.com/a.jpg']);
        // a hit of another barcode does not count
        const other = body.replace(EAN, '4066447756999');
        expect((await webLookup(EAN, { fetch: fake({ 'product-search.services.dmtech.com': other }), dmOnly: true })).product).to.equal(null);
    });

    it('takes an English name only when no search finds a German one', async () => {
        const EAN = '4066447756951';
        const shop = (name, lang) => `<html lang="${lang}"><head><title>${name}</title><script type="application/ld+json">{"@type":"Product","name":"${name}","brand":{"name":"Balea"},"gtin13":"${EAN}","image":["https://a.example/${lang}.jpg"]}</script></head><body>${EAN}</body></html>`;
        const hit = url => `<a class="result__a" href="${url}">x</a>`;
        const en = { 'html.duckduckgo.com': hit('https://shop.example.eu/en'), 'shop.example.eu': shop('Foot Bath Vital Bath Refreshing Care', 'en') };
        // only English: better than nothing
        const only = await webLookup(EAN, { fetch: fake(en) });
        expect(only.product.name).to.equal('Foot Bath Vital Bath Refreshing Care');
        // a later search finds the German shop
        const both = await webLookup(EAN, { fetch: fake({ ...en, [`bing.com/search?q=${EAN}&`]: '<li class="b_algo"><h2><a href="https://shop.example.de/de">Balea Fußbad Vitalbad</a></h2></li>', 'shop.example.de': shop('Balea Fußbad Vitalbad', 'de') }) });
        expect(both.product.name).to.contain('Fußbad Vitalbad');
        expect(looksEnglish('Foot Bath Vital Bath Refreshing Care')).to.equal(true);
        expect(looksEnglish('Body Lotion Sensitive')).to.equal(false);
        expect(looksEnglish('Handcreme mit Care Öl')).to.equal(false);
    });

    it('searches the sites of the language of the app', async () => {
        const EAN = '4066447756951';
        const calls = [];
        const base = fake({});
        const spy = () => async (url, o) => {
            calls.push(String(url));
            return base(url, o);
        };
        const de = await webLookup(EAN, { fetch: spy() });
        expect(calls.some(u => u.includes('setlang=de&cc=de'))).to.equal(true);
        expect(de.trace).to.contain('Bing (Rossmann)');
        calls.length = 0;
        const en = await webLookup(EAN, { fetch: spy(), lang: 'en' });
        expect(calls.some(u => u.includes('setlang=en-GB&cc=GB'))).to.equal(true);
        expect(calls.some(u => u.includes('setlang=de'))).to.equal(false);
        expect(en.trace).to.not.contain('Rossmann');
    });

    it('tells the language of a name for the language of the app', () => {
        expect(nameLang('Fuß Vital-Bad mit Honig')).to.equal('de');
        expect(looksForeign('Fuß Vital-Bad mit Honig', 'de')).to.equal(false);
        expect(looksForeign('Fuß Vital-Bad mit Honig', 'en')).to.equal(true);
        expect(looksForeign('Foot Bath Vital Bath Refreshing Care', 'en')).to.equal(false);
        expect(looksEnglish('Foot Bath Vital Bath Refreshing Care', '', 'en')).to.equal(false);
        expect(looksForeign('Gel douche pour peau sensible', 'fr')).to.equal(false);
        expect(looksForeign('Gel douche pour peau sensible', 'de')).to.equal(true);
        expect(localeOf('zh').lang).to.equal('zh-cn');
        expect(localeOf('xx').lang).to.equal('de');
        expect(localeOf('EN').bing).to.equal('setlang=en-GB&cc=GB');
    });

    it('does not take a name from the search snippet when the shop is not German', async () => {
        const hit = (url, title, snippet) => `<li class="b_algo"><h2><a href="${url}">${title}</a></h2><p>${snippet}</p></li>`;
        const EAN = '4066447271290';
        const nl = hit('https://www.sommerschutz.com/p/balea', 'Balea Vitaliteitsbad - sommerschutz.com', `Balea Vitaliteitsbad ${EAN} 450 g`);
        const open = '<html><head><title>Shop</title></head><body>Shop</body></html>';
        // no language on the page and a .com address: not proven German
        expect((await webLookup(EAN, { fetch: fake({ 'bing.com/search': nl, 'sommerschutz.com': open }) })).product).to.equal(null);
        // a Dutch name from a German address is dropped as well
        const de = hit('https://shop.example.de/p/balea', 'Balea Voetbad vitaliteitsbad voor voeten', `Balea ${EAN} 450 g`);
        expect((await webLookup(EAN, { fetch: fake({ 'bing.com/search': de, 'shop.example.de': open }) })).product).to.equal(null);
        // a page that says it is German is taken
        const ok = hit('https://www.sommerschutz.com/p/balea', 'Balea Fuß Vital-Bad - sommerschutz.com', `Balea Fuß Vital-Bad ${EAN} 450 g`);
        const r = await webLookup(EAN, { fetch: fake({ 'bing.com/search': ok, 'sommerschutz.com': '<html lang="de"><head><title>Shop</title></head><body>Shop</body></html>' }) });
        expect(r.product.name).to.contain('Fuß Vital-Bad');
    });

    it('knows names and pages of other languages', () => {
        expect(looksForeign('Voetbad vitaliteitsbad voedende verfrissing, 450 g')).to.equal(true);
        expect(looksForeign('Gel douche pour peau sensible')).to.equal(true);
        expect(looksForeign('Balea Vitaliteitsbad 450 g')).to.equal(true);
        expect(looksForeign('Fuß Vital-Bad mit Honig, 450 g')).to.equal(false);
        expect(looksForeign('Duft des Sommers Duschgel')).to.equal(false);
        expect(pageLang('<html><head><meta property="og:locale" content="nl_NL"></head>', new URL('https://x.com/a'))).to.equal('nl');
        expect(pageLang('<html lang="de-DE">', new URL('https://x.com/nl/a'))).to.equal('de');
        expect(pageLang('<html>', new URL('https://x.com/nl-nl/produkt'))).to.equal('nl');
    });

    it('keeps only image hits that name the product', async () => {
        const hit = (url, t) => `<a m="{&quot;purl&quot;:&quot;https://x.example/p&quot;,&quot;murl&quot;:&quot;${url}&quot;,&quot;t&quot;:&quot;${t}&quot;}"></a>`;
        const bing = hit('https://a.example/1.jpg', 'babylove Handwaschschaum mild sensitive 250 ml') + hit('https://a.example/2.jpg', 'Tips for Effective Employee Performance Coaching') + hit('https://a.example/3.jpg', 'Foto');
        const out = await imageSearch('babylove Handwaschschaum mild sensitive', fake({ 'bing.com/images': bing }), 1000);
        expect(out).to.deep.equal([{ url: 'https://a.example/1.jpg', source: 'a.example' }]);
        expect(await imageSearch('babylove Handwaschschaum', fake({ 'bing.com/images': hit('https://a.example/2.jpg', 'Employee Coaching') }), 1000)).to.deep.equal([]);
    });

    it('reads links of search engines it does not know and skips the engine itself', () => {
        const html = '<a href="https://www.mojeek.com/about">About Mojeek engine</a><a class="title" href="https://www.dm.de/p-1">NIVEA Pflegedusche 250 ml</a><a href="https://x.example/k">kurz</a>';
        expect(searchResults(html).map(h => h.url)).to.deep.equal(['https://www.dm.de/p-1']);
    });

    it('does not ask the other DuckDuckGo pages when the first one gives nothing', async () => {
        const urls = [];
        await webLookup(EAN, { fetch: async u => (urls.push(String(u)), { ok: false, headers: { get: () => '' }, text: async () => '' }) });
        expect(urls.filter(u => u.includes('duckduckgo'))).to.have.length(1);
    });

    it('keeps pictures a shop refuses to hand to a script, and drops missing ones', async () => {
        const hits = '<a class="result__a" href="https://www.dm.de/p">x</a>';
        const page = `<html><head><title>NIVEA Gel, 250 ml | dm.de</title><meta property="og:image" content="https://a.example/1.jpg"><meta name="twitter:image" content="https://b.example/2.jpg"></head><body>${EAN}<script type="application/ld+json">{"@type":"Product","name":"NIVEA Gel, 250 ml","image":["https://a.example/1.jpg","https://b.example/2.jpg"]}</script></body></html>`;
        const f = async u => {
            if (String(u).includes('a.example')) {
                return { ok: false, status: 403, headers: { get: () => '' } };
            }
            if (String(u).includes('b.example')) {
                return { ok: false, status: 404, headers: { get: () => '' } };
            }
            return fake({ 'html.duckduckgo.com': hits, 'dm.de/p': page })(u);
        };
        const r = await webLookup(EAN, { fetch: f });
        expect(r.product.images.map(i => i.url)).to.deep.equal(['https://a.example/1.jpg']);
    });

    it('finds the product picture in script data when there are no meta tags', () => {
        const html = `<html><head><title>babylove Handwaschschaum, 250 ml | dm.at</title></head><body>${EAN}<script>{"image":"https:\\u002F\\u002Fproducts.dm-static.com\\u002Fimages\\u002Fa\\u002Fbild.jpg?w=800","logo":"https://x.example/logo.png"}</script></body></html>`;
        expect(pageInfo(html, 'https://www.dm.at/p', EAN).images).to.deep.equal(['https://products.dm-static.com/images/a/bild.jpg?w=800']);
    });

    it('reads dm pictures that have no file ending, one per picture', () => {
        const u = size => `https://products.dm-static.com/images/f_auto,q_auto,c_fit,${size}/v1753/assets/pas/images/abc/babylove-handwaschschaum`;
        const html = `<html><head><title>babylove Handwaschschaum, 250 ml | dm.at</title></head><body><script>{"images":[{"zoomSrc":"${u('h_1200,w_1200')}","src":"${u('h_440,w_500')}"}],"brand":"https://products.dm-static.com/images/f_auto/v1/assets/brand/logo"}</script></body></html>`;
        expect(pageInfo(html, 'https://www.dm.at/p', EAN, true).images).to.deep.equal([u('h_1200,w_1200')]);
    });

    describe('dm MCP', () => {
        const IMG = 'https://products.dm-static.com/images/f_auto,q_auto,c_fit,w_{width},h_{height}/v1/assets/pas/images/x/babylove';
        const OK = 'https://products.dm-static.com/images/f_auto,q_auto,c_fit,w_600,h_600/v1/assets/pas/images/x/babylove';
        // answers like the MCP server: initialize, notification, tool call
        const server = (tool, sse = false) => async (url, o) => {
            const msg = JSON.parse(o.body);
            const reply = body => ({
                ok: true,
                status: 200,
                headers: { get: h => (h.toLowerCase() === 'content-type' ? (sse ? 'text/event-stream' : 'application/json') : h.toLowerCase() === 'mcp-session-id' ? 'abc' : '') },
                text: async () => (sse ? `event: message\ndata: ${JSON.stringify(body)}\n\n` : JSON.stringify(body)),
            });
            if (msg.method === 'initialize') {
                return reply({ jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18' } });
            }
            if (msg.method === 'tools/call') {
                server.last = { msg, headers: o.headers };
                return reply({ jsonrpc: '2.0', id: 2, result: tool });
            }
            return reply({});
        };
        const want = { title: 'babylove Handwaschschaum mild sensitive, 250 ml', brand: 'babylove', categories: [], images: [OK] };
        const noFields = o => ({ ...o, fields: undefined, gtin: undefined });

        it('calls getProductDetails with the barcode and reads a JSON answer', async () => {
            const tool = { content: [{ type: 'text', text: JSON.stringify({ products: [{ gtin: '4066447888843', name: want.title, brandName: 'babylove', imageUrlTemplates: [IMG] }] }) }] };
            expect(noFields(await dmMcp('4066447888843', server(tool), 1000))).to.deep.equal(noFields(want));
            expect(server.last.msg.params).to.deep.equal({ name: 'getProductDetails', arguments: { gtins: [4066447888843] } });
            expect(server.last.headers['Mcp-Session-Id']).to.equal('abc');
        });

        it('sends the barcode as a number, as dm refuses a text, and a short one works the same', async () => {
            const full = { content: [{ type: 'text', text: JSON.stringify({ products: [{ gtin: 42241249, name: 'HiPP Sonnencreme Gesicht Kids', brandName: 'HiPP Babysanft', imageUrlTemplates: [IMG] }] }) }] };
            const r = await dmMcp('42241249', server(full), 1000);
            expect(r.title).to.equal('HiPP Sonnencreme Gesicht Kids');
            expect(server.last.msg.params.arguments).to.deep.equal({ gtins: [42241249] });
        });

        it('asks by the article number of dm, and a search for an old barcode ends there', async () => {
            const row = { gtin: 4066447970494, dan: 1045994, name: 'Balea Fußbad Vital-Bad, 450 g', brandName: 'Balea', imageUrlTemplates: [IMG] };
            const tool = { content: [{ type: 'text', text: JSON.stringify({ products: [row] }) }] };
            const r = await dmMcp('1045994', server(tool), 1000, () => {}, 'dans');
            expect(r).to.deep.include({ title: 'Balea Fußbad Vital-Bad, 450 g', gtin: 4066447970494 });
            expect(server.last.msg.params.arguments).to.deep.equal({ dans: [1045994] });
            // the old barcode is unknown to the MCP server and the search of Germany, the shop of Slovakia lists it
            const OLD = '4066447756951';
            const sk = JSON.stringify({ products: [{ gtin: Number(OLD), dan: 1045994, brandName: 'Balea', title: 'Soľ do kúpeľa' }] });
            const known = JSON.stringify({ products: [{ gtin: 4066447970494, dan: 1045994, brandName: 'Balea', title: 'Fußbad Vital-Bad, 450 g', tileData: { trackingData: { categories: ['Badezusätze & Co.'] } } }] });
            const web = fake({ [`/sk/search?query=${OLD}`]: sk, '/de/search?query=4066447970494': known });
            const mcp = server(tool);
            const both = (url, o) => (String(url).includes('mcp.dm.de') ? mcp(url, o) : web(url, o));
            const miss = { content: [{ type: 'text', text: 'dan|gtin|found\n|' + OLD + '|false' }] };
            const flow = (url, o) => {
                const msg = o?.body && String(url).includes('mcp.dm.de') ? JSON.parse(o.body) : null;
                const asked = msg?.params?.arguments;
                return msg?.method === 'tools/call' && asked?.gtins ? server(miss)(url, o) : both(url, o);
            };
            const full = await webLookup(OLD, { fetch: flow, dmOnly: true, dmDeep: true });
            expect(full.product).to.deep.include({ name: 'Fußbad Vital-Bad', brand: 'Balea', source: 'dm.de' });
            expect(full.product.tags).to.deep.equal(['Badezusätze & Co.']);
            expect(full.trace).to.contain('article 1045994 found in sk, listed by dm with barcode 4066447970494');
        });

        it('says nothing for a barcode dm does not know and tells when an answer cannot be read', async () => {
            const notes = [];
            const none = { content: [{ type: 'text', text: JSON.stringify({ result: '[1]{dan|gtin|found}:\n  |4068134135513|false' }) }] };
            expect(await dmMcp('4068134135513', server(none), 1000, m => notes.push(m))).to.equal(null);
            expect(notes).to.deep.equal([]);
            const odd = { content: [{ type: 'text', text: 'Item 4068134135513: Ein Schaum.' }] };
            expect(await dmMcp('4068134135513', server(odd), 1000, m => notes.push(m))).to.equal(null);
            expect(notes).to.deep.equal(['dm: answer not understood']);
        });

        it('reads an answer in an event stream', async () => {
            const tool = { structuredContent: { products: [{ gtin: '4066447888843', title: want.title, brand: { name: 'babylove' }, images: [IMG] }] }, content: [{ type: 'text', text: '{}' }] };
            expect(noFields(await dmMcp('4066447888843', server(tool, true), 1000))).to.deep.equal(noFields(want));
        });

        it('reads the category path of a dm product and maps it to a ShelfMate category', () => {
            const table = `products[1]{gtin|productName|brand|found|categoryPath}:\n  4260401410778|Baby & Kinder Badezusatz Pflegebad, 250 ml|PAEDIPROTECT|true|Baby & Kind > Babypflege > Babyshampoo > Badezusätze & Co.`;
            const got = dmFromAnswer(null, table, '4260401410778');
            expect(got.categories).to.deep.equal(['Baby & Kind', 'Babypflege', 'Babyshampoo', 'Badezusätze & Co.']);
            expect(catInfo(got.categories)).to.deep.equal({ tags: got.categories, category: 'Drogerie' });
            const json = { products: [{ gtin: '4260401410778', title: 'Pflegebad', breadcrumbs: [{ name: 'Startseite' }, { name: 'Ernährung & Lebensmittel' }, { name: 'Getränke' }] }] };
            expect(dmFromAnswer(json, JSON.stringify(json), '4260401410778').categories).to.deep.equal(['Ernährung & Lebensmittel', 'Getränke']);
            expect(catInfo(['Haushalt', 'Waschmittel']).category).to.equal('Haushalt');
            expect(catInfo(['Tier', 'Tiernahrung']).category).to.equal('Tierbedarf');
            expect(catInfo([])).to.deep.equal({});
            expect(catSegments('Home / Pflege / Duschen')).to.deep.equal(['Pflege', 'Duschen']);
        });

        it('names the fields of the answer when dm gives no category, and asks only dm with dmOnly', async () => {
            const tool = { content: [{ type: 'text', text: JSON.stringify({ result: '[1]{dan|gtin|productName|brand|found}:\n  1545814|4260401410778|Baby & Kinder Badezusatz Pflegebad, 250 ml|PAEDIPROTECT|true' }) }] };
            const got = await webLookup('4260401410778', { fetch: server(tool), dmOnly: true });
            expect(got.trace).to.contain('dm: name found, no category (dan|gtin|productName|brand|found)');
            expect(got.product).to.deep.include({ category: 'Drogerie', source: 'dm.de' });
            const none = { content: [{ type: 'text', text: JSON.stringify({ result: '[1]{dan|gtin|found}:\n  |4068134135513|false' }) }] };
            const miss = await webLookup('4068134135513', { fetch: server(none), dmOnly: true });
            expect(miss.product).to.equal(null);
            expect(miss.trace).to.equal('dm search: no answer; dm: unknown');
        });

        it('uses product type, volume and food ingredients of the dm answer when there is no category', async () => {
            const head = 'dan|gtin|productName|brand|found|errorMessage|productUrl|image|imageBackgroundColor|productType|weight|volume|description|keyBenefits|countryOfOrigin|foodIngredients';
            const row = (name, type, vol, food) => `  ${['1545814', '4260401410778', name, 'PAEDIPROTECT', 'true', '', '', '', '', type, '', vol, '', '', '', food].join('|')}`;
            const answer = rows => ({ content: [{ type: 'text', text: JSON.stringify({ result: `[1]{${head}}:\n${rows}` }) }] });
            const bath = await webLookup('4260401410778', { fetch: server(answer(row('Baby & Kinder Badezusatz Pflegebad', 'NON_FOOD', '250 ml', ''))), dmOnly: true });
            expect(bath.product).to.deep.include({ category: 'Drogerie', packageSize: '250 ml' });
            const food = await webLookup('4260401410778', { fetch: server(answer(row('Bio Haferflocken', 'Haferflocken', '', 'Hafer'))), dmOnly: true });
            expect(food.product.category).to.equal('Lebensmittel');
            const juice = await webLookup('4260401410778', { fetch: server(answer(row('Saft Duschgel', 'NON_FOOD', '250 ml', ''))), dmOnly: true });
            expect(juice.product.category).to.equal('Drogerie');
            expect(juice.product.tags).to.equal(undefined);
        });

        it('reads the categories from the product search of dm and only for the right barcode', async () => {
            const search = {
                products: [{ gtin: 4260401410778, dan: 1545814, title: 'Baby & Kinder Badezusatz Pflegebad, 250 ml', tileData: { trackingData: { categories: ['Babyshampoo, Badezusätze & Co.'] } } }],
                facets: [{ key: 'categoryNames', values: [{ name: 'Babypflege', count: 1 }, { name: 'Babyshampoo, Badezusätze & Co.', count: 1 }] }, { key: 'brandName', values: [{ name: 'PAEDIPROTECT' }] }],
            };
            const answer = { content: [{ type: 'text', text: JSON.stringify({ result: '[1]{dan|gtin|productName|brand|found|productType}:\n  1545814|4260401410778|Baby & Kinder Badezusatz Pflegebad, 250 ml|PAEDIPROTECT|true|NON_FOOD' }) }] };
            const via = body => async (url, o) => (String(url).includes('dmtech.com') ? { ok: true, json: async () => body } : server(answer)(url, o));
            const got = await webLookup('4260401410778', { fetch: via(search), dmOnly: true });
            expect(got.product.tags).to.deep.equal(['Babypflege', 'Babyshampoo', 'Badezusätze & Co.']);
            expect(got.product.category).to.equal('Drogerie');
            expect(got.trace).to.match(/^dm: name found(;|$)/);
            // a hit for another barcode gives nothing
            const other = { products: [{ gtin: 4000000000000, tileData: { trackingData: { categories: ['Obst'] } } }], facets: [] };
            expect(await dmCategories('4260401410778', via(other), 1000)).to.deep.equal([]);
            expect(await dmCategories('4260401410778', async () => ({ ok: false }), 1000)).to.deep.equal([]);
        });

        it('takes the categories from the product page of dm when the search names none', async () => {
            const search = { products: [{ gtin: 4062300441453, dan: 1686995, title: 'HiPP Frucht & Getreide Himbeere in Apfel mit Dinkelgrieß', tileData: { trackingData: {} } }], facets: [] };
            const answer = { content: [{ type: 'text', text: JSON.stringify({ result: '[1]{dan|gtin|productName|brand|found|productType}:\n  1686995|4062300441453|HiPP Frucht & Getreide Himbeere in Apfel mit Dinkelgrieß|HiPP|true|FOOD' }) }] };
            const crumbs = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"position":1,"name":"Startseite"},{"position":2,"name":"Baby & Kind"},{"position":3,"name":"Babynahrung"}]}</script>';
            const make = html => async (url, o) => {
                if (String(url).includes('dmtech.com')) {
                    return { ok: true, json: async () => search };
                }
                if (String(url).includes('/p/d/1686995')) {
                    return html ? { ok: true, headers: { get: () => 'text/html' }, text: async () => html } : { ok: false, headers: { get: () => '' }, text: async () => '' };
                }
                return server(answer)(url, o);
            };
            const got = await webLookup('4062300441453', { fetch: make(crumbs), dmOnly: true });
            expect(got.product.tags).to.deep.equal(['Baby & Kind', 'Babynahrung']);
            const bare = await webLookup('4062300441453', { fetch: make('<html><body>nothing</body></html>'), dmOnly: true });
            expect(bare.product.tags).to.equal(undefined);
            expect(bare.trace).to.contain('dm page: no categories');
        });

        it('takes the Rossmann category from the address', () => {
            expect(rossmannCat('https://www.rossmann.de/de/pflege-und-duft-isana-professional-spuelung/p/4068134135513')).to.deep.equal({ tags: ['Pflege & Duft'], category: 'Drogerie' });
            expect(rossmannCat('https://www.rossmann.de/de/haushalt-und-wohnen-x/p/1')).to.deep.equal({ tags: ['Haushalt & Wohnen'], category: 'Haushalt' });
            expect(rossmannCat('https://www.dm.de/pflege-und-duft-x/p/1')).to.deep.equal({});
        });

        it('reads the compact TOON text, as a table and as lines', () => {
            const table = `products[1]{gtin,name,brandName,image}:\n  4066447888843,"babylove Handwaschschaum mild sensitive, 250 ml",babylove,"${IMG}"`;
            expect(noFields(dmFromAnswer(null, table, '4066447888843'))).to.deep.equal(noFields(want));
            const lines = `products[1]:\n  - gtin: 4066447888843\n    name: babylove Handwaschschaum mild sensitive, 250 ml\n    brand: babylove\n    images[1]: "${IMG}"`;
            expect(noFields(dmFromAnswer(null, lines, '4066447888843'))).to.deep.equal(noFields(want));
            expect(dmFromAnswer(null, table, '4066447888844')).to.equal(null);
        });

        it('finds nothing for an unknown barcode or an unreachable server', async () => {
            expect(await dmMcp('4066447888843', server({ content: [{ type: 'text', text: 'Keine Produkte gefunden' }] }), 1000)).to.equal(null);
            expect(await dmMcp('4066447888843', fake({}), 1000)).to.equal(null);
        });

        it('uses dm first and reports where the product comes from', async () => {
            const tool = { content: [{ type: 'text', text: JSON.stringify({ products: [{ gtin: '4066447888843', name: want.title, brandName: 'babylove', imageUrlTemplates: [IMG] }] }) }] };
            const r = await webLookup('4066447888843', { fetch: server(tool) });
            expect(r.product).to.include({ source: 'dm.de', brand: 'babylove', packageSize: '250 ml', image: OK });
        });
    });

    it('takes pictures from the DuckDuckGo image search and keeps those that name the product', async () => {
        const page = '<script>nrjVersion; vqd="4-123456";</script>';
        const json = JSON.stringify({ results: [
            { image: 'https://a.example/1.jpg', title: 'babylove Handwaschschaum mild sensitive 250 ml', url: 'https://dm.de/p' },
            { image: 'https://a.example/2.jpg', title: 'Employee Performance Coaching', url: 'https://aihr.com' },
        ] });
        const out = await imageSearch('babylove Handwaschschaum mild sensitive', fake({ 'duckduckgo.com/?q': page, 'duckduckgo.com/i.js': json }), 1000);
        expect(out).to.deep.equal([{ url: 'https://a.example/1.jpg', source: 'a.example' }]);
    });

    it('ignores titles of protection and error pages', () => {
        for (const t of ['Client Challenge', 'Just a moment...', 'Access Denied', 'Attention Required! | Cloudflare', 'Seite nicht gefunden', '404 Not Found']) {
            expect(pageInfo(`<html><head><title>${t}</title></head><body>4305615566153</body></html>`, 'https://x.example/', '4305615566153'), t).to.equal(null);
        }
    });

    it('shortens a long shop title for the image search', () => {
        const { searchName } = require('./webLookup');
        expect(searchName('Autan Protection Plus Zeckenschutz Insektenschutz, zum Schutz vor Zecken und heimischen Mücken, Travel Essentials, (1er Pack)')).to.equal('Autan Protection Plus Zeckenschutz Insektenschutz');
        expect(searchName('Duschgel, Aloe Vera')).to.equal('Duschgel Aloe Vera');
    });

    it('takes the picture of ean-suche.net from its answer or else from the product page', async () => {
        require('./webLookup').resetSuche();
        const name = 'Autan Protection Plus Zeckenschutz Insektenschutz, 100 ml';
        const json = body => async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body, text: async () => JSON.stringify(body) });
        const a = await eanSucheProduct('5000204253009', json({ found: true, product_name: name, image_url: 'https://img.example/autan.jpg' }), 1000);
        expect(a).to.deep.equal({ name, images: ['https://img.example/autan.jpg'] });
        const page = '<html><body><img src="/logo.png" alt="EAN-Suche"><img src="https://img.example/p/autan.jpg" alt="Autan Protection Plus Zeckenschutz"></body></html>';
        const f = async u => String(u).includes('/api/')
            ? { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ found: true, product_name: name }) }
            : { ok: true, status: 200, url: String(u), headers: { get: () => 'text/html' }, text: async () => page };
        const b = await eanSucheProduct('5000204253009', f, 1000);
        expect(b.images).to.deep.equal(['https://img.example/p/autan.jpg']);
    });

    it('takes the status labels and the last breadcrumb of a pharmacy article as tags, not the advertising', () => {
        const url = 'https://www.shop-apotheke.com/arzneimittel/16197861/ibu-lysin-ratiopharm-400-mg.htm';
        const html = `<html><head><title>IBU-LYSIN-ratiopharm 400 mg Filmtabletten | Shop Apotheke</title></head><body><nav><a>Arzneimittel</a></nav><h1>IBU-LYSIN-ratiopharm 400 mg</h1><div>126 Kundenbewertungen</div>
<ul><li><span>Arzneimittel</span></li><li><span>apothekenpflichtig</span></li><li><span>Now! Produkt</span></li></ul>
<nav aria-label="Breadcrumb" class="breadcrumb"><ol><li><a>Home</a></li><li><a>Arzneimittel &amp; Gesundheit</a></li><li><a>Schmerzen</a></li><li><a>Ibuprofen</a></li></ol></nav>
EAN ${EAN}</body></html>`;
        expect(pharmacyCat(html, url)).to.deep.equal({ tags: ['Arzneimittel', 'apothekenpflichtig', 'Ibuprofen'], category: 'Medikamente' });
        expect(pageInfo(html, url, EAN).cat.tags).to.deep.equal(['Arzneimittel', 'apothekenpflichtig', 'Ibuprofen']);
        expect(pharmacyCat(html, 'https://www.example.com/x')).to.deep.equal({});
    });

    it('does not take the article itself or a piece of its name as the tag of a pharmacy article', () => {
        const url = 'https://www.shop-apotheke.com/arzneimittel/1/x.htm';
        const page = (h1, trail) => `<html><body><h1>${h1}</h1><ul><li>Arzneimittel</li><li>apothekenpflichtig</li></ul><script type="application/ld+json">${JSON.stringify({ '@type': 'BreadcrumbList', itemListElement: trail.map((name, i) => ({ position: i + 1, name })) })}</script></body></html>`;
        expect(pharmacyCat(page('Fenistil Gel Dimetindenmaleat 1 mg/g, zur Linderung von Juckreiz', ['Home', 'Haut', 'Juckreiz', 'Gel Dimetindenmaleat 1 mg/g, zur Linderung von Juckreiz']), url).tags).to.deep.equal(['Arzneimittel', 'apothekenpflichtig', 'Juckreiz']);
        expect(pharmacyCat(page('Nasenspray-ratiopharm Erwachsene - bei Schnupfen: abschwellend', ['Home', 'Erkältung', 'Nasenspray', 'Nasenspray-ratiopharm Erwachsene - bei Schnupfen']), url).tags).to.deep.equal(['Arzneimittel', 'apothekenpflichtig', 'Nasenspray']);
    });

    it('lets only two requests run at the same time, however many are asked for, and starts the time limit at the turn', async () => {
        let active = 0;
        let most = 0;
        const signals = [];
        const slow = async (u, o) => {
            active++;
            most = Math.max(most, active);
            signals.push(o && o.signal);
            await new Promise(r => setTimeout(r, 20));
            active--;
            return { ok: true };
        };
        const g = gate(slow);
        await Promise.all(Array.from({ length: 9 }, (_, i) => g(`https://x.example/${i}`, { timeoutMs: 5000 })));
        expect(most).to.equal(2);
        expect(active).to.equal(0);
        expect(signals.every(s => s && typeof s.aborted === 'boolean' && !s.aborted)).to.equal(true);
        // two searches at once share the same two places
        most = 0;
        await Promise.all([...Array.from({ length: 5 }, (_, i) => g(`https://a.example/${i}`)), ...Array.from({ length: 5 }, (_, i) => g(`https://b.example/${i}`))]);
        expect(most).to.equal(2);
    });

    it('asks Shop Apotheke for a barcode: a single hit or a page with the barcode counts, a list of suggestions does not', async () => {
        const P = n => `https://www.shop-apotheke.com/arzneimittel/1619786${n}/ibu-lysin-ratiopharm-400-mg.htm`;
        const art = (n, code) => `<html><head><title>IBU-LYSIN-ratiopharm 400 mg Filmtabletten | Shop Apotheke</title></head><body><h1>IBU-LYSIN</h1><ul><li>Arzneimittel</li><li>apothekenpflichtig</li></ul>${code ? `EAN ${EAN}` : ''}</body></html>`;
        const mk = pages => async u => {
            const key = String(u).replace(/^https:\/\/www\.shop-apotheke\.com/, '');
            return key in pages ? { ok: true, headers: { get: () => 'text/html' }, text: async () => pages[key] } : { ok: false, headers: { get: () => '' }, text: async () => '' };
        };
        const search = `/search.htm?i=1&q=${EAN}`;
        const note = () => {};
        // one hit: taken, although its page does not show the barcode
        const one = await apothekeFind(EAN, mk({ [search]: `<a href="${P(1)}">x</a>`, [P(1).replace('https://www.shop-apotheke.com', '')]: art(1, false) }), 1000, note);
        expect(one.name).to.equal('IBU-LYSIN-ratiopharm 400 mg Filmtabletten');
        expect(one.sure).to.equal(false);
        expect(one.cat.tags).to.deep.equal(['Arzneimittel', 'apothekenpflichtig']);
        // several hits and none shows the barcode: only suggestions
        const many = mk({ [search]: `<a href="${P(1)}">x</a><a href="${P(2)}">y</a>`, [P(1).slice(29)]: art(1, false), [P(2).slice(29)]: art(2, false) });
        expect(await apothekeFind(EAN, many, 1000, note)).to.equal(null);
        // several hits, one shows the barcode
        const some = mk({ [search]: `<a href="${P(1)}">x</a><a href="${P(2)}">y</a>`, [P(1).slice(29)]: art(1, false), [P(2).slice(29)]: art(2, true) });
        expect((await apothekeFind(EAN, some, 1000, note)).sure).to.equal(true);
        // the search leads straight to the article
        const direct = mk({ [search]: art(1, true).replace('<head>', `<head><link rel="canonical" href="${P(1)}">`) });
        expect((await apothekeFind(EAN, direct, 1000, note)).url).to.equal(P(1));
        // no answer
        expect(await apothekeFind(EAN, mk({}), 1000, note)).to.equal(null);
    });

    it('takes an article of the vitality-fit API only when it lists exactly this barcode or PZN', async () => {
        const body = {
            products: [
                {
                    title: 'Elasten Trinkampullen mit Kollagen 7 st Trinkampullen',
                    brand: 'Elasten',
                    pack_sizes: [{ label: '7 st', identity_key: 'pzn_16929956' }, { label: '175 ml', identity_key: 'ean_4260619720232' }],
                    url: 'https://vitality-fit.de/p/quiris-elasten/',
                    image_url: 'https://static.vfstatic.net/product/x.jpg',
                    matched_pack: { label: '175 ml', identity_key: 'ean_4260619720232' },
                },
            ],
        };
        const urls = [];
        const f = async u => {
            urls.push(String(u));
            return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => JSON.stringify(body) };
        };
        const r = await vitalityFind('4260619720232', f, 1000, () => {});
        expect(urls[0]).to.include('q=4260619720232');
        expect(r.name).to.equal('Trinkampullen mit Kollagen 7 st Trinkampullen');
        expect(r.brand).to.equal('Elasten');
        expect(r.packageSize).to.equal('175 ml');
        expect(r.images).to.deep.equal(['https://static.vfstatic.net/product/x.jpg']);
        // the PZN of another pack of the same article
        expect((await vitalityFind('16929956', f, 1000, () => {})).packageSize).to.equal('7 st');
        // a hit for another number is no hit
        expect(await vitalityFind('4000000000017', f, 1000, () => {})).to.equal(null);
        expect(await vitalityFind('4260619720232', async () => ({ ok: false, status: 500 }), 1000, () => {})).to.equal(null);
    });

    it('finds pictures for a name alone and keeps only usable ones', async () => {
        const hit = (url, t) => `<a m="{&quot;purl&quot;:&quot;https://x.example/p&quot;,&quot;murl&quot;:&quot;${url}&quot;,&quot;t&quot;:&quot;${t}&quot;}"></a>`;
        const bing = hit('https://a.example/1.jpg', 'ISANA Professional Spülung Sensitiv 200 ml') + hit('https://a.example/2.jpg', 'Something unrelated');
        const r = await nameImages('Isana Professional Spuelung Sensitiv', { fetch: fake({ 'bing.com/images': bing }) });
        expect(r.images).to.deep.equal([{ url: 'https://a.example/1.jpg', source: 'a.example' }]);
        expect(r.trace).to.contain('pictures: 1 found, 1 usable');
        expect((await nameImages('Nichts', { fetch: fake({}) })).images).to.deep.equal([]);
    });

    it('asks the list of the Bing picture grid first and the page as fallback', async () => {
        const hit = (url, t) => `<a m="{&quot;purl&quot;:&quot;https://x.example/p&quot;,&quot;murl&quot;:&quot;${url}&quot;,&quot;t&quot;:&quot;${t}&quot;}"></a>`;
        const urls = [];
        const f = async u => {
            urls.push(String(u));
            const page = /images\/search/.test(String(u));
            return { ok: true, headers: { get: () => 'text/html' }, text: async () => (page ? hit('https://p.example/page.jpg', 'ISANA Spülung Sensitiv') : '') };
        };
        const r = await imageSearch('ISANA Professional Spülung Sensitiv', f, 1000);
        expect(urls.find(u => u.includes('bing.com')).includes('/images/async?')).to.equal(true);
        expect(r).to.deep.equal([{ url: 'https://p.example/page.jpg', source: 'p.example' }]);
    });

    it('does not take a short barcode that only appears as a number in a page', () => {
        const page = n => `<html><head><title>Kann ich Kinder Sonnencreme benutzen?</title></head><body>${n}</body></html>`;
        expect(pageInfo(page('Bestellnummer 42241249 vom 12.03.'), 'https://forum.example/f', '42241249')).to.equal(null);
        expect(pageInfo(page('Preis 5,25 EUR, Artikel 142241249'), 'https://shop.example/p', '42241249')).to.equal(null);
        expect(pageInfo(page('EAN: 42241249'), 'https://shop.example/p', '42241249')).to.include({ name: 'Kann ich Kinder Sonnencreme benutzen?' });
        // a long barcode needs no label, but never as part of a longer number
        expect(pageInfo(page('4066447888843'), 'https://shop.example/p', '4066447888843')).to.not.equal(null);
        expect(pageInfo(page('14066447888843'), 'https://shop.example/p', '4066447888843')).to.equal(null);
    });

    it('searches the barcode in the Bing pictures last when the name finds nothing', async () => {
        const hit = (url, t) => `<a m="{&quot;purl&quot;:&quot;https://x.example/p&quot;,&quot;murl&quot;:&quot;${url}&quot;,&quot;t&quot;:&quot;${t}&quot;}"></a>`;
        const f = async u => {
            if (/\.jpg/.test(String(u))) {
                return { ok: true, headers: { get: h => (h === 'content-type' ? 'image/jpeg' : '20000') }, text: async () => '' };
            }
            const q = decodeURIComponent(String(u).split('q=')[1] || '').split('&')[0];
            const body = q === '4066447888843' ? hit('https://dm.example/babylove.jpg', 'babylove Handwaschschaum mild sensitive 250 ml') : hit('https://junk.example/1.jpg', 'Happy Campers');
            return { ok: true, headers: { get: () => 'text/html' }, text: async () => (/images/.test(String(u)) ? body : '') };
        };
        const r = await nameImages('babylove Handwaschschaum mild sensitive', { fetch: f, ean: '4066447888843' });
        expect(r.images.map(i => i.url)).to.deep.equal(['https://dm.example/babylove.jpg']);
        expect(r.trace).to.contain('Bing barcode images: 1 hits, 1 fit');
    });

    it('drops adult results and never puts the text of a result into the trace', async () => {
        const hit = (url, t) => `<a m="{&quot;purl&quot;:&quot;https://x.example/p&quot;,&quot;murl&quot;:&quot;${url}&quot;,&quot;t&quot;:&quot;${t}&quot;}"></a>`;
        const bing = hit('https://a.example/1.jpg', 'babylove Handwaschschaum sexy naked XXX') + hit('https://a.example/xxx-babylove-handwaschschaum.jpg', 'babylove Handwaschschaum');
        const r = await nameImages('babylove Handwaschschaum', { fetch: fake({ 'bing.com/images': bing }) });
        expect(r.images).to.deep.equal([]);
        expect(r.trace).to.not.match(/naked|sexy|e\.g\./i);
        const hits = '<a class="result__a" href="https://erotik.example/p">Schaum</a><a class="result__a" href="https://www.dm.de/isana-p">ISANA</a>';
        const de = `<html lang="de"><head><title>ISANA Pflegespülung 200 ml | dm.de</title></head><body>${EAN}</body></html>`;
        const w = await webLookup(EAN, { fetch: fake({ 'html.duckduckgo.com': hits, 'dm.de/isana-p': de }) });
        expect(w.trace).to.not.contain('erotik');
        expect(w.product.name).to.contain('Pflegespülung');
    });
});
