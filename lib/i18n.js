'use strict';

const TABLE = {
    en: {
        product: 'Product',
        amount: 'Amount',
        location: 'Location',
        bestBefore: 'Best before',
        remaining: 'Remaining',
        expired: 'expired',
        days: 'd',
        opened: 'opened',
    },
    de: {
        product: 'Produkt',
        amount: 'Menge',
        location: 'Lagerort',
        bestBefore: 'MHD',
        remaining: 'Verbleibend',
        expired: 'abgelaufen',
        days: 'T',
        opened: 'geöffnet',
    },
    ru: {
        product: 'Продукт',
        amount: 'Количество',
        location: 'Место',
        bestBefore: 'Срок годности',
        remaining: 'Осталось',
        expired: 'просрочено',
        days: 'дн.',
        opened: 'открыто',
    },
    pt: {
        product: 'Produto',
        amount: 'Quantidade',
        location: 'Local',
        bestBefore: 'Validade',
        remaining: 'Restante',
        expired: 'expirado',
        days: 'd',
        opened: 'aberto',
    },
    nl: {
        product: 'Product',
        amount: 'Aantal',
        location: 'Locatie',
        bestBefore: 'Houdbaar tot',
        remaining: 'Resterend',
        expired: 'verlopen',
        days: 'd',
        opened: 'geopend',
    },
    fr: {
        product: 'Produit',
        amount: 'Quantité',
        location: 'Emplacement',
        bestBefore: 'DLC',
        remaining: 'Restant',
        expired: 'périmé',
        days: 'j',
        opened: 'ouvert',
    },
    it: {
        product: 'Prodotto',
        amount: 'Quantità',
        location: 'Posizione',
        bestBefore: 'Scadenza',
        remaining: 'Rimanente',
        expired: 'scaduto',
        days: 'g',
        opened: 'aperto',
    },
    es: {
        product: 'Producto',
        amount: 'Cantidad',
        location: 'Ubicación',
        bestBefore: 'Caducidad',
        remaining: 'Restante',
        expired: 'caducado',
        days: 'd',
        opened: 'abierto',
    },
    pl: {
        product: 'Produkt',
        amount: 'Ilość',
        location: 'Lokalizacja',
        bestBefore: 'Termin ważności',
        remaining: 'Pozostało',
        expired: 'przeterminowany',
        days: 'd',
        opened: 'otwarte',
    },
    uk: {
        product: 'Продукт',
        amount: 'Кількість',
        location: 'Місце',
        bestBefore: 'Термін придатності',
        remaining: 'Залишилось',
        expired: 'прострочено',
        days: 'дн.',
        opened: 'відкрито',
    },
    'zh-cn': {
        product: '产品',
        amount: '数量',
        location: '位置',
        bestBefore: '保质期',
        remaining: '剩余',
        expired: '已过期',
        days: '天',
        opened: '已开封',
    },
};

/**
 * Texts for the HTML data points in the ioBroker system language (English as fallback).
 *
 * @param {string} [lang] ioBroker system language
 * @returns {Record<string, string>} texts
 */
function texts(lang) {
    return TABLE[String(lang || '').toLowerCase()] || TABLE.en;
}

module.exports = { texts, TABLE };
