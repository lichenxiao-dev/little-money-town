(function (root) {
  "use strict";
  const GOODS = [
    { id: "pencil", name: "铅笔", icon: "✏️", price: 3, unit: "支", category: "文具", detail: "写字、画画都能用" },
    { id: "eraser", name: "小橡皮", icon: "🧽", price: 2, unit: "块", category: "文具", detail: "写错了，擦掉再来" },
    { id: "notebook", name: "练习本", icon: "📓", price: 5, unit: "本", category: "文具", detail: "记录学校里的新发现" },
    { id: "crayons", name: "彩笔", icon: "🖍️", price: 20, unit: "盒", category: "文具", detail: "带回家，玩涂色小游戏" },
    { id: "pencilcase", name: "星星笔袋", icon: "👝", price: 40, unit: "个", category: "文具", detail: "给文具一个整齐的小家" },
    { id: "diary", name: "闪光日记本", icon: "📔", price: 48, unit: "本", category: "文具", detail: "写下自己的小故事" },
    { id: "cookie", name: "小饼干", icon: "🍪", price: 4, unit: "块", category: "课间点心", snack: true, detail: "带回书包，课间吃一块" },
    { id: "milk", name: "牛奶", icon: "🥛", price: 6, unit: "盒", category: "课间点心", snack: true, detail: "课间加餐的小选择" },
    { id: "bread", name: "小面包", icon: "🥐", price: 10, unit: "个", category: "课间点心", snack: true, detail: "带回书包，饿了再吃" },
    { id: "chocolate", name: "巧克力", icon: "🍫", price: 18, unit: "板", category: "课间点心", snack: true, detail: "课间的小甜点" },
    { id: "cake", name: "水果小蛋糕", icon: "🍰", price: 28, unit: "个", category: "课间点心", snack: true, detail: "想吃的时候再买" },
    { id: "ball", name: "彩虹皮球", icon: "⚽", price: 20, unit: "个", category: "玩具", detail: "放学后玩接球小游戏" },
    { id: "telescope", name: "星星望远镜", icon: "🔭", price: 80, unit: "台", category: "玩具", detail: "解锁家里的找星星游戏" },
    { id: "flower-notebook", name: "花朵小本", icon: "🌸", price: 12, unit: "本", category: "文具", month: 3, detail: "春天封面的小本子" },
    { id: "strawberry-roll", name: "草莓卷", icon: "🍓", price: 9, unit: "块", category: "课间点心", month: 3, snack: true, detail: "三月的小点心" },
    { id: "sea-pencilcase", name: "海浪笔袋", icon: "🌊", price: 36, unit: "个", category: "文具", month: 6, detail: "夏天配色的文具小家" },
    { id: "fruit-jelly", name: "水果冻", icon: "🍮", price: 8, unit: "杯", category: "课间点心", month: 6, snack: true, detail: "六月的小点心" },
    { id: "maple-notebook", name: "枫叶手账本", icon: "🍁", price: 16, unit: "本", category: "文具", month: 9, detail: "秋天封面的手账本" },
    { id: "sweet-potato", name: "烤红薯", icon: "🍠", price: 10, unit: "个", category: "课间点心", month: 9, snack: true, detail: "九月的小点心" },
    { id: "snow-diary", name: "雪花日记本", icon: "❄️", price: 52, unit: "本", category: "文具", month: 12, detail: "冬天封面的日记本" },
    { id: "rice-cake", name: "香甜米糕", icon: "🍡", price: 12, unit: "块", category: "课间点心", month: 12, snack: true, detail: "十二月的小点心" },
    { id: "wish-notebook", name: "新年愿望本", icon: "🎊", price: 18, unit: "本", category: "文具", month: 1, detail: "画下新一年的小愿望" },
    { id: "orange-cookie", name: "柑橘饼干", icon: "🍊", price: 7, unit: "块", category: "课间点心", month: 1, snack: true, detail: "一月的小点心" },
    { id: "heart-notebook", name: "爱心小本", icon: "💗", price: 14, unit: "本", category: "文具", month: 2, detail: "画一份小小的心意" },
    { id: "heart-chocolate", name: "心形巧克力", icon: "🤎", price: 12, unit: "块", category: "课间点心", month: 2, snack: true, detail: "二月的小点心" },
    { id: "rain-notebook", name: "雨滴观察本", icon: "💧", price: 13, unit: "本", category: "文具", month: 4, detail: "画下雨天的新发现" },
    { id: "honey-cake", name: "蜂蜜小蛋糕", icon: "🍯", price: 10, unit: "块", category: "课间点心", month: 4, snack: true, detail: "四月的小点心" },
    { id: "leaf-notebook", name: "绿叶涂鸦本", icon: "🍃", price: 15, unit: "本", category: "文具", month: 5, detail: "装进自己的花草画" },
    { id: "bean-cake", name: "绿豆糕", icon: "🟩", price: 8, unit: "块", category: "课间点心", month: 5, snack: true, detail: "五月的小点心" },
    { id: "beach-notebook", name: "沙滩画本", icon: "🐚", price: 18, unit: "本", category: "文具", month: 7, detail: "画下想去的海边" },
    { id: "watermelon-cup", name: "西瓜杯", icon: "🍉", price: 9, unit: "杯", category: "课间点心", month: 7, snack: true, detail: "七月的小点心" },
    { id: "holiday-notebook", name: "假期手账", icon: "🌻", price: 22, unit: "本", category: "文具", month: 8, detail: "留下假期的小画" },
    { id: "mango-pudding", name: "芒果布丁", icon: "🥭", price: 10, unit: "杯", category: "课间点心", month: 8, snack: true, detail: "八月的小点心" },
    { id: "pumpkin-notebook", name: "南瓜故事本", icon: "🎃", price: 20, unit: "本", category: "文具", month: 10, detail: "画一个自己的小故事" },
    { id: "pumpkin-pie", name: "南瓜派", icon: "🥧", price: 12, unit: "块", category: "课间点心", month: 10, snack: true, detail: "十月的小点心" },
    { id: "ginkgo-notebook", name: "银杏小本", icon: "🍂", price: 17, unit: "本", category: "文具", month: 11, detail: "收好金黄色的回忆" },
    { id: "chestnut", name: "香甜栗子", icon: "🌰", price: 9, unit: "包", category: "课间点心", month: 11, snack: true, detail: "十一月的小点心" },
    { id: "flowers", name: "小花盆", icon: "🌷", price: 8, unit: "盆", legacy: true, detail: "给你的小屋添点颜色" },
    { id: "bunny", name: "兔兔玩偶", icon: "🧸", price: 28, unit: "个", legacy: true, detail: "之前收藏的老朋友" }
  ];
  const SEASONS = [
    { id: "winter", name: "冬季", icon: "❄️", months: "12、1、2 月" },
    { id: "spring", name: "春季", icon: "🌸", months: "3～5 月" },
    { id: "summer", name: "夏季", icon: "🌻", months: "6～8 月" },
    { id: "autumn", name: "秋季", icon: "🍁", months: "9～11 月" }
  ];
  function season(s) {
    const m = month(s);
    return { ...SEASONS[Math.floor((m % 12) / 3)], daysLeft: (2 - m % 3) * 28 + 29 - dayOfMonth(s) };
  }
  function available(s, id) {
    const g = GOODS.find((item) => item.id === id);
    return !!g && (!g.month || g.month === month(s));
  }
  function monthlySpecials(s) {
    return { month: month(s), name: `${month(s)} 月限定`, icon: season(s).icon, daysLeft: 29 - dayOfMonth(s) };
  }
  const SHOPS = {
    bakery: { name: "街角面包店", icon: "🥐", price: 10 },
    umbrella: { name: "晴雨用品店", icon: "☂️", price: 15 }
  };
  const MARKET_EVENTS = {
    bakery: [
      { icon: "🌾", text: "面粉涨价了，做面包更贵", effect: -2 },
      { icon: "🔧", text: "烤箱要维修，少做了一些面包", effect: -1 },
      { icon: "🥖", text: "客人和平时差不多", effect: 0 },
      { icon: "🚌", text: "旅行团路过，多了一些订单", effect: 1 },
      { icon: "😋", text: "新口味受欢迎，来买的人变多", effect: 2 }
    ],
    umbrella: [
      { icon: "🚚", text: "运费涨了，进货更贵", effect: -2 },
      { icon: "🏪", text: "附近新店打折，分走一些客人", effect: -1 },
      { icon: "📦", text: "进货和往常一样顺利", effect: 0 },
      { icon: "🤝", text: "供货商降价，进货省了一些钱", effect: 1 },
      { icon: "👒", text: "新款遮阳帽受欢迎，订单变多", effect: 2 }
    ]
  };
  const STALL = { setup: 24, unitCost: 2, price: 4, minPrice: 1, maxPrice: 8, dailyCost: 2, repair: 8, capacity: 18 };
  const INGREDIENTS = {
    lemon: { name: "柠檬", icon: "🍋", cost: 1 }, sugar: { name: "糖浆", icon: "🍯", cost: 1 },
    orange: { name: "橙子", icon: "🍊", cost: 2 }, milk: { name: "牛奶", icon: "🥛", cost: 2 },
    cocoa: { name: "可可", icon: "🍫", cost: 2 }, tea: { name: "茶叶", icon: "🍃", cost: 1 },
    ice: { name: "冰块", icon: "🧊", cost: 1 }
  };
  const DRINKS = {
    lemonade: { name: "柠檬水", icon: "🍋", recipe: { lemon: 1, sugar: 1 }, price: 4, weather: "sun" },
    icedTea: { name: "清甜冰茶", icon: "🧋", recipe: { tea: 1, ice: 1 }, price: 4, weather: "sun" },
    orangeJuice: { name: "冰橙汁", icon: "🍊", recipe: { orange: 1, ice: 1 }, price: 5, weather: "sun" },
    milkTea: { name: "香浓奶茶", icon: "☕", recipe: { tea: 1, milk: 1 }, price: 5, weather: "rain" },
    cocoaMilk: { name: "热可可", icon: "🍫", recipe: { cocoa: 1, milk: 1 }, price: 6, weather: "rain" },
    orangeMilk: { name: "橙香牛奶", icon: "🥛", recipe: { orange: 1, milk: 1 }, price: 6, weather: "sun" },
    lemonTea: { name: "柠檬甜茶", icon: "🍵", recipe: { lemon: 1, tea: 1, sugar: 1 }, price: 5, weather: "sun" },
    cocoaTea: { name: "可可奶茶", icon: "🧉", recipe: { cocoa: 1, tea: 1, milk: 1 }, price: 7, weather: "rain" },
    warmMilk: { name: "温牛奶", icon: "🥛", recipe: { milk: 1 }, price: 4, weather: "rain" }
  };
  const starterIngredients = (cups = 0) => Object.fromEntries(Object.keys(INGREDIENTS).map((id) => [id, ["lemon", "sugar"].includes(id) ? cups : 0]));
  const starterMenu = (price = STALL.price) => Object.fromEntries(Object.entries(DRINKS).map(([id, drink]) => [id, { enabled: id === "lemonade", price: id === "lemonade" ? price : drink.price }]));
  const drinkCost = (id) => Object.entries(DRINKS[id].recipe).reduce((sum, [ingredient, n]) => sum + INGREDIENTS[ingredient].cost * n, 0);
  const inventoryValue = (shop) => !shop ? 0 : shop.ingredients ? Object.entries(INGREDIENTS).reduce((sum, [id, g]) => sum + shop.ingredients[id] * g.cost, 0) : shop.stock * STALL.unitCost;
  const drinkCapacity = (shop, id) => Math.min(...Object.entries(DRINKS[id].recipe).map(([ingredient, n]) => Math.floor((shop.ingredients || starterIngredients(shop.stock))[ingredient] / n)));
  const availableDrinks = (shop) => Object.keys(DRINKS).filter((id) => (shop.menu ? shop.menu[id].enabled : id === "lemonade") && drinkCapacity(shop, id) > 0);
  const syncStock = (shop) => { shop.stock = drinkCapacity(shop, "lemonade"); };
  const newAutoStock = () => ({ enabled: false, target: 3, budget: 20, reserve: 10 });
  const validAutoStock = (rule) => !!rule && typeof rule.enabled === "boolean" &&
    Number.isInteger(rule.target) && rule.target >= 1 && rule.target <= 3 &&
    Number.isInteger(rule.budget) && rule.budget >= 1 && rule.budget <= 50 &&
    Number.isInteger(rule.reserve) && rule.reserve >= 0 && rule.reserve <= 100;
  function autoRestock(s, day) {
    const shop = s.stall, rule = shop.autoStock;
    if (!rule?.enabled || shop.status !== "open" || shop.needsRepair) return null;
    let budget = Math.min(rule.budget, Math.max(0, s.cash - rule.reserve - STALL.dailyCost));
    const available = { ...shop.ingredients }, bought = {}, menu = Object.keys(DRINKS)
      .filter((id) => shop.menu[id].enabled && shop.menu[id].price > drinkCost(id))
      .sort((a, b) => drinkCost(a) - drinkCost(b));
    let spent = 0;
    for (let cup = 0; cup < rule.target; cup++) {
      for (const id of menu) {
        const needs = Object.entries(DRINKS[id].recipe).map(([key, n]) => [key, Math.max(0, n - available[key])]);
        const cost = needs.reduce((sum, [key, n]) => sum + n * INGREDIENTS[key].cost, 0);
        if (cost > budget || needs.some(([key, n]) => shop.ingredients[key] + n > STALL.capacity)) continue;
        for (const [key, n] of needs) {
          shop.ingredients[key] += n; available[key] += n;
          if (n) bought[key] = (bought[key] || 0) + n;
        }
        for (const [key, n] of Object.entries(DRINKS[id].recipe)) available[key] -= n;
        budget -= cost; spent += cost;
      }
    }
    if (spent) {
      s.cash -= spent; shop.suppliesCost += spent; syncStock(shop);
      log(s, `按规则自动进货 ${spent} 币：${Object.entries(bought).map(([id, n]) => `${INGREDIENTS[id].name} ${n} 份`).join("、")}`, -spent, { kind: "business", day });
    }
    return { spent, bought };
  }
  const validStallPrice = (price) => Number.isInteger(price) && price >= STALL.minPrice && price <= STALL.maxPrice;
  function stallStatus(s) {
    if (s.pending) return "legacy";
    const shop = s.stall;
    if (!shop) return "new";
    if (shop.status !== "open") return shop.status;
    if (shop.needsRepair) return "repair";
    if (shop.menu && !Object.values(shop.menu).some((item) => item.enabled)) return "menu";
    if (!availableDrinks(shop).length) return "empty";
    if (s.cash < STALL.dailyCost) return "funds";
    return "open";
  }
  function stallTotals(s) {
    const shop = s.stall;
    if (!shop) return null;
    const profit = shop.revenue - (shop.consumedCost ?? shop.sold * STALL.unitCost) - shop.operatingCost - shop.repairCost;
    return { profit, net: profit - shop.setupCost, remaining: Math.max(0, shop.setupCost - profit) };
  }
  function settleStall(s, pick, weather, day) {
    const shop = s.stall;
    if (!shop || shop.status !== "open") return null;
    const autoStock = autoRestock(s, day);
    const status = stallStatus(s);
    if (status !== "open") {
      if (status === "funds") shop.status = "paused";
      return { ongoing: true, status, day, autoStock };
    }
    const visitors = (weather === "rain" ? 3 : 4) + pick(3);
    const repair = pick(10) === 0;
    const sales = {};
    for (let visitor = 0; visitor < visitors; visitor++) {
      const choices = availableDrinks(shop).flatMap((id) => DRINKS[id].weather === weather ? [id, id] : [id]);
      if (!choices.length) break;
      const id = choices[pick(choices.length)], drink = DRINKS[id], price = shop.menu[id].price;
      const budget = drink.price + pick(5);
      if (price > budget) continue;
      for (const [ingredient, n] of Object.entries(drink.recipe)) shop.ingredients[ingredient] -= n;
      const sale = sales[id] ||= { id, price, cups: 0, revenue: 0, cost: 0 };
      sale.cups++; sale.revenue += price; sale.cost += drinkCost(id);
    }
    const drinks = Object.values(sales), cups = drinks.reduce((n, d) => n + d.cups, 0);
    const revenue = drinks.reduce((n, d) => n + d.revenue, 0), materials = drinks.reduce((n, d) => n + d.cost, 0);
    const cost = materials + STALL.dailyCost;
    s.cash += revenue - STALL.dailyCost;
    syncStock(shop); shop.consumedCost += materials; shop.sold += cups; shop.revenue += revenue;
    shop.operatingCost += STALL.dailyCost; shop.days += 1;
    shop.needsRepair = repair;
    const report = { ongoing: true, status: "operated", day, weather, visitors, price: shop.price, drinks, cups, revenue, cost, profit: revenue - cost, repair, autoStock };
    shop.history = [report, ...shop.history].slice(0, 7);
    log(s, `饮料店第 ${day} 日卖出 ${cups} 杯：收入 ${revenue}，已用原料 ${materials}，营业费 ${STALL.dailyCost}，经营${report.profit >= 0 ? "赚" : "亏"} ${Math.abs(report.profit)} 币${repair ? "；工具坏了，等你决定是否维修" : ""}`,
      revenue - STALL.dailyCost, { kind: "business", realized: report.profit, day, receipts: revenue, payments: STALL.dailyCost });
    return report;
  }
  function marketInfo(s, id) {
    const record = s.market?.shops[id];
    if (!record || !SHOPS[id]) return null;
    const factors = [{ ...MARKET_EVENTS[id][record.event] }];
    if (id === "umbrella") factors.unshift(s.market.weather === "rain"
      ? { icon: "🌧️", text: "下雨了，需要雨伞的人变多", effect: 1 }
      : { icon: "☀️", text: "晴天，雨伞需求没有增加", effect: 0 });
    return { ...record, day: s.market.day, factors, change: record.price - record.old };
  }
  const LEGACY_EVENTS = {
    7: { icon: "🎂", name: "你的游戏生日", text: "办个小派对，或做一张生日卡。两种庆祝都很棒！" },
    14: { icon: "🎈", name: "小镇游园会", text: "免费寻宝开放啦！来领一份小镇礼物。" },
    21: { icon: "🧧", name: "新年庙会", text: "一份 30 币的游戏红包，怎么安排由你决定。" },
    28: { icon: "🥮", name: "月亮分享节", text: "画一张月亮卡送给邻居，心意不一定要花钱。" }
  };
  const EVENTS = {
    "01-01": { icon: "🎊", name: "元旦", text: "新年第一天，做一张新年愿望卡。", id: "new-year" },
    "01-21": { icon: "🧧", name: "春节", text: "收到新年红包，安排你的新年小计划！", id: "spring", gift: 30 },
    "06-01": { icon: "🎈", name: "儿童节", text: "今天是小朋友的节日，去参加快乐游园会。", id: "children" },
    "09-12": { icon: "🏅", name: "校园运动会", text: "给同学加油，也来试试自己的拿手项目！", id: "sports", school: true },
    "09-15": { icon: "🥮", name: "中秋节", text: "和家人赏月，做一张团圆纪念卡。", id: "moon" },
    "10-01": { icon: "🎉", name: "国庆节", text: "假期开始，给自己安排一份快乐计划。", id: "national" },
    "10-18": { icon: "🍂", name: "班级秋游", text: "背上小书包，和同学一起收集秋天的颜色。", id: "outing", school: true }
  };
  function dateInfo(s, offset = 0) {
    const index = (s.calendar.startMonth - 1) * 28 + s.calendar.startDay - 1 + s.day - 1 + offset;
    const year = Math.floor(index / 336) + 1;
    const month = Math.floor(((index % 336 + 336) % 336) / 28) + 1;
    const date = (index % 28 + 28) % 28 + 1;
    return { key: `game-${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`, year, month, date, weekday: ((s.day + offset) % 7 + 7) % 7 };
  }
  function eventOn(s, offset = 0) {
    const d = dateInfo(s, offset), key = d.key.slice(-5);
    const event = key === s.calendar.birthday ? { icon: "🎂", name: "你的生日", text: "12 月 9 日，今天的主角就是你！", id: "birthday" } : EVENTS[key];
    return event ? { ...event, key: d.key } : null;
  }
  function nextEvent(s) {
    for (let distance = 0; distance <= 336; distance++) {
      const event = eventOn(s, distance);
      if (event) return { ...event, distance };
    }
    return null;
  }
  function eventMemory(s, key) {
    if (key.startsWith("game-")) {
      const parts = key.split("-");
      return eventOn({ ...s, day: 1, calendar: { ...s.calendar, startMonth: Number(parts[2]), startDay: Number(parts[3]) } });
    }
    return LEGACY_EVENTS[Number(key.split("-")[1])];
  }
  const TASKS = {
    garden: { name: "照料阳台花草", pay: 8 }, parcel: { name: "帮家人整理书架", pay: 10 }, craft: { name: "帮忙做活动彩旗", pay: 9 },
    cashier: { name: "帮小店核对找零", pay: 10 }, packing: { name: "帮家人装好出游背包", pay: 9 },
    catcher: { name: "小店接货员", pay: 8 }, balloons: { name: "校园气球赛", pay: 9 }, digging: { name: "花园寻物员", pay: 10 }
  };
  const TASK_ROTATION = ["parcel", "garden", "craft", "cashier", "packing", "catcher", "balloons", "digging"];
  const PASTIMES = {
    draw: { label: "画一幅画", icon: "🎨" },
    ball: { label: "玩皮球", icon: "⚽", item: "ball" },
    stars: { label: "找星星", icon: "⭐", item: "telescope" }
  };
  const LEGACY_FRIENDS = { deer: "小鹿", bear: "小熊" };
  const validRecipient = (name) => typeof name === "string" && name.length > 0 && name.length <= 20 &&
    name === name.trim() && !/[\u0000-\u001f\u007f]/.test(name);
  const JOY_KEYS = ["snack", ...Object.keys(PASTIMES), "help", "share", "event"];
  const SKETCH_ITEMS = ["notebook", "diary", "flower-notebook", "maple-notebook", "snow-diary", "wish-notebook", "heart-notebook", "rain-notebook", "leaf-notebook", "beach-notebook", "holiday-notebook", "pumpkin-notebook", "ginkgo-notebook"];
  const SKETCH_COLORS = ["#74728b", "#b0afbd", "#ef9e88", "#f3d16d", "#8abfdf", "#a9c98d"];
  const COLORING_PARTS = { cottage: 14, garden: 17, ocean: 14, space: 13 };
  const COLORING_COLORS = [...SKETCH_COLORS, "#ba9bda", "#e7aaca"];
  const validColoring = (id, colors) => Object.hasOwn(COLORING_PARTS, id) && Array.isArray(colors) &&
    colors.length === COLORING_PARTS[id] && colors.every((color) => COLORING_COLORS.includes(color));
  function validSketch(strokes) {
    return Array.isArray(strokes) && strokes.length <= 40 && strokes.every((stroke) =>
      stroke && SKETCH_COLORS.includes(stroke.color) && Array.isArray(stroke.points) && stroke.points.length >= 1 && stroke.points.length <= 128 &&
      stroke.points.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isInteger) && point[0] >= 0 && point[0] <= 320 && point[1] >= 0 && point[1] <= 210));
  }
  const JOY_MAX = (JOY_KEYS.length - 1) * 3 + 3;
  // Retired activities remain valid in saved memories, but cannot award new points.
  const JOY_RECORD_KEYS = [...JOY_KEYS, "bubbles"];
  const JOY_RECORD_MAX = JOY_MAX + 3;
  const newJoy = () => ({ points: 0, counts: {}, moments: [], memories: [] });
  const NEEDS = [
    { icon: "🍱", title: "在学校吃午餐", text: "午餐时间到了，选一份喜欢的套餐。", choices: [{ name: "饭团 + 鸡蛋", icon: "🍙", price: 6 }, { name: "蔬菜鸡肉便当", icon: "🍱", price: 9 }] },
    { icon: "✏️", title: "补充学习用品", text: "这几天用掉了一些文具，补齐下一轮的学习用品。", choices: [{ name: "基础文具包", icon: "✏️", price: 6 }, { name: "彩色文具包", icon: "🌈", price: 10 }] },
    { icon: "✂️", title: "手工课准备材料", text: "下一节手工课要做作品，选一份材料包吧！", choices: [{ name: "彩纸材料包", icon: "📄", price: 8 }, { name: "彩纸 + 装饰贴纸", icon: "✨", price: 12 }] }
  ];
  const SCHOOL_WEEK = [
    { name: "周一", title: "美术课的小准备", text: "明天画什么？收好彩笔，想想你的小作品。", item: "crayons", icon: "🖍️" },
    { name: "周二", title: "整理我的笔袋", text: "把铅笔和橡皮放好，准备明天的课堂。", item: "pencil", icon: "✏️" },
    { name: "周三", title: "课间的加餐", text: "课间休息啦，选一份书包里的点心。", item: "cookie", icon: "🍎" },
    { name: "周四", title: "记录学校的新发现", text: "今天有什么有趣的事？在练习本上画下来吧。", item: "notebook", icon: "📓" },
    { name: "周五", title: "放学后的快乐", text: "这一周辛苦啦！可以回家玩球、涂色，或者为周末留一点零用钱。", item: "ball", icon: "⚽" },
    { name: "周六", title: "周末小计划", text: "今天不上学。照料花草、和朋友玩耍，或者试试小摊？不用把时间全用来赚钱。", item: null, icon: "☀️" },
    { name: "周日", title: "整理明天的书包", text: "课本、水杯、文具，各自放进合适的位置。", item: "pencilcase", icon: "🎒" }
  ];
  const fail = (message) => { throw new Error(message); };
  const int = (n) => Number.isSafeInteger(n) && n >= 0;
  const total = (list) => list.reduce((sum, n) => sum + n, 0);
  const dayOfMonth = (s) => dateInfo(s).date;
  const month = (s) => dateInfo(s).month;
  const schoolDay = (s) => SCHOOL_WEEK[(dateInfo(s).weekday + 6) % 7];
  function create() {
    return {
      version: 1, day: 1, cash: 100, savings: 0, energy: 3, weather: "sun", forecast: { rainChance: 50 },
      prices: { bakery: 10, umbrella: 15 }, shares: { bakery: [], umbrella: [] },
      shareLocks: { day: 1, bakery: 0, umbrella: 0 },
      owned: [], inventoryVersion: 2, wishlist: [], sketches: {}, colorings: {}, gifts: [], pending: false, stall: null, events: [], journal: [],
      dailyLedger: { 1: newLedgerDay() },
      guide: { step: 0, paused: false, flow: 2 },
      challengeVersion: 3,
      skills: Object.fromEntries(Object.keys(TASKS).map((id) => [id, 0])),
      challenges: Object.fromEntries(Object.keys(TASKS).map((id) => [id, { level: 2, streak: 0 }])),
      bank: { units: 0, earned: 0 },
      joy: newJoy(),
      calendar: { startMonth: 9, startDay: 1, birthday: "12-09" },
      necessities: { paidDay: 0 },
      finance: { income: 0, spending: 0, realized: 0, opening: 100, sinceDay: 1, migrated: false },
      market: null,
      news: "放学铃响啦！书包里有课本和旧文具。你想先回家，还是看看校门口的小卖部？",
      lastReport: null
    };
  }
  function restore(state) {
    const s = JSON.parse(JSON.stringify(state));
    s.forecast ??= { rainChance: 50 };
    s.market ??= null;
    s.stall ??= null;
    s.sketches ??= {};
    s.colorings ??= {};
    s.gifts ??= [];
    for (const gift of s.gifts) {
      if (gift.recipient === undefined) gift.recipient = LEGACY_FRIENDS[gift.friend];
      delete gift.friend;
    }
    if (s.stall) {
      s.stall.price ??= STALL.price;
      s.stall.ingredients ??= starterIngredients(s.stall.stock);
      s.stall.menu ??= starterMenu(s.stall.price);
      s.stall.consumedCost ??= s.stall.sold * STALL.unitCost;
      s.stall.autoStock ??= newAutoStock();
      for (const report of s.stall.history) report.price ??= STALL.price;
    }
    if (s.lastReport?.stall?.ongoing && s.lastReport.stall.status === "operated") s.lastReport.stall.price ??= STALL.price;
    if (s.shareLocks === undefined) {
      s.shareLocks = { day: s.day, ...Object.fromEntries(Object.keys(SHOPS).map((id) => [id, legacyShareLocks(s, id)])) };
    } else if (s.shareLocks.day < s.day) {
      s.shareLocks = { day: s.day, bakery: 0, umbrella: 0 };
    }
    if (s.wishlist === undefined) s.wishlist = s.goal ? [s.goal] : [];
    delete s.goal;
    if (s.inventoryVersion === undefined) {
      s.owned = s.owned.flatMap((id) => id === "pencil" ? [id, id] : [id]);
      s.inventoryVersion = 2;
    }
    if (!s.guide) s.guide = { step: 0, paused: false, flow: 2 };
    else if (s.guide.flow !== 2) {
      s.guide.step = s.guide.step === 1 ? 2 : s.guide.step === 2 ? 1 : s.guide.step;
      s.guide.flow = 2;
    }
    s.skills ??= {};
    s.challenges ??= {};
    for (const id of Object.keys(TASKS)) {
      s.skills[id] ??= 0;
      s.challenges[id] ??= { level: Math.min(4, 2 + Math.floor(s.skills[id] / 2)), streak: 0 };
    }
    s.challengeVersion = 3;
    s.bank ??= { units: 0, earned: 0 };
    s.joy ??= newJoy();
    if (!s.calendar?.startMonth) {
      s.calendar = { startMonth: 1, startDay: 1, birthday: "12-09" };
      s.events = [...new Set(s.events.map((key) => {
        const match = /^(\d+)-21$/.exec(key);
        const oldMonth = match ? Number(match[1]) : 0;
        return oldMonth > 0 && (oldMonth - 1) % 12 === 0 ? `game-${Math.floor((oldMonth - 1) / 12) + 1}-01-21` : key;
      }))];
    }
    s.necessities ??= { paidDay: 0 };
    s.finance ??= { income: 0, spending: 0, realized: 0, opening: assets(s).total, sinceDay: s.day, migrated: true };
    if (s.dailyLedger === undefined) {
      s.dailyLedger = {};
      for (const entry of s.journal) recordDaily(s, entry, false);
      s.dailyLedger[s.day] ??= newLedgerDay(false);
    }
    return s;
  }
  const challengeLevel = (s, id) => s.challenges[id].level;
  function bankStatus(s) {
    const days = 7 - (s.day - 1) % 7;
    return { days, accrued: s.bank.units / 140, forecast: Math.floor((s.bank.units + s.savings * days) / 140), earned: s.bank.earned };
  }
  function assets(s) {
    const shares = Object.keys(SHOPS).map((id) => ({ id, ...holdings(s, id) }));
    const invested = total(shares.map((h) => h.value));
    const sellable = total(shares.map((h) => h.sellable * s.prices[h.id]));
    const cost = total(shares.map((h) => h.cost));
    const materials = (s.pending ? 12 : 0) + inventoryValue(s.stall);
    return { cash: s.cash, savings: s.savings, invested, sellable, cost, unrealized: invested - cost, materials, total: s.cash + s.savings + invested + materials, shares };
  }
  function expense(s) {
    let day = s.day + (4 - s.day % 4) % 4;
    if (day === s.day && s.necessities.paidDay === day) day += 4;
    const need = NEEDS[(day / 4 - 1) % NEEDS.length];
    const aid = day === s.day && !s.energy && !s.savings && !assets(s).sellable && !inventoryValue(s.stall) ? Math.max(0, need.choices[0].price - s.cash) : 0;
    return { ...need, day, days: day - s.day, due: day === s.day, aid };
  }
  function dayPlan(s) {
    const task = TASK_ROTATION[(s.day - 1) % TASK_ROTATION.length];
    if (expense(s).due) return { phase: "bill", task };
    const work = s.journal.findIndex((e) => e.day === s.day && Object.values(TASKS).some((t) => t.name === e.text));
    if (work < 0) return { phase: "play", task };
    const decided = s.journal.slice(0, work).some((e) => e.day === s.day && /^(买了|把钱移进愿望罐|存入银行|零花钱先留在钱包|生活支出)/.test(e.text));
    return { phase: decided ? "done" : "choice", task, pay: s.journal[work].amount };
  }
  const LEDGER_TOTALS = ["income", "spending", "capitalIn", "capitalOut", "transferIn", "transferOut", "entries"];
  function newLedgerDay(complete = true) {
    return { income: 0, spending: 0, capitalIn: 0, capitalOut: 0, transferIn: 0, transferOut: 0, entries: 0, complete };
  }
  function recordDaily(s, entry, complete = true) {
    const row = s.dailyLedger[entry.day] ??= newLedgerDay(complete);
    const amount = entry.amount || 0;
    row.entries++;
    if (entry.kind === "transfer") {
      row.transferIn += Math.max(0, amount);
      row.transferOut += Math.max(0, -amount);
    } else if (entry.kind === "invest" || entry.kind === "business" && amount > 0 && entry.realized === undefined && entry.receipts === undefined) {
      row.capitalIn += Math.max(0, amount);
      row.capitalOut += Math.max(0, -amount);
    } else if (entry.kind === "business") {
      row.income += entry.receipts ?? Math.max(0, amount);
      row.spending += entry.payments ?? Math.max(0, -amount);
    } else {
      row.income += entry.income || 0;
      row.spending += entry.spending || 0;
    }
  }
  function dailyAccount(s, day = s.day) {
    if (!int(day) || day < 1 || day > s.day) return null;
    const row = s.dailyLedger?.[day] || newLedgerDay(false);
    return { ...row, day, date: dateInfo(s, day - s.day), net: row.income - row.spending, records: s.journal.filter((entry) => entry.day === day) };
  }
  function log(s, text, amount = 0, detail = {}) {
    const day = detail.day ?? s.day;
    const entry = { day, date: dateInfo(s, day - s.day).key, text, amount, kind: "activity", ...detail };
    recordDaily(s, entry);
    s.journal.unshift(entry);
    s.journal = s.journal.slice(0, 60);
    s.finance.income += detail.income || 0;
    s.finance.spending += detail.spending || 0;
    s.finance.realized += detail.realized || 0;
  }
  function pay(s, amount) {
    if (!int(amount) || s.cash < amount) fail("钱包里的钱还不够，可以先少买一点，或去赚一些。");
    s.cash -= amount;
  }
  function quote(ids) {
    if (!Array.isArray(ids) || !ids.length) fail("先选商品和数量吧。");
    const quantities = new Map();
    for (const id of ids) {
      if (!GOODS.some((g) => g.id === id)) fail("没有找到这件商品。");
      quantities.set(id, (quantities.get(id) || 0) + 1);
    }
    const items = [...quantities].map(([id, quantity]) => {
      const item = GOODS.find((g) => g.id === id);
      return { ...item, quantity, lineTotal: item.price * quantity };
    });
    const subtotal = total(items.map((item) => item.lineTotal));
    const discount = subtotal >= 30 ? 5 : 0;
    return { subtotal, discount, due: subtotal - discount, items };
  }
  function legacyShareLocks(s, id) {
    return Math.min(s.shares[id].length, s.journal.filter((e) => e.day === s.day && e.text === `买了${SHOPS[id].name}的 1 份股份`).length);
  }
  function holdings(s, id) {
    const locked = s.shareLocks === undefined ? legacyShareLocks(s, id) : s.shareLocks.day === s.day ? s.shareLocks[id] : 0;
    return { count: s.shares[id].length, cost: total(s.shares[id]), value: s.shares[id].length * s.prices[id], locked, sellable: s.shares[id].length - locked };
  }
  function joyReward(s, key) {
    if (!JOY_KEYS.includes(key)) fail("没有这个开心活动。");
    const count = s.joy.counts[key] || 0;
    return key === "event" ? count ? 0 : 3 : Math.max(0, 2 - count);
  }
  function enjoy(s, key, label, icon) {
    const gain = joyReward(s, key);
    if (gain) {
      s.joy.counts[key] = (s.joy.counts[key] || 0) + 1;
      s.joy.points += gain;
      s.joy.moments.push({ label, icon, gain });
    }
    return { joy: gain, label, icon };
  }
  function validJoy(j, day) {
    const momentsValid = (moments, points) => Array.isArray(moments) && moments.length <= JOY_RECORD_KEYS.length * 2 - 1 &&
      moments.every((m) => m && typeof m.label === "string" && m.label.length <= 80 && typeof m.icon === "string" && m.icon.length <= 16 && int(m.gain) && m.gain >= 1 && m.gain <= 3) &&
      total(moments.map((m) => m.gain)) === points;
    if (!j || !int(j.points) || j.points > JOY_RECORD_MAX || !j.counts || typeof j.counts !== "object" || Array.isArray(j.counts) ||
      !Object.entries(j.counts).every(([key, n]) => JOY_RECORD_KEYS.includes(key) && int(n) && n <= (key === "event" ? 1 : 2)) ||
      total(Object.entries(j.counts).map(([key, n]) => key === "event" ? n * 3 : n ? n + 1 : 0)) !== j.points ||
      !momentsValid(j.moments, j.points) || j.moments.length !== total(Object.values(j.counts)) ||
      !Array.isArray(j.memories) || j.memories.length > 7) return false;
    return j.memories.every((m, i) => m && int(m.day) && m.day >= 1 && m.day < day && (!i || j.memories[i - 1].day < m.day) &&
      typeof m.date === "string" && /^game-\d+-\d{2}-\d{2}$/.test(m.date) && int(m.points) && m.points <= JOY_RECORD_MAX && momentsValid(m.moments, m.points));
  }
  function advance(s, rng) {
    if (expense(s).due) fail("今天的生活支出还没安排好，先选一份方案吧。");
    const memory = { day: s.day, date: dateInfo(s).key, points: s.joy.points, moments: s.joy.moments };
    const memories = [...s.joy.memories, memory].slice(-7);
    s.joy = { ...newJoy(), memories };
    const pick = (n) => Math.min(n - 1, Math.max(0, Math.floor(rng() * n)));
    const operatingWeather = s.weather;
    // One unit is one coin held across one game-day boundary; 140 units earn one coin.
    s.bank.units += s.savings;
    s.day += 1;
    s.dailyLedger[s.day] = newLedgerDay();
    s.shareLocks = { day: s.day, bakery: 0, umbrella: 0 };
    s.energy = 3;
    s.weather = pick(100) >= 100 - s.forecast.rainChance ? "rain" : "sun";
    const report = { stall: null, shops: [], allowance: 0, joy: memory, bank: { settled: (s.day - 1) % 7 === 0, interest: 0 } };
    if (report.bank.settled) {
      const interest = Math.floor(s.bank.units / 140);
      s.bank.units %= 140;
      s.savings += interest;
      s.bank.earned += interest;
      report.bank.interest = interest;
      if (interest) log(s, "银行利息到账，留在存款里", 0, { kind: "income", bankAmount: interest, income: interest });
    }
    if (s.pending) {
      const cups = pick(7);
      const revenue = cups * 4;
      s.cash += revenue;
      s.pending = false;
      report.stall = { cups, cost: 12, revenue, profit: revenue - 12 };
      log(s, `柠檬水摊收回 ${revenue} 币；扣掉昨天的 12 币成本，${revenue >= 12 ? "赚" : "亏"} ${Math.abs(revenue - 12)} 币`, revenue, { kind: "business", realized: revenue - 12, day: memory.day, receipts: revenue, payments: 0 });
    } else report.stall = settleStall(s, pick, operatingWeather, memory.day);
    s.market = { day: s.day, weather: s.weather, shops: {} };
    for (const id of Object.keys(SHOPS)) {
      const old = s.prices[id];
      const event = pick(MARKET_EVENTS[id].length), noise = pick(9) - 4;
      const change = MARKET_EVENTS[id][event].effect + noise + (id === "umbrella" && s.weather === "rain" ? 1 : 0);
      const price = old === 0 ? 0 : Math.max(0, old + change);
      s.prices[id] = price;
      const dividend = price > 0 && pick(4) === 0 ? s.shares[id].length : 0;
      s.cash += dividend;
      report.shops.push({ id, old, price, dividend });
      s.market.shops[id] = { event, old, price, noise };
      if (dividend) log(s, `${SHOPS[id].name}发了分红（不保证每天都有）`, dividend, { kind: "income", income: dividend });
    }
    if ((s.day - 1) % 7 === 0) {
      s.cash += 20;
      report.allowance = 20;
      log(s, "每周零用钱到账", 20, { kind: "income", income: 20 });
    }
    s.news = "天气和店里的消息会影响价格，其他人的买卖也会影响。今天的消息已经计入今天的价格，不是明天的预告。";
    s.forecast = { rainChance: [20, 50, 80][pick(3)] };
    s.lastReport = report;
    return report;
  }
  function act(state, action, rng = Math.random) {
    const s = restore(state);
    let result = null;
    switch (action.type) {
      case "buy": {
        const q = quote(action.ids);
        if (q.items.some((g) => !available(s, g.id))) fail("有月度限定商品暂时下架了，等它的月份再来吧，心愿可以保留。");
        pay(s, q.due);
        s.owned = s.owned.concat(action.ids);
        log(s, `买了${q.items.map((g) => `${g.name} × ${g.quantity}${g.unit}`).join("、")}，优惠 ${q.discount} 币`, -q.due, { kind: "spending", spending: q.due });
        break;
      }
      case "eat": {
        const item = GOODS.find((g) => g.id === action.id);
        if (!item?.snack || !s.owned.includes(action.id)) fail("书包里还没有这份点心。");
        s.owned.splice(s.owned.indexOf(action.id), 1);
        result = enjoy(s, "snack", item.name, item.icon);
        log(s, `用掉 1${item.unit}${item.name}，没有再次扣钱`);
        break;
      }
      case "enjoy": {
        if (!Object.hasOwn(PASTIMES, action.id)) fail("没有这个开心活动。");
        const activity = PASTIMES[action.id];
        if (activity.item && !s.owned.includes(activity.item)) fail("书包里还没有这件玩具。");
        result = enjoy(s, action.id, activity.label, activity.icon);
        if (result.joy) log(s, `${activity.label}，开心 +${result.joy}`);
        break;
      }
      case "sketch-save":
        if (!SKETCH_ITEMS.includes(action.id) || !s.owned.includes(action.id) || !validSketch(action.strokes)) fail("先准备好自己的小本子和画作。");
        if (JSON.stringify(s.sketches[action.id] || []) === JSON.stringify(action.strokes)) {
          result = { joy: 0, icon: "🎨" };
          break;
        }
        s.sketches[action.id] = JSON.parse(JSON.stringify(action.strokes));
        result = action.strokes.length ? enjoy(s, "draw", "画了自己的小画", "🎨") : { joy: 0, icon: "🎨" };
        break;
      case "gift-sketch": {
        const recipient = typeof action.recipient === "string" ? action.recipient.trim() : "";
        const strokes = s.sketches[action.id];
        const template = typeof action.id === "string" && action.id.startsWith("coloring:") ? action.id.slice(9) : null;
        const coloring = template && s.colorings[template] ? { template, colors: s.colorings[template] } : null;
        if (!validRecipient(recipient)) fail("写一个 1～20 个字的名字或称呼吧。");
        if (!coloring && (!SKETCH_ITEMS.includes(action.id) || !s.owned.includes(action.id) || !strokes?.length)) fail("先画好自己的作品，再决定送给谁吧。");
        if (s.gifts.some((gift) => gift.recipient.toLowerCase() === recipient.toLowerCase() && JSON.stringify(gift.coloring || gift.strokes) === JSON.stringify(coloring || strokes))) fail("这幅画已经为这个人准备好了，试试创作新的作品吧。");
        const gift = { day: s.day, item: action.id, recipient, ...JSON.parse(JSON.stringify(coloring ? { coloring } : { strokes })) };
        s.gifts = [...s.gifts, gift].slice(-6);
        result = { ...enjoy(s, "share", `为${recipient}准备了自己的画`, "💌"), gift };
        break;
      }
      case "coloring-save":
        if (!validColoring(action.id, action.colors) || !s.owned.includes("crayons") && action.colors.some((c) => !SKETCH_COLORS.slice(0, 2).includes(c))) fail("先把整幅图涂好，再保存吧。");
        s.colorings[action.id] = [...action.colors];
        result = { joy: 0 };
        break;
      case "guide-start":
        if (s.guide.step === 0 || s.guide.step === 5) s.guide.step = 1;
        s.guide.paused = false;
        break;
      case "guide-pause": s.guide.paused = true; break;
      case "guide-skip":
        if (s.guide.step >= 1 && s.guide.step < 5) s.guide.step += 1;
        break;
      case "keep-money":
        log(s, "零花钱先留在钱包，之后再决定");
        break;
      case "save":
      case "withdraw": {
        const n = action.amount;
        if (!int(n) || !n) fail("请选择一个大于零的整数金额。");
        if (action.type === "save") { pay(s, n); s.savings += n; }
        else {
          if (s.savings < n) fail("银行里的存款还不够。");
          s.savings -= n; s.cash += n;
        }
        log(s, action.type === "save" ? "存入银行（钱换了位置）" : "从银行取回钱包", action.type === "save" ? -n : n, { kind: "transfer", bankAmount: action.type === "save" ? n : -n });
        break;
      }
      case "wish-add":
      case "wish-remove":
        if (!GOODS.some((g) => g.id === action.id)) fail("这个愿望还没有开放。");
        if (action.type === "wish-add") {
          if (!s.wishlist.includes(action.id)) s.wishlist.push(action.id);
        } else s.wishlist = s.wishlist.filter((id) => id !== action.id);
        break;
      case "work": {
        const task = TASKS[action.id];
        if (!task || !s.energy) fail("今天先休息吧，明天又有新的精力。");
        const performance = action.performance;
        if (performance) {
          if (!int(performance.level) || performance.level < 1 || performance.level > 5 || !int(performance.mistakes) || !int(performance.assists)) fail("这次挑战记录不完整，请再试一次。");
          const progress = s.challenges[action.id];
          if (progress.level !== performance.level) progress.streak = 0;
          progress.level = performance.level;
          progress.streak = performance.mistakes === 0 && performance.assists === 0 ? progress.streak + 1 : 0;
          if (performance.mistakes >= 4 || performance.assists >= 3) { progress.level = Math.max(1, progress.level - 1); progress.streak = 0; }
          else if (progress.streak >= 2) { progress.level = Math.min(5, progress.level + 1); progress.streak = 0; }
          result = { level: progress.level };
        }
        s.energy -= 1; s.cash += task.pay;
        s.skills[action.id] += 1;
        result = { ...result, ...enjoy(s, "help", task.name, "🤝") };
        log(s, task.name, task.pay, { kind: "income", income: task.pay });
        break;
      }
      case "expense": {
        const bill = expense(s);
        if (!bill.due || action.day !== undefined && action.day !== s.day || !int(action.choice) || !bill.choices[action.choice]) fail("这项生活支出不需要重复支付。");
        const choice = bill.choices[action.choice];
        const aid = action.aid === true ? bill.aid : 0;
        if (action.aid === true && (!aid || action.choice !== 0)) fail("补助只能用于确实付不起的基础方案。");
        pay(s, choice.price - aid);
        s.necessities.paidDay = s.day;
        result = { price: choice.price, aid };
        log(s, `生活支出：${bill.title} · ${choice.name}${aid ? `（家长直接补助 ${aid} 币）` : ""}`, -(choice.price - aid), { kind: "spending", spending: choice.price, income: aid });
        break;
      }
      case "stall":
        if (s.pending) fail("原来的一日摊还没结算，结束今天后再开新店。");
        if (s.stall && s.stall.status !== "closed") fail("店已经开好了，不用再买摊车。");
        if (!s.energy) fail("今天的精力用完了，先休息吧。");
        if (action.price !== undefined && !validStallPrice(action.price)) fail("每杯售价可以定在 1～8 币。");
        if (action.starter !== undefined && typeof action.starter !== "boolean") fail("请选择一种开店方式。");
        pay(s, STALL.setup + (action.starter === false ? 0 : 6 * STALL.unitCost)); s.energy -= 1;
        s.stall ??= { status: "closed", stock: 0, needsRepair: false, setupCost: 0, suppliesCost: 0, operatingCost: 0, repairCost: 0, revenue: 0, refunded: 0, sold: 0, days: 0, history: [] };
        s.stall.status = "open"; s.stall.needsRepair = false;
        s.stall.price = action.price ?? STALL.price;
        s.stall.ingredients = starterIngredients(action.starter === false ? 0 : 6);
        s.stall.menu = starterMenu(s.stall.price); s.stall.consumedCost ??= 0;
        s.stall.autoStock = newAutoStock();
        if (action.starter === false) s.stall.menu.lemonade.enabled = false;
        s.stall.setupCost += STALL.setup; s.stall.suppliesCost += action.starter === false ? 0 : 6 * STALL.unitCost; syncStock(s.stall);
        log(s, action.starter === false ? "开饮料店：工具 24 币；菜单和原料自己选" : "开店：摊车工具 24 币（不退款），6 杯原料 12 币；营业日另付 2 币", action.starter === false ? -24 : -36, { kind: "business", realized: -STALL.setup });
        break;
      case "stall-price":
        if (!s.stall || s.stall.status === "closed") fail("先开一家店吧。");
        if (!validStallPrice(action.price)) fail("每杯售价可以定在 1～8 币。");
        s.stall.price = action.price;
        s.stall.menu.lemonade.price = action.price;
        break;
      case "stall-menu":
        if (!s.stall || s.stall.status === "closed" || !Object.hasOwn(DRINKS, action.id) || typeof action.enabled !== "boolean") fail("先开店，再选择菜单上的饮品。");
        s.stall.menu[action.id].enabled = action.enabled;
        break;
      case "stall-auto":
        if (!s.stall || s.stall.status === "closed" || !validAutoStock(action.rule)) fail("自动进货可备 1～3 杯，每天预算 1～50 币，钱包保留 0～100 币。");
        s.stall.autoStock = { enabled: action.rule.enabled, target: action.rule.target, budget: action.rule.budget, reserve: action.rule.reserve };
        break;
      case "stall-drink-price":
        if (!s.stall || s.stall.status === "closed" || !Object.hasOwn(DRINKS, action.id) || !validStallPrice(action.price)) fail("每杯售价可以定在 1～8 币。");
        s.stall.menu[action.id].price = action.price;
        if (action.id === "lemonade") s.stall.price = action.price;
        break;
      case "stall-stock": {
        if (!s.stall || s.stall.status === "closed") fail("先开一家店吧。");
        const ids = action.ingredient === undefined ? ["lemon", "sugar"] : [action.ingredient];
        if (!ids.every((id) => Object.hasOwn(INGREDIENTS, id)) || !(action.ingredient === undefined ? [3, 6, 12] : [1, 3, 6]).includes(action.quantity) ||
          ids.some((id) => s.stall.ingredients[id] + action.quantity > STALL.capacity)) fail("每种原料最多存 18 份，换一个补货数量吧。");
        const cost = ids.reduce((sum, id) => sum + INGREDIENTS[id].cost, 0) * action.quantity;
        pay(s, cost);
        for (const id of ids) s.stall.ingredients[id] += action.quantity;
        syncStock(s.stall); s.stall.suppliesCost += cost;
        log(s, `饮料店进货：${ids.map((id) => `${INGREDIENTS[id].name} ${action.quantity} 份`).join("、")}，未用原料留在库存`, -cost, { kind: "business" });
        break;
      }
      case "stall-pause":
        if (!s.stall || s.stall.status !== "open") fail("小摊现在没有营业。");
        s.stall.status = "paused";
        break;
      case "stall-resume":
        if (!s.stall || s.stall.status !== "paused") fail("小摊现在不在暂停中。");
        if (s.stall.needsRepair || !availableDrinks(s.stall).length || s.cash < STALL.dailyCost) fail("先选好菜单、备好原料、修好工具，并留 2 币营业费。");
        s.stall.status = "open";
        break;
      case "stall-repair":
        if (!s.stall || s.stall.status === "closed" || !s.stall.needsRepair) fail("现在不需要维修。");
        pay(s, STALL.repair); s.stall.repairCost += STALL.repair; s.stall.needsRepair = false;
        log(s, "小摊维修龙头，之后才能继续营业", -STALL.repair, { kind: "business", realized: -STALL.repair });
        break;
      case "stall-close": {
        if (!s.stall || s.stall.status === "closed") fail("现在没有可以关闭的小摊。");
        const refund = inventoryValue(s.stall);
        s.cash += refund; s.stall.refunded += refund; s.stall.stock = 0;
        s.stall.ingredients = starterIngredients();
        s.stall.status = "closed"; s.stall.needsRepair = false;
        log(s, `结束这家小摊，未用原料退回 ${refund} 币，摊车工具不退款`, refund, { kind: "business" });
        break;
      }
      case "invest": {
        const id = action.id;
        if (!SHOPS[id]) fail("没有这家小店。");
        if (s.prices[id] === 0) fail("这家店已经停业，不能再买入。");
        pay(s, s.prices[id]);
        s.shares[id].push(s.prices[id]);
        s.shareLocks[id] += 1;
        log(s, `买了${SHOPS[id].name}的 1 份股份`, -s.prices[id], { kind: "invest" });
        break;
      }
      case "sell": {
        const id = action.id;
        if (!SHOPS[id] || !s.shares[id].length) fail("你还没有这家店的股份。");
        if (!holdings(s, id).sellable) fail("今天买入的股份，下一游戏日才能卖出。");
        const cost = s.shares[id].shift();
        const revenue = s.prices[id];
        s.cash += revenue;
        result = { cost, revenue, profit: revenue - cost };
        log(s, `卖出${SHOPS[id].name}最早买的 1 份：成本 ${cost}，收回 ${revenue}，${revenue >= cost ? "赚" : "亏"} ${Math.abs(revenue - cost)} 币（不含分红）`, revenue, { kind: "invest", realized: revenue - cost });
        break;
      }
      case "event": {
        const event = eventOn(s);
        if (!event || s.events.includes(event.key)) fail("今天的活动已经参加过啦，或今天没有活动。");
        if (event.id === "birthday") {
          if (!["party", "card"].includes(action.choice)) fail("选一种庆祝方式吧。");
          if (action.choice === "party") pay(s, 15);
          log(s, action.choice === "party" ? "办了一场温馨生日会" : "做了一张独一无二的生日卡", action.choice === "party" ? -15 : 0, { kind: action.choice === "party" ? "spending" : "activity", spending: action.choice === "party" ? 15 : 0 });
        } else if (event.gift) { s.cash += event.gift; log(s, `收到${event.name}游戏红包`, event.gift, { kind: "income", income: event.gift }); }
        else log(s, `参加了${event.name}，收下一份快乐回忆`);
        s.events.push(event.key);
        result = enjoy(s, "event", event.name, event.icon);
        break;
      }
      case "next": result = advance(s, rng); break;
      default: fail("这个动作还没有开放。");
    }
    if (!s.guide.paused && (
      s.guide.step === 1 && action.type === "work" ||
      s.guide.step === 2 && ["buy", "keep-money"].includes(action.type) ||
      s.guide.step === 3 && ["save", "withdraw"].includes(action.type) ||
      s.guide.step === 4 && action.type === "next"
    )) s.guide.step += 1;
    return { state: s, result };
  }
  function validStall(shop, day) {
    if (!shop || !["open", "paused", "closed"].includes(shop.status) || typeof shop.needsRepair !== "boolean") return false;
    if (!["stock", "setupCost", "suppliesCost", "operatingCost", "repairCost", "revenue", "refunded", "sold", "days"].every((key) => int(shop[key]))) return false;
    if (shop.autoStock !== undefined && !validAutoStock(shop.autoStock)) return false;
    const modern = shop.ingredients !== undefined;
    if (modern && (!shop.ingredients || Object.keys(shop.ingredients).length !== Object.keys(INGREDIENTS).length ||
      !Object.keys(INGREDIENTS).every((id) => int(shop.ingredients[id]) && shop.ingredients[id] <= STALL.capacity) ||
      !shop.menu || Object.keys(shop.menu).length !== Object.keys(DRINKS).length ||
      !Object.keys(DRINKS).every((id) => shop.menu[id] && typeof shop.menu[id].enabled === "boolean" && validStallPrice(shop.menu[id].price)) ||
      shop.menu.lemonade.price !== (shop.price ?? STALL.price) || !int(shop.consumedCost) ||
      shop.consumedCost < shop.sold * 2 || shop.consumedCost > shop.sold * 5 || shop.stock !== drinkCapacity(shop, "lemonade"))) return false;
    if (!modern && (shop.menu !== undefined || shop.consumedCost !== undefined)) return false;
    const consumed = modern ? shop.consumedCost : shop.sold * STALL.unitCost;
    const validSales = (r) => r.drinks === undefined
      ? r.revenue === r.cups * (r.price ?? STALL.price) && r.cost === r.cups * STALL.unitCost + STALL.dailyCost
      : Array.isArray(r.drinks) && new Set(r.drinks.map((d) => d?.id)).size === r.drinks.length &&
        r.drinks.every((d) => d && Object.hasOwn(DRINKS, d.id) && int(d.cups) && d.cups > 0 && validStallPrice(d.price) &&
          d.revenue === d.cups * d.price && d.cost === d.cups * drinkCost(d.id)) &&
        r.cups === total(r.drinks.map((d) => d.cups)) && r.revenue === total(r.drinks.map((d) => d.revenue)) &&
        r.cost === total(r.drinks.map((d) => d.cost)) + STALL.dailyCost;
    return (shop.price === undefined || validStallPrice(shop.price)) &&
      shop.stock <= STALL.capacity && shop.setupCost >= STALL.setup && shop.setupCost % STALL.setup === 0 &&
      shop.suppliesCost === inventoryValue(shop) + consumed + shop.refunded &&
      shop.revenue >= shop.sold * STALL.minPrice && shop.revenue <= shop.sold * STALL.maxPrice && shop.operatingCost === shop.days * STALL.dailyCost &&
      (modern || shop.refunded % STALL.unitCost === 0) && shop.repairCost % STALL.repair === 0 &&
      (shop.status !== "closed" || inventoryValue(shop) === 0 && !shop.needsRepair) &&
      Array.isArray(shop.history) && shop.history.length === Math.min(7, shop.days) &&
      (shop.days > 7 || shop.revenue === total(shop.history.map((r) => r?.revenue)) && shop.sold === total(shop.history.map((r) => r?.cups)) &&
        consumed === total(shop.history.map((r) => r?.cost - STALL.dailyCost))) &&
      shop.history.every((r, i) => r && r.ongoing === true && r.status === "operated" && int(r.day) && r.day >= 1 && r.day < day &&
        (!i || r.day < shop.history[i - 1].day) && ["sun", "rain"].includes(r.weather) &&
        int(r.cups) && r.cups <= 6 && (r.price === undefined || validStallPrice(r.price)) && validSales(r) &&
        (r.visitors === undefined || int(r.visitors) && r.visitors <= (r.weather === "rain" ? r.drinks ? 5 : 4 : 6) && r.cups <= r.visitors) &&
        r.profit === r.revenue - r.cost && typeof r.repair === "boolean");
  }
  function valid(s) {
    const requiredTasks = s?.challengeVersion === 3 ? Object.keys(TASKS) : s?.challengeVersion === 2 ? ["garden", "parcel", "craft", "cashier", "packing"] : ["garden", "parcel", "craft"];
    if (!s || s.version !== 1 || !int(s.day) || s.day < 1 ||
      !int(s.cash) || !int(s.savings) || !int(s.energy) || s.energy > 3 ||
      !["sun", "rain"].includes(s.weather) || typeof s.pending !== "boolean" ||
      s.forecast !== undefined && (!s.forecast || ![20, 50, 80].includes(s.forecast.rainChance)) ||
      s.shareLocks !== undefined && (!s.shareLocks || !int(s.shareLocks.day) || s.shareLocks.day < 1 || s.shareLocks.day > s.day ||
        !Object.keys(SHOPS).every((id) => int(s.shareLocks[id]) && s.shareLocks[id] <= (s.shares?.[id]?.length ?? -1))) ||
      s.stall != null && (s.pending || !validStall(s.stall, s.day)) ||
      (s.wishlist === undefined ? !GOODS.some((g) => g.id === s.goal) :
        !Array.isArray(s.wishlist) || new Set(s.wishlist).size !== s.wishlist.length || !s.wishlist.every((id) => GOODS.some((g) => g.id === id))) ||
      typeof s.news !== "string" ||
      s.market != null && (!s.market || s.market.day !== s.day || s.market.weather !== s.weather ||
        !Object.keys(SHOPS).every((id) => {
          const r = s.market.shops?.[id];
          return r && int(r.event) && r.event < MARKET_EVENTS[id].length && int(r.old) && int(r.price) &&
            Number.isInteger(r.noise) && r.noise >= -4 && r.noise <= 4 && r.price === s.prices?.[id] &&
            r.price === (r.old === 0 ? 0 : Math.max(0, r.old + MARKET_EVENTS[id][r.event].effect + r.noise + (id === "umbrella" && s.weather === "rain" ? 1 : 0)));
        })) ||
      s.inventoryVersion !== undefined && s.inventoryVersion !== 2 ||
      !Array.isArray(s.owned) || s.inventoryVersion === undefined && new Set(s.owned).size !== s.owned.length ||
      !s.owned.every((id) => GOODS.some((g) => g.id === id)) ||
      !Array.isArray(s.events) || !s.events.every((e) => typeof e === "string") ||
      s.dailyLedger !== undefined && (!s.dailyLedger || typeof s.dailyLedger !== "object" || Array.isArray(s.dailyLedger) ||
        !Object.entries(s.dailyLedger).every(([day, row]) => /^[1-9]\d*$/.test(day) && int(Number(day)) && Number(day) <= s.day &&
          row && typeof row.complete === "boolean" && LEDGER_TOTALS.every((key) => int(row[key])))) ||
      !Array.isArray(s.journal) || !s.journal.every((e) => int(e.day) && typeof e.text === "string" && Number.isSafeInteger(e.amount) &&
        (e.receipts === undefined && e.payments === undefined || e.kind === "business" && int(e.receipts) && int(e.payments) && e.receipts - e.payments === e.amount) &&
        (e.bankAmount === undefined || Number.isSafeInteger(e.bankAmount)) && (e.kind === undefined || ["activity", "income", "spending", "transfer", "invest", "business"].includes(e.kind)) &&
        (e.income === undefined || int(e.income)) && (e.spending === undefined || int(e.spending)) && (e.realized === undefined || Number.isSafeInteger(e.realized))) ||
      s.guide !== undefined && (!s.guide || !int(s.guide.step) || s.guide.step > 5 || typeof s.guide.paused !== "boolean" || s.guide.flow !== undefined && s.guide.flow !== 2) ||
      s.bank !== undefined && (!s.bank || !int(s.bank.units) || !int(s.bank.earned)) ||
      s.joy !== undefined && !validJoy(s.joy, s.day) ||
      s.calendar !== undefined && (!s.calendar || s.calendar.birthday !== "12-09" || (!(int(s.calendar.startMonth) && s.calendar.startMonth >= 1 && s.calendar.startMonth <= 12 && int(s.calendar.startDay) && s.calendar.startDay >= 1 && s.calendar.startDay <= 28) && !(s.calendar.startMonth === undefined && typeof s.calendar.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.calendar.startDate)))) ||
      s.necessities !== undefined && (!s.necessities || !int(s.necessities.paidDay) || s.necessities.paidDay > s.day) ||
      s.finance !== undefined && (!s.finance || !int(s.finance.income) || !int(s.finance.spending) || !Number.isSafeInteger(s.finance.realized) || !int(s.finance.opening) || !int(s.finance.sinceDay) || s.finance.sinceDay < 1 || s.finance.sinceDay > s.day || typeof s.finance.migrated !== "boolean") ||
      s.sketches !== undefined && (!s.sketches || typeof s.sketches !== "object" || Array.isArray(s.sketches) ||
        !Object.entries(s.sketches).every(([id, strokes]) => SKETCH_ITEMS.includes(id) && s.owned.includes(id) && validSketch(strokes))) ||
      s.colorings !== undefined && (!s.colorings || typeof s.colorings !== "object" || Array.isArray(s.colorings) ||
        !Object.entries(s.colorings).every(([id, colors]) => validColoring(id, colors))) ||
      s.gifts !== undefined && (!Array.isArray(s.gifts) || s.gifts.length > 6 || !s.gifts.every((gift, i) =>
        gift && int(gift.day) && gift.day >= 1 && gift.day <= s.day && (!i || gift.day >= s.gifts[i - 1].day) &&
        (gift.recipient === undefined ? Object.hasOwn(LEGACY_FRIENDS, gift.friend) : validRecipient(gift.recipient)) &&
        (gift.coloring ? gift.item === `coloring:${gift.coloring.template}` && validColoring(gift.coloring.template, gift.coloring.colors) :
          SKETCH_ITEMS.includes(gift.item) && validSketch(gift.strokes) && gift.strokes.length > 0))) ||
      s.challengeVersion !== undefined && ![2, 3].includes(s.challengeVersion) ||
      s.challenges !== undefined && (!s.challenges || !Object.keys(TASKS).every((id) => !requiredTasks.includes(id) && s.challenges[id] === undefined || s.challenges[id] && int(s.challenges[id].level) && s.challenges[id].level >= 1 && s.challenges[id].level <= 5 && int(s.challenges[id].streak) && s.challenges[id].streak < 2)) ||
      s.skills !== undefined && (!s.skills || !Object.keys(TASKS).every((id) => !requiredTasks.includes(id) && s.skills[id] === undefined || int(s.skills[id])))) return false;
    return Object.keys(SHOPS).every((id) => s.prices && int(s.prices[id]) && s.shares &&
      Array.isArray(s.shares[id]) && s.shares[id].every(int));
  }
  const api = { GOODS, SHOPS, EVENTS, TASKS, STALL, INGREDIENTS, DRINKS, drinkCost, drinkCapacity, inventoryValue, availableDrinks, SEASONS, season, monthlySpecials, available, stallStatus, stallTotals, PASTIMES, SKETCH_ITEMS, SKETCH_COLORS, JOY_MAX, joyReward, create, restore, dayPlan, challengeLevel, bankStatus, dailyAccount, assets, expense, dateInfo, eventOn, nextEvent, eventMemory, act, quote, holdings, dayOfMonth, month, schoolDay, marketInfo, valid };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Town = api;
})(globalThis);
