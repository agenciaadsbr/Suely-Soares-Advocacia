(function () {
  'use strict';
  var C = window.LP_CONFIG || {};
  var REST = C.supabaseUrl + '/rest/v1/';
  var SITE = document.body.dataset.site || C.site;
  var WA_MSG = 'Olá! Acessei a página da Dra. Suely Soares e gostaria de obter orientação sobre uma questão relacionada ao meu direito de dirigir.';

  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  // ---------- origem / UTM (preservadas durante a navegação) ----------
  var params = new URLSearchParams(location.search);
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  var utm = {};
  keys.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k); });
  if (Object.keys(utm).length) sset('ss_utm', JSON.stringify(utm));
  var stored = {};
  try { stored = JSON.parse(sget('ss_utm') || '{}'); } catch (e) {}
  if (!sget('ss_ref')) { try { sset('ss_ref', document.referrer ? new URL(document.referrer).hostname : ''); } catch (e) {} }

  function origem() {
    if (stored.utm_source || stored.utm_medium || stored.utm_campaign) {
      return [stored.utm_source, stored.utm_medium, stored.utm_campaign, stored.utm_term].filter(Boolean).join(' / ');
    }
    if (stored.fbclid) return 'facebook / social';
    if (stored.gclid) return 'google / cpc';
    return sget('ss_ref') || 'direto';
  }
  function refSuffix() {
    var p = [stored.utm_source, stored.utm_term, stored.utm_content].filter(Boolean);
    return p.length ? '\n\n(ref: ' + p.join(' | ') + ')' : '';
  }
  function waLink(msg) {
    return 'https://wa.me/' + (C.whatsapp || '5583991766666') + '?text=' + encodeURIComponent((msg || WA_MSG) + refSuffix());
  }

  // links de WhatsApp com a referência da campanha
  document.querySelectorAll('[data-wa]').forEach(function (a) { a.href = waLink(); });

  // ---------- Supabase (REST) ----------
  function insert(table, row) {
    return fetch(REST + table, {
      method: 'POST',
      headers: {
        'apikey': C.supabaseAnonKey,
        'Authorization': 'Bearer ' + C.supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row),
      keepalive: true
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  }
  insert('lp_visits', { site: SITE, path: location.pathname + location.search, referrer: document.referrer || null }).catch(function () {});

  // ---------- rastreamento ----------
  function track(name, data) {
    data = Object.assign({}, stored, data || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, data));
    if (typeof window.fbq === 'function' && name === 'whatsapp_click') {
      window.fbq('track', 'Contact', { content_name: data.position });
      window.fbq('trackCustom', 'WhatsAppClick', data);
    }
  }
  document.addEventListener('click', function (e) {
    var wa = e.target.closest('[data-wa]');
    if (wa) track('whatsapp_click', { position: wa.getAttribute('data-wa') });
  });

  // ---------- menu mobile ----------
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('menu-mobile');
  if (burger && mnav) {
    var setMenu = function (open) {
      mnav.hidden = !open;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      burger.querySelector('.ic-open').hidden = open;
      burger.querySelector('.ic-close').hidden = !open;
    };
    burger.addEventListener('click', function () { setMenu(mnav.hidden); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // ---------- FAQ ----------
  var items = document.querySelectorAll('.faq-item');
  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      items.forEach(function (o) {
        o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        o.querySelector('.faq-a').hidden = true;
        o.querySelector('.faq-ic').classList.remove('on');
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        item.querySelector('.faq-a').hidden = false;
        item.querySelector('.faq-ic').classList.add('on');
      }
    });
  });

  // ---------- formulário → Supabase → /redirect ----------
  var form = document.getElementById('lead-form');
  if (!form) return;
  var nome = document.getElementById('f-nome');
  var tel = document.getElementById('f-tel');
  var erro = document.getElementById('form-erro');
  var btn = document.getElementById('form-btn');

  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 11), f = d;
    if (d.length > 2) f = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) f = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    tel.value = f;
  });
  function showError(msg, el) { erro.textContent = msg; erro.hidden = false; if (el) el.focus(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    erro.hidden = true;
    var n = nome.value.trim();
    var digits = tel.value.replace(/\D/g, '');
    if (n.length < 2) return showError('Informe seu nome.', nome);
    if (digits.length < 10 || digits.length > 11) return showError('Informe um número de WhatsApp com DDD.', tel);
    btn.disabled = true;
    track('form_submit', {});
    var done = false;
    function go() {
      if (done) return; done = true;
      var q = new URLSearchParams(location.search);
      q.set('n', n.split(/\s+/)[0]);
      location.href = '/redirect?' + q.toString();
    }
    insert('lp_leads', { site: SITE, nome: n, whatsapp: digits, origem: origem() }).then(go).catch(go);
    setTimeout(go, 4000);
  });
})();
