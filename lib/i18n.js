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
    },
    de: {
        product: 'Produkt',
        amount: 'Menge',
        location: 'Lagerort',
        bestBefore: 'MHD',
        remaining: 'Verbleibend',
        expired: 'abgelaufen',
        days: 'T',
    },
    ru: {
        product: 'Продукт',
        amount: 'Количество',
        location: 'Место',
        bestBefore: 'Срок годности',
        remaining: 'Осталось',
        expired: 'просрочено',
        days: 'дн.',
    },
    pt: {
        product: 'Produto',
        amount: 'Quantidade',
        location: 'Local',
        bestBefore: 'Validade',
        remaining: 'Restante',
        expired: 'expirado',
        days: 'd',
    },
    nl: {
        product: 'Product',
        amount: 'Aantal',
        location: 'Locatie',
        bestBefore: 'Houdbaar tot',
        remaining: 'Resterend',
        expired: 'verlopen',
        days: 'd',
    },
    fr: {
        product: 'Produit',
        amount: 'Quantité',
        location: 'Emplacement',
        bestBefore: 'DLC',
        remaining: 'Restant',
        expired: 'périmé',
        days: 'j',
    },
    it: {
        product: 'Prodotto',
        amount: 'Quantità',
        location: 'Posizione',
        bestBefore: 'Scadenza',
        remaining: 'Rimanente',
        expired: 'scaduto',
        days: 'g',
    },
    es: {
        product: 'Producto',
        amount: 'Cantidad',
        location: 'Ubicación',
        bestBefore: 'Caducidad',
        remaining: 'Restante',
        expired: 'caducado',
        days: 'd',
    },
    pl: {
        product: 'Produkt',
        amount: 'Ilość',
        location: 'Lokalizacja',
        bestBefore: 'Termin ważności',
        remaining: 'Pozostało',
        expired: 'przeterminowany',
        days: 'd',
    },
    uk: {
        product: 'Продукт',
        amount: 'Кількість',
        location: 'Місце',
        bestBefore: 'Термін придатності',
        remaining: 'Залишилось',
        expired: 'прострочено',
        days: 'дн.',
    },
    'zh-cn': {
        product: '产品',
        amount: '数量',
        location: '位置',
        bestBefore: '保质期',
        remaining: '剩余',
        expired: '已过期',
        days: '天',
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
