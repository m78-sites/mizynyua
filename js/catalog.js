/* Каталог демо. Цены и описания — из канала t.me/mizynyua (посты 9187–9229, 4519).
   old: true — цена из старого поста, перед запуском сверить с владельцем.
   Материал колец Dopamine в канале не указан — не пишем, пока владелец не подтвердит. */
(function () {
  var silver = function (extra) {
    return [['Материал', 'серебро 925 пробы'], ['Вставки', 'цирконы'], ['Размер', 'все размеры, под заказ']].concat(extra || []);
  };
  var dopamine = [['Камень', 'циркон'], ['Размер', 'единый, подойдёт на 17–18'], ['Изготовление', 'под заказ'], ['Отправка', 'из Москвы']];
  var cord = [['Основа', 'медь с золотым покрытием'], ['Вставки', 'цирконы'], ['Изготовление', 'под заказ, 7–10 дней']];
  var bead = [['Работа', 'ручная'], ['Материал', 'бисер'], ['Наличие', 'уточняйте в переписке']];
  var choker = [['Длина', '35 см, замочек ещё 6–7 см'], ['Работа', 'ручная'], ['Материал', 'бисер']];

  window.MZ_SHELVES = [
    {
      id: 'rings', title: 'Кольца и браслеты', ratio: '2 / 3', w: 532, h: 798,
      items: [
        { id: 'ring-dopamine-pink', name: 'Кольцо Dopamine, розовое', price: 2000,
          line: 'Розовое кольцо с малиновым цирконом. Самое яркое из четырёх.', imgs: ['ring-dopamine-pink'], specs: dopamine },
        { id: 'ring-turquoise', name: 'Кольцо-дорожка с бирюзовыми цирконами', price: 2900,
          line: 'Бирюзовые цирконы по всему кругу.', imgs: ['ring-turquoise', 'ring-turquoise-box'], specs: silver() },
        { id: 'bracelet-blue', name: 'Плетёный браслет, голубой', price: 1500,
          line: 'Голубой шнур, золотистая фурнитура и циркон в центре.', imgs: ['bracelet-blue'], specs: cord },
        { id: 'ring-double', name: 'Двойное кольцо с цирконами', price: 3300,
          line: 'Кольцо с крупным камнем и дорожка. Носите вместе или по одному.',
          imgs: ['ring-double', 'ring-double-solo', 'ring-double-band'], specs: silver() },
        { id: 'bracelet-lilac', name: 'Плетёный браслет, сиреневый', price: 1500,
          line: 'Сиреневый шнур, золотистая фурнитура, один циркон.', imgs: ['bracelet-lilac'], specs: cord },
        { id: 'ring-dopamine-green', name: 'Кольцо Dopamine, оливковое', price: 2000,
          line: 'Оливковое с тёмно-зелёным камнем. Самое спокойное из четырёх.', imgs: ['ring-dopamine-green'], specs: dopamine },
        { id: 'bracelet-gold', name: 'Браслет-обруч с цирконом', price: 1500,
          line: 'Тонкий золотистый обруч с одним камнем.', imgs: ['bracelet-gold'], specs: cord },
        { id: 'ring-dopamine-yellow', name: 'Кольцо Dopamine, лимонное', price: 2000,
          line: 'Лимонное с персиковым камнем.', imgs: ['ring-dopamine-yellow'], specs: dopamine },
        { id: 'ring-dopamine-white', name: 'Кольцо Dopamine, белое', price: 2000,
          line: 'Белое с прозрачным камнем. Подходит ко всему.', imgs: ['ring-dopamine-white'], specs: dopamine },
        { id: 'bracelet-pink', name: 'Плетёный браслет, розовый', price: 1500,
          line: 'Пудрово-розовый шнур и циркон в оправе.', imgs: ['bracelet-pink'], specs: cord },
        { id: 'bracelet-olive', name: 'Плетёный браслет, оливковый', price: 1500,
          line: 'Приглушённый зелёный шнур и циркон в оправе.', imgs: ['bracelet-olive'], specs: cord },
        { id: 'bracelet-yellow', name: 'Плетёный браслет, жёлтый', price: 1500,
          line: 'Светлый, почти сливочный. Хорош летом.', imgs: ['bracelet-yellow'], specs: cord }
      ]
    },
    {
      id: 'beads', title: 'Бисер, собрано вручную', ratio: '4 / 5', w: 480, h: 600, tile: true,
      items: [
        { id: 'choker-white-letter', name: 'Чокер с буквой, белый', price: 500,
          line: 'Белый бисер и буква-подвеска. Какие буквы есть — подскажем.', imgs: ['choker-white-letter'], specs: choker },
        { id: 'choker-gold-letter', name: 'Чокер с буквой, золотистый', price: 500,
          line: 'Золотистый бисер и буква-подвеска. Тонкий, неброский.', imgs: ['choker-gold-letter'], specs: choker },
        { id: 'choker-white-star', name: 'Чокер с подвеской, белый', price: 500,
          line: 'Белый бисер и маленькая подвеска. Носите один или с цепочкой.', imgs: ['choker-white-star'], specs: choker },
        { id: 'bead-pearl-charm', name: 'Браслет из бисера с подвеской', price: 300,
          line: 'Светлые бусины и золотистая подвеска.', imgs: ['bead-pearl-charm'], specs: bead },
        { id: 'bead-red-heart', name: 'Браслет из красного бисера', price: 200,
          line: 'Красный бисер и белое сердечко.', imgs: ['bead-red-heart'], specs: bead },
        { id: 'bead-black', name: 'Браслет из чёрного бисера', price: 300,
          line: 'Чёрный бисер и золотистая застёжка. Строгий.', imgs: ['bead-black'], specs: bead },
        { id: 'clip-shell', name: 'Заколки с ракушками', price: 550, old: true,
          line: 'Ракушки и бусины на заколке. Наш собственный дизайн.', imgs: ['clip-shell'],
          specs: [['Работа', 'ручная'], ['Дизайн', 'свой, Mizynyua'], ['Наличие', 'уточняйте в переписке']] }
      ]
    }
  ];
})();
