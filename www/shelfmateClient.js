/*
 * ShelfMate client transport.
 * Provides the small subset of the socket.io client API the web app uses (on, emit, connect, disconnect, close,
 * removeAllListeners, connected) on top of fetch() and Server-Sent Events, so the app needs no ioBroker web adapter.
 */
(function () {
  'use strict';
  var ROOT = '0_userdata.0.Kuechenlager';
  var KEYS = { products: '.data.productsJson', inventory: '.data.inventoryJson', locations: '.data.locationsJson', history: '.data.historyJson', areas: '.data.areasJson', batches: '.data.batchesJson', config: '.data.configJson' };
  var IDS = {};
  Object.keys(KEYS).forEach(function (k) { IDS[k] = ROOT + KEYS[k]; });
  var ID_COMMAND = ROOT + '.api.commandJson';
  var ID_RESPONSE = ROOT + '.api.responseJson';
  var ID_READY = ROOT + '.status.ready';
  var ID_SHOP = 'shelfmate.shopping';
  var ID_SHOP_ADD = 'shelfmate.shopping.addItem';
  var ID_SHOP_REMOVE = 'shelfmate.shopping.removeItem';
  var STALE_MS = 40000;

  var keyAsked = null;
  function getKey() { try { return localStorage.getItem('shelfmate-key') || ''; } catch (e) { return ''; } }
  function setKey(k) { try { localStorage.setItem('shelfmate-key', k); } catch (e) { /* no storage */ } }

  function api(path, body, retried) {
    var headers = { 'Content-Type': 'application/json' };
    var key = getKey();
    var sent = key;
    if (key) headers['x-shelfmate-key'] = key;
    return fetch(path, { method: body === undefined ? 'GET' : 'POST', headers: headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401 && !retried) {
          if (getKey() && getKey() !== sent) return api(path, body, true);
          if (!keyAsked) {
            keyAsked = Promise.resolve().then(function () {
              var k = window.prompt('ShelfMate access key');
              if (k) setKey(k.trim());
              return !!k;
            }).then(function (ok) { keyAsked = null; return ok; });
          }
          return keyAsked.then(function (ok) { return ok ? api(path, body, true) : Promise.reject(new Error('Access key required')); });
        }
        return r.json().then(function (j) { if (!r.ok && j && j.error) throw new Error(j.error); return j; });
      });
  }

  function Socket() {
    var self = this;
    var handlers = {};
    var es = null;
    var lastMsg = 0;
    var snapAt = 0;
    var snapP = null;
    var lastResponse = null;
    var watchdog = null;
    self.connected = false;

    function emitLocal(name) {
      var args = Array.prototype.slice.call(arguments, 1);
      (handlers[name] || []).slice().forEach(function (fn) { try { fn.apply(null, args); } catch (e) { console.error(e); } });
    }
    function snap(force) {
      if (!force && snapP && Date.now() - snapAt < 400) return snapP;
      snapAt = Date.now();
      snapP = api('/api/snapshot').catch(function (e) { snapP = null; throw e; });
      return snapP;
    }
    function stateOf(snapshot, id) {
      var k = Object.keys(IDS).filter(function (x) { return IDS[x] === id; })[0];
      if (k) return { val: JSON.stringify(snapshot[k]), ack: true, ts: Date.now() };
      if (id === ID_READY) return { val: !!snapshot.ready, ack: true, ts: Date.now() };
      if (id === ID_RESPONSE) return lastResponse;
      if (id === ID_SHOP) return { val: snapshot.shopping ? JSON.stringify(snapshot.bring || []) : null, ack: true, ts: Date.now() };
      return null;
    }
    function pushSnapshot(s) {
      Object.keys(IDS).forEach(function (k) { emitLocal('stateChange', IDS[k], { val: JSON.stringify(s[k]), ack: true }); });
      if (s.shopping) emitLocal('stateChange', ID_SHOP, { val: JSON.stringify(s.bring || []), ack: true });
    }
    function open() {
      if (es) return;
      lastMsg = Date.now();
      snap(true).then(function () {
        if (es) return;
        es = new EventSource('/api/events' + (getKey() ? '?key=' + encodeURIComponent(getKey()) : ''));
        es.onopen = function () { lastMsg = Date.now(); if (!self.connected) { self.connected = true; emitLocal('connect'); } };
        es.onerror = function () {
          if (self.connected) { self.connected = false; emitLocal('disconnect'); }
          emitLocal('connect_error', new Error('event stream interrupted'));
        };
        es.addEventListener('ping', function () { lastMsg = Date.now(); });
        es.addEventListener('data', function (ev) { lastMsg = Date.now(); snapP = null; try { pushSnapshot(JSON.parse(ev.data)); } catch (e) { console.warn(e); } });
        es.addEventListener('bring', function (ev) { lastMsg = Date.now(); snapP = null; try { emitLocal('stateChange', ID_SHOP, { val: ev.data, ack: true }); } catch (e) { console.warn(e); } });
      }).catch(function (e) {
        emitLocal('connect_error', e);
        setTimeout(function () { if (!es && !self._closed) open(); }, 3000);
      });
      if (!watchdog) {
        watchdog = setInterval(function () {
          if (es && Date.now() - lastMsg > STALE_MS) { close(); open(); }
        }, 10000);
      }
    }
    function close() {
      if (es) { es.close(); es = null; }
      if (self.connected) { self.connected = false; emitLocal('disconnect'); }
    }

    self.on = function (name, fn) { (handlers[name] = handlers[name] || []).push(fn); return self; };
    self.removeAllListeners = function () { handlers = {}; return self; };
    self.connect = function () { self._closed = false; open(); return self; };
    self.disconnect = function () { self._closed = true; close(); return self; };
    self.close = self.disconnect;

    self.emit = function (name) {
      var args = Array.prototype.slice.call(arguments, 1);
      var cb = typeof args[args.length - 1] === 'function' ? args.pop() : function () {};
      var done = function (err, val) { setTimeout(function () { cb(err ? String(err.message || err) : null, val); }, 0); };
      if (name === 'subscribe') return done(null);
      if (name === 'getState') {
        snap().then(function (s) { done(null, stateOf(s, args[0])); }, done);
        return;
      }
      if (name === 'setState') {
        var id = args[0];
        var val = args[1] && typeof args[1] === 'object' ? args[1].val : args[1];
        if (id === ID_COMMAND) {
          var cmd;
          try { cmd = JSON.parse(val); } catch (e) { return done(e); }
          api('/api/command', cmd).then(function (result) {
            lastResponse = { val: JSON.stringify(result), ack: true, ts: Date.now() };
            snapP = null;
            done(null);
            setTimeout(function () { emitLocal('stateChange', ID_RESPONSE, lastResponse); }, 10);
          }, done);
          return;
        }
        if (id === ID_SHOP_ADD) {
          api('/api/shopping/add', { name: val }).then(function (r) {
            snapP = null;
            if (r && r.ok) done(null, r); else done(new Error((r && r.error) || 'Failed'));
          }, done);
          return;
        }
        if (id === ID_SHOP_REMOVE) {
          var names;
          try { names = JSON.parse(val); } catch (e) { return done(e); }
          api('/api/shopping/remove', { names: names }).then(function (r) {
            snapP = null;
            if (r && r.ok) done(null, r); else done(new Error((r && r.error) || 'Failed'));
          }, done);
          return;
        }
        return done(new Error('Unsupported'));
      }
      done(new Error('Unsupported'));
    };
    self._closed = false;
    open();
  }

  function io() { return new Socket(); }
  io.connect = io;
  window.io = io;
})();
