'use strict';

const { expect } = require('chai');
const { bookLookup, tagsOf, genresFirst } = require('./books');

const answer = map => async url => {
    const hit = Object.entries(map).find(([k]) => url.includes(k));
    return hit ? { ok: true, json: async () => hit[1] } : { ok: false, json: async () => null };
};

describe('tagsOf', () => {
    it('drops web addresses that a catalogue gives instead of a subject word', () => {
        const t = tagsOf(['Zeitschrift', 'https://w3id.org/lobid/gnd/4056543-5', 'www.example.org'], true);
        expect(t).to.deep.equal(['Zeitschrift']);
    });

    it('puts the genres in front of the subject words', () => {
        expect(genresFirst(['Kinderbuch', 'Junge', 'Magier', 'Jugendbuch', 'Fantasy'])).to.deep.equal(['Kinderbuch', 'Jugendbuch', 'Fantasy', 'Junge', 'Magier']);
    });

    it('splits subjects at a bar and lists a word once', () => {
        expect(tagsOf(['Computer', 'Computer | Datentechnik', 'computer'], true)).to.deep.equal(['Computer', 'Datentechnik']);
    });

    it('does not call a children\'s fantasy book a crime novel because of "mystery"', () => {
        expect(tagsOf(['Juvenile fiction', 'Fantasy', 'Mystery and detective stories'], false)).to.deep.equal(['Kinderbuch', 'Fantasy']);
        expect(tagsOf(['Kinderbuch', 'Fantasy', 'Kinderkrimi'], true)).to.include('Krimi');
        expect(tagsOf(['Mystery and detective stories'], false)).to.deep.equal(['Krimi']);
    });
});

describe('bookLookup', () => {
    it('takes title, author, pages and cover from Open Library', async () => {
        const r = await bookLookup('9780140328721', {
            fetch: answer({
                'openlibrary.org': {
                    'ISBN:9780140328721': {
                        title: 'Fantastic Mr Fox',
                        authors: [{ name: 'Roald Dahl' }],
                        number_of_pages: 96,
                        cover: { medium: 'http://covers.openlibrary.org/b/id/1-M.jpg' },
                    },
                },
            }),
        });
        expect(r).to.deep.equal({
            name: 'Fantastic Mr Fox',
            brand: 'Roald Dahl',
            packageSize: '96 S.',
            image: 'https://covers.openlibrary.org/b/id/1-M.jpg',
            category: 'Bücher',
            tags: [],
            source: 'openlibrary.org',
        });
    });

    it('asks the German National Library for a German book, with the ISBN-13 and the ISBN-10', async () => {
        const urls = [];
        const r = await bookLookup('9783161484100', {
            fetch: async url => {
                urls.push(url);
                return {
                    ok: true,
                    json: async () => ({ member: [{ title: 'Der Titel', contribution: [{ agent: { label: 'Autor, Anna' } }] }] }),
                };
            },
        });
        const lobidUrl = urls.find(u => u.includes('lobid.org'));
        expect(decodeURIComponent(lobidUrl)).to.contain('isbn:(9783161484100 OR 316148410X)');
        expect(r.name).to.equal('Der Titel');
        expect(r.brand).to.equal('Anna Autor');
        expect(r.source).to.equal('dnb.de');
    });

    it('reads the SRU interface of the National Library when lobid does not know the book', async () => {
        const xml = '<searchRetrieveResponse><dc:title>Lernen &amp; Leben : ein Buch</dc:title><dc:creator>Muster, Max</dc:creator></searchRetrieveResponse>';
        const notes = [];
        const r = await bookLookup('9783869141022', {
            note: m => notes.push(m),
            fetch: async url =>
                url.includes('services.dnb.de')
                    ? { ok: true, text: async () => xml }
                    : { ok: true, json: async () => ({ member: [] }) },
        });
        expect(r.name).to.equal('Lernen & Leben – ein Buch');
        expect(r.brand).to.equal('Max Muster');
        expect(r.source).to.equal('dnb.de');
        expect(notes).to.include('lobid: unknown');
    });

    it('makes titles and authors of the library readable', async () => {
        const xml =
            '<r><dc:title>[Cordier] ; Meine ersten Wörter - Suchen und Entdecken / Séverine Cordier</dc:title><dc:creator>Cordier, Séverine [Verfasser]</dc:creator><dc:creator>Muster, Max [Illustrator]</dc:creator></r>';
        const r = await bookLookup('9783869141022', {
            fetch: async url =>
                url.includes('services.dnb.de') ? { ok: true, text: async () => xml } : { ok: true, json: async () => ({ member: [] }) },
        });
        expect(r.name).to.equal('Meine ersten Wörter - Suchen und Entdecken');
        expect(r.brand).to.equal('Séverine Cordier');
        const sort = '<r><dc:title>¬Der¬ kleine Prinz : Erzählung</dc:title><dc:creator>Saint-Exupéry, Antoine de</dc:creator></r>';
        const s = await bookLookup('9783869141022', {
            fetch: async url =>
                url.includes('services.dnb.de') ? { ok: true, text: async () => sort } : { ok: true, json: async () => ({ member: [] }) },
        });
        expect(s.name).to.equal('Der kleine Prinz – Erzählung');
        expect(s.brand).to.equal('Antoine de Saint-Exupéry');
    });

    it('asks all catalogues at once, so one that does not answer does not hold the others back', async () => {
        const started = [];
        const r = await bookLookup('9783869141022', {
            fetch: async (url, opts) => {
                started.push(url);
                if (url.includes('lobid.org')) {
                    return new Promise((_, reject) =>
                        opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('late'), { name: 'TimeoutError' }))),
                    );
                }
                return url.includes('googleapis.com')
                    ? { ok: true, json: async () => ({ items: [{ volumeInfo: { title: 'Aus Google', authors: ['A'] } }] }) }
                    : { ok: false, status: 404, json: async () => null, text: async () => '' };
            },
            timeoutMs: 200,
        });
        expect(started.filter(u => !/covers\.openlibrary|opac\/mvb/.test(u)).length).to.equal(4);
        expect(r.source).to.equal('books.google.com');
    });

    it('falls back to the next source and gives null when nobody knows the book', async () => {
        const r = await bookLookup('9780140328721', {
            fetch: answer({ 'googleapis.com': { items: [{ volumeInfo: { title: 'T', authors: ['A'] } }] } }),
        });
        expect(r.source).to.equal('books.google.com');
        expect(await bookLookup('9780140328721', { fetch: answer({}) })).to.equal(null);
    });

    it('finds a magazine by its ISSN and ignores numbers that are no book', async () => {
        const urls = [];
        const r = await bookLookup('9770317847001', {
            fetch: async url => {
                urls.push(url);
                return {
                    ok: true,
                    json: async () => ({
                        member: [{ title: 'Das Magazin', otherTitleInformation: ['Magazin für Tests : Das größte Magazin der Welt'] }],
                    }),
                };
            },
        });
        expect(urls[0]).to.contain(encodeURIComponent('issn:0317-8471'));
        expect(r.name).to.equal('Das Magazin – Magazin für Tests');
        expect(r.tags).to.deep.equal(['Zeitschrift']);
        expect(await bookLookup('4006381333931', { fetch: answer({}) })).to.equal(null);
    });

    it('takes genres and subject words as tags, and the page count from the catalogue', async () => {
        const r = await bookLookup('9783869141022', {
            fetch: async url =>
                url.includes('lobid.org')
                    ? {
                          ok: true,
                          json: async () => ({
                              member: [
                                  {
                                      title: 'Meine ersten Wörter',
                                      extent: ['12 Seiten : Illustrationen'],
                                      subject: [{ label: 'Bilderbuch' }, { label: 'Wortschatz' }, { label: '028' }],
                                  },
                              ],
                          }),
                      }
                    : { ok: false, json: async () => null },
        });
        expect(r.packageSize).to.equal('12 S.');
        expect(r.tags).to.deep.equal(['Kinderbuch', 'Wortschatz']);
    });

    it('reads the subjects of the SRU answer and of the other catalogues', async () => {
        const xml =
            '<r><dc:title>Ein Buch</dc:title><dc:subject>Kinderbuch; Tiere</dc:subject><dc:subject>DDC 028</dc:subject><dc:format>32 Seiten</dc:format></r>';
        const a = await bookLookup('9783869141022', {
            fetch: async url =>
                url.includes('services.dnb.de')
                    ? { ok: true, text: async () => xml }
                    : { ok: true, json: async () => ({ member: [] }) },
        });
        expect(a.tags).to.deep.equal(['Kinderbuch', 'Tiere']);
        expect(a.packageSize).to.equal('32 S.');
        const g = await bookLookup('9780140328721', {
            fetch: answer({
                'googleapis.com': { items: [{ volumeInfo: { title: 'T', authors: ['A'], categories: ['Juvenile Fiction / Animals'] } }] },
            }),
        });
        expect(g.tags).to.deep.equal(['Kinderbuch']);
    });

    it('fills the cover and the page count from another catalogue when the first one has none', async () => {
        const r = await bookLookup('9783869141022', {
            fetch: answer({
                'lobid.org': { member: [{ title: 'Deutscher Titel' }] },
                'googleapis.com': {
                    items: [{ volumeInfo: { title: 'X', pageCount: 40, imageLinks: { thumbnail: 'http://books.google.com/c.jpg' } } }],
                },
            }),
        });
        expect(r.source).to.equal('dnb.de');
        expect(r.packageSize).to.equal('40 S.');
        expect(r.image).to.equal('https://books.google.com/c.jpg');
    });

    describe('cover by ISBN', () => {
        const jpeg = n => {
            const b = Buffer.alloc(n, 7);
            b[0] = 0xff;
            b[1] = 0xd8;
            b[2] = 0xff;
            return b;
        };
        const mk = (urls, cover) => async url => {
            urls.push(url);
            if (/portal\.dnb\.de|covers\.openlibrary/.test(url)) {
                const c = cover(url);
                return c
                    ? { ok: true, status: 200, arrayBuffer: async () => c }
                    : { ok: false, status: 404, arrayBuffer: async () => Buffer.alloc(0) };
            }
            return url.includes('lobid.org')
                ? { ok: true, json: async () => ({ member: [{ title: 'Ohne Bild' }] }) }
                : { ok: false, json: async () => null };
        };

        it('keeps a small cover of the National Library as a picture of its own', async () => {
            const urls = [];
            const r = await bookLookup('9783458646266', { fetch: mk(urls, u => (u.includes('dnb.de') ? jpeg(5000) : null)) });
            expect(r.image).to.equal(`data:image/jpeg;base64,${jpeg(5000).toString('base64')}`);
            expect(urls.some(u => u === 'https://portal.dnb.de/opac/mvb/cover?isbn=9783458646266')).to.equal(true);
        });

        it('hands a large cover over for the app to shrink, tries Open Library next and gives nothing if nobody has one', async () => {
            const big = await bookLookup('9783458646266', { fetch: mk([], u => (u.includes('dnb.de') ? jpeg(50000) : null)) });
            // the address of the National Library is of no use to a phone: the picture comes along instead
            expect(big.image).to.equal('');
            expect(big.coverData).to.equal(`data:image/jpeg;base64,${jpeg(50000).toString('base64')}`);
            const ol = await bookLookup('9783458646266', { fetch: mk([], u => (u.includes('openlibrary') ? jpeg(9000) : null)) });
            expect(ol.image).to.match(/^data:image\/jpeg;base64,/);
            expect((await bookLookup('9783458646266', { fetch: mk([], () => null) })).image).to.equal('');
            // an answer that is no picture (a page of the bot protection, for example) is no cover
            const html = await bookLookup('9783458646266', { fetch: mk([], () => Buffer.from('<html>blocked</html>'.repeat(60))) });
            expect(html.image).to.equal('');
        });
    });

    it('turns subject codes of the National Library into words and a genre', async () => {
        const xml = '<r><dc:title>Buch der Träume</dc:title><dc:subject>830 Deutsche Literatur</dc:subject><dc:subject>B Belletristik</dc:subject></r>';
        const r = await bookLookup('9783458646266', {
            fetch: async url =>
                url.includes('services.dnb.de')
                    ? { ok: true, text: async () => xml }
                    : { ok: true, json: async () => ({ member: [] }) },
        });
        expect(r.tags).to.deep.equal(['Roman', 'Deutsche Literatur']);
    });
});
