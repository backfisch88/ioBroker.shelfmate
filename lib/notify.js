'use strict';

const NOTIFY_ADAPTERS = [
    'telegram',
    'pushover',
    'signal-cbots',
    'whatsapp-cmb',
    'matrix-org',
    'notify-my-android',
    'prowl',
    'email',
];

const TEXT = {
    en: {
        low: 'Minimum stock reached: {1}',
        expired: 'Expired:',
        soon: 'Expiring soon:',
        test: 'ShelfMate: test message',
        inventory: 'Time for a stocktaking: check what is really on your shelves.',
    },
    de: {
        low: 'Mindestbestand erreicht: {1}',
        expired: 'Abgelaufen:',
        soon: 'Läuft bald ab:',
        test: 'ShelfMate: Testnachricht',
        inventory: 'Zeit für eine Inventur: Prüfe, was wirklich im Regal liegt.',
    },
    ru: {
        low: 'Достигнут минимальный запас: {1}',
        expired: 'Просрочено:',
        soon: 'Скоро истекает срок:',
        test: 'ShelfMate: тестовое сообщение',
        inventory: 'Пора провести инвентаризацию: проверьте, что действительно лежит на полках.',
    },
    pt: {
        low: 'Stock mínimo atingido: {1}',
        expired: 'Expirado:',
        soon: 'A expirar em breve:',
        test: 'ShelfMate: mensagem de teste',
        inventory: 'Hora de fazer um inventário: confirme o que realmente está nas prateleiras.',
    },
    nl: {
        low: 'Minimumvoorraad bereikt: {1}',
        expired: 'Verlopen:',
        soon: 'Verloopt binnenkort:',
        test: 'ShelfMate: testbericht',
        inventory: 'Tijd voor een inventarisatie: controleer wat er echt in de kast ligt.',
    },
    fr: {
        low: 'Stock minimum atteint : {1}',
        expired: 'Périmé :',
        soon: 'Bientôt périmé :',
        test: 'ShelfMate : message de test',
        inventory: "C'est l'heure de l'inventaire : vérifiez ce qui se trouve vraiment dans vos étagères.",
    },
    it: {
        low: 'Scorta minima raggiunta: {1}',
        expired: 'Scaduto:',
        soon: 'In scadenza:',
        test: 'ShelfMate: messaggio di prova',
        inventory: "È ora dell'inventario: controlla cosa c'è davvero sugli scaffali.",
    },
    es: {
        low: 'Stock mínimo alcanzado: {1}',
        expired: 'Caducado:',
        soon: 'Caduca pronto:',
        test: 'ShelfMate: mensaje de prueba',
        inventory: 'Hora de hacer inventario: comprueba lo que realmente hay en las estanterías.',
    },
    pl: {
        low: 'Osiągnięto minimalny zapas: {1}',
        expired: 'Przeterminowane:',
        soon: 'Wkrótce upływa termin:',
        test: 'ShelfMate: wiadomość testowa',
        inventory: 'Czas na inwentaryzację: sprawdź, co naprawdę leży na półkach.',
    },
    uk: {
        low: 'Досягнуто мінімального запасу: {1}',
        expired: 'Прострочено:',
        soon: 'Скоро спливає термін:',
        test: 'ShelfMate: тестове повідомлення',
        inventory: 'Час для інвентаризації: перевірте, що насправді лежить на полицях.',
    },
    'zh-cn': {
        low: '已达到最低库存：{1}',
        expired: '已过期：',
        soon: '即将过期：',
        test: 'ShelfMate：测试消息',
        inventory: '该盘点了：请检查货架上实际有什么。',
    },
};

/**
 * @param {string} lang language code
 */
function text(lang) {
    return TEXT[lang] || TEXT.en;
}

/**
 * @param {string} lang language code
 * @param {string} name product or group name
 */
function lowText(lang, name) {
    return text(lang).low.replace('{1}', name);
}

/**
 * Message about expired and soon expiring products, empty when there is nothing to report.
 *
 * @param {string} lang language code
 * @param {{name: string, date: string, expired: boolean, place?: string}[]} list result of Inventory.expiryList
 */
function expiryText(lang, list) {
    const t = text(lang);
    const line = x => `• ${x.name} (${x.date})${x.place ? ` – ${x.place}` : ''}`;
    const parts = [];
    const expired = list.filter(x => x.expired);
    const soon = list.filter(x => !x.expired);
    if (expired.length) {
        parts.push([t.expired, ...expired.map(line)].join('\n'));
    }
    if (soon.length) {
        parts.push([t.soon, ...soon.map(line)].join('\n'));
    }
    return parts.join('\n\n');
}

/**
 * Milliseconds until the next occurrence of HH:MM.
 *
 * @param {string} time time as HH:MM
 * @param {Date} [now] current time
 */
function msUntil(time, now = new Date()) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(time);
    const [h, min] = m ? [Number(m[1]), Number(m[2])] : [8, 0];
    const next = new Date(now);
    next.setHours(h, min, 0, 0);
    if (next.getTime() <= now.getTime() + 1000) {
        next.setDate(next.getDate() + 1);
    }
    return next.getTime() - now.getTime();
}

/**
 * Send a message through any notification adapter (fire and forget).
 *
 * @param {{sendTo: (...args: unknown[]) => void}} adapter ioBroker adapter
 * @param {{instance: string, target?: string, area?: string}} opt instance such as telegram.0
 * @param {string} message text
 * @param {'info' | 'warn' | 'error'} [severity] telegrammenu2 message type
 */
function deliver(adapter, opt, message, severity = 'info') {
    const { instance, target, area } = opt;
    if (instance.startsWith('telegrammenu2')) {
        // "area" has to be one that is already approved in telegrammenu2; warn and error go out immediately
        adapter.sendTo(instance, 'notify', { area: area || 'ShelfMate', type: severity, text: message });
        return;
    }
    if (instance.startsWith('email')) {
        adapter.sendTo(instance, { text: message, subject: 'ShelfMate', ...(target ? { to: target } : {}) });
        return;
    }
    adapter.sendTo(instance, target ? { text: message, chatId: target } : message);
}

module.exports = { NOTIFY_ADAPTERS, TEXT, lowText, expiryText, msUntil, deliver };
