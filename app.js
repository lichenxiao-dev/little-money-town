/* global Town, MiniGames, ArcadeGames */
(() => {
  "use strict";
  const T = Town;
  const CHALLENGES = { ...MiniGames.META, ...ArcadeGames.META };
  const KEY = "little-money-town-v1";
  const $ = (selector) => document.querySelector(selector);
  const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const signed = (n) => `${n > 0 ? "+" : ""}${n}`;
  const modal = $("#modal");
  const GUIDE = {
    1: { title: "先玩一关！", text: "完成今天的小游戏，赚一笔自己的零用钱。失败可以重试，不扣钱。", button: "开始今天的挑战", target: "#daily-start", screen: "daily", skip: "先不挑战，去逛逛" },
    2: { title: "这笔钱，怎么用？", text: "买一件想要的，或者先留在钱包里。你决定。", button: "去小卖部看看", target: "#daily-start", screen: "shop", skip: "今天先不买" },
    3: { title: "给下次留一点", text: "银行里的钱可以随时取回，存一段时间还能收到利息。", button: "去看看小银行", target: "#more-places", screen: "savings", skip: "先放在钱包里" },
    4: { title: "明天还有新挑战", text: "结束今天，精力就会恢复。", button: "准备去明天", target: "#more-places", skip: "我想继续玩，完成引导" }
  };
  let state = T.create();
  let cart = [];
  let shopCategory = "文具";
  let openingStallPrice = T.STALL.price;
  let stallTab = "menu";
  let confirmation = null;
  let confirmationReturn = null;
  let task = null;
  let miniController = null;
  let play = null;
  let drawing = null;
  let joyTimer;
  let sound = false;
  let audio = null;
  let toastTimer;
  let storageWarning = "";
  const coach = $("#guide-coach");
  let guideExpanded = false;
  let guideManual = false;
  let guideTarget = null;
  let guideKey = "";
  let guideScreen = "town";
  let guideFrame = 0;
  let paintColor = "#ef9e88";
  let calendarOffset = 0;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!T.valid(parsed)) throw new Error("invalid save");
      state = T.restore(parsed);
    }
  } catch {
    storageWarning = "无法读取原来的进度，当前从新小镇开始；浏览器可能限制了存储。";
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageWarning = "";
      $("#save-status").textContent = "✓ 已保存";
    } catch {
      storageWarning = "浏览器未能保存进度，请不要关闭页面。";
      $("#save-status").textContent = storageWarning;
      toast(storageWarning);
    }
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
  }
  function clearJoyFeedback() {
    clearTimeout(joyTimer);
    $("#joy-feedback").hidden = true;
    $("#joy-feedback").replaceChildren();
  }
  function joyFeedback(result, eating = false) {
    clearJoyFeedback();
    const feedback = $("#joy-feedback");
    feedback.dataset.kind = eating ? "snack" : "play";
    feedback.innerHTML = `<span class="joy-animation" aria-hidden="true"><span class="joy-treat">${escape(result.icon)}</span><span class="joy-face">${eating ? "😋" : "😊"}</span><span class="joy-spark">✨</span></span><span><strong>${result.joy ? `开心 +${result.joy}` : eating ? "慢慢享用！" : "玩得开心！"}</strong><small>${result.joy ? `今日开心 ${state.joy.points}` : "今天这类体验不再加分"}</small></span>`;
    feedback.hidden = false;
    if (result.joy) chime();
    joyTimer = setTimeout(clearJoyFeedback, 3200);
  }
  function chime() {
    if (!sound) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(990, audio.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + 0.26);
    } catch { sound = false; updateSound(); }
  }
  function celebrate() {
    chime();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    $("#confetti").innerHTML = Array.from({ length: 16 }, (_, i) =>
      `<span class="confetti-piece" style="left:${i * 6 + 2}%;animation-delay:${(i % 4) * 0.09}s">${["🌼", "✦", "🌿", "💛"][i % 4]}</span>`).join("");
    setTimeout(() => { $("#confetti").innerHTML = ""; }, 2400);
  }
  function commit(action) {
    try {
      const output = T.act(state, action);
      state = output.state;
      persist();
      render();
      return output;
    } catch (error) {
      toast(error.message);
      return null;
    }
  }
  function upcoming() {
    return T.nextEvent(state);
  }
  function render() {
    $("#cash").textContent = state.cash;
    $("#scene-cash").textContent = state.cash;
    $("#joy-count").textContent = state.joy.points;
    $("#scene-joy").textContent = state.joy.points;
    $("#joy-fill").style.width = `${Math.min(100, state.joy.points / T.JOY_MAX * 100)}%`;
    $("#joy-open").setAttribute("aria-label", `今日开心 ${state.joy.points}，查看回忆和免费玩法`);
    $("#energy").textContent = `${state.energy}/3`;
    $("#energy").setAttribute("aria-label", `精力 ${state.energy}，最多 3`);
    $("#energy-card").dataset.empty = String(state.energy === 0);
    document.querySelectorAll(".energy-track i").forEach((segment, index) => segment.classList.toggle("filled", index < state.energy));
    $("#energy-hint").textContent = state.energy ? "明天补满" : "用完啦 · 明天恢复";
    const school = T.schoolDay(state);
    const date = T.dateInfo(state);
    $("#date-label").textContent = `${date.month} 月 ${date.date} 日`;
    $(".date-pill").setAttribute("aria-label", `游戏第 ${date.year} 年 ${date.month} 月 ${date.date} 日，查看日历`);
    $("#day-heading").textContent = ["周六", "周日"].includes(school.name) ? "周末啦！" : "放学啦！";
    $("#weather-icon").textContent = state.weather === "sun" ? "☀️" : "🌧️";
    const bill = T.expense(state);
    $("#expense-reminder").hidden = bill.days !== 1;
    $("#expense-reminder").textContent = `${bill.icon} 明天：${bill.title}，记得留 ${bill.choices[0].price}～${bill.choices[1].price} 币`;
    renderMission();
    renderGuide();
  }
  function renderMission() {
    const plan = T.dayPlan(state), meta = CHALLENGES[plan.task];
    const phase = !state.energy && plan.phase === "play" ? "rest" : plan.phase;
    $(".daily-mission").dataset.phase = phase;
    $("#mission-tag").textContent = phase === "play" ? `第 ${state.skills[plan.task] + 1} 关` : phase === "choice" ? "挑战成功" : "今天也很精彩";
    $("#mission-title").textContent = phase === "play" ? meta.title : phase === "choice" ? "零用钱到手啦！" : "明天，接着冒险";
    $("#mission-copy").textContent = phase === "play" ? meta.intro : phase === "choice" ? "买点喜欢的？还是留给下次？" : "休息一下，新的挑战在等你。";
    $("#mission-reward").textContent = phase === "play" ? `🪙 完成 +${meta.reward} 币` : phase === "choice" ? `这次赚了 ${plan.pay} 币` : "⚡ 明天恢复 3 点精力";
    $("#daily-start").textContent = phase === "play" ? "开始挑战 ▶" : phase === "choice" ? "去小卖部看看 →" : "结束今天，去明天 →";
    $("#daily-save").hidden = phase !== "choice";
    $("#choose-challenge").hidden = phase !== "play";
    const bookArt = '<div class="hero-bookshelf"><div><i style="--book:#ff7f9e;--tilt:-12deg">📖<b>A</b></i><i style="--book:#8d70ed;--tilt:9deg">👑<b>B</b></i><i style="--book:#ffc75a;--tilt:-4deg">🌊<b>H</b></i></div><div><i style="--book:#72baf0;--tilt:8deg">🎭<b>M</b></i><i style="--book:#ffab67;--tilt:-9deg">🏠<b>S</b></i><i style="--book:#e88ddc;--tilt:13deg">🌹<b>X</b></i></div></div>';
    $("#mission-art").innerHTML = `<span class="hero-spark spark-one">✦</span><span class="hero-spark spark-two">✦</span><span class="hero-orbit"></span>${phase !== "play" ? '<div class="hero-prize">🏅<span>🪙 ✨ 🪙</span></div>' : plan.task === "parcel" ? bookArt : plan.task === "garden" ? '<div class="hero-garden"><span>🚿</span><b>🌷 🌻 🌷</b><i>💧 💧 💧</i></div>' : plan.task === "cashier" ? '<div class="hero-prize">🧮<span>🪙 ↔ 🪙</span></div>' : plan.task === "packing" ? '<div class="hero-prize">🎒<span>📚 🧴 🍱</span></div>' : '<div class="hero-flags"><i>♥</i><i>◆</i><i>★</i><i>●</i><span>🎨</span></div>'}<span class="hero-sticker">${phase === "play" ? "LET'S PLAY!" : "NICE JOB!"}</span>`;
    if (phase === "play" && ArcadeGames.META[plan.task]) {
      $("#mission-art").innerHTML = `<span class="hero-orbit"></span><div class="hero-prize">${meta.icon}<span>${{ catcher: "🛒 📦 🧺", balloons: "🏫 🎈 ✨", digging: "🌿 🔎 🌱" }[plan.task]}</span></div>`;
    }
    if (phase === "bill") {
      const bill = T.expense(state);
      $("#mission-tag").textContent = "今日生活任务 · 你来选方案";
      $("#mission-title").textContent = bill.title;
      $("#mission-copy").textContent = bill.text;
      $("#mission-reward").textContent = `🪙 需要 ${bill.choices[0].price}～${bill.choices[1].price} 币`;
      $("#daily-start").textContent = "看看两种方案 →";
      $("#mission-art").innerHTML = `<span class="hero-orbit"></span><div class="hero-prize">${bill.icon}<span>🪙 → ${bill.choices[0].icon}</span></div>`;
    }
    $("#mission-art").insertAdjacentHTML("beforeend", `<svg class="town-companion" viewBox="0 0 130 170" aria-hidden="true">
      <ellipse cx="65" cy="158" rx="51" ry="9" fill="#657e4930"/>
      <path d="M31 75C7 35 24 0 38 12L52 64M77 64C76 27 95 3 105 20C119 45 95 77 95 77" fill="#fff5dc" stroke="#9d8569" stroke-width="3" stroke-linejoin="round"/>
      <path d="M34 53Q22 23 32 23L43 58M88 55Q92 27 100 28Q101 42 94 57" fill="#e8b6a4"/>
      <ellipse cx="65" cy="124" rx="37" ry="35" fill="#f8ebd0" stroke="#9d8569" stroke-width="3"/>
      <ellipse cx="43" cy="153" rx="17" ry="9" fill="#fff5dc" stroke="#9d8569" stroke-width="3"/>
      <ellipse cx="88" cy="153" rx="17" ry="9" fill="#fff5dc" stroke="#9d8569" stroke-width="3"/>
      <path d="M36 113Q65 122 94 113L95 142Q65 151 35 142Z" fill="#a8c8d6"/>
      <path d="M37 118L44 99M88 119L85 99" stroke="#789bae" stroke-width="8"/>
      <path d="M24 77Q27 48 63 53Q105 50 110 79Q119 111 67 114Q14 113 24 77Z" fill="#fff5dc" stroke="#9d8569" stroke-width="3"/>
      <ellipse cx="39" cy="92" rx="10" ry="6" fill="#eab7a4"/><ellipse cx="94" cy="92" rx="10" ry="6" fill="#eab7a4"/>
      <circle cx="47" cy="81" r="4" fill="#61503f"/><circle cx="85" cy="81" r="4" fill="#61503f"/>
      <path d="M61 91Q66 85 71 91L66 96Z" fill="#b58070"/><path d="M66 96Q62 102 58 98M66 96Q70 102 74 98" fill="none" stroke="#856851" stroke-width="2" stroke-linecap="round"/>
      <path d="M48 118Q59 115 67 120Q77 115 88 118V143Q76 140 67 145Q57 140 48 143Z" fill="#fff9e3" stroke="#bc9868" stroke-width="2.5"/>
      <path d="M67 121V141M53 125L61 124M53 131L61 130M74 126L82 125M74 132L82 131" fill="none" stroke="#b7b591" stroke-width="2"/>
      <ellipse cx="41" cy="130" rx="11" ry="8" transform="rotate(-25 41 130)" fill="#fff5dc" stroke="#9d8569" stroke-width="2"/>
      <ellipse cx="94" cy="129" rx="11" ry="8" transform="rotate(25 94 129)" fill="#fff5dc" stroke="#9d8569" stroke-width="2"/>
      <path d="M5 157Q1 144 11 136Q18 149 5 157M115 158Q116 141 127 139Q130 151 115 158" fill="#98b27b"/>
      <circle cx="17" cy="153" r="6" fill="#ecc38d"/><circle cx="17" cy="153" r="2" fill="#fff7d9"/>
    </svg>`);
  }
  function startDaily() {
    const plan = T.dayPlan(state);
    if (plan.phase === "bill") openExpense();
    else if (plan.phase === "choice") openShop();
    else if (plan.phase === "done" || !state.energy) nextDay();
    else startTask(plan.task);
  }
  function renderGuide() {
    document.querySelectorAll(".guide-target").forEach((el) => el.classList.remove("guide-target"));
    const g = state.guide;
    const number = g.step || 1;
    const step = GUIDE[number];
    if ((!step || g.paused) && !guideManual || modal.open && guideScreen === "confirm") {
      coach.hidden = true;
      guideTarget = null;
      return;
    }
    let target = step?.target || ".guide-nav";
    let title = step?.title || "这条路线已经走完啦";
    let text = g.step === 0 ? "先玩一关试试！完成挑战，再决定报酬怎么用。" : step?.text || "接下来自由探索。重走引导不会清除进度。";
    let action = "guide-go";
    let button = step?.button || "再走一遍";
    if (g.paused || !step) {
      target = modal.open ? "#modal-body h2" : ".guide-nav";
      title = g.paused && step ? `上次走到：${step.title}` : title;
      text = g.paused ? "提示已经暂停。继续时会从上次的位置接上，不用重来。" : text;
      action = "guide-start"; button = g.paused && step ? "继续上次引导" : "再走一遍";
    } else if (modal.open) {
      target = "#modal-body h2";
      title = `下一站：${step.title}`;
      if (guideScreen === "shop" && number === 2) {
        target = cart.length ? "#checkout" : '[data-action="quantity"][data-change="1"]';
        title = cart.length ? "先看实付，再决定" : "先挑一件，看看价格";
        text = cart.length ? "单价乘数量就是小计。看看优惠和实付，再决定买不买。" : "先看每件多少钱，再用＋和−选择数量。";
        button = cart.length ? "我来看看购物篮" : "我来选一件"; action = "guide-focus";
      } else if (guideScreen === "work" && number === 1) {
        target = '[data-action="task"]:not(:disabled)';
        title = "选一个想做的小任务";
        text = state.energy ? "试试分类、控水和记忆挑战，完成后才有报酬。" : "今天的精力用完了，休息后再来。";
        button = "我来选任务"; action = "guide-focus";
      } else if (guideScreen === "savings" && number === 3) {
        target = "#amount";
        title = "你想给下次留多少？";
        text = "先填金额，再点“存入银行”。钱没有花掉，银行会按存放时间付利息。";
        button = "我来填金额"; action = "guide-focus";
      } else if (!["home", "work-result"].includes(guideScreen) && !(guideScreen === "savings" && number === 4)) {
        coach.hidden = true;
        guideTarget = null;
        return;
      }
    }
    const element = $(target) || (modal.open ? $("#modal-body h2") : $(".guide-nav"));
    if (!element) { coach.hidden = true; return; }
    const key = `${g.step}:${g.paused}:${guideScreen}:${target}`;
    if (key !== guideKey) guideExpanded = false;
    guideKey = key;
    guideTarget = element.classList.contains("place") ? element.querySelector(".place-label") : element;
    if (!g.paused && step) element.classList.add("guide-target");
    const host = modal.open ? modal : document.body;
    if (coach.parentElement !== host) host.append(coach);
    coach.hidden = false;
    coach.dataset.step = String(number);
    coach.dataset.target = target;
    $("#guide-hand-label").textContent = g.step === 0 ? "从这里开始" : g.paused ? "继续引导" : !step ? "已完成 ✓" : `${number}/4 · 点我`;
    $("#guide-detail").innerHTML = `<div class="coach-heading"><span>${step ? `第 ${number} / 4 步` : "新手路线已完成"}</span><button class="coach-fold" data-action="guide-collapse" aria-label="收起引导说明">收起 ×</button></div><h3>${title}</h3><p>${text}</p>
      <button class="button primary wide" data-action="${action}">${button}</button>
      ${step && !g.paused ? `<button class="text-button coach-skip" data-action="guide-skip">${step.skip} →</button>` : ""}
      <div class="coach-tools"><button class="text-button" data-action="guide-pause">暂停提示</button><button class="text-button" data-open="help">玩法说明</button></div>`;
    setGuideExpanded(guideExpanded);
  }
  function setGuideExpanded(expanded, focus = false) {
    guideExpanded = expanded;
    $("#guide-detail").hidden = !expanded;
    $("#guide-hand").setAttribute("aria-expanded", String(expanded));
    $("#guide-hand").setAttribute("aria-label", expanded ? "收起小向导提示" : "展开小向导提示");
    positionGuide();
    if (focus) (expanded ? $(".coach-fold") : $("#guide-hand"))?.focus({ preventScroll: true });
  }
  function positionGuide() {
    if (coach.hidden || !guideTarget?.isConnected) return;
    const bounds = modal.open ? modal.getBoundingClientRect() : { left: 0, right: innerWidth, top: 0, bottom: innerHeight };
    const left = Math.max(12, bounds.left + 12), right = Math.min(innerWidth - 12, bounds.right - 12);
    const headerBottom = modal.open ? $(".modal-top").getBoundingClientRect().bottom + 8 : 12;
    const top = Math.max(12, bounds.top + 12, headerBottom), bottom = Math.min(innerHeight - 12, bounds.bottom - 12);
    const rect = guideTarget.getBoundingClientRect();
    const docked = rect.bottom < top || rect.top > bottom || rect.right < left || rect.left > right;
    coach.classList.toggle("docked", docked);
    const hand = $("#guide-hand");
    const width = hand.offsetWidth, height = hand.offsetHeight;
    const x = docked ? right - width : Math.min(right - width, Math.max(left, rect.right - width / 2));
    let y = docked ? bottom - height : rect.top - height - 8;
    if (y < top) y = rect.bottom + 8;
    y = Math.max(top, Math.min(bottom - height, y));
    coach.style.left = `${x}px`; coach.style.top = `${y}px`;
    if (!guideExpanded) return;
    const detail = $("#guide-detail");
    detail.style.width = `${Math.min(290, right - left)}px`;
    detail.style.maxHeight = `${bottom - top}px`;
    const panelWidth = detail.offsetWidth, panelHeight = detail.offsetHeight;
    const panelLeft = Math.min(right - panelWidth, Math.max(left, x + width / 2 - panelWidth / 2));
    let panelTop = y + height + 8;
    if (panelTop + panelHeight > bottom) panelTop = y - panelHeight - 8;
    panelTop = Math.max(top, Math.min(bottom - panelHeight, panelTop));
    detail.style.left = `${panelLeft - x}px`; detail.style.top = `${panelTop - y}px`;
  }
  function scheduleGuidePosition() {
    cancelAnimationFrame(guideFrame);
    guideFrame = requestAnimationFrame(positionGuide);
  }
  function revealGuideTarget() {
    guideTarget?.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    positionGuide();
  }
  function openGuide() {
    guideManual = true;
    renderGuide();
    revealGuideTarget();
    setGuideExpanded(true, true);
  }
  function guideGo() {
    if (state.guide.step === 0 && !state.guide.paused && !commit({ type: "guide-start" })) return;
    const step = GUIDE[state.guide.step];
    if (state.guide.paused || !step) { openGuide(); return; }
    if (step.screen) screens[step.screen]();
    else nextDay();
  }
  function show(html, screen = "other") {
    clearJoyFeedback(); drawing = null;
    miniController?.destroy(); miniController = null;
    confirmation = null; confirmationReturn = null; task = null; play = null;
    guideScreen = screen; guideManual = false; guideExpanded = false;
    $("#modal-body").innerHTML = html;
    $("#modal-body").querySelectorAll("details").forEach((detail) => {
      if (!detail.parentElement.closest("details")) detail.name = "scene-detail";
    });
    modal.dataset.screen = screen;
    modal.setAttribute("aria-label", $("#modal-body h2")?.textContent || "小游戏");
    $("#scene-back").hidden = screen === "places";
    $("#scene-back").textContent = ["sketch", "pencilcase"].includes(screen) ? "← 回到书包" : "← 返回";
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    renderGuide();
  }
  function close() {
    clearJoyFeedback(); drawing = null;
    miniController?.destroy(); miniController = null;
    modal.close(); confirmation = null; confirmationReturn = null; task = null; play = null;
    guideScreen = "town"; guideManual = false; guideExpanded = false;
    renderGuide();
  }
  function confirm(title, copy, button, onYes) {
    const back = screens[guideScreen] || close;
    show(`<div class="big-emoji">🤔</div><h2>${title}</h2><p>${copy}</p>
      <div class="actions"><button class="button secondary" data-action="cancel">再想想</button><button class="button primary" data-action="confirm">${button}</button></div>`, "confirm");
    confirmation = onYes;
    confirmationReturn = back;
  }
  function openPlaces() {
    show(`<h2>🧭 去哪里？</h2><nav class="destination-grid" aria-label="选择场景">${[
      ["shop", "🏪", "小卖部"], ["savings", "🏦", "银行"], ["work", "🎮", "挑战"],
      ["invest", "🌱", "股份"], ["stall", "🍋", "小摊"]
    ].map(([id, icon, name]) => `<button class="destination" data-destination="${id}" data-open="${id}"><span>${icon}</span><strong>${name}</strong></button>`).join("")}</nav><button class="text-button" data-open="help">？玩法说明</button>`, "places");
  }
  function openShop() {
    const wishView = shopCategory === "心愿单";
    const currentSeason = T.monthlySpecials(state);
    const goods = wishView ? state.wishlist.map((id) => T.GOODS.find((g) => g.id === id)) : T.GOODS.filter((g) => g.category === shopCategory && T.available(state, g.id));
    show(`<header class="shop-header"><h2>${wishView ? "⭐ 我的心愿单" : "🏪 校门口小卖部"}</h2>
      <div class="scene-tabs" aria-label="商品分类">${[["文具", "✏️ 文具"], ["课间点心", "🍪 点心"], ["玩具", "⚽ 玩具"]].map(([category, label]) => `<button data-action="shop-category" data-category="${category}" aria-pressed="${shopCategory === category}">${label}</button>`).join("")}</div>
      <div class="shop-tools"><div class="shop-offer">🎟️ 满 30 减 5</div><button class="wishlist-link" data-action="shop-category" data-category="心愿单" aria-pressed="${wishView}">⭐ 心愿单 · <span id="wish-count">${state.wishlist.length}</span></button></div>
      <div class="scene-context"><span id="season-banner">${currentSeason.icon} ${currentSeason.name}</span><details class="context-help" id="season-help"><summary>？上新规则</summary><div class="context-help-body"><p>按游戏里的月份上新：每月 1 日换一组限定款，包含一件文具和一种点心。每个游戏月有 28 天，常备商品全年有，限定款明年同月还会再来，不必急着买。</p><p>下架后，已买的东西仍能用，心愿也会保留。</p></div></details></div></header>
      <div class="shop-scroll" id="shop-scroll" role="region" aria-label="商品列表" tabindex="0">
      ${wishView && !goods.length ? '<p class="empty-wishlist">还没有心愿。逛逛商品，点「☆ 加心愿」。</p>' : ""}
      <div class="grid-two shop-products">${goods.map((g, i) => `${!wishView && (i === 0 || !!g.month !== !!goods[i - 1].month) ? `<h3 class="stock-group">${g.month ? `${currentSeason.icon} ${currentSeason.name}` : "🏪 长期常备"}</h3>` : ""}<article class="product" data-product="${g.id}" aria-label="${g.name}">
        <span aria-hidden="true">${g.icon}</span><div class="product-info"><strong>${g.name}</strong><b>${g.price} 币/${g.unit}</b>${g.month ? `<small class="product-season">${g.month} 月限定<br>${T.available(state, g.id) ? currentSeason.daysLeft === 1 ? "今天结束后下架" : `${currentSeason.daysLeft} 天后下架` : "暂未上架"}</small>` : ""}</div>
        <div class="quantity-control" role="group" aria-label="${g.name}数量"><button class="quantity-button" data-action="quantity" data-id="${g.id}" data-change="-1" aria-label="减少${g.name}">−</button><output id="quantity-${g.id}" aria-label="${g.name}已选数量" aria-live="polite">0</output><button class="quantity-button" data-action="quantity" data-id="${g.id}" data-change="1" aria-label="增加${g.name}">＋</button></div><span class="line-price" id="line-price-${g.id}"></span>
        <button class="wish-button" data-action="wish-toggle" data-id="${g.id}"></button></article>`).join("")}</div></div>
      <div class="basket"><div id="basket-detail"></div><div class="basket-line"><div>实付 <strong id="basket-total">0</strong> 币</div><button class="button primary" id="checkout" data-action="checkout">确认购物</button></div></div>`, "shop");
    updateBasket();
    updateWishButtons();
  }
  function updateWishButtons() {
    $("#wish-count").textContent = state.wishlist.length;
    document.querySelectorAll('[data-action="wish-toggle"]').forEach((button) => {
      const saved = state.wishlist.includes(button.dataset.id);
      const good = T.GOODS.find((g) => g.id === button.dataset.id);
      button.textContent = saved ? "★ 已加入" : "☆ 加心愿";
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", `${saved ? "移出心愿单：" : "加入心愿单："}${good.name}`);
    });
  }
  function updateBasket() {
    const q = cart.length ? T.quote(cart) : { subtotal: 0, discount: 0, due: 0 };
    $("#basket-total").textContent = q.due;
    $("#basket-detail").innerHTML = `<p>${cart.length ? `${cart.length} 件 · ${q.subtotal} − 优惠 ${q.discount}` : "用 ＋ / − 选数量"}${q.due > state.cash ? " · 钱不够" : ""}</p>`;
    $("#checkout").disabled = !cart.length || q.due > state.cash;
    document.querySelectorAll("[data-product]").forEach((el) => {
      const id = el.dataset.product, quantity = cart.filter((item) => item === id).length;
      const good = T.GOODS.find((g) => g.id === id);
      el.classList.toggle("selected", quantity > 0);
      el.querySelector("output").textContent = quantity;
      el.querySelector('[data-change="-1"]').disabled = quantity === 0;
      el.querySelector('[data-change="1"]').disabled = !T.available(state, id);
      el.querySelector(".line-price").textContent = quantity ? `${good.price} × ${quantity} = ${good.price * quantity} 币` : "";
    });
    renderGuide();
  }
  function checkout() {
    const ids = [...cart];
    if (!ids.length) return;
    const q = T.quote(ids);
    confirm("把这些宝贝带回家？",
      `${q.items.map((g) => `<span class="checkout-line">${g.icon} ${g.name} × ${g.quantity}${g.unit}<br>${g.price} × ${g.quantity} = <b>${g.lineTotal} 币</b></span>`).join("")}<br>${q.subtotal} − 优惠 ${q.discount} = <b>${q.due} 币</b><br>🪙 钱包 ${state.cash} → <b>${state.cash - q.due}</b>`,
      `花 ${q.due} 币买下`, () => {
        if (!commit({ type: "buy", ids })) return;
        cart = []; celebrate(); openHome(); toast("已经带回家啦！文具能用，点心可以留到课间吃。");
      });
  }
  function openSavings() {
    const bank = T.bankStatus(state), bill = T.expense(state);
    show(`<h2>🏦 我的小银行</h2>
      <div class="numbers bank-balances"><div>钱包<strong>${state.cash}</strong></div><div>银行<strong id="bank-balance">${state.savings}</strong></div></div>
      <div class="interest-card"><span>🪙 → 🏦 → 🪙</span><strong>再过 ${bank.days} 天，预计 +<b id="bank-forecast">${bank.forecast}</b> 币</strong><small>游戏演示利率 · 按当前余额估计</small></div>
      ${bill.days <= 1 ? `<p>${bill.icon} ${bill.due ? "今天" : "明天"}要用 ${bill.choices[0].price}～${bill.choices[1].price} 币${bill.due ? ' <button class="text-button" data-open="expense">去付账 →</button>' : ""}</p>` : ""}
      <label for="amount">多少币？</label><input class="amount" id="amount" type="number" inputmode="numeric" min="1" step="1" value="10">
      <div class="actions"><button class="button primary" data-action="save">存入银行</button><button class="button secondary" data-action="withdraw">取回钱包</button></div>
      <details class="quiet-note"><summary>？利息怎么算</summary><p>累计到账 <b id="bank-earned">${bank.earned}</b> 币；还有约 ${bank.accrued.toFixed(2)} 币待结算。</p><p>20 币存满 7 个游戏日约得 1 币。每天结束按余额累计，每 7 天发整币。不足 1 币继续保留，取钱不丢失已累计的利息。</p><p>这是游戏演示，<b>不是现实银行利率</b>。</p></details>
      <details class="quiet-note"><summary>⭐ 我的心愿单 · ${state.wishlist.length}</summary>${state.wishlist.length ? state.wishlist.map((id) => { const g = T.GOODS.find((item) => item.id === id); return `<p>${g.icon} ${g.name} · ${g.price} 币/${g.unit}</p>`; }).join("") : "<p>还没有心愿，喜欢什么由你选。</p>"}<button class="text-button" data-action="shop-category" data-category="心愿单">打开心愿单 →</button></details>`, "savings");
  }
  function moveMoney(type) {
    const amount = Number($("#amount").value);
    if (!Number.isSafeInteger(amount) || amount <= 0) { toast("选一个大于零的整数吧。"); return; }
    if ((type === "save" ? state.cash : state.savings) < amount) { toast(type === "save" ? "钱包里的钱不够，可以少存一点。" : "银行里的钱不够，可以少取一点。"); return; }
    confirm(type === "save" ? "存一些钱进银行？" : "把钱取回钱包？",
      `<b>${amount} 币</b> · ${type === "save" ? "🪙 钱包 → 🏦 银行" : "🏦 银行 → 🪙 钱包"}<br>钱包 ${state.cash} → ${state.cash + (type === "save" ? -amount : amount)}<br>银行 ${state.savings} → ${state.savings + (type === "save" ? amount : -amount)}<br>总资产不变`,
      "确认移动", () => { if (commit({ type, amount })) { openSavings(); chime(); toast("放在哪里，由你安排。"); } });
  }
  function openWork() {
    show(`<h2>🎮 换个挑战玩</h2><p class="muted">完成一关用 1 点精力 · 今天还剩 ${state.energy} 点</p>
      <div class="challenge-grid">${Object.entries(CHALLENGES).map(([id, t]) => `<button class="challenge-card" data-action="task" data-id="${id}" ${!state.energy ? "disabled" : ""}><span>${t.icon}</span><strong>${t.title}</strong><small>${{ parcel: "真实书名 × 拼音排序", garden: "控水 × 分配水量", craft: "记忆 × 变换规则", cashier: "算找零 × 搭配零钱", packing: "空间规划 × 旋转摆放", catcher: "移动篮子 × 接好货物", balloons: "打中气球 × 限时得分", digging: "寻找线索 × 挖回种子" }[id]} · 第 ${state.skills[id] + 1} 关</small><b>完成 +${t.reward} 币 ▶</b></button>`).join("")}</div>
      <details class="quiet-note"><summary>？难度和奖励</summary><p>连续两次独立完成会进阶；卡住时可降级，奖励不变。失败或退出不扣钱、不扣精力。</p><p>奖励是游戏约定，不代表所有家务都需付钱。</p></details>`, "work");
  }
  function startTask(id, chosenLevel) {
    if (!T.TASKS[id]) return;
    if (!state.energy) { toast("今天的精力用完啦，去明天再玩。"); return; }
    if (state.guide.step === 0 && !state.guide.paused) commit({ type: "guide-start" });
    const level = Number.isInteger(chosenLevel) ? Math.max(1, Math.min(5, chosenLevel)) : T.challengeLevel(state, id);
    const stage = state.skills[id] + 1;
    show(`<div class="mini-game-root" id="mini-game-root"></div><details class="quiet-note"><summary>卡住了？</summary><p>当前难度 ${level}/5。降低难度不影响关卡进度，报酬也不变。</p>${level > 1 ? `<button class="button secondary" data-action="task-easy" data-id="${id}" data-level="${level - 1}">轻松一档</button>` : ""}<button class="text-button" data-open="work">换个游戏</button></details>`, "task");
    const run = { id, stage, finished: false };
    task = run;
    const games = ArcadeGames.META[id] ? ArcadeGames : MiniGames;
    miniController = games.mount($("#mini-game-root"), { id, level, stage, onWin: (result) => finishTask(run, result) });
  }
  function finishTask(run, result) {
    if (task !== run || run.finished) return;
    run.finished = true;
    const output = commit({ type: "work", id: run.id, performance: result });
    if (!output) return;
    const t = CHALLENGES[run.id];
    show(`<div class="win-screen"><div class="win-stars" aria-label="${result.stars}颗星">${"⭐".repeat(result.stars)}${"☆".repeat(3 - result.stars)}</div><h2>挑战成功！</h2><p>${t.title} · 第 ${run.stage} 关${T.challengeLevel(state, run.id) !== result.level ? T.challengeLevel(state, run.id) > result.level ? " · 下次难度提升" : " · 下次轻松一点" : ""}</p><div class="earned-coins">🪙 +${t.reward}<small>劳动报酬，已经放进钱包</small></div><h3>这笔钱，你想怎么用？</h3><div class="actions">${T.expense(state).due ? '<button class="button primary" data-open="expense">先安排生活支出 →</button>' : '<button class="button primary" data-open="shop">🛍️ 去小卖部</button><button class="button secondary" data-open="savings">🏦 存一点</button>'}</div><button class="text-button" data-action="keep-money">回到今天</button></div>`, "work-result");
    celebrate();
    if (run.id === "balloons") $(".earned-coins").insertAdjacentHTML("beforebegin", `<p class="balloon-result">🎈 打中 ${result.score} 分 · 目标 ${result.goal} 分</p>`);
    const thanks = { parcel: "书架整齐了，找书方便多啦！", garden: "花儿喝饱了，谢谢你细心照顾！", craft: "老师：彩旗挂好了，教室更漂亮啦，谢谢你！", cashier: "零钱找对了，谢谢你帮小店认真核对！", packing: "出游用品装好了，大家可以出发啦！", catcher: "货物接稳了，小店可以上架啦！", balloons: "气球赛达标啦，谢谢你参加校园游园会！", digging: "种子送回来了，花园又能种新花啦！" };
    $(".earned-coins").insertAdjacentHTML("afterend", `<div class="help-thanks">🤝 ${thanks[run.id]}${output.result.joy ? `<strong>开心 +${output.result.joy}</strong>` : ""}</div>`);
  }
  const stallLabels = { new: "还没开店", legacy: "今天已摆摊 · 等你收摊", open: "自动营业中", paused: "已暂停 · 不扣营业费", closed: "已关店", menu: "菜单还没选 · 暂不营业", empty: "菜单上的原料不够 · 等你补货", repair: "工具坏了 · 等你决定是否维修", funds: "营业费不够 · 自动暂停，不欠钱" };
  function stallResult(r) {
    if (!r.ongoing) return moneyResult(r);
    if (r.status !== "operated") return `<div class="notice">${stallLabels[r.status]}，本次没有扣费。</div>`;
    return `<div class="numbers"><div>卖出 ${r.cups} 杯${!r.drinks || r.drinks.length === 1 ? `<br>每杯 ${r.drinks?.[0]?.price ?? r.price ?? T.STALL.price} 币` : ""}<strong>收到 ${r.revenue}</strong></div><div>已用原料＋营业费<strong>${r.cost}</strong></div><div>当天经营净赚<strong class="${r.profit >= 0 ? "positive" : "negative"}">${signed(r.profit)}</strong></div></div>
      <details class="quiet-note"><summary>？这次经营明细</summary>${r.autoStock?.spent ? `<p>🧺 按规则自动进货花了 ${r.autoStock.spent} 币，未用的原料还在库存里。</p>` : ""}${r.drinks?.map((d) => `<p>${T.DRINKS[d.id].icon} ${T.DRINKS[d.id].name} ${d.cups} 杯 × ${d.price} 币 = ${d.revenue} 币，原料用了 ${d.cost} 币</p>`).join("") || ""}<p>${r.weather === "rain" ? "🌧️ 雨天，路过的客人可能较少" : "☀️ 晴天，路过的客人通常多一些"}。${r.revenue} 收入 − ${r.cost - T.STALL.dailyCost} 原料 − ${T.STALL.dailyCost} 营业费 = ${signed(r.profit)} 币。</p></details>
      ${r.repair ? '<div class="notice">🔧 收摊时龙头坏了，先停止营业。是否花 8 币修理由你决定，不会自动扣维修钱。</div>' : ""}`;
  }
  function openStall() {
    const shop = state.stall, status = T.stallStatus(state), totals = T.stallTotals(state);
    const price = !shop || status === "closed" ? openingStallPrice : shop.price;
    const auto = shop?.autoStock;
    const autoSettings = auto ? `<details class="quiet-note" id="auto-stock-settings"><summary>🧺 自动进货：${auto.enabled ? `每天最多 ${auto.budget} 币` : "已关闭"}</summary><label class="auto-stock-toggle"><input id="auto-stock-enabled" type="checkbox" ${auto.enabled ? "checked" : ""}> 开启成本优先的自动进货</label><div class="auto-stock-fields"><label>每款备到几杯<input class="amount" id="auto-stock-target" type="number" min="1" max="3" step="1" value="${auto.target}"></label><label>每日预算（币）<input class="amount" id="auto-stock-budget" type="number" min="1" max="50" step="1" value="${auto.budget}"></label><label>钱包保留（币）<input class="amount" id="auto-stock-reserve" type="number" min="0" max="100" step="1" value="${auto.reserve}"></label></div><p>营业前按当前菜单补货，先补原料成本低的饮品，已有库存先用。预算不足就少买，每种原料最多 18 份；除了保留的零钱，还会留 2 币营业费。</p><p>暂停、待维修时不自动买。售价不高于原料成本的饮品也不自动补，但已有原料仍会按你的菜单卖。所有开关和金额都由你决定。</p><button class="button secondary wide" data-action="stall-auto">保存自动进货规则</button></details>` : "";
    const pricing = `<section class="stall-pricing" aria-label="小摊定价"><h3>🍋 每杯卖多少钱？</h3><div class="stall-price-control"><button class="quantity-button" data-action="stall-price" data-change="-1" aria-label="每杯便宜 1 币" ${price <= T.STALL.minPrice ? "disabled" : ""}>−</button><output id="stall-price" aria-live="polite">${price} 币 / 杯</output><button class="quantity-button" data-action="stall-price" data-change="1" aria-label="每杯贵 1 币" ${price >= T.STALL.maxPrice ? "disabled" : ""}>＋</button></div><div class="stall-sale-example"><span>卖出 1 杯</span><strong>收到 ${price} 币</strong></div><div class="stall-price-hint">每杯原料花 ${T.STALL.unitCost} 币${price < T.STALL.unitCost ? " · 这个价格卖一杯亏一杯" : ""}<br>卖得贵，愿意买的客人可能更少</div></section>`;
    const rules = `<details class="quiet-note"><summary>？钱怎么算</summary><p>开店只花 24 币买工具，不含原料。先选菜单，再买原料、设置售价，每种饮品定价 1～8 币。每种原料最多存 18 份，没用的留到以后。自动进货默认关闭，选好菜单后可自己设置预算和保留零钱的规则。</p><p>结束今天时，按今天的天气营业，另付 2 币营业费。有原料但标价太高没人买，也要付营业费；菜单为空、原料不足、待修或暂停时不收费。钱包不足 2 币会自动暂停。</p><p>晴天有 4～6 位客人，雨天有 3～5 位。晴天更偏爱清凉饮品，雨天更偏爱温热饮品。参考价留了原料之外的空间，普通定价更容易卖出去；卖得贵可能无人购买。工具偶尔会坏，维修花 8 币，由你决定。</p><p>每杯成本是配方里各份原料的价格相加。进货时已经付过钱，卖出时只减少库存，不再扣一遍原料钱。收入减去已用原料、营业费和维修费才是经营净赚；还要抵回工具投入才算回本。关店时未用原料按成本退款，工具不退款。</p></details>`;
    const recipeText = (id) => Object.entries(T.DRINKS[id].recipe).map(([key, n]) => `${T.INGREDIENTS[key].name} ${n} 份`).join(" ＋ ");
    const drinkCard = (id, enabled) => {
      const drink = T.DRINKS[id], item = shop.menu[id], cost = T.drinkCost(id);
      const controls = id === "lemonade" ? pricing : `<div class="stall-price-control"><button class="quantity-button" data-action="stall-drink-price" data-id="${id}" data-change="-1" aria-label="${drink.name}便宜 1 币" ${item.price <= 1 ? "disabled" : ""}>−</button><output aria-live="polite">${item.price} 币 / 杯</output><button class="quantity-button" data-action="stall-drink-price" data-id="${id}" data-change="1" aria-label="${drink.name}贵 1 币" ${item.price >= 8 ? "disabled" : ""}>＋</button></div>`;
      return `<section class="drink-card" data-drink="${id}"><h3>${drink.icon} ${drink.name}</h3><p>原料 ${cost} 币 / 杯${enabled ? ` · 还能做 ${T.drinkCapacity(shop, id)} 杯` : ` · 参考售价 ${drink.price} 币`}</p>${enabled ? `${controls}${item.price < cost ? '<p class="negative">这个价，卖一杯亏一杯</p>' : ""}` : ""}<details class="quiet-note"><summary>看配方</summary><p>${recipeText(id)}，合计 ${cost} 币。${drink.weather === "rain" ? "雨天" : "晴天"}更受欢迎。</p></details><button class="button secondary wide" data-action="stall-menu" data-id="${id}" data-enabled="${!enabled}">${enabled ? "从菜单撤下" : "加入我的菜单"}</button></section>`;
    };
    if (status === "legacy") {
      show(`<h2>🍋 柠檬水小摊</h2><div class="notice" id="stall-status">${stallLabels[status]}</div><p>材料已付 12 币 · 结束今天看赚亏</p><details class="quiet-note"><summary>？这次小摊怎么经营</summary><p>这次是一次摆摊，结束今天就收摊，不额外收费。之后可以自行选择开一家持续经营的小摊。</p></details>`, "stall");
      return;
    }
    show(`<h2>🥤 我的校园饮料店</h2><div class="${!shop || status === "closed" ? "stall-state-label" : "notice"}" id="stall-status">${stallLabels[status]}</div>
      ${shop ? `<div class="numbers stall-totals"><div>开店投入<strong id="stall-setup">${shop.setupCost}</strong></div><div>经营净赚<strong id="stall-profit">${signed(totals.profit)}</strong></div><div>${totals.remaining ? "离回本还差" : "回本后净赚"}<strong id="stall-remaining">${totals.remaining || totals.net}</strong></div></div><p>累计营业 ${shop.days} 天 · 累计收入 ${shop.revenue} 币</p>` : ""}
      ${!shop || status === "closed" ? `<section class="stall-opening" aria-label="开店准备"><div class="stall-opening-price"><span>开店先付</span><strong>24 <small>币</small></strong></div><div class="stall-opening-includes">只买工具，菜单和原料自己选</div><dl class="stall-opening-terms"><div><dt>⚡ 开店需要</dt><dd>1 点精力</dd></div><div><dt>🪙 每营业一天</dt><dd>再付 2 币</dd></div></dl></section><button class="button primary wide" data-action="stall" ${!state.energy || state.cash < 24 ? "disabled" : ""}>花 24 币，${shop ? "重新开店" : "开一家饮料店"}</button>` : `
        <div class="scene-tabs" aria-label="饮料店管理"><button data-action="stall-tab" data-tab="menu" aria-pressed="${stallTab === "menu"}">📋 我的菜单</button><button data-action="stall-tab" data-tab="ingredients" aria-pressed="${stallTab === "ingredients"}">🧺 原料进货</button></div>
        ${stallTab === "menu" ? `<div class="stall-stock">🍋 柠檬水原料还够 <b id="stall-stock">${shop.stock}</b> 杯</div><div class="drink-menu">${Object.keys(T.DRINKS).filter((id) => shop.menu[id].enabled).map((id) => drinkCard(id, true)).join("") || "<p>先选一道喜欢的饮品吧。</p>"}</div><details class="quiet-note" id="drink-catalog"><summary>＋ 菜单添新品</summary><div class="drink-menu">${Object.keys(T.DRINKS).filter((id) => !shop.menu[id].enabled).map((id) => drinkCard(id, false)).join("") || "<p>所有饮品都在菜单上啦。</p>"}</div></details>` :
          `<p>按配方买原料，买多少由你决定。</p><div class="ingredient-list">${Object.entries(T.INGREDIENTS).map(([id, g]) => `<section class="ingredient-card" data-ingredient="${id}"><h3>${g.icon} ${g.name}</h3><p>库存 <b>${shop.ingredients[id]}</b> 份 · 每份 ${g.cost} 币</p><div class="actions">${[1, 3, 6].map((n) => `<button class="button secondary" data-action="stall-ingredient" data-id="${id}" data-quantity="${n}" ${state.cash < n * g.cost || shop.ingredients[id] + n > T.STALL.capacity ? "disabled" : ""}>${n} 份 · ${n * g.cost} 币</button>`).join("")}</div></section>`).join("")}</div><details class="quiet-note" id="lemon-restock"><summary>🍋 柠檬水组合补货</summary><div class="actions stall-restock">${[3, 6, 12].map((n) => `<button class="button secondary" data-action="stall-stock" data-quantity="${n}" ${state.cash < n * 2 || shop.ingredients.lemon + n > 18 || shop.ingredients.sugar + n > 18 ? "disabled" : ""}>${n} 杯 · ${n * 2} 币</button>`).join("")}</div></details>`}
        ${autoSettings}${shop.needsRepair ? `<button class="button primary wide" data-action="stall-repair" ${state.cash < T.STALL.repair ? "disabled" : ""}>🔧 修理龙头 · ${T.STALL.repair} 币</button>` : ""}
        <div class="actions"><button class="button secondary" data-action="${shop.status === "paused" ? "stall-resume" : "stall-pause"}" ${shop.status === "paused" && (shop.needsRepair || !T.availableDrinks(shop).length || state.cash < 2) ? "disabled" : ""}>${shop.status === "paused" ? "继续自动营业" : "暂停营业"}</button><button class="button secondary" data-action="stall-close">结束这家店</button></div>`}
      ${shop?.history.length ? `<details class="quiet-note" id="stall-history"><summary>📒 最近 ${shop.history.length} 次营业记录</summary>${shop.history.map((r) => `<div class="report-row"><strong>第 ${r.day} 个游戏日</strong>${stallResult(r)}</div>`).join("")}</details>` : ""}
      ${!shop && state.lastReport?.stall && !state.lastReport.stall.ongoing ? `<details class="quiet-note"><summary>上次一日摊的结果</summary>${stallResult(state.lastReport.stall)}</details>` : ""}
      <button class="button secondary wide" data-open="weather">🌤️ 看天气，想想备货计划</button>${rules}`, "stall");
  }
  function shopNews(id) {
    const info = T.marketInfo(state, id);
    if (!info) return '<p class="market-wait">暂无今日消息</p>';
    if (info.old === 0) return '<p class="market-wait">这家店已停业，不再经营或自动恢复价格。</p>';
    const direction = info.change > 0 ? `涨了 ${info.change}` : info.change < 0 ? `跌了 ${-info.change}` : "没有涨跌";
    return `<section class="market-update" data-market-shop="${id}" data-day="${info.day}">
      <strong>昨天 ${info.old} → 今天 ${info.price} 币</strong>
      <div class="market-factors">${info.factors.map((factor) => `<div>${factor.icon} ${escape(factor.text)}</div>`).join("")}</div>
      <details><summary>消息怎样影响价格？</summary>
        ${info.factors.map((factor) => `<p>${factor.icon} ${factor.effect > 0 ? `推高 ${factor.effect} 币` : factor.effect < 0 ? `压低 ${-factor.effect} 币` : "这条消息不改变价格"}</p>`).join("")}
        <p>其他人的买卖：${signed(info.noise)} 币。这部分也会随机变化。</p>
        <p>合在一起，今天${direction}${info.change ? " 币" : ""}。价格最低是 0，归零后停业。</p>
        <p>有好消息也可能跌，有坏消息也可能涨。</p>
      </details></section>`;
  }
  function openInvest() {
    show(`<h2>🌱 小店股份</h2>
      <p class="risk-line">⚠️ 会涨，也会跌，可能全部亏掉</p>
      <div class="scene-context"><span class="market-timing">${state.weather === "rain" ? "🌧️ 今天下雨" : "☀️ 今天晴天"}</span><details class="context-help" id="market-help"><summary>？天气与消息</summary><p>每到下一游戏日，天气和消息重新随机；刷新和买卖不会重抽。今天的消息已计入价格，不是明天的预告。</p><p>下一游戏日开始记录消息和涨跌。可以先观察，不必急着买。</p></details></div>
      <div class="grid-two market-shops">${Object.entries(T.SHOPS).map(([id, shop]) => {
        const h = T.holdings(state, id);
        return `<div class="investment"><div class="market-card-head"><span>${shop.icon}</span><h3>${shop.name}</h3></div><div class="price">${state.prices[id]} <small>币 / 份${state.prices[id] === 0 ? " · 停业" : ""}</small></div>${shopNews(id)}<div class="market-holdings"><strong>持有 ${h.count} 份</strong><p class="share-availability" data-share-availability="${id}">可卖 ${h.sellable} 份${h.locked ? ` · 今日买入 ${h.locked} 份` : ""}</p>${h.count ? `<p>成本 ${h.cost} → 现值 ${h.value}</p><p class="${h.value >= h.cost ? "positive" : "negative"}">未卖出盈亏 ${signed(h.value - h.cost)}</p>` : ""}</div><div class="actions"><button class="button primary" data-action="invest" data-id="${id}" ${!state.prices[id] || state.cash < state.prices[id] ? "disabled" : ""}>买 1 份</button><button class="button secondary" data-action="sell" data-id="${id}" ${!h.sellable ? "disabled" : ""}>卖 1 份</button></div></div>`;
      }).join("")}</div><details class="quiet-note"><summary>？股份和风险</summary><p>当天买入的股份，下一游戏日才能卖。卖出时先卖最早买的那份。</p><p>买股份是拥有小店的一小份。卖出后，钱才回到钱包。分红不保证，价格每天会变，也可能归零。分开买仍可能一起亏。</p><p>这是虚构投资，不是真实股票。</p><p>📮 ${escape(state.news)}</p></details>`, "invest");
  }
  function trade(type, id) {
    const price = state.prices[id];
    if (!T.SHOPS[id]) return;
    if (type === "invest") {
      confirm(`买入${T.SHOPS[id].name}的 1 份？`,
        `现在花 <b>${price} 币</b>，钱包：${state.cash} → ${state.cash - price} 币。<br>今天买入，<b>下一游戏日才能卖</b>。<br>它可能涨，也可能跌；最差会亏掉这 <b>${price} 币</b>。`,
        `用 ${price} 币买 1 份`, () => { if (commit({ type, id })) { openInvest(); toast("买入完成。接下来观察经营，不用急着再买。"); } });
    } else {
      if (!T.holdings(state, id).sellable) { toast("今天买入的股份，下一游戏日才能卖。"); return; }
      const cost = state.shares[id][0];
      confirm("卖出最早买入的 1 份？",
        `当时花了 <b>${cost} 币</b>，现在卖出收回 <b>${price} 币</b>。<br>这次${price >= cost ? "赚" : "亏"} <b>${Math.abs(price - cost)} 币</b>（不含已经收到的分红）。<br>钱包：${state.cash} → ${state.cash + price} 币。`,
        "确认卖出", () => {
          const output = commit({ type, id });
          if (!output) return;
          const r = output.result;
          show(`<h2>这笔投资的结果</h2>${moneyResult(r)}<button class="button secondary wide" data-open="invest">返回小店</button>`);
        });
    }
  }
  function moneyResult(r) {
    return `<div class="numbers"><div>原先成本<strong>${r.cost}</strong></div><div>收回的钱<strong>${r.revenue}</strong></div><div>${r.profit >= 0 ? "真正赚了" : "这次亏了"}<strong class="${r.profit >= 0 ? "positive" : "negative"}">${Math.abs(r.profit)}</strong></div></div><details class="quiet-note"><summary>？赚亏怎么算</summary><p>${r.revenue} 收入 − ${r.cost} 成本 = ${signed(r.profit)} 币。收回的钱不全是利润。</p><p>一次赚或亏，不代表你做得好或不好。想想当时的线索，再决定接下来怎么安排。</p></details>`;
  }
  function openWeather() {
    const today = T.dateInfo(state), tomorrow = T.dateInfo(state, 1), chance = state.forecast.rainChance;
    const prediction = chance === 80 ? "更可能下雨" : chance === 20 ? "更可能晴天" : "晴雨都可能";
    show(`<h2>🌤️ 小镇天气预报</h2><div class="weather-days">
      <section class="weather-day"><span>今天 · ${today.month} 月 ${today.date} 日</span><b aria-hidden="true">${state.weather === "sun" ? "☀️" : "🌧️"}</b><strong>${state.weather === "sun" ? "晴天" : "下雨"}</strong><small>今天营业看这个天气</small></section>
      <section class="weather-day" id="tomorrow-weather"><span>明天 · ${tomorrow.month} 月 ${tomorrow.date} 日</span><b aria-hidden="true">${chance === 80 ? "🌧️" : chance === 20 ? "☀️" : "🌤️"}</b><strong>${prediction}</strong><small>预报也可能猜错哦</small></section>
      </div><div class="actions"><button class="button primary" data-open="stall">🥤 去饮料店做计划</button><button class="button secondary" data-open="invest">🌱 看看股份</button></div>
      <details class="quiet-note"><summary>？预报怎么用</summary><p>这是游戏小镇的天气，不是真实天气。明天下雨的可能性是 ${chance}%：如果有 10 次这样的预报，大约 ${chance / 10} 次会下雨，不是每次都准。</p><p>雨天路过小摊的客人可能更少。你可以想想要备多少原料、卖多少钱，或者是否暂停营业。预报不保证赚钱，决定由你来做。</p><p>结束今天时，先按今天的天气结算小摊，再迎来明天。预报只在进入新游戏日后更新，反复打开或刷新不会换预报。</p></details>`, "weather");
  }
  function openCalendar() {
    renderCalendar(0);
  }
  function renderCalendar(offset, selectedDistance) {
    calendarOffset = offset;
    const now = T.dateInfo(state), firstOffset = 1 - now.date + offset * 28;
    const first = T.dateInfo(state, firstOffset), event = T.eventOn(state), next = upcoming();
    const used = event && state.events.includes(event.key);
    const distance = selectedDistance ?? (offset === 0 ? 0 : firstOffset);
    const selected = T.dateInfo(state, distance), selectedEvent = T.eventOn(state, distance);
    const gameDay = state.day + distance;
    const selectedBill = gameDay > 0 && gameDay % 4 === 0 ? T.expense({ ...state, day: gameDay, necessities: { paidDay: 0 } }) : null;
    show(`<h2>🗓️ 我的游戏日历</h2>
      <div class="calendar-nav"><button class="button secondary" data-action="calendar-shift" data-offset="-1" ${first.year === 1 && first.month === 1 ? "disabled" : ""} aria-label="上一个月">←</button><strong>游戏第 ${first.year} 年 · ${first.month} 月</strong><button class="button secondary" data-action="calendar-shift" data-offset="1" aria-label="下一个月">→</button></div>
      <div class="calendar">${["一", "二", "三", "四", "五", "六", "日"].map((d) => `<b class="calendar-weekday">${d}</b>`).join("")}${Array.from({ length: (first.weekday + 6) % 7 }, () => '<span aria-hidden="true"></span>').join("")}${Array.from({ length: 28 }, (_, i) => {
        const distance = firstOffset + i, d = T.dateInfo(state, distance), e = T.eventOn(state, distance), gameDay = state.day + distance;
        const need = gameDay >= 1 && gameDay % 4 === 0;
        const payday = gameDay > 1 && (gameDay - 1) % 7 === 0;
        const label = `${d.month} 月 ${d.date} 日${e ? `，${e.name}` : ""}${need ? "，生活支出" : ""}${payday ? "，零用钱和结息" : ""}`;
        return `<button class="calendar-day ${distance === 0 ? "today" : distance < 0 ? "past" : ""}" data-date="${d.key}" data-action="calendar-day" data-distance="${distance}" aria-label="${label}" aria-pressed="${d.key === selected.key}" ${distance === 0 ? 'aria-current="date"' : ""}><b>${d.date}</b><span aria-hidden="true">${e?.icon || (need ? "🧾" : payday ? "🪙" : "·")}</span></button>`;
      }).join("")}</div>
      <div class="notice calendar-selection" id="calendar-selection"><b>${selected.month} 月 ${selected.date} 日${distance === 0 ? " · 今天" : ""}</b><p>${selectedEvent ? `${selectedEvent.icon} ${selectedEvent.name}` : "🎒 普通的一天"}${selectedBill ? `<br>🧾 ${selectedBill.title} · ${selectedBill.choices[0].price}～${selectedBill.choices[1].price} 币` : ""}${gameDay > 1 && (gameDay - 1) % 7 === 0 ? "<br>🪙 零用钱 +20 · 银行结息" : ""}</p>${distance === 0 && T.expense(state).due ? '<button class="button warm" data-open="expense">去付账 →</button>' : ""}</div>
      ${event && distance === 0 ? used ? '<p class="center">今天的活动已参加 ✓</p>' : `<div class="actions">${event.id === "birthday" ? '<button class="button secondary" data-action="event" data-choice="card">做生日卡</button><button class="button warm" data-action="event" data-choice="party">15 币办派对</button>' : `<button class="button primary" data-action="event" data-choice="join">${event.gift ? `收下 ${event.gift} 币红包` : `参加${event.name}`}</button>`}</div>` : ""}
      <details class="quiet-note"><summary>？游戏日历</summary><p>虚构日期，每年 12 个月，每月 28 天。只有“结束今天”才推进时间，不对应现实农历。</p><p>🎂 生日：12 月 9 日<br>${next.icon} ${next.distance} 天后：${next.name}</p></details>`, "calendar");
  }
  function eventAction(choice) {
    const event = T.eventOn(state);
    if (!event) return;
    const perform = () => {
      const output = commit({ type: "event", choice });
      if (!output) return;
      const title = event.id === "birthday" ? "生日快乐，小镇的主角！" : `${event.name}快乐！`;
      const text = event.gift ? `${event.gift} 币游戏红包已到账。` : event.id === "birthday" ? choice === "party" ? "蛋糕、气球和朋友的祝福，变成今天的快乐。" : "你画的生日卡，收进了这一年的回忆。" : `${event.text}一份新的回忆已收进书包。`;
      show(`<div class="big-emoji">${event.icon} ✨</div><h2 class="center">${title}</h2><p class="center">${text}</p><button class="button primary wide" data-action="close">把快乐带回小镇</button>`);
      celebrate();
      joyFeedback(output.result);
    };
    if (event.id === "birthday" && choice === "party") {
      if (state.cash < 15) { toast("钱包不够 15 币。可以取出储蓄，或选免费的生日卡。"); return; }
      confirm("为生日花 15 币？", `买蛋糕、气球，和朋友一起庆祝。<br>钱包：${state.cash} → ${state.cash - 15} 币。<br>也可以选择免费的生日卡，两种方式都很棒。`, "办生日派对", perform);
    } else perform();
  }
  function eventMemories() {
    return state.events.length ? `<details class="quiet-note"><summary>🎉 节日回忆 · ${state.events.length}</summary><div class="collection">${state.events.slice(-8).map((key) => { const e = T.eventMemory(state, key); return e ? `<div>${e.icon}<small>${e.name}</small></div>` : ""; }).join("")}</div></details>` : "";
  }
  function joyMoments(moments) {
    return moments.length ? `<div class="joy-moments">${moments.map((m) => `<span>${escape(m.icon)} ${escape(m.label)} <b>+${m.gain}</b></span>`).join("")}</div>` : '<p class="muted">悠闲的一天，也值得记住。</p>';
  }
  function openJoy() {
    show(`<h2>😊 今天的小快乐</h2><div class="joy-summary"><span aria-hidden="true">😊</span><strong>今日开心 <b>${state.joy.points}</b></strong><div class="joy-track" aria-hidden="true"><i style="width:${Math.min(100, state.joy.points / T.JOY_MAX * 100)}%"></i></div></div>
      <h3>不靠买零食，也能开心</h3><div class="joy-play-buttons"><button class="button secondary" data-action="draw" data-tool="free">✏️ 免费画画</button><button class="button secondary" data-open="work">🤝 帮忙做件事</button><button class="button secondary" data-action="gift-open">💌 送出自己的画</button><button class="button secondary" data-open="home">🎒 玩已有的东西</button></div>
      <h3>📸 今天的回忆</h3>${joyMoments(state.joy.moments)}
      <details class="quiet-note"><summary>📚 最近的开心回忆</summary>${state.joy.memories.slice().reverse().map((m) => `<section class="joy-memory"><strong>第 ${m.day} 天 · 开心 ${m.points}</strong>${joyMoments(m.moments)}</section>`).join("") || "<p>结束今天后，回忆就会收进来。</p>"}</details>
      ${eventMemories()}
      ${state.gifts.length ? `<details class="quiet-note" id="gift-memories"><summary>💌 准备的小礼物 · ${state.gifts.length}</summary>${state.gifts.slice().reverse().map((gift) => `<section class="joy-memory"><strong>送给 ${escape(gift.recipient)}</strong>${giftMarkup(gift, "sketch-preview")}</section>`).join("")}</details>` : ""}
      <details class="quiet-note"><summary>？开心怎么来</summary><p>画画、玩玩具、完成帮忙任务、分享作品都能获得开心。每种体验每天先 +2，再 +1，之后不再加分；不同帮忙任务共用一份额度。点心合起来也按这个规则，换贵的不会加更多。节日活动 +3。</p><p>需要亲手完成任务，或先创作再送出，不是点开页面就加分。开心不用攒满，不兑换钱，也不影响赚钱。新的一天重新记录，回忆会留下最近 7 天。</p></details>`, "joy");
  }
  function selectedArt(id) {
    return id.startsWith("coloring:") ? { coloring: { template: id.slice(9), colors: state.colorings[id.slice(9)] } } : { strokes: state.sketches[id] };
  }
  function giftMarkup(art, className = "gift-art") {
    const coloring = art.coloring, t = coloring && COLORING_TEMPLATES[coloring.template];
    const picture = coloring ? `<rect width="320" height="280" rx="20" fill="${t.background}"/>${t.parts.map(([, tag, attrs], i) => `<${tag} ${attrs} fill="${coloring.colors[i]}" stroke="#8996ae" stroke-width="2.5"/>`).join("")}${t.details || ""}` : sketchPaths(art.strokes);
    return `<svg class="${className}" viewBox="0 0 320 ${coloring ? 280 : 210}" style="aspect-ratio:320/${coloring ? 280 : 210}" aria-label="准备的画作">${picture}</svg>`;
  }
  function openGift(id) {
    const recipient = $("#gift-recipient")?.value || "";
    const ready = [...T.SKETCH_ITEMS.filter((item) => state.sketches[item]?.length && state.owned.includes(item)), ...Object.keys(state.colorings).map((item) => `coloring:${item}`)];
    const selected = ready.includes(id) ? id : ready[0];
    if (!selected) {
      const notebook = T.SKETCH_ITEMS.find((item) => state.owned.includes(item));
      show(`<h2>💌 送一幅自己的画</h2><p>先画好作品，再决定送给谁。你的原画会留在本子里。</p>${notebook ? `<button class="button primary wide" data-action="sketch" data-id="${notebook}">打开我的画本</button>` : '<button class="button secondary wide" data-open="home">看看我的书包</button>'}`, "gift");
      return;
    }
    show(`<h2>💌 想把这幅画送给谁？</h2>${ready.length > 1 ? `<div class="actions">${ready.map((item) => `<button class="button secondary" data-action="gift-open" data-id="${item}" aria-pressed="${item === selected}">${item.startsWith("coloring:") ? COLORING_TEMPLATES[item.slice(9)].icon : T.GOODS.find((g) => g.id === item).icon}</button>`).join("")}</div>` : ""}${giftMarkup(selectedArt(selected))}<label for="gift-recipient">名字或称呼</label><input class="amount" id="gift-recipient" type="text" maxlength="20" autocomplete="off" placeholder="例如：妈妈、老师、同学的名字" value="${escape(recipient)}"><p id="gift-recipient-status" class="muted" role="status"></p><button class="button primary wide" data-action="gift-send" data-id="${selected}">做好这份礼物</button><p class="muted">只保存在这台设备，不会自动发送。原画也会保留。</p>`, "gift");
    const input = $("#gift-recipient"), button = $('[data-action="gift-send"]');
    const update = () => {
      const name = input.value.trim();
      const art = selectedArt(selected);
      const duplicate = state.gifts.some((gift) => gift.recipient.toLowerCase() === name.toLowerCase() && JSON.stringify(gift.coloring || gift.strokes) === JSON.stringify(art.coloring || art.strokes));
      button.disabled = !name || duplicate;
      $("#gift-recipient-status").textContent = duplicate ? "这幅画已经为这个人准备好了。" : "";
    };
    input.addEventListener("input", update);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); button.click(); }
    });
    update();
  }
  function sendGift(id) {
    const output = commit({ type: "gift-sketch", id, recipient: $("#gift-recipient").value });
    if (!output) return;
    show(`<h2>💌 送给 ${escape(output.result.gift.recipient)} 的画，做好啦！</h2>${giftMarkup(output.result.gift)}<div class="help-thanks">可以把这幅画拿给对方看，分享你的心意。${output.result.joy ? `<strong>分享的开心 +${output.result.joy}</strong>` : ""}</div><button class="button primary wide" data-open="joy">收好这份心意</button>`, "gift-result");
    celebrate();
  }
  function openHome() {
    const counts = new Map();
    state.owned.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const items = [...counts.keys()].map((id) => T.GOODS.find((item) => item.id === id));
    const snacks = items.filter((g) => g.snack);
    const uses = {
      pencil: '<button class="button secondary" data-action="draw" data-tool="pencil">铅笔画画</button>',
      crayons: '<button class="button secondary" data-action="draw" data-tool="crayons">彩笔画画</button>',
      ball: '<button class="button secondary" data-action="play" data-id="ball">玩接球</button>',
      telescope: '<button class="button secondary" data-action="play" data-id="stars">找星星</button>'
    };
    for (const id of T.SKETCH_ITEMS) uses[id] = `<button class="button secondary" data-action="sketch" data-id="${id}">${state.sketches[id]?.length ? "接着画" : "画自己的小画"}</button>`;
    for (const id of ["pencilcase", "sea-pencilcase"]) uses[id] = `<button class="button secondary" data-action="pencilcase" data-id="${id}">摆一摆文具</button>`;
    const playable = items.filter((g) => uses[g.id]);
    const stored = items.filter((g) => !g.snack && !uses[g.id]);
    const collection = (goods) => goods.map((g) => `<div data-owned="${g.id}"><span class="bag-item-icon">${g.icon}</span><small>${g.name}</small><b class="owned-quantity">× ${counts.get(g.id)}${g.unit}</b>${state.sketches[g.id]?.length ? `<svg class="sketch-preview" viewBox="0 0 320 210" aria-label="我的画作">${sketchPaths(state.sketches[g.id])}</svg>` : ""}${uses[g.id] || ""}</div>`).join("");
    show(`<h2>🎒 我的书包</h2>
      <h3>🎨 拿出来玩</h3><div class="collection bag-collection">${playable.length ? collection(playable) : '<p>买来的画笔和玩具，可以在这里玩。</p>'}</div>
      <h3>🍎 点心 ${snacks.length ? `<small class="joy-preview">${T.joyReward(state, "snack") ? `这次 😊 +${T.joyReward(state, "snack")}` : "今天不再加分"}</small>` : ""}</h3>${snacks.length ? `<div class="snack-list">${snacks.map((g) => `<div data-owned="${g.id}"><span>${g.icon} ${g.name}<b class="owned-quantity">× ${counts.get(g.id)}${g.unit}</b></span><button class="button secondary" data-action="eat" data-id="${g.id}">${g.id === "milk" ? "喝" : "吃"} 1${g.unit}</button></div>`).join("")}</div>` : '<p class="muted">点心袋空空的</p>'}
      ${stored.length ? `<details class="quiet-note" id="bag-stored"><summary>📚 其他物品 · ${stored.reduce((sum, g) => sum + counts.get(g.id), 0)} 件</summary><div class="collection bag-collection">${collection(stored)}</div></details>` : ""}
      <button class="text-button" data-open="shop">去校门口小卖部看看 →</button>`, "home");
  }
  const COLORING_TEMPLATES = {
    cottage: { name: "林间小屋", icon: "🏡", background: "#f1f6ed", parts: [
      ["草地", "path", 'd="M0 240Q80 216 160 239T320 236V280H0Z"'],
      ["太阳", "circle", 'cx="37" cy="40" r="24"'],
      ["云朵", "ellipse", 'cx="278" cy="51" rx="28" ry="20"'],
      ["烟囱", "rect", 'x="205" y="48" width="28" height="65" rx="4"'],
      ["墙壁", "rect", 'x="76" y="120" width="168" height="121" rx="5"'],
      ["屋顶", "path", 'd="M58 123L160 43L262 123Z"'],
      ["左窗", "rect", 'x="92" y="140" width="37" height="38" rx="6"'],
      ["右窗", "rect", 'x="190" y="140" width="37" height="38" rx="6"'],
      ["门", "path", 'd="M143 241V203Q161 178 179 203V241Z"'],
      ["左花盆", "path", 'd="M8 204H51L44 238H15Z"'],
      ["左花朵", "path", 'd="M29 166C5 148 0 181 12 188C-2 211 28 213 29 195C53 213 63 184 47 179C57 158 36 153 29 166Z"'],
      ["右花盆", "path", 'd="M267 204H310L303 238H274Z"'],
      ["右花朵", "path", 'd="M289 165C264 150 261 180 273 187C260 210 289 213 290 195C313 212 321 183 307 178C316 157 296 152 289 165Z"'],
      ["门前小路", "path", 'd="M145 246H179L192 279H130Z"']
    ] },
    garden: { name: "蝴蝶花园", icon: "🦋", background: "#f8f3fb", parts: [
      ["太阳", "circle", 'cx="38" cy="38" r="23"'],
      ["云朵", "ellipse", 'cx="275" cy="40" rx="29" ry="20"'],
      ["左上翅膀", "ellipse", 'cx="128" cy="50" rx="28" ry="30"'],
      ["右上翅膀", "ellipse", 'cx="190" cy="50" rx="28" ry="30"'],
      ["左下翅膀", "ellipse", 'cx="132" cy="96" rx="24" ry="23"'],
      ["右下翅膀", "ellipse", 'cx="186" cy="96" rx="24" ry="23"'],
      ["蝴蝶身体", "rect", 'x="148" y="42" width="22" height="70" rx="11"'],
      ["左花叶", "ellipse", 'cx="49" cy="219" rx="29" ry="15"'],
      ["右花叶", "ellipse", 'cx="271" cy="219" rx="29" ry="15"'],
      ["左花瓣", "path", 'd="M60 145C28 111 9 151 30 165C-1 187 33 218 52 195C71 225 108 192 85 175C116 153 86 120 60 145Z"'],
      ["左花心", "circle", 'cx="58" cy="173" r="17"'],
      ["右花瓣", "path", 'd="M260 145C228 111 209 151 230 165C199 187 233 218 252 195C271 225 308 192 285 175C316 153 286 120 260 145Z"'],
      ["右花心", "circle", 'cx="258" cy="173" r="17"'],
      ["左花盆", "path", 'd="M24 238H91L80 276H35Z"'],
      ["右花盆", "path", 'd="M225 238H292L281 276H236Z"'],
      ["中间郁金香", "path", 'd="M136 170L145 184L160 164L175 184L184 170V204Q160 239 136 204Z"'],
      ["中间花盆", "path", 'd="M132 240H188L180 276H140Z"']
    ] },
    ocean: { name: "海底朋友", icon: "🐠", background: "#edf6fb", parts: [
      ["海底沙滩", "path", 'd="M0 241Q60 225 124 246T320 234V280H0Z"'],
      ["大鱼尾巴", "path", 'd="M10 97L10 157L54 126Z"'],
      ["大鱼背鳍", "path", 'd="M73 103L100 63L120 105Z"'],
      ["大鱼身体", "ellipse", 'cx="102" cy="126" rx="51" ry="32"'],
      ["小鱼尾巴", "path", 'd="M307 49L307 101L267 76Z"'],
      ["小鱼身体", "ellipse", 'cx="238" cy="76" rx="33" ry="25"'],
      ["海星", "path", 'd="M245 153L258 178L288 181L267 201L273 230L245 216L218 230L222 200L203 181L232 178Z"'],
      ["贝壳", "path", 'd="M32 232C-9 177 27 160 43 181C57 146 80 168 76 187C109 171 120 208 78 232Z"'],
      ["海草左叶", "path", 'd="M151 254C107 228 108 187 130 174C146 205 140 228 151 254Z"'],
      ["海草右叶", "path", 'd="M159 254C195 225 198 189 180 171C161 202 172 224 159 254Z"'],
      ["海草中叶", "path", 'd="M151 250C134 212 141 165 157 148C180 183 160 217 159 250Z"'],
      ["左泡泡", "circle", 'cx="43" cy="38" r="19"'],
      ["中泡泡", "circle", 'cx="159" cy="37" r="18"'],
      ["右泡泡", "circle", 'cx="292" cy="131" r="18"']
    ], details: '<circle cx="122" cy="118" r="7" fill="#4e5275"/><circle cx="226" cy="70" r="6" fill="#4e5275"/><path d="M35 221L29 194M55 224L57 191M74 219L84 199" fill="none" stroke="#8996ae" stroke-width="2"/>' },
    space: { name: "星空旅行", icon: "🚀", background: "#f0edf9", parts: [
      ["左上星星", "path", 'd="M39 20L47 36L65 39L51 51L55 69L39 60L23 69L27 51L13 39L31 36Z"'],
      ["右下星星", "path", 'd="M267 196L276 213L295 217L281 229L285 249L267 239L250 249L253 229L239 217L259 213Z"'],
      ["右侧星星", "path", 'd="M281 122L289 137L307 140L294 152L296 169L281 161L266 169L268 152L255 140L273 137Z"'],
      ["左侧星星", "path", 'd="M47 92L55 108L73 111L59 123L62 142L47 133L31 142L34 123L20 111L39 108Z"'],
      ["左星球", "circle", 'cx="48" cy="207" r="30"'],
      ["右星球", "circle", 'cx="259" cy="65" r="32"'],
      ["左尾翼", "path", 'd="M124 157L94 183V226L128 203Z"'],
      ["右尾翼", "path", 'd="M196 157L226 183V226L192 203Z"'],
      ["火箭机身", "rect", 'x="123" y="91" width="74" height="119" rx="12"'],
      ["火箭头", "path", 'd="M123 96Q124 65 160 29Q196 65 197 96Z"'],
      ["舷窗", "circle", 'cx="160" cy="124" r="22"'],
      ["火箭标志", "rect", 'x="137" y="169" width="46" height="25" rx="6"'],
      ["尾焰", "path", 'd="M138 218H182L175 272L160 250L145 272Z"']
    ], details: '<path d="M224 53Q265 99 296 71M23 205Q44 224 74 213" fill="none" stroke="#8996ae" stroke-width="3"/>' }
  };
  function startDrawing(tool = "free", templateId = "cottage", drafts = {}) {
    if (!["free", "pencil", "crayons"].includes(tool) || tool !== "free" && !state.owned.includes(tool)) return;
    if (!Object.hasOwn(COLORING_TEMPLATES, templateId)) return;
    const template = COLORING_TEMPLATES[templateId];
    const draft = drafts[templateId] ||= { fills: {}, rewarded: false };
    const colored = tool === "crayons";
    const back = tool === "free" ? "joy" : "home";
    const colors = colored ? [["#ef9e88", "珊瑚红"], ["#f3d16d", "阳光黄"], ["#8abfdf", "天空蓝"], ["#a9c98d", "草地绿"], ["#ba9bda", "葡萄紫"], ["#e7aaca", "花瓣粉"]] : [["#74728b", "铅灰"], ["#b0afbd", "浅灰"]];
    paintColor = colors[0][0];
    show(`<h2>${colored ? "🖍️ 彩笔小画板" : tool === "pencil" ? "✏️ 铅笔小画板" : "✏️ 免费铅笔画"}</h2><p>选一幅喜欢的画，颜色由你来搭配。</p>
      <div class="drawing-templates" aria-label="选择涂色模板">${Object.entries(COLORING_TEMPLATES).map(([id, t]) => `<button class="button secondary" data-action="draw-template" data-template="${id}" aria-pressed="${id === templateId}">${t.icon} ${t.name}</button>`).join("")}</div>
      <div class="palette" aria-label="选择画笔颜色">${colors.map(([color, name], i) => `<button class="color-button" style="--swatch:${color}" data-action="brush" data-color="${color}" aria-label="${name}" aria-pressed="${i === 0}"><span></span>${name}</button>`).join("")}</div>
      <svg class="drawing" viewBox="0 0 320 280" aria-label="${template.name}">
        <rect width="320" height="280" rx="20" fill="${template.background}"/>
        ${template.parts.map(([name, tag, attributes], index) => `<${tag} ${attributes} class="paint-part" fill="${draft.fills[index] || "#fffdf7"}" stroke="#8996ae" stroke-width="2.5" stroke-linejoin="round" role="button" tabindex="0" aria-label="给${name}涂色" data-action="paint" data-part="${index}"/>`).join("")}
        <g pointer-events="none">${template.details || ""}</g>
      </svg><p class="center" id="drawing-progress" role="status">${draft.rewarded ? "画好啦，还可以换颜色！" : `涂好了 ${Object.keys(draft.fills).length} / ${template.parts.length}`}</p>${draft.rewarded && state.colorings[templateId] ? `<button class="button secondary wide" id="coloring-gift" data-action="gift-open" data-id="coloring:${templateId}">💌 作品已保存，做成礼物</button>` : ""}<details class="quiet-note"><summary>？画笔说明</summary><p>${colored ? "彩笔可以反复用。" : "铅笔也能画，彩笔可以涂彩色。"}不扣钱，不扣精力。换模板会留着本次的草稿，未完成的草稿退出后不保留。整幅涂好会自动保存，每种模板保留最新完成的一张，可在“今日开心”里做成礼物。想从头自由画，可以用书包里的画本。</p></details><button class="button secondary wide" data-open="${back}">${back === "joy" ? "回到今天的小快乐" : "收好画笔，回到书包"}</button>`, "coloring");
    drawing = { tool, templateId, drafts, draft, total: template.parts.length, back, painted: new Set(Object.keys(draft.fills)), rewarded: draft.rewarded };
  }
  function sketchPaths(strokes) {
    return strokes.map((stroke, index) => `<path data-stroke="${index}" d="M${stroke.points.map((point) => point.join(",")).join(" L")} L${stroke.points.at(-1).join(",")}" fill="none" stroke="${stroke.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  }
  function startSketch(id) {
    if (!T.SKETCH_ITEMS.includes(id) || !state.owned.includes(id)) return;
    const colors = state.owned.includes("crayons") ? T.SKETCH_COLORS : T.SKETCH_COLORS.slice(0, 2);
    const names = ["铅灰", "浅灰", "珊瑚红", "阳光黄", "天空蓝", "草地绿"];
    let strokes = structuredClone(state.sketches[id] || []), color = colors[0], erasing = false, pointer = null, active = true;
    show(`<h2>📓 我的小画本</h2><p>用手指画，画什么由你决定。</p><div id="sketch-editor"><div class="sketch-tools" aria-label="画笔工具">${colors.map((c, index) => `<button class="color-button" data-sketch-color="${c}" style="--swatch:${c}" aria-label="${names[index]}" aria-pressed="${index === 0}"><span></span>${names[index]}</button>`).join("")}${state.owned.includes("eraser") ? '<button class="button secondary" data-sketch="erase" aria-pressed="false">🧽 橡皮擦</button>' : ""}</div><svg id="sketch-paper" viewBox="0 0 320 210" aria-label="用手指或画笔自由画画" role="img">${sketchPaths(strokes)}</svg><div class="actions"><button class="button secondary" data-sketch="undo">撤回一笔</button><button class="button secondary" data-sketch="new">重新画一张</button><button class="button primary" data-sketch="save">保存作品</button></div><div class="notice" id="sketch-reset-confirm" role="group" aria-label="重新画一张" hidden><p>要换一张空白纸吗？保存新画后，这本原来的画会被替换。已经做好的礼物不会变。</p><div class="actions"><button class="button secondary" data-sketch="cancel-new">继续这张</button><button class="button primary" data-sketch="confirm-new">换空白纸</button></div></div><p class="muted" id="sketch-status" role="status"></p></div><details class="quiet-note"><summary>？画本怎么玩</summary><p>买到彩笔，可以用彩色画；有橡皮，可以擦掉一笔。保存后下次还能接着画，不扣钱、不扣精力。每本最多留 40 笔，保存会更新这本的画。重新画一张后，如果没有保存就退出，原来的已保存作品还在。</p></details><button class="text-button" data-open="home">收好画本，回到书包</button>`, "sketch");
    const host = $("#sketch-editor"), paper = $("#sketch-paper"), abort = new AbortController();
    const resetPrompt = $("#sketch-reset-confirm");
    const on = (element, event, fn) => element.addEventListener(event, fn, { signal: abort.signal });
    const status = (text) => { $("#sketch-status").textContent = text; };
    function paint() {
      paper.innerHTML = sketchPaths(strokes);
      host.querySelector('[data-sketch="undo"]').disabled = !strokes.length;
      host.querySelector('[data-sketch="new"]').disabled = !strokes.length;
      host.querySelector('[data-action="gift-open"]')?.remove();
    }
    function point(event) {
      const box = paper.getBoundingClientRect();
      return [Math.round(Math.max(0, Math.min(320, (event.clientX - box.left) / box.width * 320))), Math.round(Math.max(0, Math.min(210, (event.clientY - box.top) / box.height * 210)))];
    }
    function erase(event) {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (target?.matches("#sketch-paper path")) {
        strokes.splice(Number(target.dataset.stroke), 1);
        paint(); status("擦掉一笔，还可以继续画。");
      }
    }
    on(paper, "pointerdown", (event) => {
      if (!resetPrompt.hidden || pointer !== null || !event.isPrimary || event.pointerType === "mouse" && event.button !== 0) return;
      if (!erasing && strokes.length >= 40) { status("画纸已经有 40 笔啦，先撤回或擦掉一些。"); return; }
      event.preventDefault();
      pointer = event.pointerId;
      paper.setPointerCapture(pointer);
      if (erasing) erase(event);
      else { strokes.push({ color, points: [point(event)] }); paint(); status("还没保存"); }
    });
    on(paper, "pointermove", (event) => {
      if (event.pointerId !== pointer) return;
      event.preventDefault();
      if (erasing) { erase(event); return; }
      const stroke = strokes.at(-1), next = point(event), last = stroke.points.at(-1);
      if (Math.hypot(next[0] - last[0], next[1] - last[1]) < 2) return;
      if (stroke.points.length === 128) stroke.points = stroke.points.filter((_, i) => i % 2 === 0 || i === 127);
      stroke.points.push(next); paint();
    });
    function release() {
      if (pointer !== null && paper.hasPointerCapture(pointer)) paper.releasePointerCapture(pointer);
      pointer = null;
    }
    on(paper, "pointerup", release);
    on(paper, "pointercancel", release);
    on(paper, "lostpointercapture", () => { pointer = null; });
    on(window, "blur", release);
    on(document, "visibilitychange", () => { if (document.hidden) release(); });
    on(host, "click", (event) => {
      const button = event.target.closest("button");
      if (!button || !active) return;
      if (!resetPrompt.hidden && !["cancel-new", "confirm-new"].includes(button.dataset.sketch)) return;
      release();
      if (button.dataset.sketchColor) { color = button.dataset.sketchColor; erasing = false; }
      else if (button.dataset.sketch === "erase") erasing = !erasing;
      else if (button.dataset.sketch === "undo") { strokes.pop(); paint(); status("撤回一笔，还没保存"); }
      else if (button.dataset.sketch === "new") {
        resetPrompt.hidden = false;
        host.querySelector('[data-sketch="cancel-new"]').focus();
      }
      else if (button.dataset.sketch === "cancel-new") {
        resetPrompt.hidden = true;
        host.querySelector('[data-sketch="new"]').focus();
      }
      else if (button.dataset.sketch === "confirm-new") {
        strokes = []; erasing = false; resetPrompt.hidden = true;
        paint(); status("新画纸准备好了，画好后记得保存。");
        host.querySelector(`[data-sketch-color="${color}"]`).focus();
      }
      else if (button.dataset.sketch === "save") {
        const output = commit({ type: "sketch-save", id, strokes });
        if (output) {
          status("作品已收好，下次可以接着画。");
          if (!strokes.length) host.querySelector('[data-action="gift-open"]')?.remove();
          if (!host.querySelector('[data-action="gift-open"]') && strokes.length) host.insertAdjacentHTML("beforeend", `<button class="button secondary wide" data-action="gift-open" data-id="${id}">💌 把这幅画送给朋友</button>`);
          if (output.result.joy) joyFeedback(output.result);
        }
      }
      host.querySelectorAll("[data-sketch-color]").forEach((b) => b.setAttribute("aria-pressed", String(!erasing && b.dataset.sketchColor === color)));
      host.querySelector('[data-sketch="erase"]')?.setAttribute("aria-pressed", String(erasing));
      paper.dataset.erasing = String(erasing);
    });
    miniController = { destroy() { active = false; release(); abort.abort(); } };
    paint();
  }
  function startPencilcase(id) {
    if (!["pencilcase", "sea-pencilcase"].includes(id) || !state.owned.includes(id)) return;
    show('<h2>👝 摆一摆文具</h2><div id="pencilcase-game"></div><button class="text-button" data-open="home">收好笔袋，回到书包</button>', "pencilcase");
    miniController = MiniGames.mount($("#pencilcase-game"), { id: "packing", level: 2, pencilcase: true, onWin: () => {
      show('<div class="big-emoji">👝 ✨</div><h2>文具都装好啦！</h2><p>转一转、挪一挪，你找到了合适的位置。</p><button class="button primary wide" data-open="home">收进书包</button>', "pencilcase");
    } });
  }
  function startPlay(id) {
    if (!["stars", "ball"].includes(id)) return;
    if (id === "stars" && !state.owned.includes("telescope") || id === "ball" && !state.owned.includes("ball")) return;
    show(`<h2>${id === "stars" ? "🔭 把五颗星星连成一个梦" : "⚽ 和皮球打个招呼"}</h2><p>找到它，点一下！</p><div class="play-field ${id === "ball" ? "ball-field" : ""}" id="play-field"></div><p class="center" id="play-score" aria-live="polite">找到 0 / 5</p><details class="quiet-note"><summary>？玩法说明</summary><p>不用花钱，也不扣精力。</p></details><button class="text-button" data-open="home">回到书包 →</button>`);
    play = { id, count: 0 };
    drawPlay();
  }
  function drawPlay() {
    const positions = [[13, 30], [65, 50], [38, 9], [10, 55], [64, 15]];
    const [left, top] = positions[play.count];
    $("#play-field").innerHTML = `<button class="star-button" data-action="play-hit" style="left:${left}%;top:${top}%" aria-label="${play.id === "stars" ? "找到星星" : "接住皮球"}"><span>${play.id === "stars" ? "⭐" : "⚽"}</span></button>`;
  }
  function playHit() {
    if (!play) return;
    const hit = $("#play-field [data-action='play-hit']");
    const position = { left: hit.style.left, top: hit.style.top };
    play.count += 1; chime();
    $("#play-score").textContent = `找到 ${play.count} / 5`;
    if (play.count === 5) {
      const id = play.id; play = null;
      const output = commit({ type: "enjoy", id });
      if (!output) return;
      $("#play-field").innerHTML = `<div class="play-finish"><div class="big-emoji">🌈 ✨</div><p class="center">${output.result.joy ? `开心 +${output.result.joy}` : "这轮也玩得开心！"}</p></div>`;
      joyFeedback(output.result);
    }
    else drawPlay();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const spark = document.createElement("span");
      spark.className = "play-spark"; spark.textContent = "✨";
      spark.style.left = position.left; spark.style.top = position.top;
      spark.setAttribute("aria-hidden", "true");
      $("#play-field").append(spark);
      spark.addEventListener("animationend", () => spark.remove(), { once: true });
    }
  }
  function openJournal(day = state.day, view = "daily") {
    const daily = T.dailyAccount(state, day);
    if (!daily || !["daily", "assets"].includes(view)) return;
    const a = T.assets(state), f = state.finance;
    const kinds = { income: "收入", spending: "消费", transfer: "转账", invest: "股份买卖", business: "小摊经营", activity: "生活" };
    const entryMarkup = (e) => {
      const changes = [e.amount ? `钱包 ${signed(e.amount)}` : "", e.bankAmount ? `银行 ${signed(e.bankAmount)}` : ""].filter(Boolean).join("<br>");
      return `<div class="ledger"><div><small>第 ${e.day} 个游戏日 · ${kinds[e.kind] || "旧记录"}</small>${escape(e.text)}${e.receipts !== undefined ? `<small>收入 ${e.receipts} · 花销 ${e.payments}</small>` : e.spending && e.income ? `<small>消费 ${e.spending} · 补助 ${e.income}</small>` : ""}</div><b>${changes || "—"}</b></div>`;
    };
    show(`<h2>📒 我的钱钱手账</h2>
      <div class="scene-tabs" aria-label="账本视图"><button data-action="journal-tab" data-tab="daily" data-day="${day}" aria-pressed="${view === "daily"}">每日收支</button><button data-action="journal-tab" data-tab="assets" data-day="${day}" aria-pressed="${view === "assets"}">资产总览</button></div>
      <section id="daily-ledger" ${view === "daily" ? "" : "hidden"}>
      <nav class="ledger-day-nav" aria-label="选择游戏日"><button class="button secondary" data-action="journal-day" data-day="${day - 1}" ${day === 1 ? "disabled" : ""}>前一天</button><div><strong>${daily.date.month} 月 ${daily.date.date} 日${day === state.day ? " · 今天" : ""}</strong><small>第 ${day} 个游戏日</small></div><button class="button secondary" data-action="journal-day" data-day="${day + 1}" ${day === state.day ? "disabled" : ""}>后一天</button></nav>
      ${day !== state.day ? `<button class="text-button" data-action="journal-day" data-day="${state.day}">回到今天</button>` : ""}
      ${!daily.complete ? '<p class="notice" id="daily-incomplete">这天的旧记录不完整，下面只统计还保留的已知收支，不能代表全天。</p>' : ""}
      <div class="numbers daily-money"><div>当天收入<strong id="daily-income">${daily.income}</strong></div><div>当天花销<strong id="daily-spending">${daily.spending}</strong></div><div>收支差额<strong id="daily-net" class="${daily.net >= 0 ? "positive" : "negative"}">${signed(daily.net)}</strong></div></div>
      <details class="quiet-note" id="daily-transactions"><summary>📋 当天明细 · 保留 ${daily.records.length} 条</summary>${daily.records.map(entryMarkup).join("") || `<p>${daily.complete ? "这一天还没有收支记录。" : "这一天没有留下可查看的流水。"}</p>`}${daily.entries > daily.records.length ? "<p>较早的明细已收起，日汇总仍保留完整；流水只保留最近 60 条。</p>" : ""}</details>
      <details class="quiet-note" id="daily-money-moves"><summary>🏦 转账与资金买卖（不算日常收支）</summary><p>存入银行 ${daily.transferOut} 币 · 取回钱包 ${daily.transferIn} 币</p><p>买入股份 ${daily.capitalOut} 币 · 卖出股份或原料退款 ${daily.capitalIn} 币</p><p>这些钱是换了位置或收回本金，不把整笔当作赚到的钱。股份买卖的赚亏可以在明细和资产总览里看。</p></details>
      <details class="quiet-note"><summary>？每日收支怎么算</summary><p>收入包括劳动报酬、零用钱、利息、补助和饮料销售款。花销包括购物、生活支出、开店、进货、营业费和维修。</p><p>饮料店按实际营业的游戏日记录。进货已付过的钱不在卖出时再扣一次；还没用掉的原料仍是资产，所以收支差额不等于经营利润。存取款和股份买卖另列，取回的钱不当作新收入。</p><p>日汇总会保留，不受最近 60 条流水的限制。旧存档只能根据还在的流水补记，不会编造丢失的记录。</p></details>
      </section><section id="journal-assets" ${view === "assets" ? "" : "hidden"}>
      <div class="asset-total"><span>我的总资产 · 游戏币</span><strong id="asset-total">${a.total}</strong><small>比${f.migrated ? "统计开始时" : "开始时"} ${signed(a.total - f.opening)} 币 · 含尚未卖出的股份</small></div>
      <div class="asset-grid"><div>🪙 钱包<strong id="asset-cash">${a.cash}</strong><small>现在能花</small></div><div>🏦 银行<strong id="asset-bank">${a.savings}</strong><small>取回后能花</small></div><div>🌱 股份现值<strong id="asset-shares">${a.invested}</strong><small>会涨，也会跌</small></div><div>🍋 小摊原料<strong id="asset-materials">${a.materials}</strong><small>未用原料，按成本记</small></div></div>
      <details class="quiet-note"><summary>我的股份 · 未卖出盈亏 ${signed(a.unrealized)} 币</summary>${a.shares.map((h) => `<div class="report-row">${T.SHOPS[h.id].icon} ${T.SHOPS[h.id].name} · ${h.count} 份<br>买入成本 ${h.cost} → 当前总值 ${h.value} 币 · <b class="${h.value >= h.cost ? "positive" : "negative"}">${signed(h.value - h.cost)}</b><br>今天可卖 ${h.sellable} 份 · ${h.sellable * state.prices[h.id]} 币${h.locked ? ` · 今日买入 ${h.locked} 份` : ""}</div>`).join("")}<p>未用小摊原料按成本记入。摊车工具不能退款，算开店费用，不算可用资产。书包里的 ${state.owned.length} 件物品不能出售，也不当作可用的钱。</p></details>
      <details class="quiet-note"><summary>📒 收支与明细</summary><div class="numbers"><div>累计收入<strong id="finance-income">${f.income}</strong></div><div>累计消费<strong id="finance-spending">${f.spending}</strong></div><div>卖出 / 经营盈亏<strong id="finance-realized" class="${f.realized >= 0 ? "positive" : "negative"}">${signed(f.realized)}</strong></div></div>
      <p class="muted">存取款不算收入或消费。股份卖出只把赚亏部分记入盈亏，买入不算消费。${f.migrated ? `分类累计从第 ${f.sinceDay} 个游戏日升级时开始，之前的流水仍保留。` : ""}</p>
      ${state.journal.map(entryMarkup).join("") || "<p>第一笔故事，等你来写。</p>"}</details></section>`, "journal");
  }
  function openExpense() {
    const bill = T.expense(state);
    if (!bill.due) { toast("今天的生活支出已经安排好了。"); return; }
    show(`<h2>${bill.icon} ${bill.title}</h2><p>今天选哪一份？</p>
      <div class="expense-choices">${bill.choices.map((choice, i) => `<button class="expense-choice" data-action="pay-expense" data-choice="${i}" ${state.cash < choice.price ? "disabled" : ""}><span>${choice.icon}</span><strong>${choice.name}</strong><b>${choice.price} 币</b><small>${state.cash >= choice.price ? `买后钱包剩 ${state.cash - choice.price} 币` : `还差 ${choice.price - state.cash} 币`}</small></button>`).join("")}</div>
      ${bill.aid ? `<div class="notice">家长帮你补 ${bill.aid} 币，直接付给基础方案，不放进钱包。</div><button class="button primary wide" data-action="expense-aid">我的 ${state.cash} 币 + 补助 ${bill.aid} 币，选基础方案</button>` : ""}
      <div class="actions">${state.savings ? '<button class="button secondary" data-open="savings">🏦 去银行取钱</button>' : ""}${state.energy ? '<button class="button secondary" data-open="work">🎮 做任务赚一点</button>' : ""}${T.assets(state).sellable ? '<button class="button secondary" data-open="invest">🌱 看看可卖的股份</button>' : ""}${T.inventoryValue(state.stall) ? '<button class="button secondary" data-open="stall">🥤 去饮料店安排原料</button>' : ""}</div>
      ${state.cash < bill.choices[0].price && !bill.aid ? '<details class="quiet-note"><summary>？钱不够怎么办</summary><p>先安排可用的钱。小摊关店能退回未用原料的钱。任务机会、存款、可卖股份和可退原料都用尽后，可以申请基础方案差额补助。</p></details>' : ""}`, "expense");
  }
  function payExpense(choice, aid = false) {
    const bill = T.expense(state), item = bill.choices[choice];
    if (!bill.due || !item) return;
    const paid = item.price - (aid ? bill.aid : 0);
    confirm(`选${item.name}？`, `这次消费 <b>${item.price} 币</b>。${aid ? `<br>家长直接补助 ${bill.aid} 币。` : ""}<br>钱包：${state.cash} → ${state.cash - paid} 币。`, "确认支付", () => {
      if (commit({ type: "expense", choice, aid, day: bill.day })) { close(); chime(); toast("生活任务完成，花的钱换来了今天需要的东西！"); }
    });
  }
  function nextDay() {
    if (T.expense(state).due) { openExpense(); return; }
    const event = T.eventOn(state), bill = T.expense(state);
    confirm("结束今天，去明天？",
      `⚡ 休息后，精力恢复到 3 点${state.pending ? "<br>🍋 收摊，看看今天赚了还是亏了" : T.stallStatus(state) === "open" ? "<br>🍋 看今天卖了几杯，扣 2 币营业费" : state.stall && state.stall.status !== "closed" ? `<br>🍋 ${stallLabels[T.stallStatus(state)]}` : ""}${event && !state.events.includes(event.key) ? `<br>📅 ${event.name}还没参加` : ""}${bill.days === 1 ? `<br>${bill.icon} 明天${bill.title}：${bill.choices[0].price}～${bill.choices[1].price} 币` : ""}`,
      "晚安，去明天", () => {
        const finishingGuide = state.guide.step === 4 && !state.guide.paused;
        const output = commit({ type: "next" });
        if (!output) return;
        const r = output.result;
        const event = T.eventOn(state), bill = T.expense(state);
        show(`<h2>${state.weather === "sun" ? "☀️" : "🌧️"} 早上好！</h2><p>${T.month(state)} 月 ${T.dayOfMonth(state)} 日 · ⚡ 精力已补满</p>
          <details class="quiet-note" id="joy-day-report"><summary>📸 昨天的开心回忆 · ${r.joy.points}</summary>${joyMoments(r.joy.moments)}</details>
          ${bill.days <= 1 ? `<div class="notice">${bill.icon} ${bill.due ? "今天" : "明天"}：${bill.title}，需要 ${bill.choices[0].price}～${bill.choices[1].price} 币。${bill.due ? '<button class="text-button" data-open="expense">我来安排 →</button>' : ""}</div>` : ""}
          ${finishingGuide ? '<p class="positive">✓ 新手路线走完啦！接下来自由探索，小向导先收起来了。</p>' : ""}
          ${r.allowance ? `<div class="notice">🪙 每周零用钱 <b>+${r.allowance} 币</b> 到账</div>` : ""}
          ${r.bank.settled ? `<div class="notice" id="interest-report">🏦 银行结息：<b>+${r.bank.interest} 币</b>，已留在存款里</div>` : ""}
          ${r.stall ? `<h3>🍋 昨天的小摊</h3>${stallResult(r.stall)}<button class="button secondary" data-open="stall">查看我的小摊 →</button>` : ""}
          <details class="quiet-note"><summary>📮 小店消息</summary>${r.shops.map((shop) => `<div class="report-row">${T.SHOPS[shop.id].icon} ${T.SHOPS[shop.id].name}${shop.price === 0 ? " · 已停业" : ""}${shopNews(shop.id)}${shop.dividend ? `<br>分红 +${shop.dividend} 币，已放进钱包` : ""}</div>`).join("")}<p>今天的消息已计入价格，不是明天的预告。</p></details>
          ${event ? `<div class="notice">${event.icon} 今天有${event.name}！<button class="text-button" data-open="calendar">去参加 →</button></div>` : ""}
          <button class="button primary wide" data-action="close">去小镇逛逛</button>`);
      });
  }
  function openHelp() {
    show(`<h2>🌱 欢迎来到小小生活家</h2><p>你有 <b>100 币起始资金</b>。没有考试，没有财富排名，也没有必须照做的路线。</p>
      <div class="notice">🎒 看书包、用彩笔画画，吃一份课间点心<br>🏪 买文具和零食，付款前看清钱包变化<br>🙌 完成家庭小任务，获得约定奖励<br>🫙 把一部分钱留给下周或新笔袋<br>🍋 摆摊时，收入减成本才是利润<br>🌱 投资可能赚钱，也可能亏掉本金<br>📅 自己结束一天，生日和节日就会慢慢到来</div>
      <p>不想投资也能一直玩。钱不够时，可以做免费任务；精力用完就去明天。没有欠债，也不会因为破产而失败重来。</p>
      <p class="muted">给大人：这是简化的金融启蒙模拟，不是投资建议。所有钱和小店均为虚构，不接真实支付。无登录、广告或外部请求，存档只在当前浏览器。清理浏览器数据会清除进度。</p><button class="button primary wide" data-action="close">我要自己探索</button>`);
  }
  function updateSound() {
    $("#sound").textContent = sound ? "♫" : "♪";
    $("#sound").setAttribute("aria-label", sound ? "关闭音效" : "开启音效");
    $("#sound").title = sound ? "关闭音效" : "开启音效";
    $("#sound").setAttribute("aria-pressed", String(sound));
  }
  const screens = { places: openPlaces, shop: openShop, savings: openSavings, work: openWork, daily: startDaily, expense: openExpense, stall: openStall, invest: openInvest, calendar: openCalendar, weather: openWeather, home: openHome, joy: openJoy, journal: openJournal, help: openHelp, guide: openGuide };
  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open]");
    if (opener) { screens[opener.dataset.open]?.(); return; }
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    switch (action) {
      case "daily-main": startDaily(); break;
      case "keep-money":
        if (commit({ type: "keep-money" })) { close(); toast("先留着也是一个好选择。"); }
        break;
      case "close": close(); break;
      case "cancel": { const back = confirmationReturn || close; back(); break; }
      case "scene-back": { const back = confirmationReturn || (drawing ? screens[drawing.back] : null) || ({ sketch: openHome, pencilcase: openHome, home: close, journal: close }[guideScreen]) || openPlaces; back(); break; }
      case "journal-day": openJournal(Number(button.dataset.day)); break;
      case "journal-tab": openJournal(Number(button.dataset.day), button.dataset.tab); break;
      case "next-day": nextDay(); break;
      case "shop-category":
        if (["文具", "课间点心", "玩具", "心愿单"].includes(button.dataset.category)) {
          shopCategory = button.dataset.category; openShop();
          $(`[data-action="shop-category"][data-category="${shopCategory}"]`).focus({ preventScroll: true });
        }
        break;
      case "wish-toggle": {
        const removing = state.wishlist.includes(button.dataset.id);
        if (!commit({ type: removing ? "wish-remove" : "wish-add", id: button.dataset.id })) break;
        if (shopCategory === "心愿单" && removing) {
          const scroll = modal.scrollTop;
          openShop(); modal.scrollTop = scroll;
          $(".wishlist-link").focus({ preventScroll: true });
        } else updateWishButtons();
        break;
      }
      case "confirm": { const callback = confirmation; confirmation = null; callback?.(); break; }
      case "guide-start":
        guideManual = false;
        if (commit({ type: "guide-start" })) guideGo();
        break;
      case "guide-toggle":
        if (!guideExpanded && coach.classList.contains("docked")) revealGuideTarget();
        setGuideExpanded(!guideExpanded, true);
        break;
      case "guide-collapse": setGuideExpanded(false, true); break;
      case "guide-focus": {
        const target = guideTarget;
        setGuideExpanded(false);
        revealGuideTarget();
        target?.focus({ preventScroll: true });
        break;
      }
      case "guide-go": guideGo(); break;
      case "guide-pause": {
        const target = guideTarget;
        guideManual = false; guideExpanded = false;
        if (commit({ type: "guide-pause" })) { target?.focus({ preventScroll: true }); toast("小手收好啦，右上角「小向导」可以继续。"); }
        break;
      }
      case "guide-skip":
        if (state.guide.step === 0 && !commit({ type: "guide-start" })) break;
        if (commit({ type: "guide-skip" })) { close(); revealGuideTarget(); toast(state.guide.step === 5 ? "这条路线走完啦，接下来自由探索。" : "这个选择也很好，小手已经移到下一站。"); }
        break;
      case "eat": {
        const output = commit({ type: "eat", id: button.dataset.id });
        if (output) { openHome(); joyFeedback(output.result, true); }
        break;
      }
      case "draw": startDrawing(button.dataset.tool); break;
      case "draw-template": if (drawing) startDrawing(drawing.tool, button.dataset.template, drawing.drafts); break;
      case "sketch": startSketch(button.dataset.id); break;
      case "gift-open": openGift(button.dataset.id); break;
      case "gift-send": sendGift(button.dataset.id); break;
      case "pencilcase": startPencilcase(button.dataset.id); break;
      case "brush":
        paintColor = button.dataset.color;
        document.querySelectorAll('[data-action="brush"]').forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
        break;
      case "paint":
        if (!drawing) break;
        button.setAttribute("fill", paintColor); chime();
        drawing.painted.add(button.dataset.part);
        drawing.draft.fills[button.dataset.part] = paintColor;
        if (!drawing.rewarded) {
          $("#drawing-progress").textContent = `涂好了 ${drawing.painted.size} / ${drawing.total}`;
          if (drawing.painted.size === drawing.total) {
            drawing.rewarded = true;
            drawing.draft.rewarded = true;
            const output = commit({ type: "enjoy", id: "draw" });
            if (output) {
              $("#drawing-progress").textContent = output.result.joy ? `画好啦！开心 +${output.result.joy}` : "画好啦，喜欢就再涂涂！";
              joyFeedback(output.result);
            }
          }
        }
        if (drawing.painted.size === drawing.total) {
          const colors = COLORING_TEMPLATES[drawing.templateId].parts.map((_, i) => drawing.draft.fills[i]);
          if (commit({ type: "coloring-save", id: drawing.templateId, colors }) && !$("#coloring-gift")) {
            $("#drawing-progress").insertAdjacentHTML("afterend", `<button class="button secondary wide" id="coloring-gift" data-action="gift-open" data-id="coloring:${drawing.templateId}">💌 作品已保存，做成礼物</button>`);
          }
        }
        break;
      case "quantity":
        if (!T.GOODS.some((g) => g.id === button.dataset.id)) break;
        if (button.dataset.change === "1" && T.available(state, button.dataset.id)) cart.push(button.dataset.id);
        else if (button.dataset.change === "-1") {
          const index = cart.indexOf(button.dataset.id);
          if (index >= 0) cart.splice(index, 1);
        }
        updateBasket(); break;
      case "checkout": checkout(); break;
      case "save": case "withdraw": moveMoney(action); break;
      case "task": startTask(button.dataset.id); break;
      case "task-easy": startTask(button.dataset.id, Number(button.dataset.level)); break;
      case "pay-expense": payExpense(Number(button.dataset.choice)); break;
      case "expense-aid": payExpense(0, true); break;
      case "calendar-shift": renderCalendar(calendarOffset + Number(button.dataset.offset)); break;
      case "calendar-day":
        renderCalendar(calendarOffset, Number(button.dataset.distance));
        $('.calendar-day[aria-pressed="true"]').focus({ preventScroll: true });
        break;
      case "stall": {
        confirm("花 24 币，开饮料店？", `<span class="stall-confirm-line">🛒 摊车工具 <b>24 币</b>，不退款</span><span class="stall-confirm-line">⚡ 用 1 点精力 · 钱包剩 <b>${state.cash - 24} 币</b></span><span class="stall-confirm-line">📋 开好店，再选菜单、进原料、定售价</span><span class="stall-confirm-line">🪙 真正营业时，每天另付 <b>2 币营业费</b></span><span class="stall-confirm-risk">还没选菜单或备齐原料时，不扣营业费。原料不会自动补货，可随时暂停或关店。</span>`, "确认开店", () => {
          if (commit({ type: "stall", starter: false })) { stallTab = "menu"; openStall(); toast("店开好了！先选一道喜欢的饮品，再按配方进货。"); }
        }); break;
      }
      case "stall-price": {
        const opening = !state.stall || state.stall.status === "closed";
        const price = (opening ? openingStallPrice : state.stall.price) + Number(button.dataset.change);
        if (!Number.isInteger(price) || price < T.STALL.minPrice || price > T.STALL.maxPrice) break;
        if (opening) openingStallPrice = price;
        else if (!commit({ type: action, price })) break;
        const scroll = modal.scrollTop;
        openStall();
        modal.scrollTop = scroll;
        const selector = `[data-action="stall-price"][data-change="${button.dataset.change}"]:not(:disabled)`;
        ($(selector) || $('[data-action="stall-price"]:not(:disabled)')).focus({ preventScroll: true });
        break;
      }
      case "stall-stock": {
        const n = Number(button.dataset.quantity);
        confirm(`补 ${n} 杯原料？`, `花 ${n * T.STALL.unitCost} 币，没用的原料留着以后用。补货不会替你恢复已暂停的营业。`, "确认补货", () => {
          if (commit({ type: action, quantity: n })) openStall();
        }); break;
      }
      case "stall-tab":
        if (["menu", "ingredients"].includes(button.dataset.tab)) { stallTab = button.dataset.tab; openStall(); }
        break;
      case "stall-menu":
        if (commit({ type: action, id: button.dataset.id, enabled: button.dataset.enabled === "true" })) openStall();
        break;
      case "stall-auto":
        if (commit({ type: action, rule: { enabled: $("#auto-stock-enabled").checked, target: Number($("#auto-stock-target").value), budget: Number($("#auto-stock-budget").value), reserve: Number($("#auto-stock-reserve").value) } })) {
          openStall(); toast("自动进货规则已保存，结束游戏日营业前才会执行。");
        }
        break;
      case "stall-drink-price": {
        const id = button.dataset.id, item = state.stall?.menu[id];
        if (item && commit({ type: action, id, price: item.price + Number(button.dataset.change) })) {
          const scroll = modal.scrollTop; openStall(); modal.scrollTop = scroll;
          $(`[data-drink="${id}"] [data-action="stall-drink-price"]:not(:disabled)`)?.focus({ preventScroll: true });
        }
        break;
      }
      case "stall-ingredient": {
        const id = button.dataset.id, g = T.INGREDIENTS[id], quantity = Number(button.dataset.quantity);
        if (!g) break;
        confirm(`买 ${quantity} 份${g.name}？`, `每份 ${g.cost} 币，一共 ${g.cost * quantity} 币。剩下的原料留着下次用，不会替你恢复已暂停的营业。`, "确认进货", () => {
          if (commit({ type: "stall-stock", ingredient: id, quantity })) openStall();
        });
        break;
      }
      case "stall-repair":
        confirm("修好龙头？", `维修花 ${T.STALL.repair} 币，不保证之后赚钱。修好后，未暂停的小摊会在下次结束游戏日时继续营业。`, "确认维修", () => { if (commit({ type: action })) openStall(); }); break;
      case "stall-close":
        confirm("结束这家小摊？", `不再营业或扣营业费。未用原料退回 ${T.inventoryValue(state.stall)} 币，摊车工具不退款。经营记录保留，重新开店要重新投入。`, "确认关店", () => { if (commit({ type: action })) openStall(); }); break;
      case "stall-pause":
        if (commit({ type: action })) openStall();
        break;
      case "stall-resume":
        confirm("恢复自动营业？", "之后每个营业日自动扣 2 币营业费，即使没有客人也要付。", "继续营业", () => { if (commit({ type: action })) openStall(); }); break;
      case "invest": case "sell": trade(action, button.dataset.id); break;
      case "event": eventAction(button.dataset.choice); break;
      case "play": startPlay(button.dataset.id); break;
      case "play-hit": playHit(); break;
    }
  });
  $("#modal-body").addEventListener("keydown", (event) => {
    if (event.target.matches('[data-action="paint"]') && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      event.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  $("#close-modal").addEventListener("click", close);
  modal.addEventListener("close", () => {
    if (modal.open) return;
    clearJoyFeedback(); drawing = null;
    miniController?.destroy(); miniController = null;
    confirmation = null; confirmationReturn = null; task = null; play = null;
    guideScreen = "town"; guideManual = false; guideExpanded = false;
    renderGuide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && guideExpanded) {
      event.preventDefault();
      event.stopPropagation();
      setGuideExpanded(false, true);
    }
  }, true);
  document.addEventListener("pointerdown", (event) => {
    if (guideExpanded && !coach.contains(event.target) && !event.target.closest('[data-open="guide"]')) setGuideExpanded(false);
  });
  document.addEventListener("scroll", scheduleGuidePosition, true);
  window.addEventListener("resize", scheduleGuidePosition);
  window.visualViewport?.addEventListener("resize", scheduleGuidePosition);
  $("#sound").addEventListener("click", () => { sound = !sound; updateSound(); chime(); });
  $("#reset").addEventListener("click", () => confirm("真的要重新开始吗？", "这会清除当前浏览器里的钱、物品和节日回忆，回到第 1 天、100 币。这个操作不能撤销。", "清除进度，重新开始", () => {
    state = T.create(); cart = []; shopCategory = "文具"; persist(); close(); render(); toast("新的放学故事，从你开始。点小手可以看提示。");
  }));
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY || !event.newValue) return;
    try {
      const updated = JSON.parse(event.newValue);
      if (T.valid(updated)) { state = T.restore(updated); cart = []; close(); render(); toast("另一个窗口更新了小镇，已同步最新进度。"); }
    } catch { /* Leave the current game intact when another tab writes invalid data. */ }
  });
  render(); updateSound();
  if (storageWarning) { $("#save-status").textContent = storageWarning; toast(storageWarning); }
})();
