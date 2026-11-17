(function (root) {
  "use strict";
  const BOOK_COLORS = ["#ede1ff", "#ffedcd", "#ffe1eb", "#daf0ff"];
  const BOOKS = [
    { title: "安徒生童话", pinyin: "AN TU SHENG TONG HUA", icon: "📖" },
    { title: "白雪公主", pinyin: "BAI XUE GONG ZHU", icon: "👑" },
    { title: "丑小鸭", pinyin: "CHOU XIAO YA", icon: "🦢" },
    { title: "格林童话", pinyin: "GE LIN TONG HUA", icon: "🌳" },
    { title: "海底两万里", pinyin: "HAI DI LIANG WAN LI", icon: "🌊" },
    { title: "黑骏马", pinyin: "HEI JUN MA", icon: "🐎" },
    { title: "灰姑娘", pinyin: "HUI GU NIANG", icon: "👠" },
    { title: "木偶奇遇记", pinyin: "MU OU QI YU JI", icon: "🎭" },
    { title: "三只小猪", pinyin: "SAN ZHI XIAO ZHU", icon: "🏠" },
    { title: "西游记", pinyin: "XI YOU JI", icon: "☁️" },
    { title: "小红帽", pinyin: "XIAO HONG MAO", icon: "🧣" },
    { title: "小王子", pinyin: "XIAO WANG ZI", icon: "🌹" },
    { title: "小鹿斑比", pinyin: "XIAO LU BAN BI", icon: "🌿" },
    { title: "小公主", pinyin: "XIAO GONG ZHU", icon: "🎀" },
    { title: "爱丽丝梦游仙境", pinyin: "AI LI SI MENG YOU XIAN JING", icon: "🗝️" },
    { title: "爱丽丝镜中奇遇", pinyin: "AI LI SI JING ZHONG QI YU", icon: "🪞" },
    { title: "彼得·潘", pinyin: "BI DE PAN", icon: "⛵" },
    { title: "鲁滨逊漂流记", pinyin: "LU BIN XUN PIAO LIU JI", icon: "🏝️" }
  ];
  const COLORS = [{ name: "红", icon: "♥", color: "#ff7599" }, { name: "蓝", icon: "◆", color: "#6c9cff" }, { name: "黄", icon: "★", color: "#ffc95b" }, { name: "绿", icon: "●", color: "#61d3b3" }];
  const COINS = [1, 2, 5, 10];
  const PACK_ITEMS = [
    { name: "课本", icon: "📚", color: "#decaff" }, { name: "笔袋", icon: "👝", color: "#ffcbdc" },
    { name: "水杯", icon: "🥤", color: "#bae5ff" }, { name: "点心盒", icon: "🍱", color: "#ffdcaa" },
    { name: "画本", icon: "📔", color: "#c5eaca" }, { name: "雨伞", icon: "☂️", color: "#f3c7f2" },
    { name: "纸巾", icon: "🧻", color: "#fff3a8" }, { name: "餐具袋", icon: "🥄", color: "#bcebe7" }
  ];
  const META = {
    parcel: { icon: "📚", title: "拼音小书架", intro: "给熟悉的故事，排一个新顺序！", rule: "书名拼音 A → Z · 从上层左边开始", reward: 10 },
    garden: { icon: "🌷", title: "小小浇水师", intro: "帮花园控好水，让每盆花都喝饱。", rule: "看水流，提前松手，给后面的花留水。", reward: 8 },
    craft: { icon: "🎏", title: "彩旗小帮手", intro: "班级要办活动，帮老师挂好彩旗。", rule: "先看老师的样子，再按要求挂彩旗。", reward: 9 },
    cashier: { icon: "🧮", title: "找零小帮手", intro: "零钱有限，怎样刚好找给顾客？", rule: "收到的钱 − 订单总价 = 应找的钱", reward: 10 },
    packing: { icon: "🎒", title: "装包小能手", intro: "转一转、摆一摆，把出游用品装好！", rule: "物品不能重叠，也不能超出背包", reward: 9 }
  };
  const MEMORY_RULES = { forward: "照顺序挂 →", reverse: "倒着挂 ←", skip: "蓝旗先不挂 ◆" };
  const bookKey = (book) => book.pinyin.replaceAll(" ", "");
  function compareBooks(a, b) {
    const left = bookKey(a), right = bookKey(b);
    return left < right ? -1 : left > right ? 1 : 0;
  }
  function chooseBooks(level, rng) {
    const take = (items, count) => shuffle(items, rng).slice(0, count);
    const hBooks = BOOKS.filter((b) => b.pinyin.startsWith("H"));
    const xiaoBooks = BOOKS.filter((b) => b.pinyin.startsWith("XIAO "));
    const aliceBooks = BOOKS.filter((b) => b.pinyin.startsWith("AI LI SI "));
    const groups = new Map();
    BOOKS.filter((b) => !b.pinyin.startsWith("H") && !b.pinyin.startsWith("X") && !b.pinyin.startsWith("AI LI SI ")).forEach((b) => {
      const first = b.pinyin[0];
      groups.set(first, [...(groups.get(first) || []), b]);
    });
    const distinct = () => shuffle([...groups.values()], rng).map((group) => take(group, 1)[0]);
    if (level === 1) return distinct().slice(0, 4);
    if (level === 2) return [...take(hBooks, 2), ...distinct().slice(0, 4)];
    if (level === 3) return [...take(xiaoBooks, 3), ...distinct().slice(0, 3)];
    if (level === 4) return [...xiaoBooks, ...take(hBooks, 2), ...distinct().slice(0, 2)];
    return [...xiaoBooks, ...aliceBooks, BOOKS.find((b) => b.title === "西游记"), ...take(hBooks, 2)];
  }
  function answer(game) {
    const pattern = [...game.patterns[game.round]], rule = game.rules[game.round];
    return rule === "reverse" ? pattern.reverse() : rule === "skip" ? pattern.filter((n) => n !== 1) : pattern;
  }
  function shuffle(items, rng) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(rng() * (i + 1)));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function changeValue(game) {
    return game.selected.reduce((sum, n, i) => sum + n * COINS[i], 0);
  }
  function packedCells(game) {
    const cells = Array(game.columns * game.rows).fill(null);
    for (const item of game.items) {
      const position = game.placements[item.id];
      if (!position) continue;
      for (let y = position.y; y < position.y + item.h; y++) {
        for (let x = position.x; x < position.x + item.w; x++) cells[y * game.columns + x] = item.id;
      }
    }
    return cells;
  }
  function create(id, level = 1, rng = Math.random) {
    if (!META[id]) throw new Error("Unknown minigame");
    level = Math.max(1, Math.min(5, Math.floor(level)));
    const game = { id, level, mistakes: 0, assists: 0, won: false };
    if (id === "parcel") {
      game.columns = level === 1 ? 2 : 3;
      game.books = shuffle(chooseBooks(level, rng).map((book, id) => ({ ...book, id, paint: Math.floor(rng() * BOOK_COLORS.length) })), rng);
      if (game.books.every((b, i) => !i || compareBooks(game.books[i - 1], b) < 0)) game.books.push(game.books.shift());
      game.rows = Math.ceil(game.books.length / game.columns);
      game.showPinyin = level === 1;
      game.slots = Array(game.books.length).fill(null);
      game.selected = null;
      game.errors = [];
    } else if (id === "garden") {
      game.targets = Array.from({ length: Math.min(5, level + 2) }, () => 45 + Math.floor(rng() * 26));
      game.margin = [0, 12, 6, 5, 4, 3][level];
      game.plant = 0;
      game.water = 0;
      game.rate = 22 + level * 4;
      game.flowTime = 0;
      game.holdTime = 0;
      game.amplitude = [0, 0, 0.35, 0.45, 0.55, 0.65][level];
      game.drips = level === 1 ? 0 : level + 1;
      game.lastDrips = 0;
      game.tank = game.targets.reduce((sum, n) => sum + n, 0) + [0, 150, 25, 15, 8, 0][level];
      game.capacity = game.tank;
      game.dry = false;
    } else if (id === "cashier") {
      game.round = 0;
      game.selected = COINS.map(() => 0);
      game.error = "";
      game.orders = Array.from({ length: 3 }, (_, round) => {
        const change = 2 + level + round + Math.floor(rng() * (3 + level * 2));
        const paid = change < 10 ? 10 : change < 20 ? 20 : 50;
        const available = COINS.filter((coin) => !(level === 1 && coin === 10) && !(level >= 4 && round === 1 && coin === 5));
        let remaining = change;
        const stock = COINS.map(() => 0);
        for (const coin of [...available].reverse()) {
          const index = COINS.indexOf(coin);
          stock[index] = Math.floor(remaining / coin);
          remaining %= coin;
        }
        available.forEach((coin) => { stock[COINS.indexOf(coin)] += Math.floor(rng() * (level >= 4 ? 2 : 4)); });
        return { cost: paid - change, paid, stock };
      });
    } else if (id === "packing") {
      [game.columns, game.rows] = [[3, 4], [4, 4], [5, 4], [5, 5], [5, 5]][level - 1];
      const parts = [{ w: game.columns, h: game.rows }];
      while (parts.length < level + 3) {
        const largest = Math.max(...parts.map((p) => p.w * p.h));
        const part = shuffle(parts.filter((p) => p.w * p.h === largest), rng)[0];
        const axis = part.w > 1 && (part.h === 1 || rng() < 0.5) ? "w" : "h";
        const cut = 1 + Math.floor(rng() * (part[axis] - 1));
        parts.splice(parts.indexOf(part), 1, { ...part, [axis]: cut }, { ...part, [axis]: part[axis] - cut });
      }
      game.items = shuffle(parts.map((part, id) => ({ ...PACK_ITEMS[id], id, ...(rng() < 0.5 ? { w: part.h, h: part.w } : part) })), rng);
      game.placements = {};
      game.selected = null;
      game.error = "";
    } else {
      game.patterns = Array.from({ length: 3 }, (_, round) => Array.from({ length: level + round + 2 }, () => Math.min(3, Math.floor(rng() * 4))));
      game.rules = level === 1 ? ["forward", "forward", "forward"] : level === 2 ? ["forward", "reverse", "forward"] : ["reverse", "skip", level >= 4 ? "reverse" : "forward"];
      game.patterns.forEach((pattern, i) => { if (game.rules[i] === "skip" && pattern.every((n) => n === 1)) pattern[0] = 0; });
      game.round = 0;
      game.input = [];
      game.phase = "ready";
    }
    return game;
  }
  function move(game, action) {
    const g = structuredClone(game);
    if (g.won) return g;
    if (g.id === "parcel") {
      if (action.type === "pinyin") {
        g.showPinyin = !g.showPinyin;
      } else if (action.type === "select" && g.books.some((b) => b.id === action.id) && !g.slots.includes(action.id)) {
        g.selected = g.selected === action.id ? null : action.id;
      } else if (action.type === "place" && Number.isInteger(action.index) && action.index >= 0 && action.index < g.slots.length) {
        if (g.slots[action.index] !== null) {
          g.selected = null;
          g.slots[action.index] = null;
        } else if (g.selected !== null && !g.slots.includes(g.selected)) {
          g.slots[action.index] = g.selected;
          g.selected = null;
        }
        g.errors = [];
      } else if (action.type === "check") {
        const ordered = [...g.books].sort(compareBooks);
        g.errors = g.slots.flatMap((id, i) => {
          const expected = ordered[i];
          return id === expected.id ? [] : [i];
        });
        if (g.errors.length) g.mistakes += 1;
        else g.won = true;
      }
    } else if (g.id === "garden") {
      if (g.dry) return g;
      if (action.type === "water" && Number.isFinite(action.seconds) && action.seconds >= 0) {
        const phase = g.plant * 1.1, omega = Math.PI * 2 / 1.2;
        const amount = g.rate * (action.seconds + g.amplitude * (Math.cos(omega * g.flowTime + phase) - Math.cos(omega * (g.flowTime + action.seconds) + phase)) / omega);
        const poured = Math.min(100 - g.water, g.tank, Math.max(0, amount));
        g.water += poured;
        g.tank = Math.max(0, g.tank - poured);
        g.flowTime += action.seconds;
        g.holdTime += action.seconds;
      } else if (action.type === "release") {
        g.lastDrips = Math.min(100 - g.water, g.tank, g.drips * Math.min(1, g.holdTime / 0.3));
        g.water += g.lastDrips; g.tank -= g.lastDrips; g.holdTime = 0;
        const low = g.targets[g.plant] - g.margin, high = g.targets[g.plant] + g.margin;
        if (g.water > high) { g.mistakes += 1; g.water = 0; }
        else if (g.water >= low) {
          g.plant += 1; g.water = 0;
          g.won = g.plant === g.targets.length;
        }
        if (g.water === 0) g.flowTime = 0;
        const needed = g.targets.slice(g.plant).reduce((sum, n) => sum + n - g.margin, 0) - g.water;
        g.dry = !g.won && g.tank + 0.001 < needed;
        if (g.dry) g.mistakes += 1;
      }
    } else if (g.id === "cashier") {
      const order = g.orders[g.round], index = action.index;
      if (["coin-add", "coin-remove"].includes(action.type) && Number.isInteger(index) && index >= 0 && index < COINS.length) {
        if (action.type === "coin-add" && g.selected[index] < order.stock[index]) g.selected[index] += 1;
        if (action.type === "coin-remove" && g.selected[index] > 0) g.selected[index] -= 1;
        g.error = "";
      } else if (action.type === "give-change") {
        if (changeValue(g) !== order.paid - order.cost) { g.mistakes += 1; g.error = "change"; }
        else {
          g.round += 1;
          g.won = g.round === g.orders.length;
          g.selected = COINS.map(() => 0); g.error = "";
        }
      }
    } else if (g.id === "packing") {
      if (action.type === "pack-select" && g.items.some((item) => item.id === action.id)) {
        delete g.placements[action.id];
        g.selected = g.selected === action.id ? null : action.id;
        g.error = "";
      } else if (action.type === "pack-rotate" && g.selected !== null) {
        const item = g.items.find((item) => item.id === g.selected);
        [item.w, item.h] = [item.h, item.w]; g.error = "";
      } else if (action.type === "pack-place" && Number.isInteger(action.index) && action.index >= 0 && action.index < g.columns * g.rows) {
        const cells = packedCells(g), owner = cells[action.index];
        if (g.selected === null && owner !== null) {
          delete g.placements[owner]; g.selected = owner; g.error = "";
        } else if (g.selected !== null) {
          const item = g.items.find((item) => item.id === g.selected);
          const x = action.index % g.columns, y = Math.floor(action.index / g.columns);
          if (x + item.w > g.columns || y + item.h > g.rows) g.error = "outside";
          else {
            const overlap = Array.from({ length: item.h }, (_, dy) => Array.from({ length: item.w }, (_, dx) => cells[(y + dy) * g.columns + x + dx])).flat().some((id) => id !== null);
            if (overlap) g.error = "overlap";
            else { g.placements[item.id] = { x, y }; g.selected = null; g.error = ""; }
          }
          if (g.error) g.mistakes += 1;
        }
      } else if (action.type === "pack-check") {
        g.won = Object.keys(g.placements).length === g.items.length && packedCells(g).every((id) => id !== null);
        if (!g.won) { g.mistakes += 1; g.error = "missing"; }
      }
    } else if (action.type === "show") {
      if (g.phase === "input" || g.phase === "retry") g.assists += 1;
      g.phase = "show"; g.input = [];
    } else if (action.type === "listen" && g.phase === "show") {
      g.phase = "input";
    } else if (action.type === "color" && g.phase === "input" && Number.isInteger(action.color) && action.color >= 0 && action.color < 4) {
      if (answer(g)[g.input.length] !== action.color) {
        g.mistakes += 1; g.phase = "retry"; g.input = [];
      } else {
        g.input.push(action.color);
        if (g.input.length === answer(g).length) {
          g.round += 1; g.input = [];
          g.won = g.round === 3;
          g.phase = g.won ? "won" : "ready";
        }
      }
    }
    return g;
  }
  function mount(host, options) {
    const pencilcase = options.pencilcase === true && options.id === "packing";
    const meta = pencilcase ? { title: "我的笔袋", rule: "转一转、摆一摆，把练习文具装好", reward: 0 } : META[options.id];
    function makeGame() {
      const next = create(options.id, options.level);
      if (pencilcase) {
        const stationery = [["铅笔", "✏️"], ["橡皮", "🧽"], ["彩笔", "🖍️"], ["尺子", "📏"], ["贴纸", "🌟"]];
        next.items.forEach((item, i) => { [item.name, item.icon] = stationery[i % stationery.length]; });
      }
      return next;
    }
    let game = makeGame();
    let active = true;
    let frame = 0;
    let held = false;
    let lastFrame = 0;
    let pointer = null;
    let timers = [];
    let playback = 0;
    let message = "";
    const abort = new AbortController();
    const on = (name, fn) => host.addEventListener(name, fn, { signal: abort.signal });
    const later = (fn, delay) => timers.push(setTimeout(() => { if (active) fn(); }, delay));
    const stars = () => game.mistakes + game.assists === 0 ? 3 : game.mistakes + game.assists <= 3 ? 2 : 1;
    function finish() {
      if (!active || !game.won) return false;
      const result = { id: game.id, level: game.level, mistakes: game.mistakes, assists: game.assists, stars: stars() };
      destroy();
      options.onWin(result);
      return true;
    }
    function update(action) {
      if (!active) return;
      game = move(game, action);
      if (!finish()) render();
    }
    function bookHTML(book) {
      return `<span class="story-cover" style="--book:${BOOK_COLORS[book.paint]}"><span class="story-icon" aria-hidden="true">${book.icon}</span><b class="story-title">${book.title}</b><span class="story-pinyin" ${game.showPinyin ? "" : "hidden"}>${book.pinyin.split(" ").map((syllable) => `<span>${syllable}</span>`).join(" ")}</span></span>`;
    }
    function render() {
      if (!active) return;
      const focused = ["parcel", "cashier", "packing"].includes(game.id) && host.contains(document.activeElement) ? document.activeElement.dataset : null;
      const focusSelector = focused?.mini ? `[data-mini="${focused.mini}"]${focused.id !== undefined ? `[data-id="${focused.id}"]` : focused.index !== undefined ? `[data-index="${focused.index}"]` : ""}` : null;
      const progress = game.id === "parcel" ? `${game.slots.filter((n) => n !== null).length}/${game.slots.length} 本`
        : game.id === "garden" ? `${game.plant}/${game.targets.length} 盆` : game.id === "packing" ? `${Object.keys(game.placements).length}/${game.items.length} 件` : `第 ${game.round + 1}/3 ${game.id === "cashier" ? "位" : "轮"}`;
      host.innerHTML = `<div class="game-hud" data-difficulty="${game.level}"><span>${pencilcase ? "自由玩" : `第 ${options.stage ?? 1} 关`}</span><strong>${meta.title}</strong><span id="mini-progress">${progress}</span></div>
        <p class="game-rule">${meta.rule}</p>
        <div id="game-board"></div><p class="game-feedback" id="game-feedback" role="status">${message}</p>
        <div class="game-bottom"><span>${pencilcase ? "不扣钱、不扣精力，也不领报酬" : `完成 +${meta.reward} 币`}</span><button class="text-button" data-mini="restart">重新来</button></div>`;
      const board = host.querySelector("#game-board");
      if (game.id === "parcel") {
        board.innerHTML = `<div class="book-tools"><button class="button secondary" data-mini="pinyin" aria-pressed="${game.showPinyin}">${game.showPinyin ? "收起拼音" : "🔤 看拼音"}</button><span>相同字母？继续往后比！</span></div>
          <div class="book-tray story-tray" aria-label="待整理的书">${game.books.filter((b) => !game.slots.includes(b.id)).map((book) =>
          `<button class="book-choice ${game.selected === book.id ? "picked" : ""}" data-mini="book" data-id="${book.id}" data-pinyin="${book.pinyin}" aria-label="拿起《${book.title}》${game.showPinyin ? `，${book.pinyin}` : ""}" aria-pressed="${game.selected === book.id}">${bookHTML(book)}</button>`).join("") || '<span class="tray-empty">书都上架啦，检查一下！</span>'}</div>
          <div class="bookcase story-bookcase">${Array.from({ length: game.rows }, (_, row) => `<div class="shelf-row" data-rule="pinyin"><strong>第 ${row + 1} 层 <small>${row ? "接着上一层 →" : "从左到右 →"}</small></strong><div class="shelf-slots" style="--columns:${game.columns}">${Array.from({ length: Math.min(game.columns, game.slots.length - row * game.columns) }, (_, col) => {
            const index = row * game.columns + col, book = game.books.find((b) => b.id === game.slots[index]);
            return `<button class="shelf-slot ${game.errors.includes(index) ? "wrong-slot" : ""}" data-mini="slot" data-index="${index}" data-row="${row}" data-column="${col}" data-filled="${Boolean(book)}" aria-label="第${row + 1}层第${col + 1}格${book ? `，《${book.title}》，点一下拿下来` : "，放到这里"}">${book ? bookHTML(book) : '<span>＋</span>'}</button>`;
          }).join("")}</div></div>`).join("")}</div>
          <p class="mini-tip">点书 → 点空位 · 点已放好的书可以拿下来</p><button class="button primary wide" data-mini="check">整理好啦，检查！</button>
          <details class="book-guide"><summary>？字母顺序小提示</summary><p class="alphabet-guide">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p><p>从第一个字母比起，相同就继续比。忽略拼音里的空格和声调。</p><p>小红帽：XIAO <b>H</b>ONG MAO<br>小王子：XIAO <b>W</b>ANG ZI<br>前面的 XIAO 相同，H 在 W 前，所以小红帽先放。</p></details>`;
      } else if (game.id === "garden") {
        const target = game.targets[game.plant];
        board.innerHTML = `<div class="water-budget">💧 共用一箱水 <strong id="tank-left">${Math.floor(game.tank)}</strong> / ${game.capacity} 滴</div>
          <div class="plant-row">${game.targets.map((n, i) => `<div class="plant-pot ${i === game.plant ? "current-plant" : ""}"><span>${i < game.plant ? "🌻" : "🌱"}</span><small>${i < game.plant ? "✓ 喝饱啦" : `${n - game.margin}～${n + game.margin}滴`}</small></div>`).join("")}</div>
          <div class="watering-scene"><span class="watering-can">🚿</span><div class="water-drops" aria-hidden="true">💧 💧 💧</div><span class="big-plant">🌷</span></div>
          <div class="water-flow"><strong id="water-flow">水流：平稳</strong><span>${game.drips ? `松手还有余水 · 最多 ${game.drips} 滴` : "练习档 · 松手即停"}</span></div>
          <div class="water-label"><span>还不够</span><strong>${game.drips ? "提前松手" : "松手停在绿区"}</strong><span>太多啦</span></div>
          <div class="water-meter" role="progressbar" aria-label="当前水量" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(game.water)}" data-drips="${game.drips}" data-low="${target - game.margin}" data-high="${target + game.margin}"><div class="water-zone" style="left:${target - game.margin}%;width:${2 * game.margin}%">✓</div><div class="water-fill"></div><div class="water-cursor"></div></div>
          <button class="button water-button wide" data-mini="${game.dry ? "restart" : "water"}">${game.dry ? "水不够了，重新分配 ↻" : "按住浇水 · 松手停下"}</button><details class="quiet-note"><summary>？控水提示</summary><p>长按按钮或空格浇水。第一档水流平稳，后面会忽快忽慢；松手后的余水也要算进绿区。短按余水少，长按余水多。浇多的水不会回到水箱。</p></details>`;
        paintWater();
      } else if (game.id === "cashier") {
        const order = game.orders[game.round];
        board.innerHTML = `<div class="change-receipt"><div>🛒 订单总价<strong id="order-cost">${order.cost}</strong>币</div><div>🤲 顾客付了<strong id="customer-paid">${order.paid}</strong>币</div></div>
          <div class="coin-tray">${COINS.map((coin, i) => `<button class="coin-choice" data-mini="coin-add" data-index="${i}" data-value="${coin}" data-stock="${order.stock[i] - game.selected[i]}" aria-label="拿出${coin}币" ${game.selected[i] === order.stock[i] ? "disabled" : ""}><b>${coin}</b><span>币 · 剩 ${order.stock[i] - game.selected[i]} 枚</span></button>`).join("")}</div>
          <div class="change-pile"><strong>已经放了 <b id="change-total">${changeValue(game)}</b> 币</strong><div>${COINS.map((coin, i) => game.selected[i] ? `<button class="change-coin" data-mini="coin-remove" data-index="${i}" aria-label="退回${coin}币">${coin} 币 × ${game.selected[i]} ↩</button>` : "").join("") || "<span>点零钱放进去</span>"}</div></div>
          <button class="button primary wide" data-mini="give-change">确认找零 →</button><p class="mini-tip">点已选的钱可以退回 · 练习零钱，不动自己的钱包</p>`;
      } else if (game.id === "packing") {
        const cells = packedCells(game), selected = game.items.find((item) => item.id === game.selected);
        board.innerHTML = `<div class="packing-items">${game.items.map((item) => `<button class="packing-item" data-mini="pack-select" data-id="${item.id}" data-width="${item.w}" data-height="${item.h}" aria-pressed="${item.id === game.selected}" style="--item:${item.color}"><span>${item.icon}</span><strong>${item.name}</strong><small>${game.placements[item.id] ? "已装好 · 点我取出" : `${item.w} × ${item.h} 格`}</small></button>`).join("")}</div>
          <div class="packing-tools"><strong id="packing-selected">${selected ? `${selected.icon} ${selected.name} · ${selected.w}×${selected.h}` : "先选一样物品"}</strong><button class="button secondary" data-mini="pack-rotate" ${selected ? "" : "disabled"}>旋转 ↻</button></div>
          <div class="packing-grid" role="group" aria-label="${pencilcase ? "笔袋空间" : "背包空间"}" data-columns="${game.columns}" data-rows="${game.rows}" style="--columns:${game.columns}">${cells.map((id, index) => {
            const item = game.items.find((item) => item.id === id), pos = item && game.placements[id];
            const first = pos && index === pos.y * game.columns + pos.x;
            return `<button class="pack-cell" data-mini="pack-place" data-index="${index}" ${item ? `data-owner="${id}" style="--item:${item.color}"` : ""} aria-label="第${Math.floor(index / game.columns) + 1}行第${index % game.columns + 1}格${item ? `，${item.name}` : "，空位"}">${first ? item.icon : item ? "·" : "＋"}</button>`;
          }).join("")}</div><p class="mini-tip">点格子放物品左上角 · 想取出？点上方物品卡片</p><button class="button primary wide" data-mini="pack-check">装好了，检查！</button>`;
      } else {
        const pattern = game.patterns[game.round];
        board.innerHTML = `<div id="memory-rule" class="rule-badge" data-rule="${game.rules[game.round]}">${MEMORY_RULES[game.rules[game.round]]}</div>
          <div class="flag-string">${answer(game).map((_, i) => `<span class="memory-flag" data-flag="${i}">${i < game.input.length ? COLORS[game.input[i]].icon : "?"}</span>`).join("")}</div>
          <div class="memory-display" aria-live="polite"><span id="memory-flash">🎏</span><strong id="memory-message">${game.phase === "input" ? "轮到你挂彩旗啦！" : game.phase === "retry" ? "差一点，再看一遍？" : `老师的样子有 ${pattern.length} 个颜色`}</strong></div>
          <div class="color-pads">${COLORS.map((color, i) => `<button class="color-pad" style="--pad:${color.color}" data-mini="color" data-color="${i}" aria-label="${color.name}色${color.icon}" ${game.phase !== "input" ? "disabled" : ""}><span>${color.icon}</span>${color.name}</button>`).join("")}</div>
          <button class="button secondary wide" data-mini="watch" ${game.phase === "show" ? "disabled" : ""}>${game.phase === "input" ? "再看一遍（不扣钱）" : game.phase === "retry" ? "再试这一轮" : "准备好了，开始看"}</button>`;
      }
      if (focusSelector) host.querySelector(focusSelector)?.focus({ preventScroll: true });
    }
    function paintWater() {
      const meter = host.querySelector(".water-meter");
      if (!meter) return;
      meter.setAttribute("aria-valuenow", Math.round(game.water));
      host.querySelector(".water-fill").style.width = `${game.water}%`;
      host.querySelector(".water-cursor").style.left = `${game.water}%`;
      host.querySelector("#tank-left").textContent = Math.floor(game.tank);
      const flow = 1 + game.amplitude * Math.sin(game.flowTime * Math.PI * 2 / 1.2 + game.plant * 1.1);
      const flowLabel = host.querySelector("#water-flow");
      flowLabel.textContent = `水流：${flow > 1.15 ? "快 ↑" : flow < 0.85 ? "慢 ↓" : "平稳"}`;
      flowLabel.dataset.speed = flow > 1.15 ? "fast" : flow < 0.85 ? "slow" : "steady";
      host.querySelector(".watering-scene").classList.toggle("pouring", held);
    }
    function tick(now) {
      if (!active || !held) return;
      const seconds = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      game = move(game, { type: "water", seconds });
      paintWater();
      if (game.water >= 100 || game.tank <= 0) stopWater();
      else frame = requestAnimationFrame(tick);
    }
    function startWater() {
      if (!active || held || game.id !== "garden" || game.dry) return;
      held = true;
      lastFrame = performance.now();
      paintWater();
      frame = requestAnimationFrame(tick);
    }
    function stopWater() {
      if (!held) return;
      held = false;
      cancelAnimationFrame(frame);
      pointer = null;
      const before = game.plant, mistakes = game.mistakes;
      game = move(game, { type: "release" });
      message = game.dry ? "水不够分啦！少浇一点，后面的花也要喝水。" : game.mistakes > mistakes ? game.drips ? "余水也算水量，要再早一点松手！这盆重试。" : "水太多啦！这盆重试，用掉的水不退回。" : game.plant > before ? "刚刚好！下一盆需要的水不一样哦。" : "还差一点，可以接着浇。";
      if (!finish()) render();
    }
    function watch() {
      if (!active || game.id !== "craft" || game.phase === "show") return;
      const token = ++playback;
      game = move(game, { type: "show" });
      message = "看图形和颜色，记住顺序。";
      render();
      const pattern = [...game.patterns[game.round]];
      pattern.forEach((color, i) => {
        later(() => {
          if (token !== playback) return;
          const flash = host.querySelector("#memory-flash");
          flash.textContent = COLORS[color].icon;
          flash.style.color = COLORS[color].color;
          flash.dataset.color = String(color);
          host.querySelector("#memory-message").textContent = `${i + 1} · ${COLORS[color].name}`;
        }, 350 + i * 850);
        later(() => {
          if (token !== playback) return;
          const flash = host.querySelector("#memory-flash");
          flash.textContent = "·"; flash.removeAttribute("data-color");
        }, 950 + i * 850);
      });
      later(() => {
        if (token !== playback) return;
        message = `轮到你了：${MEMORY_RULES[game.rules[game.round]]}`;
        update({ type: "listen" });
      }, 350 + pattern.length * 850);
    }
    on("click", (event) => {
      const button = event.target.closest("[data-mini]");
      if (!active || !button || button.disabled) return;
      const action = button.dataset.mini;
      if (action === "pinyin") { message = ""; update({ type: "pinyin" }); }
      else if (["coin-add", "coin-remove", "give-change", "pack-select", "pack-rotate", "pack-place", "pack-check"].includes(action)) {
        const previousRound = game.round;
        game = move(game, { type: action, index: Number(button.dataset.index), id: Number(button.dataset.id) });
        message = { change: "还没找对，再算算收到的钱减去总价。", outside: "伸到背包外面啦，转一转或换个位置。", overlap: "这里放不下，和别的物品重叠啦。", missing: "还有物品没装好，再试试不同摆法。" }[game.error] || (game.id === "cashier" && game.round > previousRound ? "找对啦！下一位顾客来了。" : "");
        if (!finish()) render();
      }
      else if (action === "book") { message = "拿好了，选一个空位放进去。"; update({ type: "select", id: Number(button.dataset.id) }); }
      else if (action === "slot") { message = ""; update({ type: "place", index: Number(button.dataset.index) }); }
      else if (action === "check") {
        game = move(game, { type: "check" });
        message = game.errors.length ? "虚线格还没摆对。按拼音 A → Z，相同字母就继续往后比。" : "";
        if (!finish()) render();
      } else if (action === "watch") watch();
      else if (action === "color") {
        const previous = game.round;
        game = move(game, { type: "color", color: Number(button.dataset.color) });
        message = game.phase === "retry" ? "这轮再看一次，注意上面的规则。" : game.round > previous ? "过关！看清下一轮的规则。" : "对啦，接着来！";
        if (!finish()) render();
      } else if (action === "restart") {
        stopTimers();
        const mistakes = game.mistakes + 1, assists = game.assists;
        game = makeGame();
        game.mistakes = mistakes; game.assists = assists;
        message = "新的一局，慢慢来。"; render();
      }
    });
    on("pointerdown", (event) => {
      if (!event.target.closest('[data-mini="water"]') || event.button !== 0 || held) return;
      event.preventDefault();
      pointer = event.pointerId;
      host.setPointerCapture(pointer);
      startWater();
    });
    on("pointerup", (event) => { if (event.pointerId === pointer) stopWater(); });
    on("pointercancel", () => { held = false; pointer = null; cancelAnimationFrame(frame); paintWater(); });
    on("lostpointercapture", () => { if (held) { held = false; pointer = null; cancelAnimationFrame(frame); paintWater(); } });
    on("keydown", (event) => {
      if (event.target.closest('[data-mini="water"]') && [" ", "Enter"].includes(event.key)) { event.preventDefault(); startWater(); }
    });
    on("keyup", (event) => {
      if ([" ", "Enter"].includes(event.key) && held) { event.preventDefault(); stopWater(); }
    });
    function stopTimers() {
      playback += 1; held = false; pointer = null;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout); timers = [];
    }
    function pause() {
      if (!active) return;
      stopTimers();
      if (game.id === "craft" && game.phase === "show") {
        game.phase = "ready"; message = "刚才离开了一会儿，准备好再看。"; render();
      } else if (game.id === "garden") paintWater();
    }
    window.addEventListener("blur", pause, { signal: abort.signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, { signal: abort.signal });
    function destroy() {
      active = false; stopTimers(); abort.abort();
    }
    render();
    return { destroy };
  }
  const api = { META, BOOKS, COLORS, create, move, mount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MiniGames = api;
})(globalThis);
