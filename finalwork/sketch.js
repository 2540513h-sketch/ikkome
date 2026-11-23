// ゆめかわの空から落ちてくるもの。見た目で選ぶ？ それとも…
const SPEED = 4;            // 自分が動く速さ
const CATCH_DIST = 28;      // この距離まで近づくと取れる
const TIME_LIMIT = 1800;    // 60フレーム × 30秒
const POINTS = [1, 3];      // 種類ごとのポイント：[0]きれい、[1]有毒そう

let state = 'title';        // 'title'（はじめ）、'play'（遊ぶ）、'result'（結果）
let px;                     // 自分の横の位置
let items = [];             // 落ちてくるもの
let popups = [];            // 取ったときに浮かぶ「+3」などの文字
let points, best = 0;       // ポイントと、いちばん良かったポイント
let caught;                 // 取った数：[0]きれい、[1]有毒そう
let timeLeft, spawnTimer, pulse;

function setup() {
  createCanvas(400, 400);
  resetGame();
}

function resetGame() {
  px = width / 2;
  items = [];
  popups = [];
  points = 0;
  caught = [0, 0];
  timeLeft = TIME_LIMIT;
  spawnTimer = 0;
  pulse = 0;
}

function keyPressed() {
  if (key === ' ' && state !== 'play') {
    resetGame();
    state = 'play';
  }
}

function draw() {
  drawBackground();
  if (state === 'play') {
    updateGame();
  }
  drawItems();
  drawPlayer();
  drawPopups();
  if (state === 'title') {
    drawTitle();
  } else if (state === 'play') {
    drawHUD();
  } else {
    drawResult();
  }
}

function updateGame() {
  // 左右キーで動く
  if (keyIsDown(LEFT_ARROW)) px -= SPEED;
  if (keyIsDown(RIGHT_ARROW)) px += SPEED;
  px = constrain(px, 20, width - 20);

  // 時間がたつほど、落ちるのが速く、出てくる間隔が短くなる
  const passed = TIME_LIMIT - timeLeft;
  const fallSpeed = 1.5 + passed / 600;
  const interval = max(18, 50 - passed / 60);

  spawnTimer++;
  if (spawnTimer > interval) {
    items.push(makeItem());
    spawnTimer = 0;
  }

  const playerY = height - 40;
  for (let i = items.length - 1; i >= 0; i--) {
    items[i].y += fallSpeed;
    if (dist(px, playerY, items[i].x, items[i].y) < CATCH_DIST) {
      collect(items[i]);
      items.splice(i, 1);
    } else if (items[i].y > height + 20) {
      items.splice(i, 1);
    }
  }

  timeLeft--;
  if (timeLeft <= 0) {
    best = max(best, points);
    state = 'result';
  }
}

// 新しく落とすものを作る
function makeItem() {
  return {
    x: random(20, width - 20),
    y: -20,
    type: random() < 0.5 ? 0 : 1,
    spikes: makeSpikes(),
    phase: random(TWO_PI),
  };
}

// 取ったとき：種類ごとに決まった点数が入る
function collect(it) {
  const gain = POINTS[it.type];
  points += gain;
  caught[it.type]++;
  popups.push({ x: it.x, y: it.y, text: '+' + gain, life: 40 });
  pulse = 10;
}

// 有毒そうなもののトゲ（角度と長さをばらばらに）
function makeSpikes() {
  const list = [];
  const n = 7;
  for (let k = 0; k < n; k++) {
    list.push({ a: k * TWO_PI / n + random(-0.2, 0.2), len: random(8, 18) });
  }
  return list;
}

// 背景：水色→紫→ピンクの3色グラデーション
function drawBackground() {
  for (let y = 0; y < height; y++) {
    const t = y / height;
    let r, g, b;
    if (t < 0.5) {
      const k = t / 0.5;
      r = 170 + (200 - 170) * k;
      g = 220 + (150 - 220) * k;
      b = 255 + (230 - 255) * k;
    } else {
      const k = (t - 0.5) / 0.5;
      r = 200 + (255 - 200) * k;
      g = 150 + (180 - 150) * k;
      b = 230 + (210 - 230) * k;
    }
    stroke(r, g, b);
    line(0, y, width, y);
  }
}

// 落ちてくるものを描く（きれいなものはゆらゆら、有毒そうなものはふるえる）
function drawItems() {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.type === 0) {
      const x = it.x + sin(frameCount * 0.05 + it.phase) * 4;
      noStroke();
      fill(255, 255, 255, 110);
      ellipse(x, it.y, 22);
      fill(255, 240, 250, 230);
      ellipse(x, it.y, 12);
    } else {
      const x = it.x + random(-1, 1);
      stroke(120, 0, 40);
      strokeWeight(3);
      for (let k = 0; k < it.spikes.length; k++) {
        const s = it.spikes[k];
        line(x, it.y, x + cos(s.a) * s.len, it.y + sin(s.a) * s.len);
      }
      noStroke();
      fill(30, 0, 30);
      ellipse(x, it.y, 14);
    }
  }
}

// 自分：取った瞬間だけ少しふくらむ
function drawPlayer() {
  if (pulse > 0) pulse--;
  noStroke();
  fill(255, 120, 180);
  ellipse(px, height - 40, 30 + pulse);
}

// 「+3」などの文字を、上に浮かべながら消していく
function drawPopups() {
  textAlign(CENTER, CENTER);
  textSize(16);
  noStroke();
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.y -= 1;
    p.life--;
    fill(90, 40, 90, p.life * 6);
    text(p.text, p.x, p.y);
    if (p.life <= 0) {
      popups.splice(i, 1);
    }
  }
}

// はじめの画面：ルールは書かない。操作だけ
function drawTitle() {
  noStroke();
  fill(90, 40, 90);
  textAlign(CENTER, CENTER);
  textSize(22);
  text('ゆめのそら', width / 2, height / 2 - 30);
  textSize(14);
  text('← →　うごく', width / 2, height / 2 + 10);
  text('スペースではじめる', width / 2, height / 2 + 35);
}

// 遊んでいる間の表示：ポイントと残り時間
function drawHUD() {
  noStroke();
  fill(90, 40, 90);
  textSize(14);
  textAlign(LEFT, TOP);
  text(points + ' pt', 10, 10);
  textAlign(RIGHT, TOP);
  text(ceil(timeLeft / 60) + ' 秒', width - 10, 10);
}

// 結果画面：取った数を棒グラフで見せて、ここで初めて点数の仕組みを明かす
function drawResult() {
  noStroke();
  fill(255, 255, 255, 210);
  rect(30, 30, width - 60, height - 60, 14);

  fill(90, 40, 90);
  textAlign(CENTER, TOP);
  textSize(20);
  text(points + ' pt', width / 2, 45);
  textSize(12);
  text('ベスト ' + best + ' pt', width / 2, 72);

  // 取った数の棒グラフ
  const base = 250;
  const labels = ['きれいなもの', '有毒そうなもの'];
  for (let j = 0; j < 2; j++) {
    const h = min(caught[j] * 6, 130);
    const x = 120 + j * 120;
    if (j === 0) {
      fill(255, 180, 220);
    } else {
      fill(40, 0, 40);
    }
    rect(x - 25, base - h, 50, h);
    fill(90, 40, 90);
    text(labels[j], x, base + 6);
    text(caught[j] + ' こ', x, base - h - 18);
  }

  // ここで初めて、点数の仕組みを明かす
  textSize(13);
  text('きれいなもの 1pt ／ 有毒そうなもの 3pt', width / 2, 290);
  text('見た目で、選んでいませんでしたか？', width / 2, 312);
  textSize(12);
  text('スペースでもう一度', width / 2, 340);
}