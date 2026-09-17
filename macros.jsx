import { useState, useEffect, useMemo, useRef } from "react";

const C = {
  ground: "#FFF4E3",
  surface: "#FFFFFF",
  ink: "#2B1B3D",
  soft: "#6F5F7B",
  line: "#EBD9C3",
  tarjeta: "#FBEEDA", // fondo de cada sección, crema cálido
  campo: "#FFFBF2", // controles dentro de la tarjeta, un tono más claro
  borde: "#EFDFC6",
  // barras: saturadas. texto: la misma familia, oscurecida para que se lea.
  kcal: "#8B4FD6",
  kcalT: "#5C2C96",
  prot: "#F5453A",
  protT: "#C62012",
  carb: "#FFB300",
  carbT: "#8F6100",
  fat: "#12B5B0",
  fatT: "#0A6E6B",
};

// Verde de la creatina: no choca con ningún color ya usado.
const VERDE = "#35704A";

// bg: relleno. fg: texto encima del relleno. txt: el tono cuando el color
// se usa como texto sobre la tarjeta.
const MEAL = {
  Desayuno: { bg: "#C9902F", fg: "#2B1B3D", txt: "#8A5E12" },
  Almuerzo: { bg: "#3C776F", fg: "#FFFFFF", txt: "#2F6B65" },
  Comida: { bg: "#A84A3C", fg: "#FFFFFF", txt: "#A84A3C" },
  Cena: { bg: "#6F5793", fg: "#FFFFFF", txt: "#6F5793" },
  Otros: { bg: "#A05070", fg: "#FFFFFF", txt: "#A05070" },
};
const TAUPE = "#7E6A55"; // Comunes
const VINO = "#8A4A5C"; // Alcohol

const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const SANS =
  'ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const DEFAULT_TARGETS = { p: 170, c: 238, g: 68 };
// Día sin entrenar: el plan recorta sobre todo carbohidratos.
const DEFAULT_DESCANSO = { p: 162, c: 117, g: 64 };
const MEALS = ["Desayuno", "Almuerzo", "Comida", "Cena", "Otros"];

// cant = cantidad sugerida por el plan. pu/cu/gu = macros por UNA unidad.
const PLAN = [
  {
    comida: "Desayuno",
    items: [
      { nombre: "Huevos", u: "pieza", cant: 3, pu: 6.3, cu: 0.4, gu: 5, fiu: 0, azu: 0.2, sou: 65, sau: 1.6 },
      { nombre: "Verduras", u: "taza", cant: 1, pu: 2, cu: 4, gu: 0, fiu: 3, azu: 2.5, sou: 30, sau: 0 },
      { nombre: "Tortilla de maíz", u: "pieza", cant: 3, pu: 2, cu: 15, gu: 0.7, fiu: 1.5, azu: 0.3, sou: 12, sau: 0.1 },
      { nombre: "Aguacate hass", u: "g", cant: 70, pu: 0.014, cu: 0.086, gu: 0.157, fiu: 0.067, azu: 0.004, sou: 0.07, sau: 0.022 },
      { nombre: "Frijoles", u: "taza", cant: 0.5, pu: 16, cu: 40, gu: 2, fiu: 15, azu: 0.6, sou: 200, sau: 0.2 },
    ],
  },
  {
    comida: "Almuerzo",
    items: [
      { nombre: "Barra Kirkland", u: "pieza", cant: 1, pu: 21, cu: 22, gu: 9, fiu: 15, azu: 2, sou: 190, sau: 4.5 },
      { nombre: "Plátano", u: "pieza", cant: 1, pu: 1, cu: 27, gu: 0, fiu: 3, azu: 14, sou: 1, sau: 0.1 },
    ],
  },
  {
    comida: "Comida",
    items: [
      { nombre: "Pollo", u: "g", cant: 150, pu: 0.3, cu: 0, gu: 0.033, fiu: 0, azu: 0, sou: 0.7, sau: 0.01 },
      { nombre: "Salmón", u: "g", cant: 150, pu: 0.227, cu: 0, gu: 0.127, alt: true, fiu: 0, azu: 0, sou: 0.6, sau: 0.03 },
      { nombre: "Verduras", u: "taza", cant: 1, pu: 2, cu: 4, gu: 0, fiu: 3, azu: 2.5, sou: 30, sau: 0 },
      { nombre: "Frijoles", u: "taza", cant: 0.5, pu: 16, cu: 40, gu: 2, fiu: 15, azu: 0.6, sou: 200, sau: 0.2 },
      { nombre: "Tortilla de maíz", u: "pieza", cant: 3, pu: 2, cu: 15, gu: 0.7, fiu: 1.5, azu: 0.3, sou: 12, sau: 0.1 },
      { nombre: "Aguacate hass", u: "g", cant: 70, pu: 0.014, cu: 0.086, gu: 0.157, fiu: 0.067, azu: 0.004, sou: 0.07, sau: 0.022 },
    ],
  },
  {
    comida: "Cena",
    items: [
      { nombre: "Atún en agua", u: "g", cant: 140, pu: 0.23, cu: 0, gu: 0.01, fiu: 0, azu: 0, sou: 2.5, sau: 0.002 },
      { nombre: "Mayonesa", u: "cucharada", cant: 1, pu: 0, cu: 0, gu: 11, fiu: 0, azu: 0.1, sou: 90, sau: 1.6 },
      { nombre: "Salmas", u: "paquete", cant: 4, pu: 2, cu: 15, gu: 1.5, fiu: 0.6, azu: 0.3, sou: 160, sau: 0.9 },
      { nombre: "Verduras", u: "taza", cant: 1, pu: 2, cu: 4, gu: 0, fiu: 3, azu: 2.5, sou: 30, sau: 0 },
    ],
  },
];

// Alimentos frecuentes fuera del plan. Se registran en la comida de la hora
// actual y se mueven después desde Corregir.
const COMUNES = [
  { nombre: "Arroz blanco", u: "g", cant: 150, pu: 0.027, cu: 0.28, gu: 0.003, fiu: 0.004, azu: 0.001, sou: 0.01, sau: 0.001 },
  { nombre: "Pescado blanco", u: "g", cant: 150, pu: 0.22, cu: 0, gu: 0.02, fiu: 0, azu: 0, sou: 0.8, sau: 0.005 },
  { nombre: "Carne roja", u: "g", cant: 150, pu: 0.27, cu: 0, gu: 0.09, fiu: 0, azu: 0, sou: 0.7, sau: 0.035 },
  { nombre: "Carne molida", u: "g", cant: 150, pu: 0.25, cu: 0, gu: 0.13, fiu: 0, azu: 0, sou: 0.75, sau: 0.05 },
  { nombre: "Medallón de pescado", u: "g", cant: 200, pu: 0.2, cu: 0, gu: 0.03, fiu: 0, azu: 0, sou: 1.2, sau: 0.01 },
];

// Bebidas con alcohol. "au" son gramos de etanol por unidad.
const ALCOHOL = [
  { nombre: "Cerveza", u: "botella", cant: 1, pu: 1.6, cu: 13, gu: 0, au: 14, fiu: 0, azu: 0, sou: 14, sau: 0 },
  { nombre: "Tequila", u: "caballito", cant: 1, pu: 0, cu: 0, gu: 0, au: 14, fiu: 0, azu: 0, sou: 0, sau: 0 },
  { nombre: "Carajillo", u: "copa", cant: 1, pu: 0.3, cu: 18, gu: 0, au: 12, fiu: 0, azu: 17, sou: 10, sau: 0 },
  { nombre: "Gin & tonic", u: "vaso", cant: 1, pu: 0, cu: 13, gu: 0, au: 14, fiu: 0, azu: 13, sou: 10, sau: 0 },
  { nombre: "Vino blanco", u: "copa", cant: 1, pu: 0.1, cu: 3, gu: 0, au: 14, fiu: 0, azu: 1.4, sou: 7, sau: 0 },
  { nombre: "Vino tinto", u: "copa", cant: 1, pu: 0.1, cu: 4, gu: 0, au: 16, fiu: 0, azu: 0.9, sou: 6, sau: 0 },
];

const kcalOf_ = (p, c, g) => Math.round(p * 4 + c * 4 + g * 9);

// El etanol aporta 7 kcal/g y no cuenta como ningún macro.
const kcalOf = (p, c, g, a = 0) => Math.round(p * 4 + c * 4 + g * 9 + a * 7);
const MICRO_K = ["fi", "az", "so", "sa"];
const mac = (e) => ({
  p: e.cant * e.pu,
  c: e.cant * e.cu,
  g: e.cant * e.gu,
  a: e.cant * (e.au || 0),
  fi: e.cant * (e.fiu || 0),
  az: e.cant * (e.azu || 0),
  so: e.cant * (e.sou || 0),
  sa: e.cant * (e.sau || 0),
});
const VACIO = { p: 0, c: 0, g: 0, a: 0, fi: 0, az: 0, so: 0, sa: 0 };
const suma = (a, m) => ({
  p: a.p + m.p,
  c: a.c + m.c,
  g: a.g + m.g,
  a: a.a + m.a,
  fi: a.fi + m.fi,
  az: a.az + m.az,
  so: a.so + m.so,
  sa: a.sa + m.sa,
});

// Cada taza de café lleva un sobre de Splenda.
const SPLENDA = { c: 1, az: 0.9, so: 5 };
const kcalMac = (m) => kcalOf(m.p, m.c, m.g, m.a || 0);
const nice = (n) =>
  Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1);
// porción -> porciones, no "porcións"
const plural = (u) => {
  if (/[aeiou]$/.test(u)) return `${u}s`;
  if (/ón$/.test(u)) return `${u.slice(0, -2)}ones`;
  return `${u}es`;
};
const unidad = (e) => {
  if (e.u === "g") return "g";
  return e.cant === 1 ? e.u : plural(e.u);
};

const PLAN_INDEX = {};
PLAN.forEach((b) =>
  b.items.forEach((i) => {
    PLAN_INDEX[i.nombre.toLowerCase()] = i;
  })
);
COMUNES.forEach((i) => {
  PLAN_INDEX[i.nombre.toLowerCase()] = i;
});
ALCOHOL.forEach((i) => {
  PLAN_INDEX[i.nombre.toLowerCase()] = i;
});

// Cuánto aporta cada comida según el plan, y su fracción acumulada del día.
const PLAN_KCAL = PLAN.map((b) => {
  const t = b.items
    .filter((i) => !i.alt)
    .reduce(
      (a, i) => ({
        p: a.p + i.cant * i.pu,
        c: a.c + i.cant * i.cu,
        g: a.g + i.cant * i.gu,
      }),
      { p: 0, c: 0, g: 0 }
    );
  return { comida: b.comida, kcal: kcalOf_(t.p, t.c, t.g) };
});
const PLAN_KCAL_TOTAL = PLAN_KCAL.reduce((a, b) => a + b.kcal, 0) || 1;
const PLAN_ACUM = (() => {
  let acc = 0;
  return PLAN_KCAL.map((b) => {
    acc += b.kcal;
    return { comida: b.comida, frac: acc / PLAN_KCAL_TOTAL, sola: b.kcal / PLAN_KCAL_TOTAL };
  });
})();
const paso = (u) => (u === "g" ? 5 : u === "taza" ? 0.25 : 0.5);

const dayKey = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const prettyDate = (d) => {
  if (dayKey(d) === dayKey(new Date())) return "Hoy";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(y)) return "Ayer";
  return d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};
const mealNow = () => {
  const h = new Date().getHours();
  if (h < 11) return "Desayuno";
  if (h < 14) return "Almuerzo";
  if (h < 18) return "Comida";
  return "Cena";
};

const mem = new Map();
const hasStore =
  typeof window !== "undefined" &&
  window.storage &&
  typeof window.storage.set === "function";

async function safeGet(k) {
  if (hasStore) {
    try {
      const r = await window.storage.get(k);
      if (r && typeof r.value === "string") return r.value;
    } catch (e) {
      /* la clave no existe todavía */
    }
  }
  return mem.has(k) ? mem.get(k) : null;
}

async function safeSet(k, v) {
  mem.set(k, v);
  if (!hasStore) return false;
  for (let i = 0; i < 3; i++) {
    try {
      await window.storage.set(k, v);
      return true;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  return false;
}

// Repara entradas viejas: las que se guardaron con macros totales y
// multiplicador, y las que quedaron en la unidad genérica "porción".
const reparar = (e) => {
  if (e.u && e.u !== "porción") return e;

  const tot = e.u
    ? { p: e.cant * e.pu, c: e.cant * e.cu, g: e.cant * e.gu }
    : {
        p: (e.p ?? 0) * (e.factor ?? 1),
        c: (e.c ?? 0) * (e.factor ?? 1),
        g: (e.g ?? 0) * (e.factor ?? 1),
      };

  const base = PLAN_INDEX[String(e.nombre || "").toLowerCase()];
  const comun = {
    id: e.id,
    nombre: e.nombre,
    comida: e.comida || "Otros",
    hora: e.hora || "",
  };

  if (base) {
    // Deduce la cantidad en la unidad real del alimento sin perder los macros.
    const ref = base.pu || base.cu || base.gu;
    const val = base.pu ? tot.p : base.cu ? tot.c : tot.g;
    const cant = ref ? Math.round((val / ref) * 4) / 4 : base.cant;
    return {
      ...comun,
      u: base.u,
      cant: cant > 0 ? cant : base.cant,
      pu: base.pu,
      cu: base.cu,
      gu: base.gu,
      au: base.au || 0,
      fiu: base.fiu || 0,
      azu: base.azu || 0,
      sou: base.sou || 0,
      sau: base.sau || 0,
    };
  }

  return { ...comun, u: "porción", cant: 1, pu: tot.p, cu: tot.c, gu: tot.g };
};

// Iconos vectoriales de cada alimento. Paleta acotada para que coordinen
// entre si y con el resto de la interfaz.
const I = {
  crema: "#FFF3E0",
  borde: "#DCC8A6",
  masa: "#F2D49A",
  masaMed: "#E3BA75",
  masaOsc: "#CE9E52",
  verde: "#4E9E4A",
  verdeCl: "#7CC05F",
  verdeOsc: "#2F6B3C",
  pulpa: "#D2DE6B",
  hueso: "#F4E7D2",
  cafe: "#6B4A2F",
  frijol: "#3E2522",
  ambar: "#FFB300",
  turquesa: "#12B5B0",
  rosa: "#F08A6C",
  rosaCl: "#FFD5C2",
  metal: "#CDD3D9",
  pollo: "#C9813F",
};

const SVG = {
  Huevos: (
    <>
      <ellipse cx="12" cy="13" rx="9.5" ry="6.5" fill="#FFFFFF" stroke={I.borde} strokeWidth="1" />
      <circle cx="10" cy="12" r="3.6" fill={I.ambar} />
    </>
  ),
  Verduras: (
    <>
      <path d="M11 12v8" stroke={I.verdeCl} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="8.5" cy="9" r="4.4" fill={I.verde} />
      <circle cx="13.8" cy="8.2" r="3.6" fill={I.verdeCl} />
      <circle cx="11.5" cy="12" r="3.4" fill={I.verdeOsc} />
    </>
  ),
  "Tortilla de maíz": (
    <>
      <ellipse cx="12" cy="16.5" rx="9" ry="3.1" fill={I.masaOsc} />
      <ellipse cx="12" cy="13.2" rx="9" ry="3.1" fill={I.masaMed} />
      <ellipse cx="12" cy="9.9" rx="9" ry="3.1" fill={I.masa} />
    </>
  ),
  "Aguacate hass": (
    <>
      <path d="M12 2.5c4.2 0 6.8 3.8 6.8 8.3 0 5.4-3.2 10.7-6.8 10.7s-6.8-5.3-6.8-10.7C5.2 6.3 7.8 2.5 12 2.5z" fill={I.verdeOsc} />
      <path d="M12 5c3.1 0 5 3 5 6.4 0 4.2-2.3 8.1-5 8.1s-5-3.9-5-8.1C7 8 8.9 5 12 5z" fill={I.pulpa} />
      <circle cx="12" cy="12.6" r="3.3" fill={I.cafe} />
    </>
  ),
  Frijoles: (
    <>
      <path d="M3 12.5h18c0 4.6-4 8-9 8s-9-3.4-9-8z" fill="#FFFFFF" stroke={I.borde} strokeWidth="1" />
      <ellipse cx="8.4" cy="11" rx="2.7" ry="1.9" fill={I.frijol} />
      <ellipse cx="14.4" cy="10.4" rx="2.7" ry="1.9" fill="#5C3A34" />
      <ellipse cx="11.4" cy="12.4" rx="2.7" ry="1.9" fill={I.frijol} />
    </>
  ),
  "Barra Kirkland": (
    <>
      <rect x="1.5" y="8" width="21" height="8" rx="1.8" fill={I.turquesa} />
      <rect x="8" y="8" width="8" height="8" fill={I.cafe} />
      <circle cx="10.3" cy="11.4" r="0.95" fill="#C98A4B" />
      <circle cx="13.6" cy="12.9" r="0.95" fill="#C98A4B" />
    </>
  ),
  "Plátano": (
    <>
      <path d="M4 4.5c.8 8.4 6.2 14 14.5 14.6-1.2 1.2-3.3 1.9-5.7 1.9C6.9 21 2.2 15.8 2.2 8.7c0-2.6.7-4.2 1.8-4.2z" fill={I.ambar} stroke="#E09B00" strokeWidth="0.9" strokeLinejoin="round" />
    </>
  ),
  Pollo: (
    <>
      <path d="M15.6 3.2a5.8 5.8 0 0 1 3.5 10c-2.1 1.9-4.8 1.7-6.5.4l-4.2 4.2a2.7 2.7 0 1 1-3.8-3.8l4.2-4.2c-1.3-1.7-1.5-4.4.4-6.5a5.8 5.8 0 0 1 6.4-.1z" fill={I.pollo} />
      <circle cx="6.1" cy="17.9" r="2.4" fill={I.hueso} />
    </>
  ),
  "Salmón": (
    <>
      <path d="M2.5 16c2.8-5.8 8.4-9.5 18-9.5v9.5c-7.4 0-12.6 1.6-14.8 4.2z" fill={I.rosa} />
      <path d="M6 14.5c3.2-2.3 7.6-3.6 13-3.8M8 18c3-1.6 6.8-2.5 11.5-2.6" stroke={I.rosaCl} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  ),
  "Atún en agua": (
    <>
      <path d="M3 8.5v5.2c0 2 4 3.6 9 3.6s9-1.6 9-3.6V8.5z" fill={I.metal} />
      <rect x="3.6" y="10.4" width="16.8" height="3.4" rx="0.6" fill={I.turquesa} />
      <ellipse cx="12" cy="8.5" rx="9" ry="3.5" fill="#E4E9ED" />
      <ellipse cx="12" cy="8.5" rx="5.2" ry="1.9" fill={I.rosa} />
    </>
  ),
  "Medallón de pescado": (
    <>
      <ellipse cx="12" cy="12" rx="9.3" ry="6.2" fill="#F0DCB8" stroke="#D2B184" strokeWidth="1" />
      <path d="M6.6 11.3c1.4-1 2.8-1 4.2 0M13.2 13.2c1.4-1 2.8-1 4.2 0" stroke="#C09258" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </>
  ),
  Mayonesa: (
    <>
      <rect x="5.8" y="6.6" width="12.4" height="14" rx="2.2" fill="#FFF3C4" stroke="#E0C77E" strokeWidth="1" />
      <rect x="6.6" y="3.2" width="10.8" height="3.6" rx="1.1" fill={I.metal} />
      <rect x="7.6" y="11" width="8.8" height="5.4" rx="1" fill="#FFFFFF" opacity="0.85" />
    </>
  ),
  "Arroz blanco": (
    <>
      <path d="M3 12.5h18c0 4.6-4 8-9 8s-9-3.4-9-8z" fill="#FFFFFF" stroke={I.borde} strokeWidth="1" />
      <ellipse cx="8.2" cy="11" rx="2.4" ry="1.5" fill="#FFFFFF" stroke={I.borde} strokeWidth="0.9" />
      <ellipse cx="13.4" cy="10.3" rx="2.4" ry="1.5" fill="#FFFFFF" stroke={I.borde} strokeWidth="0.9" />
      <ellipse cx="11" cy="12.3" rx="2.4" ry="1.5" fill="#FFFFFF" stroke={I.borde} strokeWidth="0.9" />
    </>
  ),
  "Pescado blanco": (
    <>
      <path d="M2.5 12c3.5-4.5 8-6.5 12.5-6.5S21 9 21 12s-1.5 6.5-6 6.5S6 16.5 2.5 12z" fill="#EFE6D6" stroke="#CBBB9E" strokeWidth="1" />
      <path d="M2.5 12l4 3.2V8.8z" fill="#DCCFB6" />
      <circle cx="16.6" cy="10.4" r="1.1" fill="#6B5B45" />
    </>
  ),
  "Carne roja": (
    <>
      <path d="M4.5 9c1.5-3.5 5-5 9-5 4.5 0 7 2.5 7 6.5s-3 8.5-8 8.5c-4.5 0-8.5-2.5-8.5-6 0-1.5.5-2.8 .5-4z" fill="#A8342B" />
      <path d="M8 7.5c-1.6 1.2-2.4 3-2.4 4.8" stroke="#F4E7D2" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="13" cy="11" r="1.6" fill="#7E231C" />
    </>
  ),
  "Carne molida": (
    <>
      <path d="M3 17.5c0-3.8 4-6.5 9-6.5s9 2.7 9 6.5z" fill="#A8342B" />
      <circle cx="8" cy="14.2" r="1.5" fill="#8C2A22" />
      <circle cx="12.4" cy="13.2" r="1.5" fill="#C24438" />
      <circle cx="16.4" cy="14.6" r="1.5" fill="#8C2A22" />
      <circle cx="10.4" cy="9.6" r="1.4" fill="#C24438" />
      <circle cx="14.2" cy="9.9" r="1.4" fill="#8C2A22" />
    </>
  ),
  Cerveza: (
    <>
      <path d="M4.5 7h11v12.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z" fill="#F2B430" stroke="#D49412" strokeWidth="1" />
      <path d="M4.5 7h11v3.5h-11z" fill="#FFF6E0" />
      <path d="M15.8 9.5h2.4a2.4 2.4 0 0 1 0 4.8h-2.4" fill="none" stroke="#D49412" strokeWidth="1.6" />
      <path d="M7.5 12v6M11 12v6" stroke="#FFD97A" strokeWidth="1.2" />
    </>
  ),
  Tequila: (
    <>
      <path d="M7 6h10l-1.2 11.5a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8z" fill="#FDF6E4" stroke="#C9B58F" strokeWidth="1" />
      <path d="M7.7 12h8.6l-.5 5.5a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8z" fill="#E7C463" />
      <rect x="6.5" y="20" width="11" height="1.6" rx="0.8" fill="#C9B58F" />
    </>
  ),
  Carajillo: (
    <>
      <path d="M6 6.5h12v10.8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#EFE6D6" stroke="#C4B393" strokeWidth="1" />
      <path d="M6.4 11h11.2v6.3a3 3 0 0 1-3 3H9.4a3 3 0 0 1-3-3z" fill="#4A2E1E" />
      <ellipse cx="12" cy="11" rx="5.6" ry="1.4" fill="#C79A63" />
    </>
  ),
  "Gin & tonic": (
    <>
      <path d="M6.5 4h11v15.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" fill="#EAF4F7" stroke="#A9C6D0" strokeWidth="1" />
      <path d="M6.5 10h11v9.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" fill="#CFE8EF" />
      <circle cx="9.4" cy="14" r="1.1" fill="#FFFFFF" opacity="0.9" />
      <path d="M14 3.2a3 3 0 0 1 3 3h-3z" fill="#8CC63F" />
    </>
  ),
  "Vino blanco": (
    <>
      <path d="M7 3.5h10l-.7 6.2a4.4 4.4 0 0 1-4.3 3.9 4.4 4.4 0 0 1-4.3-3.9z" fill="#F7F2DC" stroke="#CFC49B" strokeWidth="1" />
      <path d="M12 13.6v5.4" stroke="#CFC49B" strokeWidth="1.6" />
      <rect x="8" y="19.4" width="8" height="1.6" rx="0.8" fill="#CFC49B" />
    </>
  ),
  "Vino tinto": (
    <>
      <path d="M7 3.5h10l-.7 6.2a4.4 4.4 0 0 1-4.3 3.9 4.4 4.4 0 0 1-4.3-3.9z" fill="#8E2F45" stroke="#6B2233" strokeWidth="1" />
      <path d="M12 13.6v5.4" stroke="#B08B93" strokeWidth="1.6" />
      <rect x="8" y="19.4" width="8" height="1.6" rx="0.8" fill="#B08B93" />
    </>
  ),
  Creatina: (
    <>
      <path d="M4.5 9.5h11v5.2a4.6 4.6 0 0 1-4.6 4.6H9.1a4.6 4.6 0 0 1-4.6-4.6z" fill="#E4E9ED" stroke="#A9B4BD" strokeWidth="1" />
      <path d="M4.5 9.5c0-1.7 2.5-3 5.5-3s5.5 1.3 5.5 3z" fill="#FFFFFF" stroke="#A9B4BD" strokeWidth="1" />
      <path d="M15.5 11.2l4.6-5a1.7 1.7 0 0 1 2.5 2.3l-5 4.6" fill="none" stroke="#A9B4BD" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  Agua: (
    <>
      <path d="M5.5 3.5h13l-1.4 16.2a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8z" fill="#DCEEF5" stroke="#9FC6D6" strokeWidth="1" />
      <path d="M6.6 10.5h10.8l-.85 9.4a1.6 1.6 0 0 1-1.6 1.4H9.05a1.6 1.6 0 0 1-1.6-1.4z" fill="#4FB3D9" />
    </>
  ),
  "Café": (
    <>
      <path d="M4 6.5h13v7.2a5.2 5.2 0 0 1-5.2 5.2H9.2A5.2 5.2 0 0 1 4 13.7z" fill="#6B4A2F" />
      <path d="M4 6.5h13v2.6H4z" fill="#F4E7D2" />
      <path d="M17.4 8.2h1.9a2.6 2.6 0 0 1 0 5.2h-1.9" fill="none" stroke="#6B4A2F" strokeWidth="1.6" />
      <rect x="3" y="19.8" width="15" height="1.8" rx="0.9" fill="#CDD3D9" />
    </>
  ),
  Salmas: (
    <>
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="2.6" fill={I.masa} stroke={I.masaOsc} strokeWidth="1" />
      <circle cx="8.6" cy="8.6" r="1" fill={I.masaOsc} />
      <circle cx="15.4" cy="8.6" r="1" fill={I.masaOsc} />
      <circle cx="12" cy="12" r="1" fill={I.masaOsc} />
      <circle cx="8.6" cy="15.4" r="1" fill={I.masaOsc} />
      <circle cx="15.4" cy="15.4" r="1" fill={I.masaOsc} />
    </>
  ),
};

function Icono({ nombre, size = 18 }) {
  const arte = SVG[nombre];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: "block" }}
    >
      {arte || <circle cx="12" cy="12" r="8" fill={I.borde} />}
    </svg>
  );
}

// Consulta los macros de un platillo y devuelve UN registro consolidado.
async function pedirMacros(texto) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analiza este platillo y devuelve sus macronutrientes.

Platillo: "${texto}"

Reglas:
- Devuelve UN SOLO elemento con el platillo completo. NUNCA lo separes por ingredientes: unos chilaquiles con pollo son un elemento, no tres.
- "nombre": nombre corto del platillo, máximo cuatro palabras.
- "cant" y "u": la cantidad total. Usa u="pieza" si se cuenta por unidades (tacos, sándwiches, piezas de pan), u="porción" si es un plato servido, u="g" solo si el usuario dio un peso.
- Si el usuario no indica cantidad, usa cant=1.
- "p", "c", "g": macros TOTALES de esa cantidad, en gramos enteros, sumando todos los ingredientes y el aceite de preparación.
- "fi" fibra en g, "az" azúcar en g, "so" sodio en mg, "sa" grasa saturada en g, también TOTALES de esa cantidad. Usa 0 si no aplica.
- Responde ÚNICAMENTE con JSON válido, sin markdown:
{"items":[{"nombre":"Tacos al pastor","cant":3,"u":"pieza","p":21,"c":33,"g":18,"fi":4,"az":2,"so":620,"sa":6}]}`,
        },
      ],
    }),
  });
  const data = await res.json();
  const raw = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .replace(/```json|```/g, "")
    .trim();
  const items = JSON.parse(raw).items || [];
  if (!items.length) throw new Error("vacío");

  // Red de seguridad: si aun así devolvió ingredientes sueltos, se suman.
  const uno = items[0];
  const cant = items.length === 1 ? Math.max(0.1, Number(uno.cant) || 1) : 1;
  const u =
    items.length === 1 &&
    ["pieza", "porción", "taza", "cucharada", "paquete", "g"].includes(uno.u)
      ? uno.u
      : "porción";
  const tot = items.reduce(
    (a, it) => ({
      p: a.p + Math.max(0, Number(it.p) || 0),
      c: a.c + Math.max(0, Number(it.c) || 0),
      g: a.g + Math.max(0, Number(it.g) || 0),
    }),
    { p: 0, c: 0, g: 0 }
  );

  const micro = items.reduce(
    (a, it) => ({
      fi: a.fi + Math.max(0, Number(it.fi) || 0),
      az: a.az + Math.max(0, Number(it.az) || 0),
      so: a.so + Math.max(0, Number(it.so) || 0),
      sa: a.sa + Math.max(0, Number(it.sa) || 0),
    }),
    { fi: 0, az: 0, so: 0, sa: 0 }
  );

  return {
    nombre: String(uno.nombre || texto).slice(0, 40),
    u,
    cant,
    pu: tot.p / cant,
    cu: tot.c / cant,
    gu: tot.g / cant,
    fiu: micro.fi / cant,
    azu: micro.az / cant,
    sou: micro.so / cant,
    sau: micro.sa / cant,
  };
}

// Logotipo: monograma DM con hoja, recortado del original y recoloreado a la
// paleta de la app. Va en horizontal para no robar alto en el teléfono.
// Cada bloque de la app vive en su propia tarjeta con rótulo, para que se
// distinga de un vistazo dónde empieza y dónde termina.
function Seccion({ titulo, derecha, children, plano }) {
  return (
    <section
      className="mt-3 rounded-lg"
      style={{
        background: plano ? "transparent" : C.tarjeta,
        border: plano ? "none" : `1px solid ${C.borde}`,
        boxShadow: plano ? "none" : "0 1px 2px rgba(43,27,61,0.07)",
        padding: plano ? 0 : 14,
      }}
    >
      {(titulo || derecha) && (
        <div className="mb-2.5 flex items-baseline justify-between">
          {titulo && (
            <h2
              className="text-xs"
              style={{
                color: C.soft,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              {titulo}
            </h2>
          )}
          {derecha}
        </div>
      )}
      {children}
    </section>
  );
}


function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="10 -1 106 55"
        height="24"
        width="47"
        role="img"
        aria-label="Dieta Misa"
        style={{ display: "block", flexShrink: 0 }}
      >
        <path
          d="M 12 10 H 32 C 45 10 52 18 52 31 C 52 44 45 52 32 52 H 12 V 10 Z M 24 21 V 41 H 30 C 37 41 40 37 40 31 C 40 25 37 21 30 21 H 24 Z"
          fill={C.ink}
        />
        <path
          d="M 60 52 V 10 H 71 L 82 34 L 93 10 H 104 V 52 H 93 V 26 L 84 46 H 80 L 71 26 V 52 H 60 Z"
          fill={MEAL.Comida.bg}
        />
        <path
          d="M 96 11 C 93 4 102 0 109 2 C 114 6 111 15 103 13 C 99 12 97 12 96 11 Z"
          fill={VERDE}
        />
      </svg>
      <span
        className="text-sm"
        style={{ color: C.ink, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        Dieta Misa
      </span>
    </div>
  );
}


export default function MacroDashboard() {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [descanso, setDescanso] = useState(DEFAULT_DESCANSO);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [settings, setSettings] = useState(false);
  const [verPlan, setVerPlan] = useState(false);
  const [cerradas, setCerradas] = useState([]);
  const [saved, setSaved] = useState("idle");
  const [tab, setTab] = useState("hoy");
  const [detalle, setDetalle] = useState(null);
  const [verResp, setVerResp] = useState(false);
  const [verSim, setVerSim] = useState(false);
  const [sim, setSim] = useState([]);
  const [simInput, setSimInput] = useState("");
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState(null);
  const [pegado, setPegado] = useState("");
  const [avisoResp, setAvisoResp] = useState("");
  const [avisoTipo, setAvisoTipo] = useState("info");
  const respRef = useRef(null);
  const [prep, setPrep] = useState("idle");
  const [avance, setAvance] = useState({ hecho: 0, total: 0 });
  const [respaldoFull, setRespaldoFull] = useState("");
  const [resumen, setResumen] = useState({});
  const [rellenando, setRellenando] = useState(false);
  const relleno = useRef(false);
  const timer = useRef(null);
  const pend = useRef({});

  const key = `macros:dia-${dayKey(date)}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      const dsc = await safeGet("macros:descanso");
      if (alive && dsc) {
        try {
          setDescanso(JSON.parse(dsc));
        } catch (e) {
          /* se usan los del plan */
        }
      }
      const t = await safeGet("macros:targets");
      if (alive && t) {
        try {
          setTargets(JSON.parse(t));
        } catch (e) {
          /* objetivos ilegibles, se usan los del plan */
        }
      }
      const r = await safeGet("macros:resumen");
      if (alive && r) {
        try {
          setResumen(JSON.parse(r));
        } catch (e) {
          /* resumen ilegible, se reconstruye al abrir el historial */
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setEntries([]);
    setOpenId(null);
    (async () => {
      const d = await safeGet(key);
      if (alive && d) {
        try {
          setEntries(JSON.parse(d).map(reparar));
        } catch (e) {
          setEntries([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  // Agrupa las escrituras pendientes por clave y las manda juntas tras una
  // pausa, para no disparar una escritura por cada toque.
  const encolar = (pares) => {
    pend.current = { ...pend.current, ...pares };
    setSaved("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const jobs = pend.current;
      pend.current = {};
      const oks = [];
      for (const k2 of Object.keys(jobs)) oks.push(await safeSet(k2, jobs[k2]));
      setSaved(oks.every(Boolean) ? "ok" : "fail");
    }, 700);
  };

  const persist = (next) => {
    setEntries(next);
    const t = next.reduce(
      (a, e) => suma(a, mac(e)),
      { ...VACIO }
    );
    const f = dayKey(date);
    const res = { ...resumen };
    // Las bebidas del día no dependen de la comida, se conservan.
    const beb = {};
    if (res[f]?.agua !== undefined) beb.agua = res[f].agua;
    if (res[f]?.cafe !== undefined) beb.cafe = res[f].cafe;
    if (res[f]?.creatina !== undefined) beb.creatina = res[f].creatina;
    if (res[f]?.ej !== undefined) beb.ej = res[f].ej;

    if (!next.length) {
      if (Object.keys(beb).length) res[f] = beb;
      else delete res[f];
    } else {
      res[f] = { ...beb, ...cifras(t, beb.cafe || 0) };
    }
    setResumen(res);

    encolar({ [key]: JSON.stringify(next), "macros:resumen": JSON.stringify(res) });
  };

  const toggleCreatina = () => {
    const f = dayKey(date);
    const prev = resumen[f] || {};
    const res = { ...resumen, [f]: { ...prev, creatina: prev.creatina ? 0 : 1 } };
    setResumen(res);
    encolar({ "macros:resumen": JSON.stringify(res) });
  };

  // Vasos de agua y tazas de café. Viven en el resumen del día, así el
  // historial los tiene sin necesidad de otra clave.
  const setBebida = (tipo, delta) => {
    const f = dayKey(date);
    const prev = resumen[f] || {};
    const val = Math.max(0, (prev[tipo] || 0) + delta);
    const base = entries.reduce((a, e) => suma(a, mac(e)), { ...VACIO });
    const nCafes = tipo === "cafe" ? val : prev.cafe || 0;
    const res = {
      ...resumen,
      [f]: {
        ...prev,
        [tipo]: val,
        // el café cambia carbohidratos, azúcar y sodio del día
        ...(entries.length || nCafes ? cifras(base, nCafes) : {}),
      },
    };
    setResumen(res);
    encolar({ "macros:resumen": JSON.stringify(res) });
  };

  // La primera vez que se abre el historial, reconstruye el resumen
  // leyendo los dias guardados uno por uno. Solo ocurre una vez.
  useEffect(() => {
    if (tab !== "historial" || relleno.current) return;
    relleno.current = true;
    let alive = true;
    (async () => {
      setRellenando(true);
      const acc = {};
      for (let i = 0; i < 21; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = dayKey(d);
        const raw = await safeGet(`macros:dia-${k}`);
        if (raw) {
          try {
            const t = JSON.parse(raw)
              .map(reparar)
              .reduce(
                (a, e) => {
                  const m = mac(e);
                  return { p: a.p + m.p, c: a.c + m.c, g: a.g + m.g };
                },
                { p: 0, c: 0, g: 0 }
              );
            if (t.p || t.c || t.g)
              acc[k] = {
                p: Math.round(t.p),
                c: Math.round(t.c),
                g: Math.round(t.g),
              };
          } catch (e) {
            /* dia ilegible, se omite */
          }
        }
        await new Promise((r) => setTimeout(r, 90));
      }
      if (!alive) return;
      setResumen((prev) => {
        const merged = { ...acc, ...prev };
        safeSet("macros:resumen", JSON.stringify(merged));
        return merged;
      });
      setRellenando(false);
    })();
    return () => {
      alive = false;
    };
  }, [tab]);

  useEffect(() => {
    if (!detalle) return;
    const esc = (ev) => ev.key === "Escape" && setDetalle(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [detalle]);

  useEffect(() => {
    const flush = () => {
      const jobs = pend.current || {};
      pend.current = {};
      Object.keys(jobs).forEach((k2) => safeSet(k2, jobs[k2]));
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  // Cifras del día listas para guardar, con el Splenda de cada café incluido.
  const cifras = (t, nCafes) => ({
    p: Math.round(t.p),
    c: Math.round(t.c + nCafes * SPLENDA.c),
    g: Math.round(t.g),
    ...(t.a > 0 ? { a: Math.round(t.a) } : {}),
    fi: Math.round(t.fi),
    az: Math.round(t.az + nCafes * SPLENDA.az),
    so: Math.round(t.so + nCafes * SPLENDA.so),
    sa: Math.round(t.sa),
  });

  const cafes = resumen[dayKey(date)]?.cafe || 0;

  const totals = useMemo(
    () =>
      entries.reduce(
        (a, e) => suma(a, mac(e)),
        {
          ...VACIO,
          c: cafes * SPLENDA.c,
          az: cafes * SPLENDA.az,
          so: cafes * SPLENDA.so,
        }
      ),
    [entries, cafes]
  );

  const planTotal = useMemo(() => {
    const t = { p: 0, c: 0, g: 0 };
    PLAN.forEach((b) =>
      b.items.forEach((i) => {
        if (i.alt) return;
        t.p += i.cant * i.pu;
        t.c += i.cant * i.cu;
        t.g += i.cant * i.gu;
      })
    );
    return { p: Math.round(t.p), c: Math.round(t.c), g: Math.round(t.g) };
  }, []);

  const agregar = (it, comida) =>
    persist([
      ...entries,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nombre: it.nombre,
        comida: comida || mealNow(),
        u: it.u,
        cant: it.cant,
        pu: it.pu,
        cu: it.cu,
        gu: it.gu,
        au: it.au || 0,
        fiu: it.fiu || 0,
        azu: it.azu || 0,
        sou: it.sou || 0,
        sau: it.sau || 0,
        hora: new Date().toLocaleTimeString("es", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

  const setCant = (id, v) =>
    persist(
      entries.map((e) =>
        e.id === id ? { ...e, cant: Math.max(0, Number(v) || 0) } : e
      )
    );
  const setComida = (id, comida) =>
    persist(entries.map((e) => (e.id === id ? { ...e, comida } : e)));
  const borrar = (id) => persist(entries.filter((e) => e.id !== id));

  const shift = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    if (d > new Date()) return;
    setDate(d);
  };

  const analizar = async () => {
    const texto = input.trim();
    if (!texto || busy) return;
    setBusy(true);
    setError(null);
    try {
      const base = await pedirMacros(texto);
      const id = `${Date.now()}`;
      persist([
        ...entries,
        {
          ...base,
          id,
          comida: mealNow(),
          hora: new Date().toLocaleTimeString("es", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setInput("");
      // Abre la corrección para ajustar la cantidad total de inmediato.
      setOpenId(id);
    } catch (e) {
      setError("No se pudo leer esa comida. Prueba escribirla con cantidades.");
    } finally {
      setBusy(false);
    }
  };

  const buscarSim = async () => {
    const texto = simInput.trim();
    if (!texto || simBusy || sim.length >= 3) return;
    setSimBusy(true);
    setSimError(null);
    try {
      const base = await pedirMacros(texto);
      setSim([...sim, { ...base, id: `s${Date.now()}` }]);
      setSimInput("");
    } catch (e) {
      setSimError("No se pudo calcular ese alimento.");
    } finally {
      setSimBusy(false);
    }
  };

  const respaldoBase = useMemo(
    () =>
      JSON.stringify({ v: 1, objetivos: targets, descanso, dias: resumen }),
    [targets, descanso, resumen]
  );
  const respaldo = respaldoFull || respaldoBase;

  // Lee el desglose completo de cada día guardado. Va de uno en uno con una
  // pausa corta: leer 40 claves de golpe es justo lo que hacía fallar el
  // almacenamiento.
  const prepararCompleto = async () => {
    setPrep("trabajando");
    setAvisoResp("");
    const fechas = Object.keys(resumen).sort();
    setAvance({ hecho: 0, total: fechas.length });
    const registros = {};
    for (let i = 0; i < fechas.length; i++) {
      const f = fechas[i];
      const raw = await safeGet(`macros:dia-${f}`);
      if (raw) {
        try {
          registros[f] = JSON.parse(raw).map(reparar);
        } catch (e) {
          /* ese día no se pudo leer, se conserva su total */
        }
      }
      setAvance({ hecho: i + 1, total: fechas.length });
      await new Promise((r) => setTimeout(r, 90));
    }
    // El día en pantalla puede tener cambios sin escribir todavía.
    if (entries.length) registros[dayKey(date)] = entries;

    setRespaldoFull(
      JSON.stringify({
        v: 2,
        objetivos: targets,
        descanso,
        dias: resumen,
        registros,
      })
    );
    setPrep("listo");
    setAvisoTipo("ok");
    const n = Object.keys(registros).length;
    setAvisoResp(
      `Respaldo completo listo: ${n} ${
        n === 1 ? "día con su desglose" : "días con su desglose"
      }. Ya puedes copiarlo.`
    );
  };

  const seleccionarRespaldo = () => {
    const ta = respRef.current;
    if (!ta) return null;
    ta.removeAttribute("readonly");
    ta.focus();
    ta.setSelectionRange(0, ta.value.length);
    return ta;
  };

  const copiarRespaldo = async () => {
    // 1. API moderna. No siempre existe dentro de un marco.
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(respaldo);
        setAvisoTipo("ok");
        setAvisoResp("Copiado al portapapeles.");
        return;
      }
    } catch (e) {
      /* pasa al método viejo */
    }
    // 2. Método viejo sobre el propio campo de texto.
    const ta = seleccionarRespaldo();
    try {
      if (ta && document.execCommand("copy")) {
        ta.setAttribute("readonly", "true");
        setAvisoTipo("ok");
        setAvisoResp("Copiado.");
        return;
      }
    } catch (e) {
      /* pasa al aviso manual */
    }
    // 3. Queda seleccionado para que lo copies tú.
    setAvisoTipo("info");
    setAvisoResp(
      "Tu navegador no deja copiar solo. El texto ya quedó seleccionado: usa Ctrl+C, o mantén presionado y elige Copiar."
    );
  };

  const restaurar = async () => {
    try {
      const d = JSON.parse(pegado.trim());
      if (!d || typeof d !== "object" || !d.dias) throw new Error("formato");
      const fusion = { ...d.dias, ...resumen };

      // Formato 2: trae el desglose por alimento de cada día.
      let dias = 0;
      if (d.registros && typeof d.registros === "object") {
        const fechas = Object.keys(d.registros).slice(0, 60);
        for (const f of fechas) {
          const k = `macros:dia-${f}`;
          const ya = await safeGet(k);
          if (ya) continue; // no se pisa lo que ya existe en este dispositivo
          const lista = (d.registros[f] || []).map(reparar);
          await safeSet(k, JSON.stringify(lista));
          const t = lista.reduce(
            (a, e2) => {
              const m = mac(e2);
              return { p: a.p + m.p, c: a.c + m.c, g: a.g + m.g };
            },
            { p: 0, c: 0, g: 0 }
          );
          fusion[f] = {
            p: Math.round(t.p),
            c: Math.round(t.c),
            g: Math.round(t.g),
          };
          dias++;
          await new Promise((r) => setTimeout(r, 90));
        }
      }

      setResumen(fusion);
      await safeSet("macros:resumen", JSON.stringify(fusion));
      if (d.objetivos && typeof d.objetivos.p === "number") {
        setTargets(d.objetivos);
        await safeSet("macros:targets", JSON.stringify(d.objetivos));
      }
      if (d.descanso && typeof d.descanso.p === "number") {
        setDescanso(d.descanso);
        await safeSet("macros:descanso", JSON.stringify(d.descanso));
      }
      setPegado("");
      setAvisoTipo("ok");
      setAvisoResp(
        `Restaurados ${Object.keys(d.dias).length} días de totales` +
          (dias ? ` y ${dias} con su desglose completo` : "") +
          ". Los que ya tenías aquí se conservan."
      );
    } catch (e) {
      setAvisoTipo("error");
      setAvisoResp(
        "Ese texto no es un respaldo válido. Pega el bloque completo, desde la primera llave hasta la última."
      );
    }
  };

  const simTot = useMemo(
    () =>
      sim.reduce(
        (a, e) => suma(a, mac(e)),
        { ...VACIO }
      ),
    [sim]
  );

  const kcalPorComida = useMemo(() => {
    const out = {};
    MEALS.forEach((m) => (out[m] = 0));
    entries.forEach((e) => {
      const x = mac(e);
      out[e.comida] = (out[e.comida] || 0) + kcalMac(x);
    });
    MEALS.forEach((m) => (out[m] = Math.round(out[m])));
    return out;
  }, [entries]);

  // Aporte de cada alimento al macro elegido, agrupando repeticiones.
  const detalleDatos = useMemo(() => {
    if (!detalle) return null;
    const mapa = new Map();
    entries.forEach((e) => {
      const x = mac(e);
      const val = detalle === "p" ? x.p : detalle === "c" ? x.c : x.g;
      const k = `${e.nombre}|${e.u}`;
      const prev = mapa.get(k) || {
        nombre: e.nombre,
        u: e.u,
        cant: 0,
        val: 0,
        veces: 0,
      };
      prev.cant += e.cant;
      prev.val += val;
      prev.veces += 1;
      mapa.set(k, prev);
    });
    const lista = [...mapa.values()]
      .filter((r) => r.val >= 0.5)
      .sort((a, b) => b.val - a.val);
    const suma = lista.reduce((a, b) => a + b.val, 0);
    const ceros = [...mapa.values()].length - lista.length;
    return { lista, suma, ceros };
  }, [detalle, entries]);

  // El día cuenta como con ejercicio salvo que se apague el interruptor.
  const ejercicio = resumen[dayKey(date)]?.ej !== 0;
  const obj = ejercicio ? targets : descanso;

  const toggleEjercicio = () => {
    const f = dayKey(date);
    const prev = resumen[f] || {};
    const res = { ...resumen, [f]: { ...prev, ej: prev.ej === 0 ? 1 : 0 } };
    setResumen(res);
    encolar({ "macros:resumen": JSON.stringify(res) });
  };

  const targetKcal = kcalOf(obj.p, obj.c, obj.g);
  const eatenKcal = kcalMac(totals);
  const toggleMeal = (m) =>
    setCerradas((cs) => (cs.includes(m) ? cs.filter((x) => x !== m) : [...cs, m]));

  return (
    <div
      style={{ background: C.ground, color: C.ink, fontFamily: SANS }}
      className="min-h-screen w-full px-4 py-5"
    >
      <style>{`
        .mbar{transition:width .45s cubic-bezier(.2,.8,.3,1),stroke-dasharray .45s cubic-bezier(.2,.8,.3,1),stroke-dashoffset .45s cubic-bezier(.2,.8,.3,1)}
        @media (prefers-reduced-motion: reduce){.mbar{transition:none}}
        .fx:focus-visible{outline:2px solid ${C.ink};outline-offset:2px}
        .chip{transition:transform .12s ease}
        .chip:active{transform:scale(.94)}
        @media (prefers-reduced-motion: reduce){.chip{transition:none}.chip:active{transform:none}}
        input::placeholder{color:${C.soft}}
      `}</style>

      <div className="mx-auto w-full max-w-md">
        <div
          className="mb-4 flex items-center justify-between pb-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Logo />
          <div className="flex items-center gap-3">
            {saved === "fail" && (
              <span className="text-xs" style={{ color: C.protT }}>
                sin guardar
              </span>
            )}
            {saved === "ok" && (
              <span className="text-xs" style={{ color: C.soft }}>
                guardado
              </span>
            )}
            <button
              onClick={() => setSettings((x) => !x)}
              className="fx text-xs underline"
              style={{ color: C.soft }}
            >
              Objetivos
            </button>
          </div>
        </div>

        <header className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => shift(-1)}
              className="fx px-1 text-lg"
              style={{ color: C.soft }}
              aria-label="Día anterior"
            >
              ‹
            </button>
            <h1 className="text-base">{prettyDate(date)}</h1>
            <button
              onClick={() => shift(1)}
              className="fx px-1 text-lg"
              style={{ color: C.soft }}
              aria-label="Día siguiente"
            >
              ›
            </button>
          </div>
        </header>

        <nav className="mt-4 flex gap-1.5">
          {[
            ["hoy", "Hoy"],
            ["historial", "Historial"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="fx chip rounded-full px-4 py-1.5 text-sm"
              style={{
                background: tab === id ? C.ink : C.campo,
                color: tab === id ? C.ground : C.ink,
                border: `1px solid ${tab === id ? C.ink : C.line}`,
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "historial" ? (
          <Historial
            resumen={resumen}
            targets={targets}
            cargando={rellenando}
          />
        ) : (
        <>

        {settings && (
          <div
            className="mt-3 rounded-sm p-3"
            style={{ background: C.campo, border: `1px solid ${C.line}` }}
          >
            <p className="text-xs" style={{ color: C.soft }}>
              Gramos diarios. Las calorías se calculan solas.
            </p>
            {[
              {
                titulo: "Con ejercicio",
                val: targets,
                set: setTargets,
                clave: "macros:targets",
              },
              {
                titulo: "Sin ejercicio",
                val: descanso,
                set: setDescanso,
                clave: "macros:descanso",
              },
            ].map((grupo) => (
              <div key={grupo.clave} className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: C.ink }}>
                    {grupo.titulo}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: C.soft }}>
                    {kcalOf(grupo.val.p, grupo.val.c, grupo.val.g)} kcal
                  </span>
                </div>
                <div className="mt-1 flex gap-2">
                  {[
                    ["p", "Proteína"],
                    ["c", "Carbohidratos"],
                    ["g", "Grasas"],
                  ].map(([k, label]) => (
                    <label key={k} className="flex-1 text-xs">
                      <span style={{ color: C.soft }}>{label}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={grupo.val[k]}
                        onChange={(ev) => {
                          const next = {
                            ...grupo.val,
                            [k]: Math.max(0, Number(ev.target.value) || 0),
                          };
                          grupo.set(next);
                          safeSet(grupo.clave, JSON.stringify(next));
                        }}
                        className="fx mt-1 w-full rounded-sm px-2 py-1 text-sm"
                        style={{
                          background: C.ground,
                          border: `1px solid ${C.line}`,
                          fontFamily: SERIF,
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Seccion titulo="Resumen del día">
        <button
          onClick={toggleEjercicio}
          aria-pressed={ejercicio}
          className="fx chip mt-4 flex w-full items-center gap-2 rounded-sm px-2.5 py-2"
          style={{
            background: ejercicio ? MEAL.Almuerzo.bg : C.campo,
            border: `1px solid ${ejercicio ? MEAL.Almuerzo.bg : C.line}`,
          }}
        >
          <span
            className="text-sm"
            style={{ color: ejercicio ? "#FFFFFF" : C.ink }}
          >
            {ejercicio ? "Día con ejercicio" : "Día sin ejercicio"}
          </span>
          <span
            className="text-xs"
            style={{ color: ejercicio ? "#F2E6D4" : C.soft }}
          >
            objetivo {kcalOf(obj.p, obj.c, obj.g)} kcal
          </span>
          <span
            className="ml-auto flex h-6 w-11 items-center rounded-full px-0.5"
            style={{
              background: ejercicio ? "#2B4F4A" : C.line,
              justifyContent: ejercicio ? "flex-end" : "flex-start",
            }}
          >
            <span
              className="block h-5 w-5 rounded-full"
              style={{ background: C.campo }}
            />
          </span>
        </button>

        <div className="mt-5">
          <span
            style={{ fontFamily: SERIF, fontSize: 52, lineHeight: 1 }}
            className="tabular-nums"
          >
            {eatenKcal}
          </span>
          <span className="ml-2 text-sm" style={{ color: C.soft }}>
            kcal
          </span>
        </div>

        <div className="mt-5 space-y-5">
          <BarKcal
            porComida={kcalPorComida}
            target={targetKcal}
            alcohol={totals.a}
          />
          <Bar
            label="Proteína"
            value={totals.p}
            target={obj.p}
            color={C.prot}
            onClick={() => setDetalle("p")}
          />
          <Bar
            label="Carbohidratos"
            value={totals.c}
            target={obj.c}
            color={C.carb}
            onClick={() => setDetalle("c")}
          />
          <Bar
            label="Grasas"
            value={totals.g}
            target={obj.g}
            color={C.fat}
            onClick={() => setDetalle("g")}
          />
        </div>
        </Seccion>

        <Seccion titulo="Bebidas y suplementos">
        <div className="flex gap-2">
          {[
            { tipo: "agua", nombre: "Agua", etiqueta: "vasos", col: "#166E92" },
            { tipo: "cafe", nombre: "Café", etiqueta: "tazas", col: "#6B4A2F" },
          ].map((b) => {
            const n = resumen[dayKey(date)]?.[b.tipo] || 0;
            return (
              <div
                key={b.tipo}
                className="flex flex-1 items-center gap-2 rounded-sm px-2.5 py-2"
                style={{ background: C.campo, border: `1px solid ${C.line}` }}
              >
                <Icono nombre={b.nombre} size={22} />
                <div className="min-w-0 leading-none">
                  <span
                    className="tabular-nums"
                    style={{ fontFamily: SERIF, fontSize: 22, color: b.col }}
                  >
                    {n}
                  </span>
                  <span className="ml-1 text-xs" style={{ color: C.soft }}>
                    {b.etiqueta}
                  </span>
                </div>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => setBebida(b.tipo, -1)}
                    disabled={n === 0}
                    aria-label={`Quitar ${b.etiqueta}`}
                    className="fx chip h-8 w-8 rounded-sm text-base disabled:opacity-30"
                    style={{ background: C.ground, border: `1px solid ${C.line}` }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => setBebida(b.tipo, 1)}
                    aria-label={`Sumar ${b.etiqueta}`}
                    className="fx chip h-8 w-8 rounded-sm text-base"
                    style={{ background: b.col, color: "#FFFFFF" }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {(() => {
          const hoy = resumen[dayKey(date)]?.creatina ? true : false;
          // Adherencia de los últimos 14 días, contando desde el día en pantalla.
          let tomados = 0;
          for (let i = 0; i < 14; i++) {
            const d = new Date(date);
            d.setDate(d.getDate() - i);
            if (resumen[dayKey(d)]?.creatina) tomados++;
          }
          return (
            <button
              onClick={toggleCreatina}
              aria-pressed={hoy}
              className="fx chip mt-2 flex w-full items-center gap-2 rounded-sm px-2.5 py-2"
              style={{
                background: hoy ? VERDE : C.campo,
                color: hoy ? C.ground : C.ink,
                border: `1px solid ${hoy ? VERDE : C.line}`,
              }}
            >
              <span style={{ opacity: hoy ? 1 : 0.6 }}>
                <Icono nombre="Creatina" size={22} />
              </span>
              <span className="text-sm">Creatina</span>
              <span className="text-xs" style={{ color: hoy ? C.line : C.soft }}>
                {tomados} de los últimos 14 días
              </span>
              <span
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-sm text-sm"
                style={{
                  background: hoy ? C.ground : "transparent",
                  color: hoy ? VERDE : C.soft,
                  border: hoy ? "none" : `1px solid ${C.line}`,
                }}
              >
                {hoy ? "✓" : ""}
              </span>
            </button>
          );
        })()}
        </Seccion>

        <Seccion titulo="Registrar">
        <div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analizar()}
              placeholder="Algo fuera del plan…"
              className="fx flex-1 rounded-sm px-3 py-2 text-sm"
              style={{ background: C.campo, border: `1px solid ${C.line}` }}
            />
            <button
              onClick={analizar}
              disabled={busy || !input.trim()}
              className="fx chip rounded-sm px-4 py-2 text-sm disabled:opacity-40"
              style={{ background: C.kcal, color: "#FFFFFF" }}
            >
              {busy ? "…" : "Añadir"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs" style={{ color: C.protT }}>
              {error}
            </p>
          )}
        </div>

        <div className="mt-4">
          {PLAN.map((bloque) => (
            <div key={bloque.comida} className="mt-4">
              <h2
                className="inline-block rounded-sm px-1.5 py-0.5 text-xs"
                style={{
                  background: MEAL[bloque.comida].bg,
                  color: MEAL[bloque.comida].fg,
                }}
              >
                {bloque.comida}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {bloque.items.map((it) => {
                  const veces = entries.filter(
                    (e) => e.nombre === it.nombre && e.comida === bloque.comida
                  ).length;
                  return (
                    <button
                      key={it.nombre + it.u}
                      onClick={() => agregar(it, bloque.comida)}
                      className="fx chip inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-xs"
                      style={{
                        background: veces ? MEAL[bloque.comida].bg : C.campo,
                        color: veces ? MEAL[bloque.comida].fg : C.ink,
                        border: `1px solid ${
                          veces ? MEAL[bloque.comida].bg : C.line
                        }`,
                      }}
                    >
                      <Icono nombre={it.nombre} size={15} />
                      <span>{it.nombre}</span>
                      {veces > 1 && (
                        <span className="tabular-nums opacity-70">×{veces}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-5">
            <h2
              className="inline-block rounded-sm px-1.5 py-0.5 text-xs"
              style={{ background: TAUPE, color: "#FFFFFF" }}
            >
              Comunes
            </h2>
            <span className="ml-2 text-xs" style={{ color: C.soft }}>
              entran en {mealNow()}, muévelos desde Corregir
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {COMUNES.map((it) => {
                const veces = entries.filter(
                  (e) => e.nombre === it.nombre
                ).length;
                return (
                  <button
                    key={it.nombre}
                    onClick={() => agregar(it)}
                    className="fx chip inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-xs"
                    style={{
                      background: veces ? TAUPE : C.campo,
                      color: veces ? "#FFFFFF" : C.ink,
                      border: `1px solid ${veces ? TAUPE : C.line}`,
                    }}
                  >
                    <Icono nombre={it.nombre} size={15} />
                    <span>{it.nombre}</span>
                    {veces > 1 && (
                      <span className="tabular-nums opacity-70">×{veces}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <h2
              className="inline-block rounded-sm px-1.5 py-0.5 text-xs"
              style={{ background: VINO, color: "#FFFFFF" }}
            >
              Alcohol
            </h2>
            <span className="ml-2 text-xs" style={{ color: C.soft }}>
              suma calorías, no macros
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALCOHOL.map((it) => {
                const veces = entries.filter((e) => e.nombre === it.nombre).length;
                return (
                  <button
                    key={it.nombre}
                    onClick={() => agregar(it)}
                    className="fx chip inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-xs"
                    style={{
                      background: veces ? VINO : C.campo,
                      color: veces ? "#FFFFFF" : C.ink,
                      border: `1px solid ${veces ? VINO : C.line}`,
                    }}
                  >
                    <Icono nombre={it.nombre} size={15} />
                    <span>{it.nombre}</span>
                    {veces > 1 && (
                      <span className="tabular-nums opacity-70">×{veces}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </Seccion>

        <Seccion titulo="Comidas de hoy">
        <div>
          {!ready ? (
            <p className="text-sm" style={{ color: C.soft }}>
              Cargando…
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm" style={{ color: C.soft }}>
              Nada registrado. Toca un alimento de arriba.
            </p>
          ) : (
            MEALS.filter((m) => entries.some((e) => e.comida === m)).map((m) => {
              const lista = entries.filter((e) => e.comida === m);
              const sub = lista.reduce(
                (a, e) => suma(a, mac(e)),
                { ...VACIO }
              );
              const abierta = !cerradas.includes(m);
              return (
                <section key={m} className="mb-5">
                  <button
                    onClick={() => toggleMeal(m)}
                    className="fx flex w-full items-baseline justify-between pb-1"
                    style={{ borderBottom: `3px solid ${MEAL[m].bg}` }}
                  >
                    <span className="text-sm">
                      <span
                        className="mr-1.5 inline-block text-xs"
                        style={{
                          color: C.soft,
                          transform: abierta ? "rotate(90deg)" : "none",
                        }}
                      >
                        ›
                      </span>
                      {m}
                    </span>
                    <span
                      className="tabular-nums text-sm"
                      style={{ fontFamily: SERIF, color: C.kcalT }}
                    >
                      {kcalMac(sub)}
                      <span style={{ color: C.soft }}> kcal</span>
                    </span>
                  </button>

                  {!abierta && (
                    <div
                      className="mt-1 flex gap-3 text-xs tabular-nums"
                      style={{ color: C.soft }}
                    >
                      <span>
                        {lista.length}{" "}
                        {lista.length === 1 ? "alimento" : "alimentos"}
                      </span>
                      <span style={{ color: C.protT }}>P {Math.round(sub.p)}</span>
                      <span style={{ color: C.carbT }}>C {Math.round(sub.c)}</span>
                      <span style={{ color: C.fatT }}>G {Math.round(sub.g)}</span>
                    </div>
                  )}

                  {abierta && (
                    <ul>
                      {lista.map((e) => {
                        const x = mac(e);
                        return (
                          <li
                            key={e.id}
                            className="py-3"
                            style={{ borderBottom: `1px solid ${C.line}` }}
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="flex min-w-0 items-center gap-2 pr-3 text-sm">
                                <Icono nombre={e.nombre} size={18} />
                                <span className="truncate">{e.nombre}</span>
                              </span>
                              <span
                                className="shrink-0 tabular-nums text-sm"
                                style={{ fontFamily: SERIF, color: C.kcalT }}
                              >
                                {kcalMac(x)}
                                <span
                                  className="text-xs"
                                  style={{ color: C.soft, fontFamily: SANS }}
                                >
                                  {" "}
                                  kcal
                                </span>
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-2 text-xs tabular-nums">
                              <span style={{ color: C.soft }}>
                                {nice(e.cant)} {unidad(e)}
                              </span>
                              <Sep />
                              <span style={{ color: C.protT }}>P {Math.round(x.p)}</span>
                              <span style={{ color: C.carbT }}>C {Math.round(x.c)}</span>
                              <span style={{ color: C.fatT }}>G {Math.round(x.g)}</span>
                              <button
                                onClick={() => setOpenId(openId === e.id ? null : e.id)}
                                className="fx ml-auto rounded-sm px-2 py-0.5 text-xs"
                                style={{
                                  background: openId === e.id ? C.ink : C.campo,
                                  color: openId === e.id ? C.campo : C.ink,
                                  border: `1px solid ${C.line}`,
                                }}
                              >
                                {openId === e.id ? "Cerrar" : "Corregir"}
                              </button>
                            </div>

                            {openId === e.id && (
                              <div
                                className="mt-3 rounded-sm p-3"
                                style={{
                                  background: C.campo,
                                  border: `1px solid ${C.line}`,
                                }}
                              >
                                <label className="block text-xs" style={{ color: C.soft }}>
                                  ¿Cuánto comiste realmente?
                                </label>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step={paso(e.u)}
                                    value={e.cant}
                                    onChange={(ev) => setCant(e.id, ev.target.value)}
                                    className="fx w-28 rounded-sm px-2 py-1.5 text-base tabular-nums"
                                    style={{
                                      background: C.ground,
                                      border: `1px solid ${C.line}`,
                                      fontFamily: SERIF,
                                    }}
                                  />
                                  <span className="text-sm">{unidad(e)}</span>
                                  <button
                                    onClick={() => borrar(e.id)}
                                    className="fx ml-auto text-xs underline"
                                    style={{ color: C.protT }}
                                  >
                                    Eliminar
                                  </button>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs" style={{ color: C.soft }}>
                                    Mover a
                                  </span>
                                  {MEALS.filter((x2) => x2 !== e.comida).map((x2) => (
                                    <button
                                      key={x2}
                                      onClick={() => setComida(e.id, x2)}
                                      className="fx rounded-full px-2 py-1 text-xs"
                                      style={{
                                        background: C.ground,
                                        border: `1px solid ${C.line}`,
                                      }}
                                    >
                                      {x2}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>
        </Seccion>

        <Seccion
          titulo="Mi plan"
          derecha={
            <button
              onClick={() => setVerPlan((v) => !v)}
              className="fx text-xs underline"
              style={{ color: C.soft }}
            >
              {verPlan ? "ocultar" : "ver"}
            </button>
          }
        >

          {verPlan && (
            <div className="mt-3">
              {PLAN.map((bloque) => {
                const sub = bloque.items
                  .filter((i) => !i.alt)
                  .reduce(
                    (a, i) => ({
                      p: a.p + i.cant * i.pu,
                      c: a.c + i.cant * i.cu,
                      g: a.g + i.cant * i.gu,
                    }),
                    { p: 0, c: 0, g: 0 }
                  );
                return (
                  <div key={bloque.comida} className="mb-4">
                    <div className="flex items-baseline justify-between">
                      <h3
                        className="text-xs uppercase tracking-wide"
                        style={{ color: MEAL[bloque.comida].txt }}
                      >
                        {bloque.comida}
                      </h3>
                      <span className="tabular-nums text-xs" style={{ color: C.soft }}>
                        {kcalOf(sub.p, sub.c, sub.g)} kcal
                      </span>
                    </div>
                    <ul className="mt-1">
                      {bloque.items.map((i) => (
                        <li
                          key={i.nombre + i.u}
                          className="flex items-baseline justify-between py-1 text-sm"
                          style={{ borderBottom: `1px solid ${C.line}` }}
                        >
                          <span
                            className="flex min-w-0 items-center gap-2"
                            style={{ color: i.alt ? C.soft : C.ink }}
                          >
                            <span style={{ opacity: i.alt ? 0.55 : 1 }}>
                              <Icono nombre={i.nombre} size={16} />
                            </span>
                            <span className="truncate">
                              {i.alt && <span style={{ color: C.soft }}>o bien </span>}
                              {i.nombre}
                            </span>
                          </span>
                          <span
                            className="shrink-0 pl-3 tabular-nums"
                            style={{ fontFamily: SERIF, color: C.soft }}
                          >
                            {nice(i.cant)} {unidad(i)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div
                      className="mt-1 flex gap-3 text-xs tabular-nums"
                      style={{ color: C.soft }}
                    >
                      <span style={{ color: C.protT }}>P {Math.round(sub.p)}</span>
                      <span style={{ color: C.carbT }}>C {Math.round(sub.c)}</span>
                      <span style={{ color: C.fatT }}>G {Math.round(sub.g)}</span>
                    </div>
                  </div>
                );
              })}

              <div
                className="flex items-baseline justify-between pt-2"
                style={{ borderTop: `2px solid ${C.ink}` }}
              >
                <span className="text-sm">Plan completo</span>
                <span className="tabular-nums text-sm" style={{ fontFamily: SERIF }}>
                  {planTotal.p} P · {planTotal.c} C · {planTotal.g} G
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: C.soft }}>
                Los renglones en gris son alternativas, no se suman. El total
                asume pollo en la comida y atún en la cena.
              </p>
            </div>
          )}
        </Seccion>

        <Seccion
          titulo="Simulador"
          derecha={
            <button
              onClick={() => setVerSim((v) => !v)}
              className="fx text-xs underline"
              style={{ color: C.soft }}
            >
              {verSim ? "ocultar" : "ver"}
            </button>
          }
        >

          {verSim && (
            <div className="mt-3">
              <p className="text-xs leading-relaxed" style={{ color: C.soft }}>
                Prueba hasta tres alimentos y mira cómo quedaría tu día. Nada de
                esto se registra ni se guarda.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  value={simInput}
                  onChange={(ev) => setSimInput(ev.target.value)}
                  onKeyDown={(ev) => ev.key === "Enter" && buscarSim()}
                  disabled={sim.length >= 3}
                  placeholder={
                    sim.length >= 3
                      ? "Ya son tres, quita uno"
                      : "Buscar alimento…"
                  }
                  className="fx flex-1 rounded-sm px-3 py-2 text-sm disabled:opacity-50"
                  style={{ background: C.campo, border: `1px solid ${C.line}` }}
                />
                <button
                  onClick={buscarSim}
                  disabled={simBusy || !simInput.trim() || sim.length >= 3}
                  className="fx chip rounded-sm px-4 py-2 text-sm disabled:opacity-40"
                  style={{ background: C.fat, color: C.ink }}
                >
                  {simBusy ? "…" : "Probar"}
                </button>
              </div>
              {simError && (
                <p className="mt-2 text-xs" style={{ color: C.protT }}>
                  {simError}
                </p>
              )}

              {sim.length > 0 && (
                <>
                  <ul className="mt-3">
                    {sim.map((e) => {
                      const x = mac(e);
                      return (
                        <li
                          key={e.id}
                          className="py-2"
                          style={{ borderBottom: `1px solid ${C.line}` }}
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="truncate pr-3 text-sm">
                              {e.nombre}
                            </span>
                            <span
                              className="shrink-0 tabular-nums text-sm"
                              style={{ fontFamily: SERIF, color: C.kcalT }}
                            >
                              {kcalMac(x)}
                              <span className="ml-1 text-xs" style={{ color: C.soft }}>
                                kcal
                              </span>
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs tabular-nums">
                            <input
                              type="number"
                              inputMode="decimal"
                              step={paso(e.u)}
                              value={e.cant}
                              onChange={(ev) =>
                                setSim(
                                  sim.map((z) =>
                                    z.id === e.id
                                      ? {
                                          ...z,
                                          cant: Math.max(
                                            0,
                                            Number(ev.target.value) || 0
                                          ),
                                        }
                                      : z
                                  )
                                )
                              }
                              className="fx w-20 rounded-sm px-2 py-1 text-sm tabular-nums"
                              style={{
                                background: C.campo,
                                border: `1px solid ${C.line}`,
                                fontFamily: SERIF,
                              }}
                            />
                            <span style={{ color: C.soft }}>{unidad(e)}</span>
                            <Sep />
                            <span style={{ color: C.protT }}>P {Math.round(x.p)}</span>
                            <span style={{ color: C.carbT }}>C {Math.round(x.c)}</span>
                            <span style={{ color: C.fatT }}>G {Math.round(x.g)}</span>
                            <button
                              onClick={() => setSim(sim.filter((z) => z.id !== e.id))}
                              className="fx ml-auto text-xs underline"
                              style={{ color: C.protT }}
                            >
                              Quitar
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-5 space-y-4">
                    {[
                      {
                        n: "Calorías",
                        act: eatenKcal,
                        proy: kcalOf(
                          totals.p + simTot.p,
                          totals.c + simTot.c,
                          totals.g + simTot.g,
                          totals.a + simTot.a
                        ),
                        meta: targetKcal,
                        col: C.kcalT,
                        bar: C.kcal,
                        u: "kcal",
                      },
                      {
                        n: "Proteína",
                        act: Math.round(totals.p),
                        proy: Math.round(totals.p + simTot.p),
                        meta: obj.p,
                        col: C.protT,
                        bar: C.prot,
                        u: "g",
                      },
                      {
                        n: "Carbohidratos",
                        act: Math.round(totals.c),
                        proy: Math.round(totals.c + simTot.c),
                        meta: obj.c,
                        col: C.carbT,
                        bar: C.carb,
                        u: "g",
                      },
                      {
                        n: "Grasas",
                        act: Math.round(totals.g),
                        proy: Math.round(totals.g + simTot.g),
                        meta: obj.g,
                        col: C.fatT,
                        bar: C.fat,
                        u: "g",
                      },
                    ].map((f) => {
                      const dif = f.proy - f.meta;
                      return (
                        <div key={f.n}>
                          <div className="flex items-baseline justify-between text-sm">
                            <span style={{ color: f.col }}>{f.n}</span>
                            <span className="tabular-nums" style={{ fontFamily: SERIF }}>
                              <span style={{ color: C.soft }}>{f.act}</span>
                              <span style={{ color: C.soft }}> → </span>
                              <span style={{ color: f.col }}>{f.proy}</span>
                              <span className="ml-1 text-xs" style={{ color: C.soft }}>
                                de {f.meta}
                              </span>
                            </span>
                          </div>
                          <BarSim
                            act={f.act}
                            extra={f.proy - f.act}
                            meta={f.meta}
                            color={f.bar}
                          />
                          <div
                            className="mt-0.5 text-right text-xs tabular-nums"
                            style={{ color: C.soft }}
                          >
                            {(() => {
                              const pct = f.meta
                                ? Math.round((f.proy / f.meta) * 100)
                                : 0;
                              if (dif === 0) return `justo en la meta · 100%`;
                              return dif < 0
                                ? `faltarían ${-dif} ${f.u} · ${pct}% de la meta`
                                : `+${dif} ${f.u} sobre la meta · ${pct}%`;
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSim([])}
                    className="fx mt-4 text-xs underline"
                    style={{ color: C.soft }}
                  >
                    Limpiar simulación
                  </button>
                </>
              )}
            </div>
          )}
        </Seccion>

        <Seccion
          titulo="Respaldo"
          derecha={
            <button
              onClick={() => setVerResp((v) => !v)}
              className="fx text-xs underline"
              style={{ color: C.soft }}
            >
              {verResp ? "ocultar" : "ver"}
            </button>
          }
        >

          {verResp && (
            <div className="mt-3">
              <p className="text-xs leading-relaxed" style={{ color: C.soft }}>
                {hasStore
                  ? `Almacenamiento activo. ${Object.keys(resumen).length} ${
                      Object.keys(resumen).length === 1
                        ? "día guardado"
                        : "días guardados"
                    }.`
                  : "Sin almacenamiento en esta sesión: lo que registres se pierde al cerrar. Copia el respaldo antes de salir."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={prepararCompleto}
                  disabled={prep === "trabajando"}
                  className="fx chip rounded-sm px-3 py-2 text-sm disabled:opacity-40"
                  style={{ background: C.fat, color: C.ink }}
                >
                  {prep === "trabajando"
                    ? `Leyendo ${avance.hecho} de ${avance.total}…`
                    : "Incluir desglose"}
                </button>
                <button
                  onClick={copiarRespaldo}
                  className="fx chip rounded-sm px-3 py-2 text-sm"
                  style={{ background: C.kcal, color: "#FFFFFF" }}
                >
                  Copiar respaldo
                </button>
                <button
                  onClick={restaurar}
                  disabled={!pegado.trim()}
                  className="fx chip rounded-sm px-3 py-2 text-sm disabled:opacity-40"
                  style={{ background: C.campo, border: `1px solid ${C.line}` }}
                >
                  Restaurar
                </button>
              </div>

              <textarea
                ref={respRef}
                readOnly
                value={respaldo}
                onFocus={(ev) => ev.target.select()}
                rows={3}
                className="fx mt-3 w-full rounded-sm p-2 text-xs"
                style={{
                  background: C.campo,
                  border: `1px solid ${C.line}`,
                  color: C.soft,
                }}
              />

              <textarea
                value={pegado}
                onChange={(ev) => setPegado(ev.target.value)}
                rows={3}
                placeholder="Pega aquí el respaldo del otro dispositivo…"
                className="fx mt-2 w-full rounded-sm p-2 text-xs"
                style={{ background: C.campo, border: `1px solid ${C.line}` }}
              />

              {avisoResp && (
                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{
                    color:
                      avisoTipo === "error"
                        ? C.protT
                        : avisoTipo === "ok"
                        ? C.fatT
                        : C.soft,
                  }}
                >
                  {avisoResp}
                </p>
              )}

              <p className="mt-2 text-xs leading-relaxed" style={{ color: C.soft }}>
                {prep === "listo"
                  ? "Este respaldo lleva tus objetivos, el total de cada día y el desglose por alimento. Al restaurarlo no se pisa ningún día que ya exista en el otro dispositivo."
                  : "Así como está, el respaldo lleva tus objetivos y el total de cada día. Toca Incluir desglose para agregar también qué comiste cada día."}
              </p>
            </div>
          )}
        </Seccion>

        {detalle && detalleDatos && (() => {
          const meta = {
            p: { nombre: "Proteína", col: C.prot, colT: C.protT, obj: obj.p },
            c: { nombre: "Carbohidratos", col: C.carb, colT: C.carbT, obj: obj.c },
            g: { nombre: "Grasas", col: C.fat, colT: C.fatT, obj: obj.g },
          }[detalle];
          const suma = Math.round(detalleDatos.suma);
          return (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center p-3"
              style={{ background: "rgba(43,27,61,0.45)" }}
              onClick={() => setDetalle(null)}
              role="dialog"
              aria-modal="true"
              aria-label={`Detalle de ${meta.nombre}`}
            >
              <div
                onClick={(ev) => ev.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-lg"
                style={{
                  background: C.ground,
                  border: `1px solid ${C.line}`,
                  maxHeight: "82vh",
                }}
              >
                <div
                  className="flex items-baseline justify-between px-4 py-3"
                  style={{ borderBottom: `3px solid ${meta.col}` }}
                >
                  <div>
                    <h2 className="text-sm" style={{ color: meta.colT }}>
                      {meta.nombre}
                    </h2>
                    <p className="text-xs" style={{ color: C.soft }}>
                      {suma} g de {meta.obj} g · {detalleDatos.lista.length}{" "}
                      {detalleDatos.lista.length === 1 ? "alimento" : "alimentos"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetalle(null)}
                    className="fx rounded-sm px-2 py-1 text-sm"
                    style={{ background: C.campo, border: `1px solid ${C.line}` }}
                  >
                    Cerrar
                  </button>
                </div>

                <div
                  className="overflow-y-auto px-4 py-3"
                  style={{ maxHeight: "60vh" }}
                >
                  {detalleDatos.lista.length === 0 ? (
                    <p className="py-6 text-sm" style={{ color: C.soft }}>
                      Ningún alimento registrado aporta {meta.nombre.toLowerCase()}.
                    </p>
                  ) : (
                    <ul>
                      {detalleDatos.lista.map((r, i) => {
                        const pct = suma ? (r.val / detalleDatos.suma) * 100 : 0;
                        return (
                          <li
                            key={r.nombre + r.u}
                            className="py-2.5"
                            style={{
                              borderTop: i ? `1px solid ${C.line}` : "none",
                            }}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-2 text-sm">
                                <Icono nombre={r.nombre} size={18} />
                                <span className="truncate">{r.nombre}</span>
                              </span>
                              <span
                                className="shrink-0 tabular-nums text-sm"
                                style={{ fontFamily: SERIF, color: meta.colT }}
                              >
                                {Math.round(r.val)}
                                <span className="ml-1 text-xs" style={{ color: C.soft }}>
                                  g
                                </span>
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className="shrink-0 text-xs tabular-nums"
                                style={{ color: C.soft, minWidth: 74 }}
                              >
                                {nice(r.cant)} {unidad(r)}
                              </span>
                              <div
                                className="h-2 flex-1 overflow-hidden rounded-sm"
                                style={{ background: `${meta.col}20` }}
                              >
                                <div
                                  className="mbar h-full"
                                  style={{ width: `${pct}%`, background: meta.col }}
                                />
                              </div>
                              <span
                                className="w-10 shrink-0 text-right text-xs tabular-nums"
                                style={{ color: meta.colT }}
                              >
                                {Math.round(pct)}%
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {detalleDatos.ceros > 0 && (
                    <p className="mt-3 text-xs" style={{ color: C.soft }}>
                      {detalleDatos.ceros}{" "}
                      {detalleDatos.ceros === 1
                        ? "alimento no aporta"
                        : "alimentos no aportan"}{" "}
                      {meta.nombre.toLowerCase()} y no aparecen en la lista.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <p className="mt-8 text-xs leading-relaxed" style={{ color: C.soft }}>
          Las cantidades son estimaciones. Si comiste otra cantidad, toca
          Corregir y escribe la cantidad real en su propia unidad.
        </p>
        </>
        )}
      </div>
    </div>
  );
}

const METRICAS = [
  ["kcal", "Calorías", "kcal"],
  ["p", "Proteína", "g"],
  ["c", "Carbohidratos", "g"],
  ["g", "Grasas", "g"],
  ["fi", "Fibra", "g"],
  ["az", "Azúcar", "g"],
  ["so", "Sodio", "mg"],
  ["sa", "Saturada", "g"],
  ["alc", "Alcohol", "kcal"],
  ["agua", "Agua", "vasos"],
  ["cafe", "Café", "tazas"],
];

function Historial({ resumen, targets, cargando }) {
  const [m, setM] = useState("kcal");
  const [dias, setDias] = useState(14);

  const BEBIDA = { agua: "#4FB3D9", cafe: "#6B4A2F", alc: VINO };
  const MICRO = {
    fi: { bar: "#6BA368", txt: "#3F6B3D", tope: false },
    az: { bar: "#E86FA8", txt: "#A83070", tope: true },
    so: { bar: "#7C8CA8", txt: "#4A587095", tope: true },
    sa: { bar: "#E0813C", txt: "#94501A", tope: true },
  };
  const esMicro = !!MICRO[m];
  const BEBIDA_T = { agua: "#166E92", cafe: "#6B4A2F", alc: VINO };
  const esBebida = m === "agua" || m === "cafe" || m === "alc";
  const color = MICRO[m]
    ? MICRO[m].bar
    : BEBIDA[m]
    ? BEBIDA[m]
    : m === "p"
    ? C.prot
    : m === "c"
    ? C.carb
    : m === "g"
    ? C.fat
    : C.kcal;
  const colorT = MICRO[m]
    ? MICRO[m].txt
    : BEBIDA_T[m]
    ? BEBIDA_T[m]
    : m === "p"
    ? C.protT
    : m === "c"
    ? C.carbT
    : m === "g"
    ? C.fatT
    : C.kcalT;
  const unit =
    m === "so"
      ? "mg"
      : m === "kcal" || m === "alc"
      ? "kcal"
      : m === "agua"
      ? "vasos"
      : m === "cafe"
      ? "tazas"
      : "g";
  // El agua trae una referencia de 8 vasos. El café no lleva meta.
  const objKcal = kcalOf(targets.p, targets.c, targets.g);
  const meta =
    m === "kcal"
      ? objKcal
      : m === "agua"
      ? 8
      : m === "cafe" || m === "alc"
      ? 0
      : m === "fi"
      ? Math.round((objKcal / 1000) * 14) // mínimo: 14 g por cada 1000 kcal
      : m === "az"
      ? Math.round((objKcal * 0.1) / 4) // tope: 10% de la energía
      : m === "so"
      ? 2300 // tope diario en mg
      : m === "sa"
      ? Math.round((objKcal * 0.1) / 9) // tope: 10% de la energía
      : targets[m];

  const barras = useMemo(() => {
    const out = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const r = resumen[k];
      out.push({
        k,
        dia: d.getDate(),
        valor: !r
          ? null
          : m === "kcal"
          ? r.p === undefined
            ? null
            : kcalOf(r.p, r.c, r.g, r.a || 0)
          : m === "alc"
          ? Math.round((r.a || 0) * 7)
          : esMicro
          ? r[m] === undefined
            ? null
            : Math.round(r[m])
          : esBebida
          ? r[m] || 0
          : r[m] === undefined
          ? null
          : Math.round(r[m]),
      });
    }
    return out;
  }, [resumen, dias, m, esBebida, esMicro]);

  const conDatos = barras.filter((b) => b.valor !== null);
  const max = Math.max(meta * 1.15, ...conDatos.map((b) => b.valor), 1);
  const promCrudo = conDatos.length
    ? conDatos.reduce((a, b) => a + b.valor, 0) / conDatos.length
    : 0;
  const prom =
    esBebida && m !== "alc"
      ? Math.round(promCrudo * 10) / 10
      : Math.round(promCrudo);
  const alto = 150;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-1.5">
        {METRICAS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setM(id)}
            className="fx chip rounded-full px-3 py-1.5 text-xs"
            style={{
              background: m === id ? color : C.campo,
              color:
                m === id
                  ? id === "kcal" || id === "cafe"
                    ? "#FFFFFF"
                    : C.ink
                  : C.ink,
              border: `1px solid ${m === id ? color : C.line}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {conDatos.length === 0 ? (
        <p className="mt-8 text-sm" style={{ color: C.soft }}>
          {cargando
            ? "Buscando días anteriores…"
            : "Todavía no hay días registrados. Vuelve mañana."}
        </p>
      ) : (
        <>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <span
                className="tabular-nums"
                style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1, color: colorT }}
              >
                {prom}
              </span>
              <span className="ml-2 text-sm" style={{ color: C.soft }}>
                {unit} en promedio
              </span>
            </div>
            <span className="pb-1 text-xs" style={{ color: C.soft }}>
              {conDatos.length} {conDatos.length === 1 ? "día" : "días"} con
              registro
            </span>
          </div>

          <div className="relative mt-5" style={{ height: alto }}>
            {meta > 0 && (
              <>
                <div
                  className="absolute w-full"
                  style={{
                    bottom: (meta / max) * alto,
                    borderTop: `1px dashed ${C.ink}`,
                    opacity: 0.5,
                  }}
                />
                <div
                  className="absolute right-0 px-1 text-xs tabular-nums"
                  style={{
                    bottom: (meta / max) * alto + 2,
                    color: C.soft,
                    background: C.ground,
                  }}
                >
                  {m === "fi" ? "mínimo" : m === "agua" ? "referencia" : esMicro ? "tope" : "meta"}{" "}
                  {meta}
                </div>
              </>
            )}
            <div className="flex h-full items-end gap-1">
              {barras.map((b) => (
                <div key={b.k} className="flex h-full flex-1 items-end">
                  {b.valor === null ? (
                    <div
                      className="w-full rounded-sm"
                      style={{ height: 3, background: C.line }}
                    />
                  ) : (
                    <div
                      className="mbar w-full rounded-sm"
                      style={{
                        height: Math.max(3, (b.valor / max) * alto),
                        background: color,
                        opacity: b.valor >= meta ? 1 : 0.55,
                      }}
                      title={`${b.valor} ${unit}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-1 flex gap-1">
            {barras.map((b) => (
              <div
                key={b.k}
                className="flex-1 text-center text-xs tabular-nums"
                style={{ color: C.soft, fontSize: 9 }}
              >
                {b.dia}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed" style={{ color: C.soft }}>
            Las barras sólidas llegaron a la meta, las tenues se quedaron cortas. Las líneas planas son días sin registro y no cuentan en el
            promedio.
          </p>

          <div className="mt-5 flex gap-1.5">
            {[7, 14, 30].map((n) => (
              <button
                key={n}
                onClick={() => setDias(n)}
                className="fx chip rounded-full px-3 py-1 text-xs tabular-nums"
                style={{
                  background: dias === n ? C.ink : C.campo,
                  color: dias === n ? C.ground : C.ink,
                  border: `1px solid ${dias === n ? C.ink : C.line}`,
                }}
              >
                {n} días
              </button>
            ))}
          </div>
        </>
      )}

      {cargando && conDatos.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: C.soft }}>
          Revisando días anteriores…
        </p>
      )}
    </div>
  );
}

function Sep() {
  return (
    <span
      aria-hidden="true"
      className="inline-block"
      style={{ width: 1, height: "0.85em", background: C.line }}
    />
  );
}

// Barra de tres tramos: lo ya comido, lo que sumaria la simulacion, y lo que
// faltaria para la meta. El tramo simulado va rayado para que se distinga de
// lo que realmente comiste.
// Barra de calorías dividida por comida, con marcas de dónde deberías ir
// según el reparto del plan. Deja ver cómo avanza el día.
// Puntos de control del arco y muestreo para ubicar las etiquetas justo
// debajo de su marca (la longitud del arco no avanza igual que la x).
const ARCO = [
  [8, 52],
  [90, 10],
  [210, 8],
  [292, 42],
];
const ARCO_TABLA = (() => {
  const pt = (t) => {
    const u = 1 - t;
    return [
      u * u * u * ARCO[0][0] +
        3 * u * u * t * ARCO[1][0] +
        3 * u * t * t * ARCO[2][0] +
        t * t * t * ARCO[3][0],
      u * u * u * ARCO[0][1] +
        3 * u * u * t * ARCO[1][1] +
        3 * u * t * t * ARCO[2][1] +
        t * t * t * ARCO[3][1],
    ];
  };
  const filas = [];
  let largo = 0;
  let prev = pt(0);
  filas.push({ l: 0, x: prev[0] });
  for (let i = 1; i <= 400; i++) {
    const p = pt(i / 400);
    largo += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    filas.push({ l: largo, x: p[0] });
    prev = p;
  }
  return { filas, total: largo };
})();
const xEnFraccion = (f) => {
  const meta = f * ARCO_TABLA.total;
  const fila = ARCO_TABLA.filas.find((r) => r.l >= meta);
  return fila ? fila.x : 292;
};

function BarKcal({ porComida, target, alcohol = 0 }) {
  const total = MEALS.reduce((a, m) => a + (porComida[m] || 0), 0);
  const max = Math.max(target, total, 1);

  // Arco suave. pathLength=100 deja medir los tramos en porcentaje directo,
  // sin calcular la longitud real de la curva.
  const D = "M 8 52 C 90 10, 210 8, 292 42";
  const grosor = 9;

  // Tramos de color, uno por comida, en el orden en que transcurre el día.
  const tramos = [];
  let acc = 0;
  MEALS.forEach((m) => {
    const v = porComida[m] || 0;
    if (v <= 0) return;
    const largo = (v / max) * 100;
    tramos.push({ m, inicio: acc, largo });
    acc += largo;
  });

  const marcas = PLAN_ACUM.slice(0, -1).map((a) => ({
    frac: (a.frac * target) / max,
    kcal: Math.round(a.frac * target),
  }));
  const pasado = total > target ? target / max : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm">Calorías</span>
        <span className="tabular-nums text-sm" style={{ fontFamily: SERIF }}>
          {total}
          <span style={{ color: C.soft }}> de {target} kcal</span>
        </span>
      </div>

      <svg
        viewBox="0 0 300 70"
        className="mt-1 w-full"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label={`${total} de ${target} kcal, repartidas por comida`}
      >
        {/* riel completo */}
        <path
          d={D}
          pathLength="100"
          fill="none"
          stroke={`${C.kcal}24`}
          strokeWidth={grosor}
          strokeLinecap="round"
        />

        {/* lo consumido, por comida */}
        {tramos.map((t) => (
          <path
            key={t.m}
            className="mbar"
            d={D}
            pathLength="100"
            fill="none"
            stroke={MEAL[t.m].bg}
            strokeWidth={grosor}
            strokeLinecap="butt"
            strokeDasharray={`${t.largo} 100`}
            strokeDashoffset={-t.inicio}
          />
        ))}

        {/* redondeo del extremo inicial */}
        {tramos.length > 0 && (
          <path
            d={D}
            pathLength="100"
            fill="none"
            stroke={MEAL[tramos[0].m].bg}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={`0.6 100`}
            strokeDashoffset={0}
          />
        )}

        {/* marcas de avance esperado: hueco del color del fondo + pastilla */}
        {marcas.map((mk) => (
          <g key={mk.kcal}>
            <path
              d={D}
              pathLength="100"
              fill="none"
              stroke={C.tarjeta}
              strokeWidth={grosor + 2}
              strokeLinecap="butt"
              strokeDasharray={`2.4 100`}
              strokeDashoffset={-(mk.frac * 100 - 1.2)}
            />
            <path
              d={D}
              pathLength="100"
              fill="none"
              stroke={C.line}
              strokeWidth={grosor - 1}
              strokeLinecap="round"
              strokeDasharray={`0.8 100`}
              strokeDashoffset={-(mk.frac * 100 - 0.4)}
            />
            <text
              x={xEnFraccion(mk.frac)}
              y={66}
              textAnchor="middle"
              fontSize="9"
              fill={C.soft}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {mk.kcal}
            </text>
          </g>
        ))}

        {/* si te pasaste, dónde quedó el objetivo */}
        {pasado !== null && (
          <path
            d={D}
            pathLength="100"
            fill="none"
            stroke={C.ink}
            strokeWidth={grosor + 3}
            strokeLinecap="butt"
            strokeDasharray={`1.2 100`}
            strokeDashoffset={-(pasado * 100 - 0.6)}
          />
        )}
      </svg>

      <div className="mt-1 space-y-1">
        {PLAN_ACUM.map((a) => {
          const hecho = porComida[a.comida] || 0;
          const pctHecho = Math.round((hecho / target) * 100);
          const pctPlan = Math.round(a.sola * 100);
          return (
            <div
              key={a.comida}
              className="flex items-baseline gap-2 text-xs tabular-nums"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: MEAL[a.comida].bg }}
              />
              <span style={{ color: C.ink }}>{a.comida}</span>
              <span className="ml-auto" style={{ color: C.soft }}>
                plan {pctPlan}%
              </span>
              <span
                className="w-12 text-right"
                style={{ color: hecho ? C.kcalT : C.soft }}
              >
                {pctHecho}%
              </span>
            </div>
          );
        })}
        {alcohol > 0 && (
          <div className="flex items-baseline gap-2 text-xs tabular-nums">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: VINO }}
            />
            <span style={{ color: C.ink }}>Alcohol</span>
            <span className="ml-auto" style={{ color: C.soft }}>
              {Math.round(alcohol)} g · {Math.round(alcohol * 7)} kcal
            </span>
            <span className="w-12 text-right" style={{ color: VINO }}>
              {Math.round(((alcohol * 7) / target) * 100)}%
            </span>
          </div>
        )}
        {porComida.Otros > 0 && (
          <div className="flex items-baseline gap-2 text-xs tabular-nums">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: MEAL.Otros.bg }}
            />
            <span style={{ color: C.ink }}>Otros</span>
            <span className="ml-auto" style={{ color: C.soft }}>
              fuera del plan
            </span>
            <span className="w-12 text-right" style={{ color: C.kcalT }}>
              {Math.round((porComida.Otros / target) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


function BarSim({ act, extra, meta, color }) {
  const total = act + extra;
  const max = Math.max(meta, total, 1);
  const pAct = (Math.min(act, max) / max) * 100;
  const pExtra = (Math.min(extra, Math.max(0, max - act)) / max) * 100;
  const pLeft = total < meta ? ((meta - total) / max) * 100 : 0;
  const marca = total > meta ? (meta / max) * 100 : null;

  return (
    <div
      className="relative mt-1 flex h-5 w-full overflow-hidden rounded-sm"
      style={{ background: C.campo, border: `1px solid ${C.line}` }}
      role="img"
      aria-label={`${act} consumido, ${extra} simulado, meta ${meta}`}
    >
      <div className="mbar h-full" style={{ width: `${pAct}%`, background: color }} />
      <div
        className="mbar h-full"
        style={{
          width: `${pExtra}%`,
          background: `repeating-linear-gradient(135deg, ${color} 0 3px, ${color}55 3px 7px)`,
        }}
      />
      {pLeft > 0 && (
        <div
          className="mbar h-full"
          style={{ width: `${pLeft}%`, background: `${color}20` }}
        />
      )}
      {marca !== null && (
        <div
          className="absolute top-0 h-full"
          style={{
            left: `calc(${marca}% - 2px)`,
            width: 4,
            background: C.ink,
            boxShadow: `0 0 0 1.5px ${C.campo}`,
          }}
        />
      )}
    </div>
  );
}


function Bar({ label, value, target, color, unit = "g", onClick }) {
  const v = Math.round(value);
  const t = Math.round(target);
  const max = Math.max(t, v, 1);
  const done = (Math.min(v, t) / max) * 100;
  const over = v > t ? ((v - t) / max) * 100 : 0;
  const left = v < t ? ((t - v) / max) * 100 : 0;

  const Cont = onClick ? "button" : "div";
  return (
    <Cont
      onClick={onClick}
      className={onClick ? "fx block w-full text-left" : undefined}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm">
          {label}
          {onClick && (
            <span className="ml-1 text-xs" style={{ color: C.soft }}>
              ›
            </span>
          )}
        </span>
        <span className="tabular-nums text-sm" style={{ fontFamily: SERIF }}>
          {v}
          <span style={{ color: C.soft }}>
            {" "}
            de {t} {unit}
          </span>
        </span>
      </div>

      <div
        className="relative mt-1.5 flex h-5 w-full overflow-hidden rounded-sm"
        style={{ background: C.campo, border: `1px solid ${C.line}` }}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={t}
        aria-label={label}
      >
        <div className="mbar h-full" style={{ width: `${done}%`, background: color }} />
        {over > 0 && (
          <div
            className="mbar h-full"
            style={{
              width: `${over}%`,
              background: `repeating-linear-gradient(135deg, ${color} 0 4px, ${color}99 4px 8px)`,
            }}
          />
        )}
        {left > 0 && (
          <div
            className="mbar h-full"
            style={{ width: `${left}%`, background: `${color}22` }}
          />
        )}
        {over > 0 && (
          <div
            className="absolute top-0 h-full"
            style={{
              left: `calc(${done}% - 2px)`,
              width: 4,
              background: C.ink,
              boxShadow: `0 0 0 1.5px ${C.campo}`,
            }}
          />
        )}
      </div>

      <div
        className="mt-1 flex justify-between text-xs tabular-nums"
        style={{ color: C.soft }}
      >
        <span>consumido {v}</span>
        <span>
          {v < t
            ? `${t - v === 1 ? "falta" : "faltan"} ${t - v} ${unit}`
            : v === t
            ? "objetivo cumplido"
            : `+${v - t} ${unit} sobre el objetivo`}
        </span>
      </div>
    </Cont>
  );
}
