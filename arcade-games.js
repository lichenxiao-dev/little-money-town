(function (root) {
  "use strict";

  const META = {
    catcher: { icon: "📦", title: "小店接货员", intro: "帮小店接好送来的货物！", rule: "移动篮子接包裹，避开破损货物。", reward: 8 },
    balloons: { icon: "🎈", title: "校园气球赛", intro: "来参加校园游园会，试试你的眼力和手速！", rule: "气球往上飞，分越高越快。35 秒内达到目标分数！", reward: 9 },
    digging: { icon: "🌱", title: "花园寻物员", intro: "规划路线，把种子袋送回园丁身边！", rule: "找齐种子，还要留精力走回入口。", reward: 10 }
  };
  const COLORS = [
    { name: "红色", value: "#ed8497" }, { name: "蓝色", value: "#81b9ec" },
    { name: "黄色", value: "#f5cf68" }, { name: "绿色", value: "#8dc8a1" }
  ];
  const SHAPES = [{ name: "圆点", icon: "●" }, { name: "菱形", icon: "◆" }, { name: "星星", icon: "★" }];
  const clone = (value) => structuredClone(value);
  const bounded = (value, low, high) => Math.min(high, Math.max(low, value));
  const integer = Number.isInteger;
  const finite = Number.isFinite;

  function randomInt(rng, count) {
    const value = rng();
    if (!finite(value) || value < 0 || value >= 1) throw new RangeError("rng must return a number in [0, 1)");
    return Math.floor(value * count);
  }
  function neighbors(index, width) {
    const result = [];
    if (index % width) result.push(index - 1);
    if (index % width < width - 1) result.push(index + 1);
    if (index >= width) result.push(index - width);
    if (index < width * (width - 1)) result.push(index + width);
    return result;
  }
  function balloonLabel(balloon) {
    return `${COLORS[balloon.color].name}${SHAPES[balloon.shape].name}，${balloon.points}分`;
  }
  function hittable(game, balloon) {
    const fraction = (game.elapsed - balloon.start) / balloon.flight;
    return !balloon.popped && fraction >= 0.08 && fraction < 0.92;
  }
  function create(id, level = 1, rng = Math.random) {
    if (!Object.prototype.hasOwnProperty.call(META, id)) throw new RangeError("Unknown arcade game");
    if (!integer(level) || level < 1 || level > 5) throw new RangeError("level must be 1..5");
    if (typeof rng !== "function") throw new TypeError("rng must be a function");
    const game = { id, level, mistakes: 0, assists: 0, won: false, lost: false, feedback: "", revision: 0 };
    if (id === "catcher") {
      Object.assign(game, {
        goal: 6 + level, score: 0, lives: level <= 2 ? 4 : 3, basket: 50,
        duration: 4000 - level * 300, elapsed: 0, item: 0, radius: 12 - level * 0.5,
        deliveries: Array.from({ length: 12 + level }, (_, i) => ({
          kind: i % 4 === 3 ? "damaged" : i % 5 === 0 ? "box" : "parcel",
          x: 14 + randomInt(rng, 73)
        }))
      });
    } else if (id === "balloons") {
      const duration = 35000, lanes = level >= 4 ? 4 : 3, balloons = [];
      for (let lane = 0; lane < lanes; lane++) {
        const offset = randomInt(rng, 3);
        let start = lane * 650, cycle = 0;
        while (start < duration) {
          const points = (cycle + offset) % 3 + 1;
          const flight = Math.round(([7200, 5500, 3900][points - 1] - level * 250) * 0.72);
          balloons.push({
            id: `${lane}-${cycle}`, lane, points, shape: points - 1,
            color: randomInt(rng, COLORS.length), phase: randomInt(rng, 628) / 100,
            start, flight, popped: false, poppedAt: null
          });
          start += flight + 450;
          cycle++;
        }
      }
      Object.assign(game, {
        goal: [12, 18, 24, 30, 36][level - 1], score: 0, elapsed: 0,
        duration, lanes, balloons
      });
    } else {
      const width = level === 1 ? 4 : level < 4 ? 5 : 6;
      const entry = randomInt(rng, width);
      const path = [entry];
      let column = entry;
      for (let row = 1; row < width; row++) {
        path.push(row * width + column);
        const direction = column === 0 ? 1 : column === width - 1 ? -1 : randomInt(rng, 2) ? 1 : -1;
        const steps = level >= 4 ? 2 : 1;
        for (let step = 0; step < steps; step++) {
          const next = column + direction;
          if (next < 0 || next >= width) break;
          column = next;
          path.push(row * width + column);
        }
      }
      const goal = 2 + Math.floor(level / 2);
      const targets = Array.from({ length: goal }, (_, i) => path[Math.ceil((i + 1) * (path.length - 1) / goal)]);
      const cells = Array.from({ length: width * width }, (_, index) => ({
        rock: !path.includes(index) && randomInt(rng, 100) < 20 + level * 5,
        open: index === entry, seed: targets.includes(index),
        hardness: !path.includes(index) && randomInt(rng, 100) < 35 + level * 6 ? 2 : 1
      }));
      Object.assign(game, {
        width, entry, position: entry, path, cells, goal, score: 0,
        budget: 2 * (path.length - 1) + (6 - level), scans: level === 1 ? 0 : level < 4 ? 2 : 1, scanned: level === 1, hint: null
      });
    }
    return game;
  }
  function digHint(game) {
    const distance = Array(game.cells.length).fill(Infinity), previous = [], visited = new Set();
    distance[game.position] = 0;
    while (visited.size < game.cells.length) {
      let current = -1;
      for (let i = 0; i < distance.length; i++) if (!visited.has(i) && (current < 0 || distance[i] < distance[current])) current = i;
      if (current < 0 || !finite(distance[current])) return null;
      const cell = game.cells[current];
      if (game.score === game.goal ? current === game.entry : cell.seed && !cell.open) {
        while (previous[current] !== game.position && previous[current] !== undefined) current = previous[current];
        return current === game.position ? null : current;
      }
      visited.add(current);
      for (const next of neighbors(current, game.width)) {
        const target = game.cells[next];
        const cost = target.open ? 1 : target.hardness;
        if (!target.rock && distance[current] + cost < distance[next]) {
          distance[next] = distance[current] + cost; previous[next] = current;
        }
      }
    }
    return null;
  }

  function notice(game, text) {
    game.feedback = text;
    game.revision++;
  }
  function complete(game) {
    if (game.score >= game.goal) {
      game.won = true;
      notice(game, "完成啦，谢谢你的帮忙！");
    }
  }
  function lose(game, text) {
    game.lost = true;
    notice(game, `${text} 再试一次吧，不扣钱。`);
  }
  function move(input, action) {
    const game = clone(input);
    if (!game || game.won || game.lost || !action || typeof action !== "object") return game;
    if (game.id === "catcher") {
      if (action.type === "basket" && finite(action.x) && action.x >= 0 && action.x <= 100) {
        game.basket = bounded(action.x, 7, 93);
      } else if (action.type === "step" && (action.direction === -1 || action.direction === 1)) {
        game.basket = bounded(game.basket + action.direction * 8, 7, 93);
      } else if (action.type === "tick" && finite(action.ms) && action.ms > 0) {
        game.elapsed += Math.min(action.ms, 100);
        if (game.elapsed >= game.duration) {
          const delivery = game.deliveries[game.item];
          const caught = Math.abs(delivery.x - game.basket) <= game.radius;
          if (delivery.kind === "damaged") {
            if (caught) {
              game.lives--;
              game.mistakes++;
              notice(game, "这是破损货物，下次让它落到回收区。");
            } else notice(game, "避开破损货物了！");
          } else if (caught) {
            const count = delivery.kind === "box" ? 2 : 1;
            game.score += count;
            notice(game, `接好啦！+${count} 件`);
          } else {
            game.mistakes++;
            notice(game, "漏接了，把篮子移到下一件下面。");
          }
          game.item++;
          game.elapsed = 0;
          complete(game);
          if (!game.won && (game.lives === 0 || game.item >= game.deliveries.length)) {
            lose(game, game.lives === 0 ? "先把破损货物分开。" : "这一车送完了。");
          }
        }
      }
    } else if (game.id === "balloons") {
      if (action.type === "pop" && typeof action.id === "string") {
        const balloon = game.balloons.find((item) => item.id === action.id);
        if (!balloon || !hittable(game, balloon)) return game;
        balloon.popped = true;
        balloon.poppedAt = game.elapsed;
        game.score += balloon.points;
        notice(game, `打中啦！+${balloon.points} 分${game.score >= game.goal ? "，已经达标，继续试试更高分！" : ""}`);
      } else if (action.type === "tick" && finite(action.ms) && action.ms > 0) {
        game.elapsed = Math.min(game.duration, game.elapsed + Math.min(action.ms, 100));
        if (game.elapsed === game.duration) {
          if (game.score >= game.goal) complete(game);
          else lose(game, `时间到！打中 ${game.score} 分，目标是 ${game.goal} 分。`);
        }
      }
    } else if (game.id === "digging") {
      if (action.type === "scan" && game.scans > 0 && !game.scanned && game.hint === null) {
        game.scans--;
        game.assists++;
        game.hint = digHint(game);
        notice(game, "只提示下一步，后面的路线还要自己想。");
      } else if (action.type === "dig" && integer(action.index) && action.index >= 0 && action.index < game.cells.length) {
        const cell = game.cells[action.index];
        if (cell.rock || !neighbors(game.position, game.width).includes(action.index)) return game;
        const cost = cell.open ? 1 : cell.hardness, found = cell.seed && !cell.open;
        if (cost > game.budget) {
          game.mistakes++;
          lose(game, `这里要 ${cost} 点精力，剩下的精力不够了。`);
          return game;
        }
        cell.open = true; game.position = action.index; game.hint = null;
        game.budget -= cost;
        if (found) {
          game.score++;
          notice(game, "找到种子袋啦！");
        } else notice(game, cost === 2 ? "硬土用了 2 点精力，看看下一步怎么走。" : "走了 1 步，记得给回程留精力。");
        if (game.score === game.goal) {
          if (game.position === game.entry) complete(game);
          else notice(game, "种子找齐啦！带回 🚪 入口才算完成。");
        }
        if (!game.won && game.budget === 0) { game.mistakes++; lose(game, "精力用完了，下次试试更省力的路线。"); }
      }
    }
    return game;
  }
  function mount(host, { id, level = 1, stage = 1, onWin } = {}) {
    let game = create(id, level);
    const doc = host.ownerDocument;
    const win = doc.defaultView;
    const abort = new win.AbortController();
    let active = true, awarded = false, frame = 0, lastTime = null;
    let manualPause = false, background = doc.hidden || !doc.hasFocus();
    let heldDirection = 0, heldTime = 0, dragPointer = null;
    let paintedBalloons = null, paintedRevision = -1;
    let tiltEnabled = false, tiltPending = false, tiltListening = false, tiltCenter = null, tiltOrigin = 50, tiltTimer = 0;
    const shownStage = integer(stage) && stage > 0 ? stage : 1;
    const on = (element, event, fn) => element.addEventListener(event, fn, { signal: abort.signal });
    const rules = {
      catcher: "包裹算 1 件，整箱算 2 件；带 × 的破损货物要避开。漏接会少收货，接到破损货会用掉一次机会。键盘 ← → 或 A / D 移动，按住可连续移动；操作区按空格暂停或继续。平板开始游戏时会自动尝试倾斜控制；首次使用可能需要允许系统权限，并通过 HTTPS 或本机地址打开。拿稳平板后，左右倾斜来移动；转屏或暂停后重新以当前姿势为准。不同意或不支持时，仍能用手指拖动篮子或按左右键。",
      balloons: "气球从下面升起来。圆点 1 分、菱形 2 分、星星 3 分，分越高飞得越快。35 秒结束后，达到目标分数就过关；漏掉气球不扣分。先打哪个由你决定。手指点气球，或按 Tab 选择再按空格、Enter；数字 1～4 对应从左到右的列，只能打到已经飞进场的气球。分数不是金币，通关才领固定报酬。",
      digging: "🙂 是你的位置，每次只能走到上下左右相邻的一格。普通土和已开小路花 1 点精力，硬土花 2 点，石头不能走。先选找种子的顺序，别忘了还要走回入口。绕路可能省下挖硬土的精力，也可能更费力。提示只给下一步，次数有限。第一档会显示一条参考路线。这里的精力只属于这关，不扣首页精力；失败可以重来。方向键选格，Enter 或空格走过去。"
    };
    host.innerHTML = `<section class="arcade-root" data-arcade-game="${id}">
      <div class="game-hud arcade-hud" data-difficulty="${level}"><span>第 ${shownStage} 关</span><strong>${META[id].title}</strong><span class="arcade-progress"></span></div>
      <p class="arcade-rule">${id === "catcher" && !win.navigator.maxTouchPoints ? "← → / A D 移动篮子，接包裹、躲开破损货物。" : META[id].rule}</p>
      <div class="arcade-counters"></div>
      <div class="arcade-board" data-arcade="board" tabindex="0" aria-label="${META[id].title}操作区"></div>
      <p class="arcade-feedback" role="status" aria-live="polite"></p>
      <div class="arcade-controls">
        ${id === "catcher" ? '<button type="button" data-arcade="left" aria-label="篮子向左">◀ 左</button><button type="button" data-arcade="right" aria-label="篮子向右">右 ▶</button>' : ""}
        ${id === "digging" ? '<button type="button" data-arcade="scan">👣 提示一步</button>' : '<button type="button" data-arcade="pause">暂停</button>'}
        <button type="button" data-arcade="restart">重新来</button>
      </div>
      <details class="arcade-guide"><summary>? 玩法提示</summary><p>${rules[id]}</p>${id === "catcher" ? '<button type="button" class="button secondary" data-arcade="tilt" aria-pressed="false">启用倾斜控制</button>' : ""}<p>这里的件数只是任务进度，不是钱包里的钱。完成劳动后领取约定报酬；重来不扣钱，但会保留失误和帮助记录。</p></details>
    </section>`;
    const rootElement = host.querySelector(".arcade-root");
    const board = host.querySelector(".arcade-board");
    const progress = host.querySelector(".arcade-progress");
    const counters = host.querySelector(".arcade-counters");
    const feedback = host.querySelector(".arcade-feedback");
    const restart = host.querySelector('[data-arcade="restart"]');
    const pause = host.querySelector('[data-arcade="pause"]');
    const tilt = host.querySelector('[data-arcade="tilt"]');
    let focusCell = game.entry || 0;
    function focusBoard() {
      const target = id === "digging" ? board.querySelector(`[data-cell="${game.position}"]`)
        : id === "balloons" ? board.querySelector('[data-balloon][data-popped="false"]') : board;
      if (id === "digging") focusCell = game.position;
      (target || board).focus({ preventScroll: true });
    }

    function connected() {
      return active && host.isConnected && host.contains(rootElement);
    }
    function stopped() {
      return background || manualPause || tiltPending || game.won || game.lost;
    }
    function stopTilt() {
      win.removeEventListener("deviceorientation", orient);
      tiltListening = false;
      tiltCenter = null;
      win.clearTimeout(tiltTimer);
    }
    function orient(event) {
      if (!connected() || stopped() || !tiltEnabled || heldDirection || dragPointer !== null || !finite(event.gamma) || !finite(event.beta)) return;
      win.clearTimeout(tiltTimer);
      const angle = (win.screen.orientation?.angle ?? win.orientation ?? 0) * Math.PI / 180;
      const value = event.gamma * Math.cos(angle) + event.beta * Math.sin(angle);
      if (tiltCenter === null) { tiltCenter = value; tiltOrigin = game.basket; }
      dispatch({ type: "basket", x: bounded(tiltOrigin + (value - tiltCenter) * 2, 7, 93) });
    }
    function syncTilt() {
      if (!tilt) return;
      tilt.disabled = tiltPending || game.won || game.lost;
      tilt.textContent = tiltPending ? "等待允许…" : tiltEnabled ? "关闭倾斜控制" : "启用倾斜控制";
      tilt.setAttribute("aria-pressed", String(tiltEnabled));
      if (!tiltEnabled || stopped() || !connected()) { stopTilt(); return; }
      if (tiltListening) return;
      tiltListening = true;
      win.addEventListener("deviceorientation", orient, { signal: abort.signal });
      tiltTimer = win.setTimeout(() => {
        if (!connected() || !tiltEnabled) return;
        tiltEnabled = false;
        notice(game, "没有收到倾斜信号，先用手指拖动篮子吧。");
        render();
      }, 2500);
    }
    async function toggleTilt() {
      if (tiltPending) return;
      if (tiltEnabled) { tiltEnabled = false; render(); return; }
      if (!win.isSecureContext || !win.DeviceOrientationEvent) {
        notice(game, "这里暂时不能感应倾斜，可以用手指拖动篮子或按左右键。");
        render();
        return;
      }
      tiltPending = true;
      render();
      try {
        const permission = typeof win.DeviceOrientationEvent.requestPermission === "function"
          ? await win.DeviceOrientationEvent.requestPermission() : "granted";
        if (!connected()) return;
        tiltEnabled = permission === "granted";
        notice(game, tiltEnabled ? "拿稳平板，再左右倾斜试试！" : "没有开启感应，仍可拖动篮子或按左右键。");
      } catch {
        if (connected()) notice(game, "感应没能开启，先用手指拖动篮子吧。");
      } finally {
        tiltPending = false;
        if (connected()) { render(); schedule(); }
      }
    }
    const recalibrate = () => { tiltCenter = null; };
    on(win, "orientationchange", recalibrate);
    if (win.screen.orientation) on(win.screen.orientation, "change", recalibrate);
    function finish() {
      if (!game.won || awarded || !connected()) return;
      awarded = true;
      const errors = game.mistakes + game.assists;
      if (typeof onWin === "function") onWin({
        level: game.level, mistakes: game.mistakes, assists: game.assists,
        stars: errors === 0 ? 3 : errors <= 3 ? 2 : 1,
        score: game.score, goal: game.goal
      });
    }
    function dispatch(action) {
      if (!connected()) { destroy(); return; }
      game = move(game, action);
      render();
      finish();
    }
    function render() {
      syncTilt();
      progress.textContent = `${game.score} / ${game.goal}`;
      rootElement.dataset.state = game.won ? "won" : game.lost ? "lost" : stopped() ? "paused" : "playing";
      board.setAttribute("aria-disabled", String(stopped()));
      if (paintedRevision !== game.revision) {
        feedback.textContent = game.feedback || META[id].intro;
        feedback.dataset.tone = game.won ? "success" : game.lost ? "retry" : "notice";
        paintedRevision = game.revision;
      }
      restart.disabled = game.won;
      if (pause) {
        pause.textContent = manualPause ? "继续" : "暂停";
        pause.disabled = game.won || game.lost;
        pause.setAttribute("aria-pressed", String(manualPause));
      }
      if (id === "catcher") renderCatcher();
      else if (id === "balloons") renderBalloons();
      else renderDigging();
    }
    function renderCatcher() {
      counters.textContent = `余 ${game.deliveries.length - game.item} 次送货 · 避损机会 ${game.lives}`;
      if (!board.querySelector(".arcade-basket")) {
        board.classList.add("arcade-yard");
        board.innerHTML = '<span class="arcade-drop" data-arcade="delivery"></span><span class="arcade-basket" data-arcade="basket" role="img" aria-label="接货篮子">🧺</span><span class="arcade-floor">接货区</span><span class="arcade-paused">已暂停</span>';
      }
      const delivery = game.deliveries[game.item];
      const drop = board.querySelector(".arcade-drop");
      drop.hidden = !delivery || game.won || game.lost;
      if (delivery) {
        drop.textContent = delivery.kind === "damaged" ? "📦 ×" : delivery.kind === "box" ? "📦 2" : "📦 1";
        drop.dataset.kind = delivery.kind;
        drop.setAttribute("aria-label", delivery.kind === "damaged" ? "破损货物，请避开" : delivery.kind === "box" ? "整箱，2 件" : "包裹，1 件");
        drop.style.left = `${delivery.x}%`;
        drop.style.top = `${8 + game.elapsed / game.duration * 72}%`;
      }
      board.querySelector(".arcade-basket").style.left = `${game.basket}%`;
      for (const button of rootElement.querySelectorAll('[data-arcade="left"], [data-arcade="right"]')) button.disabled = stopped();
    }
    function renderBalloons() {
      const time = Math.max(0, Math.ceil((game.duration - game.elapsed) / 1000));
      counters.classList.add("balloon-mission");
      counters.dataset.score = String(game.score);
      counters.dataset.goal = String(game.goal);
      const summary = `${time}:${game.score}:${game.goal}`;
      if (counters.dataset.summary !== summary) {
        counters.innerHTML = `<div class="balloon-score"><strong>${game.score} <small>分</small></strong><span>目标 ${game.goal} 分</span></div><div class="balloon-clock" aria-label="剩余 ${time} 秒">⏳ ${time}<small>秒</small></div>`;
        counters.dataset.summary = summary;
      }
      board.classList.add("arcade-sky");
      const visible = game.balloons.filter((b) => game.elapsed >= b.start && game.elapsed < b.start + b.flight && (!b.popped || game.elapsed - b.poppedAt < 220));
      const key = visible.map((b) => b.id).join(",");
      if (paintedBalloons !== key) {
        const oldFocus = doc.activeElement;
        const focusedBalloon = oldFocus && board.contains(oldFocus) && oldFocus.matches("[data-balloon]");
        const focusNumber = focusedBalloon ? oldFocus.dataset.number : null;
        board.innerHTML = visible.map((balloon) => `<button type="button" class="arcade-balloon" data-balloon="${balloon.id}" data-number="${balloon.lane + 1}" data-points="${balloon.points}" data-color="${balloon.color}" data-shape="${balloon.shape}" aria-label="第${balloon.lane + 1}列，${balloonLabel(balloon)}气球" style="--arcade-color:${COLORS[balloon.color].value}"><span aria-hidden="true">${SHAPES[balloon.shape].icon}</span><b class="balloon-points" aria-hidden="true">+${balloon.points}</b><small aria-hidden="true">${balloon.lane + 1}</small><i class="balloon-knot" aria-hidden="true"></i></button>`).join("") + '<span class="arcade-paused">已暂停</span>';
        paintedBalloons = key;
        if (focusNumber) (board.querySelector(`[data-number="${focusNumber}"]`) || board).focus({ preventScroll: true });
      }
      visible.forEach((balloon) => {
        const button = board.querySelector(`[data-balloon="${balloon.id}"]`);
        const age = game.elapsed - balloon.start;
        const x = (balloon.lane + 0.5) * 100 / game.lanes + Math.sin(age / 1200 + balloon.phase) * 1.5;
        const y = 112 - age / balloon.flight * 124;
        button.style.left = `${x}%`;
        button.style.top = `${y}%`;
        button.dataset.popped = String(balloon.popped);
        button.setAttribute("aria-disabled", String(!hittable(game, balloon) || stopped()));
      });
    }
    function renderDigging() {
      counters.textContent = `精力 ${game.budget} · 种子 ${game.score} / ${game.goal}${game.score === game.goal && !game.won ? " · 返回 🚪" : ""}`;
      counters.dataset.position = game.position;
      counters.dataset.entry = game.entry;
      board.classList.add("arcade-garden");
      board.style.setProperty("--arcade-columns", game.width);
      if (!board.querySelector("[data-cell]")) {
        board.innerHTML = game.cells.map((_, index) => `<button type="button" class="arcade-cell" data-cell="${index}"></button>`).join("");
      }
      const scan = rootElement.querySelector('[data-arcade="scan"]');
      scan.disabled = stopped() || game.scanned || game.scans === 0 || game.hint !== null;
      scan.textContent = game.scanned ? "👣 练习路线" : `👣 提示一步 · 剩 ${game.scans} 次`;
      game.cells.forEach((cell, index) => {
        const button = board.querySelector(`[data-cell="${index}"]`);
        const available = !cell.rock && neighbors(game.position, game.width).includes(index);
        const trail = game.scanned && game.path.includes(index) || game.hint === index;
        const cost = cell.open ? 1 : cell.hardness;
        button.innerHTML = `${index === game.position ? "🙂" : index === game.entry ? "🚪" : cell.rock ? "🪨" : cell.open ? "·" : cell.seed ? "⚑" : trail ? "👣" : cost === 2 ? "🟫" : ""}${!cell.rock && index !== game.position ? `<small>${cost} 点</small>` : ""}`;
        button.dataset.open = String(cell.open);
        button.dataset.seed = String(cell.seed);
        button.dataset.trail = String(trail);
        button.dataset.available = String(available && !stopped());
        button.dataset.rock = String(cell.rock);
        button.dataset.cost = cost;
        button.dataset.player = String(index === game.position);
        button.setAttribute("aria-disabled", String(!available || stopped()));
        button.tabIndex = index === focusCell ? 0 : -1;
        button.setAttribute("aria-label", `${Math.floor(index / game.width) + 1}行${index % game.width + 1}列，${index === game.position ? "你在这里" : index === game.entry ? "入口" : cell.rock ? "石头" : cell.open ? "已开小路" : cell.seed ? "种子袋" : cost === 2 ? "硬土" : "普通土"}${available ? `，花 ${cost} 点精力走过去` : ""}`);
      });
    }
    function reset() {
      if (awarded || game.won) return;
      const mistakes = game.mistakes, assists = game.assists;
      game = create(id, level);
      game.mistakes = mistakes;
      game.assists = assists + 1;
      notice(game, "重新开始，慢慢来！");
      paintedRevision = -1;
      paintedBalloons = null;
      focusCell = game.entry || 0;
      board.replaceChildren();
      manualPause = false;
      tiltCenter = null;
      heldDirection = 0;
      dragPointer = null;
      lastTime = null;
      render();
      schedule();
      focusBoard();
    }
    function point(event) {
      const rect = board.getBoundingClientRect();
      if (rect.width > 0) dispatch({ type: "basket", x: bounded((event.clientX - rect.left) / rect.width * 100, 0, 100) });
    }
    on(host, "click", (event) => {
      const button = event.target.closest("button");
      if (!button || !rootElement.contains(button)) return;
      const control = button.dataset.arcade;
      if (control === "restart") { reset(); return; }
      if (control === "tilt") { toggleTilt(); return; }
      if (control === "pause" && !game.won && !game.lost) {
        manualPause = !manualPause;
        heldDirection = 0;
        lastTime = null;
        render();
        if (manualPause) cancelFrame(); else schedule();
        return;
      }
      if (stopped()) return;
      if (control === "left" || control === "right") dispatch({ type: "step", direction: control === "left" ? -1 : 1 });
      else if (control === "scan") dispatch({ type: "scan" });
      else if (button.dataset.balloon) dispatch({ type: "pop", id: button.dataset.balloon });
      else if (button.dataset.cell !== undefined) {
        focusCell = Number(button.dataset.cell);
        dispatch({ type: "dig", index: focusCell });
      }
    });
    on(board, "pointerdown", (event) => {
      if (id !== "catcher" || stopped() || (event.button !== 0 && event.pointerType === "mouse")) return;
      dragPointer = event.pointerId;
      board.setPointerCapture(event.pointerId);
      board.focus({ preventScroll: true });
      point(event);
    });
    on(board, "pointermove", (event) => {
      if (id === "catcher" && !stopped() && event.pointerId === dragPointer) point(event);
    });
    on(host, "pointerdown", (event) => {
      const button = event.target.closest('[data-arcade="left"], [data-arcade="right"]');
      if (button && !stopped()) {
        heldDirection = button.dataset.arcade === "left" ? -1 : 1;
        heldTime = -180;
      }
    });
    const release = () => {
      heldDirection = 0;
      heldTime = 0;
      tiltCenter = null;
      if (dragPointer !== null && board.hasPointerCapture(dragPointer)) board.releasePointerCapture(dragPointer);
      dragPointer = null;
    };
    on(win, "pointerup", release);
    on(win, "pointercancel", release);
    on(host, "keydown", (event) => {
      if (id === "catcher" && event.target === board && event.key === " ") {
        event.preventDefault();
        if (!event.repeat) pause.click();
        return;
      }
      if (stopped() || event.target.closest("summary, details")) return;
      const direction = { ArrowLeft: -1, ArrowRight: 1, a: -1, A: -1, d: 1, D: 1 }[event.key];
      if (id === "catcher" && direction) {
        event.preventDefault();
        if (!event.repeat) {
          dispatch({ type: "step", direction });
          heldTime = -180;
        }
        heldDirection = direction;
      } else if (id === "balloons" && /^[1-6]$/.test(event.key)) {
        event.preventDefault();
        const balloon = game.balloons.find((b) => b.lane === Number(event.key) - 1 && hittable(game, b));
        if (balloon) dispatch({ type: "pop", id: balloon.id });
      } else if (id === "digging" && event.target.matches("[data-cell]") && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -game.width, ArrowDown: game.width };
        const next = focusCell + offsets[event.key];
        if (neighbors(focusCell, game.width).includes(next)) {
          focusCell = next;
          render();
          board.querySelector(`[data-cell="${focusCell}"]`).focus();
        }
      }
    });
    on(win, "keyup", (event) => { if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) release(); });
    on(host, "focusout", (event) => { if (!host.contains(event.relatedTarget)) release(); });
    function cancelFrame() {
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    }
    function backgroundChanged(value) {
      background = value;
      release();
      cancelFrame();
      if (!connected()) { destroy(); return; }
      render();
      schedule();
    }
    on(win, "blur", () => backgroundChanged(true));
    on(win, "focus", () => backgroundChanged(doc.hidden));
    on(doc, "visibilitychange", () => backgroundChanged(doc.hidden || !doc.hasFocus()));
    function schedule() {
      if (active && id !== "digging" && !stopped() && !frame) frame = win.requestAnimationFrame(tick);
    }
    function tick(time) {
      frame = 0;
      if (!connected()) { destroy(); return; }
      if (stopped()) { lastTime = null; return; }
      const ms = lastTime === null ? 0 : bounded(time - lastTime, 0, 80);
      lastTime = time;
      if (heldDirection && id === "catcher") {
        heldTime += ms;
        if (heldTime >= 60) {
          game = move(game, { type: "step", direction: heldDirection });
          heldTime = 0;
        }
      }
      if (ms > 0) dispatch({ type: "tick", ms });
      schedule();
    }
    // Covers replacement during a pause, when there is deliberately no RAF.
    const observer = new win.MutationObserver(() => { if (!connected()) destroy(); });
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    function destroy() {
      if (!active) return;
      active = false;
      stopTilt();
      cancelFrame();
      release();
      abort.abort();
      observer.disconnect();
    }
    render();
    focusBoard();
    schedule();
    if (id === "catcher" && win.navigator.maxTouchPoints > 0 && win.isSecureContext && win.DeviceOrientationEvent) toggleTilt();
    return { destroy };
  }

  const api = { META, create, move, mount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ArcadeGames = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
