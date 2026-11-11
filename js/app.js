/* Mizynyua — демо, версия 2. Полки, карточка товара, «коробочка» и заказ сообщением в Telegram. */
(function () {
  'use strict';

  var SHELVES = window.MZ_SHELVES || [];
  var ORDER_CHAT = 'https://t.me/masnmi';
  var STORE_KEY = 'mz_box_v2';
  var MAX_QTY = 20;
  var NBSP = ' ';
  var NNBSP = ' ';

  /* справочник товаров без прототипа: ключи вроде «constructor» не пройдут */
  var byId = Object.create(null);
  SHELVES.forEach(function (sh) {
    sh.items.forEach(function (it) { it.shelf = sh; byId[it.id] = it; });
  });

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var productDlg = $('[data-product]');
  var cartDlg = $('[data-cart]');
  var header = $('[data-header]');
  var boxbtn = $('.boxbtn');
  var boxbar = $('[data-boxbar]');
  var current = null;
  var addedAt = 0;

  /* ---------- утилиты ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* неразрывный пробел после коротких слов, чтобы «с», «и», «из» не висели в конце строки */
  function nb(s) { return String(s).replace(/(^|\s)([а-яёА-ЯЁ]{1,2})\s/g, '$1$2' + NBSP); }
  function price(n) { return String(Number(n) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP) + NBSP + '₽'; }
  function plain(s) { return String(s).replace(/[  ]/g, ' '); }
  /* в версии «одним файлом» картинки уже лежат в разметке — берём их оттуда */
  var IMGS = Object.create(null);
  function collectImgs(root) {
    Array.prototype.forEach.call(root.querySelectorAll('img[data-img]'), function (i) { IMGS[i.getAttribute('data-img')] = i.getAttribute('src'); });
  }
  collectImgs(document);
  Array.prototype.forEach.call(document.querySelectorAll('template[data-imgs]'), function (t) { collectImgs(t.content); });
  function img(name) { return IMGS[name] || 'img/' + name + '.webp'; }
  function say(text) {
    var open = $('dialog[open] [data-live]');
    var live = open || $('body > [data-live]');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 40);
  }
  function chat(text) { return ORDER_CHAT + '?text=' + encodeURIComponent(text); }

  /* ---------- коробочка ---------- */
  var cart = load();
  function load() {
    var out = Object.create(null);
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (raw && typeof raw === 'object') {
        Object.keys(raw).forEach(function (id) {
          var q = Math.floor(Number(raw[id]));
          if (byId[id] && q > 0) out[id] = Math.min(q, MAX_QTY);
        });
      }
    } catch (e) { /* хранилище недоступно — коробочка живёт до перезагрузки */ }
    return out;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) { /* см. выше */ }
  }
  function ids() { return Object.keys(cart).filter(function (id) { return byId[id]; }); }
  function count() { return ids().reduce(function (s, id) { return s + cart[id]; }, 0); }
  function total() { return ids().reduce(function (s, id) { return s + cart[id] * byId[id].price; }, 0); }
  function hasOld() { return ids().some(function (id) { return byId[id].old; }); }
  function setQty(id, q) {
    if (!byId[id]) return;
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, MAX_QTY);
    save();
    sync();
  }
  function orderText() {
    var lines = ids().map(function (id, i) {
      var it = byId[id];
      return (i + 1) + '. ' + it.name + (it.old ? '*' : '') + ' — ' + cart[id] + ' шт. × ' + plain(price(it.price));
    });
    return 'Здравствуйте! Хочу заказать с сайта:\n\n' + lines.join('\n') +
      '\n\nИтого без доставки: ' + plain(price(total())) +
      (hasOld() ? '\n* цену уточнить' : '') +
      '\n\nРазмер кольца / буква / пожелания: ';
  }

  /* ---------- бирка на ниточке: дырочка в углу фото, волнистая нитка, бирка прежней формы ---------- */
  /* Петля шпагата: одна нить выходит из люверса, вторая огибает край фото; обе сходятся
     к дырочке бирки узелком. У каждой бирки своя длина нити и свой наклон. */
  var HANGS = [[-46, 40, -24], [-52, 47, -31], [-40, 35, -18], [-56, 50, -27], [-44, 45, -35], [-50, 38, -21], [-42, 49, -29]];
  function rope(where, i) {
    var p = HANGS[i % HANGS.length], tx = p[0], ty = p[1];
    var ex = where === 'top' ? 14 : -3, ey = where === 'top' ? 3 : 16;
    var f = function (n) { return Math.round(n * 10) / 10; };
    var a = 'M0 0Q' + f(tx * 0.45 + 4) + ' ' + f(ty * 0.55) + ' ' + tx + ' ' + ty;
    var b = 'M' + ex + ' ' + ey + 'Q' + f(tx * 0.3 + ex * 0.6 + 6) + ' ' + f(ty * 0.72 + ey * 0.3) + ' ' + tx + ' ' + ty;
    return { style: '--tr:' + f(-tx + 3.5) + 'px;--tt:' + (ty - 13) + 'px;--ta:' + p[2] + 'deg',
      svg: '<svg class="hang__rope" width="1" height="1">' +
        '<path class="tw1" d="' + b + '"/><path class="tw2" d="' + b + '"/>' +
        '<path class="tw1" d="' + a + '"/><path class="tw2" d="' + a + '"/>' +
        '<circle class="knot" cx="' + tx + '" cy="' + ty + '" r="2.3"/></svg>' };
  }
  /* каталог: вертикальная бирка с острым верхом висит под люверсом; петля — через люверс и через верхний край фото */
  var VHANGS = [[-1, 18, -3], [1, 22, 2], [-2, 16, -4], [1, 20, 3], [-1, 21, -2], [2, 17, 4], [0, 19, -3]];
  function vhang(text, i) {
    var p = VHANGS[i % VHANGS.length], tx = p[0], ty = p[1];
    var f = function (n) { return Math.round(n * 10) / 10; };
    var a = 'M0 0Q' + f(tx * 0.5 + 2) + ' ' + f(ty * 0.5) + ' ' + tx + ' ' + ty;
    var b = 'M3 -10Q' + f(tx * 0.6 + 5) + ' ' + f(ty * 0.35) + ' ' + tx + ' ' + ty;
    return '<span class="hang hang--v" style="--tx:' + tx + 'px;--ty:' + ty + 'px;--ta:' + p[2] + 'deg" aria-hidden="true"><span class="hang__hole"></span>' +
      '<svg class="hang__rope" width="1" height="1"><path class="tw1" d="' + b + '"/><path class="tw2" d="' + b + '"/>' +
      '<path class="tw1" d="' + a + '"/><path class="tw2" d="' + a + '"/><circle class="knot" cx="' + tx + '" cy="' + ty + '" r="1.8"/></svg>' +
      '<span class="vtag"><span class="vtag__body">' + esc(text) + '</span></span></span>';
  }
  function hang(text, where, i) {
    if (where === 'top') return vhang(text, i);
    var r = rope(where, i);
    return '<span class="hang hang--' + where + '" style="' + r.style + '" aria-hidden="true"><span class="hang__hole"></span>' +
      r.svg + '<span class="hang__tag"><span class="tag tag--r">' + esc(text) + '</span></span></span>';
  }

  /* ---------- полки ---------- */
  function cardHtml(it, i) {
    var sh = it.shelf;
    var eager = sh.id === 'rings' && i < 4;
    var more = it.imgs.length > 1 ? '<span class="card__count">' + it.imgs.length + ' фото</span>' : '';
    /* фото и название открывают карточку; для клавиатуры и диктора — одна кнопка, название */
    return '<article class="card" style="--ratio:' + sh.ratio + '">' +
      '<button type="button" class="card__photo' + (sh.id === 'beads' ? ' card__photo--linen' : '') + '" data-open="' + esc(it.id) + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + esc(img(it.imgs[0])) + '" alt="" width="' + sh.w + '" height="' + sh.h + '"' +
        (eager ? ' fetchpriority="' + (i < 2 ? 'high' : 'auto') + '"' : ' loading="lazy"') + ' decoding="async">' + more +
        hang(price(it.price), 'top', i + (sh.id === 'beads' ? 3 : 0)) +
      '</button>' +
      '<div class="card__info">' +
        '<button type="button" class="card__name" data-open="' + esc(it.id) + '">' + esc(nb(it.name)) +
          '<span class="sr">, ' + esc(price(it.price)) + '</span></button>' +
        '<button type="button" class="add" data-add="' + esc(it.id) + '"></button>' +
      '</div>' +
    '</article>';
  }
  function tileHtml() {
    var ask = chat('Здравствуйте! Хочу чокер со своей буквой: ');
    return '<div class="tile"><h3>Своя буква</h3>' +
      '<p>Нужна другая буква или цвет бисера&nbsp;— напишите, обсудим.</p>' +
      '<a class="link" href="' + esc(ask) + '" target="_blank" rel="noopener">Написать в&nbsp;Telegram</a></div>';
  }
  function renderShelves() {
    SHELVES.forEach(function (sh) {
      var el = $('[data-shelf="' + sh.id + '"]');
      if (!el || el.querySelector('.card')) return; /* карточки уже выведены в разметке */
      el.innerHTML = sh.items.map(cardHtml).join('') + (sh.tile ? tileHtml() : '');
    });
  }

  function syncButtons() {
    $$('[data-add]').forEach(function (b) {
      var id = b.getAttribute('data-add');
      var it = byId[id];
      var inBox = !!cart[id];
      b.dataset.in = inBox ? 'true' : 'false';
      b.innerHTML = '<span class="add__box" aria-hidden="true"><svg><use href="#box"/></svg>' +
        '<svg class="bow add__bow"><use href="#bow"/></svg>' +
        (inBox ? '<svg class="add__tick"><use href="#check"/></svg>' : '') + '</span>' +
        '<span class="add__txt">' + (inBox ? 'В коробочке' : 'В коробочку') + '</span>';
      b.setAttribute('aria-label', (inBox ? 'В коробочке, открыть: ' : 'Положить в коробочку: ') + it.name);
    });
    if (current) {
      var pb = $('[data-p-add]');
      var inC = !!cart[current.id];
      pb.dataset.in = inC ? 'true' : 'false';
      pb.textContent = inC ? 'В коробочке — открыть' : 'В коробочку — ' + price(current.price);
    }
  }

  /* ---------- окна и кнопка «назад» на телефоне ---------- */
  /* событие close приходит не сразу, поэтому «тихое» закрытие помечаем на самом окне */
  function quietClose(dlg) { dlg.dataset.quiet = '1'; dlg.close(); }
  function openDialog(dlg) {
    if (typeof dlg.showModal !== 'function') { location.href = ORDER_CHAT; return; }
    var other = $('dialog[open]');
    if (other === dlg) return;
    if (other) {
      quietClose(other);
      try { history.replaceState({ mz: 1 }, ''); } catch (e) { /* без истории — просто окно */ }
    } else {
      try { history.pushState({ mz: 1 }, ''); } catch (e) { /* см. выше */ }
    }
    dlg.showModal();
    syncBar();
  }
  [productDlg, cartDlg].forEach(function (dlg) {
    dlg.addEventListener('close', function () {
      if (dlg === productDlg && !productDlg.open) current = null;
      var quiet = dlg.dataset.quiet === '1';
      delete dlg.dataset.quiet;
      syncBar();
      if (quiet || $('dialog[open]')) return;
      if (history.state && history.state.mz) history.back();
    });
    /* закрыть кликом мимо, только если и нажали, и отпустили на подложке */
    var downOnBackdrop = false;
    dlg.addEventListener('mousedown', function (e) { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener('click', function (e) { if (downOnBackdrop && e.target === dlg) dlg.close(); });
  });
  window.addEventListener('popstate', function () {
    var open = $('dialog[open]');
    if (open) quietClose(open);
  });

  /* ---------- карточка товара ---------- */
  function openProduct(id) {
    var it = byId[id];
    if (!it) return;
    current = it;
    productDlg.style.setProperty('--ratio', it.shelf.ratio);
    $('[data-p-shelf]').textContent = it.shelf.title;
    $('[data-p-name]').textContent = nb(it.name);
    $('[data-p-price]').textContent = price(it.price);
    $('[data-p-line]').textContent = nb(it.line);
    $('[data-p-old]').hidden = !it.old;
    $('[data-p-specs]').innerHTML = it.specs.map(function (s) {
      return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>';
    }).join('');
    $('[data-p-ask]').href = chat('Здравствуйте! Вопрос про «' + it.name + '»: ');
    $('[data-p-thumbs]').innerHTML = it.imgs.length < 2 ? '' : it.imgs.map(function (n, i) {
      return '<button type="button" class="thumb" data-thumb="' + i + '" aria-label="Фото ' + (i + 1) + ' из ' + it.imgs.length + '">' +
        '<img src="' + esc(img(n)) + '" alt="" width="' + it.shelf.w + '" height="' + it.shelf.h + '"></button>';
    }).join('');
    showImg(0);
    syncButtons();
    openDialog(productDlg);
    $('.modal__box', productDlg).scrollTop = 0;
    var body = $('.modal__body', productDlg);
    if (body) body.scrollTop = 0;
  }
  function showImg(i) {
    var frame = $('[data-p-frame]');
    var el = document.createElement('img');
    el.src = img(current.imgs[i]);
    el.width = current.shelf.w;
    el.height = current.shelf.h;
    el.decoding = 'async';
    el.alt = current.name + (current.imgs.length > 1 ? ', фото ' + (i + 1) : '');
    frame.replaceChildren(el);
    $$('[data-thumb]').forEach(function (t) {
      if (Number(t.getAttribute('data-thumb')) === i) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
  }

  /* ---------- окно коробочки ---------- */
  function renderCart() {
    var list = $('[data-cart-list]');
    var foot = $('[data-cart-foot]');
    var focusKey = null;
    var a = document.activeElement;
    if (a && list.contains(a)) {
      ['data-inc', 'data-dec', 'data-del'].some(function (k) {
        if (a.hasAttribute(k)) { focusKey = [k, a.getAttribute(k)]; return true; }
        return false;
      });
    }
    var all = ids();
    if (!all.length) {
      list.innerHTML = '<div class="empty"><svg class="bow" aria-hidden="true"><use href="#bow"/></svg>' +
        '<p>Пока пусто. Положите сюда то, что понравилось, и&nbsp;отправьте список в&nbsp;Telegram.</p>' +
        '<button type="button" class="btn btn--line" data-to-catalog>К украшениям</button></div>';
      foot.hidden = true;
      if (focusKey) $('[data-close]', cartDlg).focus();
      return;
    }
    foot.hidden = false;
    list.innerHTML = all.map(function (id) {
      var it = byId[id];
      var q = cart[id];
      return '<div class="line" style="--ratio:' + it.shelf.ratio + '">' +
        '<img class="line__img" src="' + esc(img(it.imgs[0])) + '" alt="" width="64" height="96" loading="lazy">' +
        '<div class="line__main">' +
          '<div class="line__top"><span class="line__name">' + esc(nb(it.name)) + (it.old ? ' *' : '') + '</span>' +
          '<span class="line__price">' + esc(price(it.price * q)) + '</span></div>' +
          '<div class="line__row">' +
            '<div class="qty">' +
              '<button type="button" data-dec="' + esc(id) + '" aria-label="' + (q === 1 ? 'Убрать из коробочки: ' : 'На одну меньше: ') + esc(it.name) + '">−</button>' +
              '<output aria-live="off"><span class="sr">Количество: </span>' + q + '</output>' +
              '<button type="button" data-inc="' + esc(id) + '" aria-label="На одну больше: ' + esc(it.name) + '"' + (q >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
            '</div>' +
            '<button type="button" class="line__del" data-del="' + esc(id) + '">Убрать</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    $('[data-cart-total]').textContent = price(total());
    $('[data-cart-oldnote]').hidden = !hasOld();
    $('[data-cart-send]').href = chat(orderText());
    if (focusKey) {
      var back = $('[' + focusKey[0] + '="' + focusKey[1] + '"]', list) || $('[data-close]', cartDlg);
      if (back.disabled) back = $('[data-dec="' + focusKey[1] + '"]', list) || back;
      back.focus();
    }
  }
  function syncBar() {
    var n = count();
    var show = n > 0 && !$('dialog[open]');
    boxbar.hidden = false;
    boxbar.classList.toggle('is-on', show);
    boxbar.setAttribute('aria-hidden', show ? 'false' : 'true');
    boxbar.tabIndex = show ? 0 : -1;
    document.body.classList.toggle('has-bar', n > 0);
    $('[data-bar-count]').textContent = n + ' ' + plural(n, 'вещь', 'вещи', 'вещей');
    $('[data-bar-total]').textContent = price(total());
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function sync() {
    var n = count();
    var badge = $('[data-cart-count]');
    badge.textContent = n;
    badge.hidden = n === 0;
    boxbtn.setAttribute('aria-label', n ? 'Коробочка, вещей: ' + n : 'Коробочка, пусто');
    syncButtons();
    renderCart();
    syncBar();
  }
  function openCart() { renderCart(); openDialog(cartDlg); }

  function put(id) {
    if (cart[id]) {
      /* второй быстрый клик по той же кнопке не должен внезапно открывать коробочку */
      if (Date.now() - addedAt < 500) return;
      return openCart();
    }
    setQty(id, 1);
    addedAt = Date.now();
    boxbtn.classList.remove('is-tied');
    void boxbtn.offsetWidth;
    boxbtn.classList.add('is-tied');
    say('Положили в коробочку: ' + byId[id].name + '. Всего вещей: ' + count());
  }

  function copyOrder(btn) {
    var text = orderText();
    var done = function () { btn.textContent = 'Список скопирован — вставьте его в чат с @masnmi'; say('Список скопирован'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text) && done(); });
    } else if (fallbackCopy(text)) done();
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    cartDlg.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* ---------- события ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-add],[data-p-add],[data-thumb],[data-close],[data-cart-open],[data-inc],[data-dec],[data-del],[data-to-catalog],[data-cart-copy]');
    if (!t) return;
    if (t.hasAttribute('data-open')) return openProduct(t.getAttribute('data-open'));
    if (t.hasAttribute('data-add')) return put(t.getAttribute('data-add'));
    if (t.hasAttribute('data-p-add')) { if (current) put(current.id); return; }
    if (t.hasAttribute('data-thumb')) return showImg(Number(t.getAttribute('data-thumb')));
    if (t.hasAttribute('data-close')) return t.closest('dialog').close();
    if (t.hasAttribute('data-cart-open')) return openCart();
    if (t.hasAttribute('data-inc')) return setQty(t.getAttribute('data-inc'), (cart[t.getAttribute('data-inc')] || 0) + 1);
    if (t.hasAttribute('data-dec')) {
      var d = t.getAttribute('data-dec');
      if (cart[d] === 1) say('Убрали из коробочки: ' + byId[d].name);
      return setQty(d, (cart[d] || 0) - 1);
    }
    if (t.hasAttribute('data-del')) {
      var r = t.getAttribute('data-del');
      say('Убрали из коробочки: ' + byId[r].name);
      return setQty(r, 0);
    }
    if (t.hasAttribute('data-cart-copy')) return copyOrder(t);
    if (t.hasAttribute('data-to-catalog')) {
      cartDlg.close();
      return document.getElementById('rings').scrollIntoView();
    }
  });

  /* коробочка открыта в другой вкладке или хранилище очистили */
  window.addEventListener('storage', function (e) {
    if (e.key === STORE_KEY || e.key === null) { cart = load(); sync(); }
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { cart = load(); sync(); }
  });

  /* маленький знак в шапке появляется, когда большой ушёл за край */
  var lid = $('[data-lid] .lid__mark');
  if (lid && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      header.classList.toggle('show-logo', !en[0].isIntersecting);
    }, { rootMargin: '-' + (header.offsetHeight || 64) + 'px 0px 0px 0px' }).observe(lid);
  } else {
    header.classList.add('show-logo');
  }
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 4); }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- бирки качаются от прокрутки ----------
     Каждая бирка — маятник на пружинке: пока страницу листают, бирку относит от движения,
     после остановки она качается обратно и затухает. Короткая нить — качается чаще,
     длинная — медленнее; у каждой своя сила отклонения и своё затухание. */
  function initSway() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var visible = new Set();
    var items = $$('.vtag, .hang__tag').map(function (el, i) {
      var hang = el.closest('.hang');
      var cs = getComputedStyle(hang);
      var len = parseFloat(cs.getPropertyValue('--ty')) || (parseFloat(cs.getPropertyValue('--tt')) + 13) || 30;
      var jit = ((i * 37) % 11) / 10;
      var k = 0.000055 * (20 / Math.max(14, len)) * (0.85 + jit * 0.3);
      return { el: el, hang: hang, a: 0, w: 0, k: k,
        c: 2 * (0.09 + jit * 0.07) * Math.sqrt(k),
        drag: (1.6 + jit * 1.6) * (i % 3 === 1 ? -0.7 : 1) };
    });
    if (!items.length) return;
    function rest(it) { it.a = 0; it.w = 0; it.el.style.setProperty('--sw', '0deg'); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          var it = items.find(function (x) { return x.hang === e.target; });
          if (!it) return;
          if (e.isIntersecting) visible.add(it); else { visible.delete(it); rest(it); }
        });
      }, { rootMargin: '80px 0px' });
      items.forEach(function (it) { io.observe(it.hang); });
    } else items.forEach(function (it) { visible.add(it); });

    var lastY = window.scrollY, lastT = 0, v = 0, running = false;
    function frame(t) {
      var dt = lastT ? Math.min(48, t - lastT) : 16;
      lastT = t;
      var y = window.scrollY;
      var nv = (y - lastY) / dt;
      lastY = y;
      v += (nv - v) * 0.3;
      var energy = Math.abs(v);
      visible.forEach(function (it) {
        var target = Math.max(-7, Math.min(7, -v * it.drag));
        var acc = -it.k * (it.a - target) - it.c * it.w;
        it.w += acc * dt;
        it.a = Math.max(-14, Math.min(14, it.a + it.w * dt));
        it.el.style.setProperty('--sw', it.a.toFixed(2) + 'deg');
        energy += Math.abs(it.a) + Math.abs(it.w) * 60;
      });
      if (energy > 0.04) requestAnimationFrame(frame);
      else { running = false; lastT = 0; v = 0; visible.forEach(rest); }
    }
    window.addEventListener('scroll', function () {
      if (running) return;
      running = true;
      requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* после перезагрузки с открытым окном в истории остаётся отметка — убираем, окна закрыты */
  try { if (history.state && history.state.mz) history.replaceState(null, ''); } catch (e) { /* без истории */ }
  /* окна открываются через историю — браузер не должен сам прокручивать страницу при «назад» */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* старый браузер */ }

  /* цены на бирках первого экрана — из каталога, чтобы не разъехались */
  $$('[data-price-of]').forEach(function (t) {
    var it = byId[t.getAttribute('data-price-of')];
    if (it) t.textContent = price(it.price);
    else t.hidden = true;
  });

  renderShelves();
  sync();
  onScroll();
  initSway();
})();
