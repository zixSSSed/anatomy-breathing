/* 3D-модель нижних дыхательных путей на three.js r128.
   Оси: +y вверх, +z — к зрителю (передняя сторона тела), правая сторона пациента — это -x. */
(function () {
  const A = window.App;
  const box = document.querySelector("[data-viewer]");
  if (!box) return;
  const canvas = box.querySelector("canvas");
  const infoEl = document.querySelector("[data-info]");
  const labelsEl = box.querySelector("[data-labels]");
  const phaseEl = box.querySelector("[data-phase]");

  function fallback(msg) {
    box.insertAdjacentHTML("beforeend", `<div class="v-fallback"><div><h3 style="margin-bottom:8px">3D-модель не загрузилась</h3><p class="small">${msg}</p><p class="small" style="margin-top:8px"><a href="schemes.html">Открыть плоские схемы</a></p></div></div>`);
    canvas.hidden = true;
    box.querySelectorAll(".v-tools,.v-zoom").forEach((e) => (e.hidden = true));
  }
  if (!window.THREE) return fallback("Не удалось загрузить библиотеку three.js. Проверьте интернет и обновите страницу.");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return fallback("Браузер не поддерживает WebGL.");
  }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);

  let dirty = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const CAM = { dist: 28.5, y: 0.75 };
  const root = new THREE.Group();
  root.position.y = 0;
  scene.add(root);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a96a3, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(5, 9, 12); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(-8, -3, -8); scene.add(rim);

  /* ---------- helpers ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mats = [];
  const col = (v) => new THREE.Color(A.cssVar(v) || "#cccccc");
  function mat(colorVar, opts = {}) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: col(colorVar), roughness: 0.55, metalness: 0 }, opts));
    m.userData.var = colorVar;
    m.userData.baseOpacity = m.opacity;
    mats.push(m);
    return m;
  }
  let seed = 12345;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function mergeGeos(list) {
    let vc = 0, ic = 0;
    list.forEach((g) => { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; });
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), idx = new Uint32Array(ic);
    let vo = 0, io = 0;
    list.forEach((g) => {
      pos.set(g.attributes.position.array, vo * 3);
      nor.set(g.attributes.normal.array, vo * 3);
      const n = g.attributes.position.count;
      if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
      else { for (let i = 0; i < n; i++) idx[io + i] = vo + i; io += n; }
      vo += n;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    return out;
  }
  const UP = V(0, 1, 0);
  function tubeGeo(a, b, rA, rB, seg = 14) {
    const d = b.clone().sub(a), len = d.length();
    const g = new THREE.CylinderGeometry(rB, rA, len, seg, 1, true);
    const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), V(1, 1, 1));
    g.applyMatrix4(m);
    return g;
  }
  function ballGeo(p, r, seg = 12) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.6));
    g.translate(p.x, p.y, p.z);
    return g;
  }
  // С-образное хрящевое полукольцо, открытое назад (к -z), ось направлена по dir
  function ringGeo(center, dir, r, tube) {
    const gap = 0.55;
    const g = new THREE.TorusGeometry(r, tube, 6, 28, Math.PI * 2 - gap * 2);
    g.rotateZ(-Math.PI / 2 + gap); // разрыв вокруг -y в плоскости XY
    g.rotateX(Math.PI / 2);        // кольцо в плоскости XZ, разрыв к -z
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    g.translate(center.x, center.y, center.z);
    return g;
  }

  /* ---------- parts registry ---------- */
  const parts = {};   // id -> {meshes:[], layer}
  const pickables = [];
  function addMesh(id, layer, geo, material, opts = {}) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData.part = id;
    if (opts.renderOrder != null) mesh.renderOrder = opts.renderOrder;
    (opts.parent || root).add(mesh);
    (parts[id] = parts[id] || { meshes: [], layer }).meshes.push(mesh);
    if (opts.pick !== false) pickables.push(mesh);
    return mesh;
  }

  /* ---------- larynx ---------- */
  const mCart = () => mat("--cartilage", { roughness: 0.45 });
  {
    // перстневидный хрящ
    const cr = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 32, 1, true);
    cr.translate(0, 4.62, 0);
    addMesh("cricoid", "tree", cr, mCart().clone(), {}).material.side = THREE.DoubleSide;
    // щитовидный хрящ: две пластинки, сходящиеся спереди
    const th = new THREE.CylinderGeometry(0.72, 0.62, 0.95, 24, 6, true, -1.3, 2.6);
    const p = th.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      let z = 0.78 - 0.88 * Math.abs(x);
      let ny = y;
      if (y > 0.4 && Math.abs(x) < 0.16) ny = y - (0.16 - Math.abs(x)) * 1.2; // вырезка сверху
      p.setXYZ(i, x * 1.05, ny, z);
    }
    th.computeVertexNormals();
    th.translate(0, 5.3, 0);
    const thm = mCart(); thm.side = THREE.DoubleSide;
    addMesh("thyroid", "tree", th, thm);
    // надгортанник
    const ep = new THREE.SphereGeometry(1, 20, 14);
    ep.scale(0.3, 0.62, 0.07); ep.rotateX(-0.28); ep.translate(0, 6.15, 0.05);
    addMesh("epi", "tree", ep, mCart());
    // черпаловидные
    const ar = mergeGeos([new THREE.ConeGeometry(0.13, 0.36, 10).translate(-0.2, 4.98, -0.32), new THREE.ConeGeometry(0.13, 0.36, 10).translate(0.2, 4.98, -0.32)]);
    addMesh("aryt", "tree", ar, mCart());
    // подъязычная кость
    const hy = new THREE.TorusGeometry(0.72, 0.075, 8, 30, Math.PI * 1.15);
    hy.rotateZ(-Math.PI * 0.075 + Math.PI); hy.rotateX(Math.PI / 2); hy.rotateY(Math.PI);
    hy.translate(0, 6.42, -0.05);
    addMesh("hyoid", "tree", hy, mat("--bone", { roughness: 0.6 }));
  }

  /* ---------- trachea ---------- */
  const B = V(0, 0.8, 0); // бифуркация
  {
    const tube = new THREE.CylinderGeometry(0.39, 0.39, 4.46 - B.y, 28, 1, true);
    tube.translate(0, (4.46 + B.y) / 2, 0);
    const tm = mat("--mucosa", { roughness: 0.7 }); tm.side = THREE.DoubleSide;
    addMesh("trachea", "tree", tube, tm);
    const rings = [];
    const N = 18;
    for (let i = 0; i < N; i++) {
      const y = 4.32 - i * ((4.32 - B.y - 0.22) / (N - 1));
      rings.push(ringGeo(V(0, y, 0), UP, 0.43, 0.075));
    }
    addMesh("trachea", "tree", mergeGeos(rings), mCart());
    addMesh("bif", "tree", ballGeo(B, 0.4, 20), mat("--mucosa", { roughness: 0.7 }));
  }

  /* ---------- bronchial tree ---------- */
  const deg = Math.PI / 180;
  const dR = V(-Math.sin(25 * deg), -Math.cos(25 * deg), 0); // правый: вертикальнее
  const dL = V(Math.sin(45 * deg), -Math.cos(45 * deg), 0);  // левый: 45° → вместе 70°
  const R = B.clone().addScaledVector(dR, 1.55);
  const L = B.clone().addScaledVector(dL, 2.55);
  function bronchus(id, a, b, rA, rB, nRings) {
    addMesh(id, "tree", mergeGeos([tubeGeo(a, b, rA, rB, 20), ballGeo(b, rB, 16)]), mat("--mucosa", { roughness: 0.7 }));
    if (nRings) {
      const dir = b.clone().sub(a);
      const rings = [];
      for (let i = 0; i < nRings; i++) {
        const t = 0.12 + (i * 0.8) / Math.max(1, nRings - 1);
        const r = rA + (rB - rA) * t;
        rings.push(ringGeo(a.clone().addScaledVector(dir, t), dir, r + 0.035, 0.05));
      }
      addMesh(id, "tree", mergeGeos(rings), mCart());
    }
  }
  bronchus("rmain", B, R, 0.36, 0.32, 7);   // 6–8 полуколец
  bronchus("lmain", B, L, 0.31, 0.27, 10);  // 9–12 полуколец

  // долевые и далее
  const LUNG = {
    R: { c: V(-2.35, -1.05, -0.1), a: 1.85, h: 3.55, d: 1.95, side: -1 },
    L: { c: V(2.4, -1.2, -0.1), a: 1.6, h: 3.7, d: 1.9, side: 1 },
  };
  function insideLung(p, k, margin = 0.85) {
    const l = LUNG[k];
    const q = p.clone().sub(l.c);
    return (q.x / l.a) ** 2 + (q.y / l.h) ** 2 + (q.z / l.d) ** 2 < margin * margin;
  }
  const lobar = [], segm = [], small = [], acini = [];
  function grow(p, dir, len, r, gen, lungK) {
    let d = dir.clone().normalize();
    let end = p.clone().addScaledVector(d, len);
    // держим ветви внутри лёгкого
    for (let tries = 0; tries < 6 && !insideLung(end, lungK, 0.92); tries++) {
      d.lerp(LUNG[lungK].c.clone().sub(p).normalize(), 0.35).normalize();
      end = p.clone().addScaledVector(d, len * 0.85);
    }
    const target = gen === 0 ? segm : small;
    target.push(tubeGeo(p, end, r, r * 0.82, gen === 0 ? 10 : 7), ballGeo(end, r * 0.82, 7));
    if (gen >= 3) {
      for (let i = 0; i < 3; i++) {
        const o = V(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.16);
        acini.push(ballGeo(end.clone().add(o), 0.07, 6));
      }
      return;
    }
    const n = 2;
    for (let i = 0; i < n; i++) {
      const jitter = V(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.15);
      const nd = d.clone().add(jitter).normalize();
      grow(end, nd, len * 0.72, r * 0.66, gen + 1, lungK);
    }
  }
  function lobe(start, dir, len, segDirs, lungK) {
    const d = dir.clone().normalize();
    const end = start.clone().addScaledVector(d, len);
    lobar.push(tubeGeo(start, end, 0.21, 0.18, 14), ballGeo(end, 0.18, 12));
    segDirs.forEach((sd) => grow(end, V(...sd), 0.95, 0.12, 0, lungK));
    return end;
  }
  // правое лёгкое: 3 доли, 10 сегментов (3 + 2 + 5)
  lobe(R, V(-0.8, 0.62, 0.05), 1.05, [[-0.2, 1, 0.1], [-0.6, 0.6, 0.6], [-0.5, 0.5, -0.7]], "R");
  const RI = R.clone().addScaledVector(V(-0.25, -1, 0.05).normalize(), 0.8);
  lobar.push(tubeGeo(R, RI, 0.23, 0.21, 14), ballGeo(RI, 0.21, 12));
  lobe(RI, V(-0.45, -0.45, 0.8), 0.95, [[-0.7, -0.2, 0.7], [0.1, -0.5, 1]], "R");
  lobe(RI, V(-0.22, -1, -0.15), 1.25, [[0, 0.1, -1], [-0.5, -1, 0.5], [-1, -0.8, 0], [-0.4, -1, -0.6], [0.3, -1, -0.3]], "R");
  // левое лёгкое: 2 доли, 10 сегментов (5 + 5)
  lobe(L, V(0.55, 0.75, 0.3), 1.1, [[0.1, 1, 0.1], [0.4, 0.7, -0.6], [0.5, 0.6, 0.7], [0.6, -0.3, 0.8], [0.3, -0.6, 1]], "L");
  lobe(L, V(0.3, -1, -0.2), 1.45, [[0.1, 0.1, -1], [0.4, -1, 0.5], [1, -0.8, 0], [0.5, -1, -0.6], [-0.2, -1, -0.3]], "L");
  addMesh("lobar", "tree", mergeGeos(lobar), mat("--mucosa", { roughness: 0.7 }));
  addMesh("segm", "tree", mergeGeos(segm), mat("--cartilage", { roughness: 0.5 }));
  addMesh("small", "tree", mergeGeos(small), mat("--cartilage", { roughness: 0.5 }));
  addMesh("acinus", "tree", mergeGeos(acini), mat("--lobe-1", { roughness: 0.8 }));

  /* ---------- lungs ---------- */
  const lungGroups = {};
  function buildLung(k) {
    const l = LUNG[k];
    const g0 = new THREE.SphereGeometry(1, 84, 64).toNonIndexed();
    const p = g0.attributes.position;
    const orig = new Float32Array(p.array);
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const taper = 0.5 + 0.5 * Math.pow((1 - y) / 2, 0.55); // уже к верхушке
      x *= taper; z *= taper;
      // медиальная поверхность уплощена
      const med = -l.side * x; // >0 — к срединной линии
      if (med > 0.45) x = -l.side * (0.45 + (med - 0.45) * 0.3);
      // сердечная вырезка левого лёгкого
      if (k === "L" && z > 0.1 && -x > 0.05 && y < 0.15 && y > -0.75) {
        const w = Math.sin(((y + 0.75) / 0.9) * Math.PI) * Math.min(1, (z - 0.1) / 0.4);
        x += 0.38 * w;
      }
      let Y = y * l.h;
      // вогнутое основание (диафрагмальная поверхность)
      if (y < -0.35) {
        const r2 = Math.min(1, (x * x) / 0.5 + (z * z) / 0.6);
        Y += (1 - r2) * 0.95 * Math.min(1, (-0.35 - y) / 0.5);
      }
      p.setXYZ(i, x * l.a, Y - l.h, z * l.d); // начало координат у верхушки: на вдохе лёгкое растягивается вниз
    }
    // распределяем треугольники по долям
    const buckets = k === "R" ? { up: [], mid: [], low: [] } : { up: [], low: [] };
    const posArr = p.array;
    for (let t = 0; t < p.count; t += 3) {
      let cy = 0, cz = 0;
      for (let j = 0; j < 3; j++) { cy += orig[(t + j) * 3 + 1]; cz += orig[(t + j) * 3 + 2]; }
      cy /= 3; cz /= 3;
      const oblique = (k === "R" ? -0.12 : -0.05) - 0.55 * cz;
      let b;
      if (cy < oblique) b = "low";
      else if (k === "R" && cy < 0.08) b = "mid";
      else b = "up";
      for (let j = 0; j < 9; j++) buckets[b].push(posArr[t * 3 + j]);
    }
    const grp = new THREE.Group();
    grp.position.set(l.c.x, l.c.y + l.h, l.c.z); // группа стоит в верхушке лёгкого
    root.add(grp);
    lungGroups[k] = grp;
    const colorVar = { up: "--lobe-1", mid: "--lobe-2", low: "--lobe-3" };
    for (const name in buckets) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(buckets[name], 3));
      g.computeVertexNormals();
      const m = mat(colorVar[name], { transparent: true, opacity: 0.36, depthWrite: false, side: THREE.DoubleSide, roughness: 0.75 });
      addMesh(`${k}-${name}`, "lungs", g, m, { parent: grp, renderOrder: 3 });
    }
    // плевра: чуть больше и на «ребро» ниже
    const pg = new THREE.SphereGeometry(1, 48, 36);
    const pp = pg.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      let x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      const taper = 0.5 + 0.5 * Math.pow((1 - y) / 2, 0.55);
      x *= taper; z *= taper;
      const med = -l.side * x;
      if (med > 0.45) x = -l.side * (0.45 + (med - 0.45) * 0.3);
      let Y = y * (l.h + 0.35);
      if (y < -0.35) { const r2 = Math.min(1, (x * x) / 0.5 + (z * z) / 0.6); Y += (1 - r2) * 0.8 * Math.min(1, (-0.35 - y) / 0.5); }
      pp.setXYZ(i, x * l.a * 1.07, Y - (l.h + 0.35) + 0.12, z * l.d * 1.07);
    }
    pg.computeVertexNormals();
    const pm = mat("--air", { transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, roughness: 0.3 });
    addMesh("pleura", "pleura", pg, pm, { parent: grp, renderOrder: 4 });
  }
  buildLung("R");
  buildLung("L");

  /* ---------- diaphragm ---------- */
  const diaph = new THREE.Group();
  root.add(diaph);
  const DIA_Y = -4.62;
  function domeY(x, z) {
    const r = 1.05 * Math.exp(-(((x + 2.35) ** 2) / 2.6 + (z * z) / 3.2)); // правый купол выше
    const l = 0.82 * Math.exp(-(((x - 2.4) ** 2) / 2.4 + (z * z) / 3.2));
    const c = 0.35 * Math.exp(-((x * x) / 1.2 + (z * z) / 2.5));
    const edge = -0.9 * Math.min(1, ((x * x) / 30 + (z * z) / 9));
    return r + l + c + edge;
  }
  {
    const g = new THREE.PlaneGeometry(8.8, 5.2, 70, 40);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, domeY(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const m = mat("--muscle", { transparent: true, opacity: 0.5, side: THREE.DoubleSide, roughness: 0.8, depthWrite: false });
    addMesh("diaph", "diaph", g, m, { parent: diaph, renderOrder: 2 });
    diaph.position.y = DIA_Y;
  }

  /* ---------- heart ---------- */
  {
    const g = new THREE.SphereGeometry(1, 32, 24);
    g.scale(1.25, 1.55, 1.1);
    g.rotateZ(0.65);
    g.translate(0.65, -2.95, 0.95);
    const m = mat("--artery", { transparent: true, opacity: 0.32, depthWrite: false, roughness: 0.6 });
    addMesh("heart", "heart", g, m, { renderOrder: 1 });
  }

  /* ---------- info ---------- */
  const INFO = {
    trachea: { t: "Трахея", lat: "trachea", topic: "41-trachea", f: ["От VI–VII шейного до IV–V грудного позвонка", "Длина 9–13 см, диаметр 15–18 мм", "16–20 хрящевых полуколец (на модели 18), открытых назад", "Задняя стенка — перепонка с гладкими мышцами; сзади пищевод"] },
    bif: { t: "Бифуркация трахеи", lat: "", topic: "41-bronchi", f: ["Место деления трахеи на два главных бронха", "Уровень IV–V грудных позвонков", "Главные бронхи расходятся под углом 70°"] },
    rmain: { t: "Правый главный бронх", lat: "bronchus principalis dexter", topic: "41-bronchi", f: ["Шире и короче левого: 1–3 см", "Расположен вертикальнее, как продолжение трахеи", "6–8 хрящевых полуколец (на модели 7)", "Над ним — непарная вена"] },
    lmain: { t: "Левый главный бронх", lat: "bronchus principalis sinister", topic: "41-bronchi", f: ["Длина 4–6 см, уже правого", "9–12 хрящевых полуколец (на модели 10)", "Над ним проходит дуга аорты"] },
    lobar: { t: "Долевые бронхи", lat: "", topic: "41-bronchi", f: ["Бронхи II порядка", "В правом лёгком 3, в левом 2 — по числу долей"] },
    segm: { t: "Сегментарные бронхи", lat: "", topic: "41-bronchi", f: ["Бронхи III порядка, по 10 в каждом лёгком", "Хрящи в них распадаются на отдельные пластинки", "Каждый идёт в свой бронхолёгочный сегмент вместе с ветвями лёгочной артерии и вены"] },
    small: { t: "Субсегментарные и дольковые бронхи, бронхиолы", lat: "", topic: "41-bronchi", f: ["Субсегментарные — IV–VII порядки, дольковые — VIII", "Конечные бронхиолы (12–18 в дольке): хрящей нет, есть мышечные волокна", "Всё от главного бронха до конечных бронхиол — бронхиальное дерево"] },
    acinus: { t: "Ацинусы", lat: "acinus", topic: "42-lungs", f: ["Дыхательные бронхиолы, альвеолярные ходы и альвеолы", "Структурно-функциональная единица лёгкого, здесь идёт газообмен", "До 800 тыс. ацинусов и до 500 млн альвеол", "Альвеолы 0,2–0,3 мм, изнутри покрыты сурфактантом"] },
    "R-up": { t: "Верхняя доля правого лёгкого", lat: "pulmo dexter", topic: "42-lungs", f: ["Правое лёгкое: 3 доли, 2 борозды, 10–11 сегментов", "Правое больше, короче и шире левого: правый купол диафрагмы выше", "Верхушка на 3–4 см выше I ребра"] },
    "R-mid": { t: "Средняя доля правого лёгкого", lat: "pulmo dexter", topic: "42-lungs", f: ["Есть только в правом лёгком", "Отделена горизонтальной и косой бороздами"] },
    "R-low": { t: "Нижняя доля правого лёгкого", lat: "pulmo dexter", topic: "42-lungs", f: ["Лежит ниже косой борозды", "Основание вогнуто — диафрагмальная поверхность", "Нижняя граница: по среднеключичной линии 6 ребро, по околопозвоночной 11"] },
    "L-up": { t: "Верхняя доля левого лёгкого", lat: "pulmo sinister", topic: "42-lungs", f: ["Левое лёгкое: 2 доли, 1 борозда, 10 сегментов", "На переднем крае — сердечная вырезка", "Передняя граница у хряща 4 ребра отклоняется влево на 4–5 см"] },
    "L-low": { t: "Нижняя доля левого лёгкого", lat: "pulmo sinister", topic: "42-lungs", f: ["Лежит ниже косой борозды", "Левое лёгкое уже и длиннее правого — сердце смещено влево"] },
    pleura: { t: "Плевра", lat: "pleura", topic: "42-pleura", f: ["Висцеральный листок сращён с лёгким, париетальный выстилает грудную полость", "В щели 2–5 мл жидкости, давление отрицательное", "Нижняя граница на ребро ниже лёгкого — здесь синусы", "Сердечной вырезки у плевры нет"] },
    diaph: { t: "Диафрагма", lat: "diaphragma", topic: "42-cycle", f: ["На вдохе сокращается, купол опускается", "На выдохе купол поднимается", "Правый купол выше левого — поэтому правое лёгкое короче", "Снизу сухожильный центр ограничивает средостение"] },
    heart: { t: "Сердце", lat: "cor", topic: "42-pleura", f: ["Лежит в переднем средостении", "Смещено влево — левое лёгкое уже, на нём сердечная вырезка"] },
    thyroid: { t: "Щитовидный хрящ гортани", lat: "larynx", topic: "41-larynx", f: ["Непарный хрящ; гортань на уровне IV–VI шейных позвонков", "К углу щитовидного хряща крепится голосовая связка", "Выступ у мальчиков 10–12 лет — кадык"] },
    cricoid: { t: "Перстневидный хрящ", lat: "", topic: "41-larynx", f: ["Непарный хрящ, основание гортани", "Ниже гортань переходит в трахею"] },
    epi: { t: "Надгортанник", lat: "epiglottis", topic: "41-larynx", f: ["Непарный хрящ", "Внутренние мышцы гортани поднимают и опускают его", "У новорождённого выше корня языка — можно дышать и глотать одновременно"] },
    aryt: { t: "Черпаловидные хрящи", lat: "", topic: "41-larynx", f: ["Парные хрящи на задней стороне гортани", "От голосового отростка черпаловидного хряща к углу щитовидного натянута голосовая связка"] },
    hyoid: { t: "Подъязычная кость", lat: "", topic: "41-larynx", f: ["Гортань подвешена к ней связками", "При глотании гортань смещается вместе с ней"] },
  };
  const LABELS = [
    ["hyoid", V(1.55, 6.55, 0.1), "Подъязычная кость"],
    ["epi", V(-1.2, 6.05, 0.1), "Надгортанник"],
    ["thyroid", V(0, 5.35, 0.85), "Гортань"],
    ["trachea", V(0.55, 2.9, 0.35), "Трахея"],
    ["bif", V(0, 1.15, 0.5), "Бифуркация"],
    ["rmain", V(-1.25, -0.35, 0.4), "Правый главный бронх"],
    ["lmain", V(1.95, -0.75, 0.4), "Левый главный бронх"],
    ["R-up", V(-2.8, 1.1, 0.8), "Верхняя доля"],
    ["R-mid", V(-2.9, -1.35, 1.35), "Средняя доля"],
    ["R-low", V(-2.9, -3.3, -0.2), "Нижняя доля"],
    ["L-up", V(2.9, 0.6, 0.9), "Верхняя доля"],
    ["L-low", V(3.0, -3.4, -0.3), "Нижняя доля"],
    ["segm", V(-1.5, -2.35, 0.3), "Сегментарные бронхи"],
    ["heart", V(0.9, -2.6, 2.1), "Сердце"],
    ["diaph", V(-3.6, -4.9, 1.4), "Диафрагма"],
  ];
  const labelEls = LABELS.map(([id, pos, txt]) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "v-label";
    el.textContent = txt;
    el.dataset.part = id;
    labelsEl.appendChild(el);
    return { id, pos, el };
  });

  /* ---------- selection ---------- */
  const accent = () => col("--accent");
  let selected = null;
  function paintSelection() {
    for (const id in parts) {
      const on = id === selected;
      parts[id].meshes.forEach((m) => {
        m.material.emissive = on ? accent().multiplyScalar(0.45) : new THREE.Color(0x000000);
        if (m.material.transparent) m.material.opacity = on ? Math.min(0.75, m.material.userData.baseOpacity * 2.2) : m.material.userData.baseOpacity;
      });
    }
    labelEls.forEach((l) => l.el.classList.toggle("on", l.id === selected));
    dirty = true;
  }
  function showInfo(id) {
    const d = INFO[id];
    if (!d) return;
    infoEl.innerHTML = `<div class="k">Выбрано на модели</div><h3>${d.t}${d.lat ? ` <span class="lat">${d.lat}</span>` : ""}</h3><ul>${d.f.map((x) => `<li>${x}</li>`).join("")}</ul><p class="small" style="margin-top:10px"><a href="${A.notesLink(d.topic)}">Читать в конспекте</a></p>`;
  }
  function select(id) {
    if (findMode) return answerFind(id);
    selected = id;
    paintSelection();
    showInfo(id);
  }
  labelsEl.addEventListener("click", (e) => { const b = e.target.closest(".v-label"); if (b) select(b.dataset.part); });

  /* ---------- find mode ---------- */
  let findMode = false, findQ = null, findScore = { ok: 0, all: 0 };
  const FIND = ["trachea", "bif", "rmain", "lmain", "R-up", "R-mid", "R-low", "L-up", "L-low", "diaph", "thyroid", "epi", "heart", "segm"];
  function askFind() {
    findQ = FIND[Math.floor(Math.random() * FIND.length)];
    selected = null; paintSelection();
    infoEl.innerHTML = `<div class="k">Найди на модели: ${findScore.ok} из ${findScore.all}</div><h3>Покажите: ${INFO[findQ].t.toLowerCase()}</h3><p class="small" style="color:var(--ink-2)">Подписи скрыты. Вращайте модель и нажмите на нужную часть.</p>`;
  }
  function answerFind(id) {
    if (!findQ) return;
    findScore.all++;
    const ok = id === findQ || (findQ === "trachea" && id === "bif" && false);
    if (ok) findScore.ok++;
    selected = findQ; paintSelection();
    infoEl.innerHTML = `<div class="k">Найди на модели: ${findScore.ok} из ${findScore.all}</div><h3>${ok ? "Верно" : `Это ${INFO[id] ? INFO[id].t.toLowerCase() : "другая часть"}`}</h3><p class="small" style="color:var(--ink-2)">${ok ? "" : `Нужная часть — ${INFO[findQ].t.toLowerCase()} — подсвечена. `}${INFO[findQ].f[0]}.</p><div class="row" style="margin-top:10px"><button class="btn primary sm" type="button" data-find-next>Следующая</button></div>`;
    findQ = null;
  }
  infoEl.addEventListener("click", (e) => { if (e.target.closest("[data-find-next]")) askFind(); });
  const findBtn = box.querySelector("[data-find]");
  const labelsBtn = box.querySelector("[data-labels-toggle]");
  let labelsOn = box.clientWidth > 560;
  labelsBtn.setAttribute("aria-pressed", labelsOn);
  labelsEl.style.display = labelsOn ? "" : "none";
  findBtn.addEventListener("click", () => {
    findMode = !findMode;
    findBtn.setAttribute("aria-pressed", findMode);
    labelsEl.style.display = findMode || !labelsOn ? "none" : "";
    if (findMode) { findScore = { ok: 0, all: 0 }; askFind(); }
    else { selected = null; paintSelection(); infoEl.innerHTML = `<div class="k">Как пользоваться</div><h3>Нажмите на часть модели</h3>`; }
  });
  labelsBtn.addEventListener("click", () => {
    labelsOn = !labelsOn;
    labelsBtn.setAttribute("aria-pressed", labelsOn);
    labelsEl.style.display = labelsOn && !findMode ? "" : "none";
  });

  /* ---------- layers ---------- */
  const layerVisible = { lungs: true, tree: true, pleura: false, diaph: true, heart: true };
  function applyLayers() {
    for (const id in parts) parts[id].meshes.forEach((m) => (m.visible = layerVisible[parts[id].layer]));
    labelEls.forEach((l) => (l.el.hidden = !layerVisible[(parts[l.id] || {}).layer]));
    dirty = true;
  }
  box.querySelectorAll("[data-layer]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.layer;
    layerVisible[k] = !layerVisible[k];
    b.setAttribute("aria-pressed", layerVisible[k]);
    applyLayers();
  }));
  applyLayers();

  /* ---------- interaction ---------- */
  const defaultDist = () => (box.clientWidth / Math.max(1, box.clientHeight) < 0.85 ? 35 : CAM.dist);
  const view = { ry: -0.35, rx: 0.06, dist: defaultDist() };
  let autoRotate = !reduce, drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, ry: view.ry, rx: view.rx, moved: 0, id: e.pointerId, type: e.pointerType };
    autoRotate = false;
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.type === "touch" && Math.abs(dy) > Math.abs(dx) * 1.2 && drag.moved < 12) return; // даём прокручивать страницу
    if (drag.moved > 4 && !drag.captured) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} drag.captured = true; }
    view.ry = drag.ry + dx * 0.008;
    view.rx = Math.max(-0.6, Math.min(0.6, drag.rx + dy * 0.005));
    dirty = true;
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  window.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasClick = drag.moved < 6;
    drag = null;
    if (!wasClick) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables.filter((m) => m.visible), false);
    if (!hits.length) return;
    // прозрачные лёгкие и плевра не должны закрывать бронхи внутри
    const solid = hits.find((h) => !h.object.material.transparent);
    const pick = solid || hits.find((h) => h.object.userData.part !== "pleura") || hits[0];
    select(pick.object.userData.part);
  });
  canvas.addEventListener("wheel", (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    view.dist = Math.max(12, Math.min(44, view.dist + e.deltaY * 0.02));
    dirty = true;
  }, { passive: false });
  box.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    view.dist = Math.max(12, Math.min(44, view.dist + (b.dataset.zoom === "in" ? -3 : 3)));
    dirty = true;
  }));
  box.querySelector("[data-reset]").addEventListener("click", () => {
    Object.assign(view, { ry: -0.35, rx: 0.06, dist: defaultDist() });
    selected = null; paintSelection();
    dirty = true;
  });

  /* ---------- breathing ---------- */
  let breathing = false, bt = 0, lastTs = 0, lastPhase = "";
  const breatheBtn = box.querySelector("[data-breathe]");
  breatheBtn.addEventListener("click", () => {
    breathing = !breathing;
    breatheBtn.setAttribute("aria-pressed", breathing);
    breatheBtn.textContent = breathing ? "Остановить" : "Дышать";
    phaseEl.hidden = !breathing;
    if (!breathing) { setBreath(0); lastPhase = ""; }
    dirty = true;
  });
  function setBreath(p) {
    ["R", "L"].forEach((k) => lungGroups[k].scale.set(1 + 0.035 * p, 1 + 0.075 * p, 1 + 0.035 * p));
    diaph.position.y = DIA_Y - 0.55 * p;
    diaph.scale.y = 1 - 0.3 * p;
  }

  /* ---------- theme ---------- */
  window.addEventListener("themechange", () => {
    mats.forEach((m) => m.color.copy(col(m.userData.var)));
    paintSelection();
  });

  /* ---------- loop ---------- */
  const tmp = new THREE.Vector3();
  let visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) dirty = true; }).observe(box);
  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(box); else window.addEventListener("resize", resize);
  resize();

  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (!visible) return;
    if (autoRotate) { view.ry += dt * 0.18; dirty = true; }
    if (breathing) {
      bt = (bt + dt / 5) % 1;
      const inh = bt < 0.4;
      const p = inh ? 0.5 - 0.5 * Math.cos((bt / 0.4) * Math.PI) : 0.5 + 0.5 * Math.cos(((bt - 0.4) / 0.6) * Math.PI);
      setBreath(p);
      const ph = inh ? "in" : "out";
      if (ph !== lastPhase) {
        lastPhase = ph;
        phaseEl.innerHTML = inh
          ? "<b>Вдох.</b> Наружные межрёберные мышцы и диафрагма сокращаются, купол опускается, лёгкие расширяются. Давление в лёгких ниже атмосферного — воздух входит."
          : "<b>Выдох.</b> Мышцы расслабляются, купол диафрагмы поднимается, эластическая тяга сжимает лёгкие. Давление выше атмосферного — воздух выходит.";
      }
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    root.rotation.set(view.rx, view.ry, 0);
    camera.position.set(0, CAM.y + 0.6, view.dist);
    camera.lookAt(0, CAM.y, 0);
    renderer.render(scene, camera);
    // подписи
    if (labelsEl.style.display !== "none") {
      const w = box.clientWidth, h = box.clientHeight;
      root.updateMatrixWorld();
      labelEls.forEach((l) => {
        if (l.el.hidden) return;
        tmp.copy(l.pos).applyMatrix4(root.matrixWorld);
        const back = tmp.z < -0.6;
        tmp.project(camera);
        l.el.style.left = `${((tmp.x + 1) / 2) * w}px`;
        l.el.style.top = `${((1 - tmp.y) / 2) * h}px`;
        l.el.classList.toggle("back", back);
      });
    }
  }
  requestAnimationFrame(frame);
})();
