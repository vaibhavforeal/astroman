// Ashtakoot Guna Milan — the classical 36-point (ashta-koota) marriage-
// compatibility score between two people's Moon nakshatra + rashi (Moon sign).
//
// Eight kutas are scored and summed to a maximum of 36 "gunas":
//   Varna 1 · Vashya 2 · Tara 3 · Yoni 4 · Graha Maitri 5 · Gana 6 · Bhakoot 7 · Nadi 8
//
// Every kuta table below is indexed [boy][girl] (i.e. male → female): several
// kutas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana) are directional, so the
// caller must designate which Moon is the groom's and which is the bride's.
//
// The scoring matrices are the widely-used Saravali/BPHS set (matching common
// Jyotish software). Structural invariants — the nakshatra→gana / →nadi
// partitions, the 14×14 yoni matrix diagonal, and the 36-guna total — are
// asserted at load time so a typo can't slip through, in the spirit of the
// ashtakavarga module.

// --- Reference data ---------------------------------------------------------

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// --- 1. Varna (max 1) -------------------------------------------------------
// Moon sign → varna by element: water = Brahmin, fire = Kshatriya, earth =
// Vaishya, air = Shudra. Rank Brahmin 4 (highest) … Shudra 1. One point if the
// boy's varna is equal to or higher than the girl's.
const VARNA_NAMES = { 4: "Brahmin", 3: "Kshatriya", 2: "Vaishya", 1: "Shudra" };
const VARNA_RANK_BY_SIGN = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]; // Aries..Pisces

// --- 2. Vashya (max 2) ------------------------------------------------------
// Moon sign → vashya class. Sagittarius and Capricorn split at 15° (we have the
// exact degree), the rest are whole-sign.
const VASHYA_CATS = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"];
function vashyaCat(signIndex, degInSign) {
  switch (signIndex) {
    case 0: case 1: return 0;                       // Aries, Taurus — quadruped
    case 2: case 5: case 6: case 10: return 1;      // Gemini, Virgo, Libra, Aquarius — human
    case 3: case 11: return 2;                      // Cancer, Pisces — watery
    case 4: return 3;                               // Leo — wild beast
    case 7: return 4;                               // Scorpio — insect
    case 8: return degInSign < 15 ? 1 : 0;          // Sagittarius: 1st half human, 2nd quadruped
    case 9: return degInSign < 15 ? 0 : 2;          // Capricorn: 1st half quadruped, 2nd watery
    default: return 1;
  }
}
// VASHYA_ARRAY[boyClass][girlClass] (Saravali).
const VASHYA_ARRAY = [
  [2.0, 0.5, 1.0, 0.0, 2.0],
  [0.5, 2.0, 0.0, 0.0, 0.0],
  [1.0, 0.0, 2.0, 2.0, 2.0],
  [0.0, 0.0, 2.0, 2.0, 0.0],
  [1.0, 0.0, 1.0, 0.0, 2.0]
];

// --- 3. Tara / Dina (max 3) -------------------------------------------------
// Count inclusively from one Moon nakshatra to the other; the count mod 9 gives
// the tara (Janma..Atimitra). Vipat(3), Pratyari(5) and Vadha(7) are the
// inauspicious taras. The score combines both directions.
const TARA_NAMES = [
  "Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Atimitra"
];
const TARA_ARRAY = [
  [3.0, 3.0, 1.5, 3.0, 1.5, 3.0, 1.5, 3.0, 3.0],
  [3.0, 3.0, 1.5, 3.0, 1.5, 3.0, 1.5, 3.0, 3.0],
  [1.5, 1.5, 0.0, 1.5, 0.0, 1.5, 0.0, 1.5, 1.5],
  [3.0, 3.0, 1.5, 3.0, 1.5, 3.0, 1.5, 3.0, 3.0],
  [1.5, 1.5, 0.0, 1.5, 0.0, 1.5, 0.0, 1.5, 1.5],
  [3.0, 3.0, 1.5, 3.0, 1.5, 3.0, 1.5, 3.0, 3.0],
  [1.5, 1.5, 0.0, 1.5, 0.0, 1.5, 0.0, 1.0, 1.0],
  [3.0, 3.0, 1.5, 3.0, 1.5, 3.0, 1.5, 3.0, 3.0],
  [3.0, 3.0, 1.5, 3.0, 1.5, 3.0, 1.5, 3.0, 3.0]
];
function taraIndex(fromNak, toNak) {
  const count = ((toNak - fromNak + 27) % 27) + 1; // inclusive count, 1..27
  const r = count % 9;
  return r === 0 ? 8 : r - 1; // 0 = Janma … 8 = Atimitra
}

// --- 4. Yoni (max 4) --------------------------------------------------------
// Each nakshatra maps to one of 14 animal yonis; compatibility is read off a
// 14×14 matrix (diagonal 4 = same yoni; 0 = sworn enemies).
const YONI_ANIMAL = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const YONI_CATS = [
  "Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat",
  "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"
];
const YONI_ARRAY = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 1, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]
];

// --- 5. Graha Maitri (max 5) ------------------------------------------------
// Friendship between the lords of the two Moon signs.
const SIGN_LORD_PLANET = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]; // sign → planet idx
const PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const MAITRI_ARRAY = [
  [5.0, 5.0, 5.0, 4.0, 5.0, 0.0, 0.0],
  [5.0, 5.0, 4.0, 1.0, 4.0, 0.5, 0.5],
  [5.0, 4.0, 5.0, 0.5, 5.0, 3.0, 0.5],
  [4.0, 1.0, 0.5, 5.0, 0.5, 5.0, 4.0],
  [5.0, 4.0, 5.0, 0.5, 5.0, 0.5, 3.0],
  [0.0, 0.5, 3.0, 5.0, 0.5, 5.0, 5.0],
  [0.0, 0.5, 0.5, 4.0, 3.0, 5.0, 5.0]
];

// --- 6. Gana (max 6) --------------------------------------------------------
// Nakshatra temperament: Deva (divine), Manushya (human), Rakshasa (demonic).
const GANA_CATS = ["Deva", "Manushya", "Rakshasa"];
const GANA_BY_NAK = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0
];
const GANA_ARRAY = [
  [6, 6, 0], // boy Deva
  [5, 6, 0], // boy Manushya
  [1, 0, 6]  // boy Rakshasa
];

// --- 7. Bhakoot (max 7) -----------------------------------------------------
// Based on the mutual position of the two Moon signs. Full 7 points unless the
// signs form a 2/12, 5/9 or 6/8 relationship — those carry Bhakoot dosha (0).
const BHAKOOT_DOSHA_DISTANCES = new Set([2, 5, 6, 8, 9, 12]);

// --- 8. Nadi (max 8) --------------------------------------------------------
// Nakshatra "pulse": Aadi (Vata), Madhya (Pitta), Antya (Kapha). Same Nadi
// scores 0 and carries Nadi dosha (the gravest); different Nadi scores 8.
const NADI_CATS = ["Aadi", "Madhya", "Antya"];
const NADI_BY_NAK = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2
];

// --- Load-time guards --------------------------------------------------------
(function assertTables() {
  const nine = (arr, label) => {
    if (arr.length !== 27) throw new Error(`${label} must cover 27 nakshatras, got ${arr.length}`);
    const counts = [0, 0, 0];
    for (const v of arr) counts[v]++;
    if (counts.some(c => c !== 9)) throw new Error(`${label} partition uneven: ${counts.join("/")}`);
  };
  nine(GANA_BY_NAK, "GANA_BY_NAK");
  nine(NADI_BY_NAK, "NADI_BY_NAK");
  if (YONI_ANIMAL.length !== 27) throw new Error("YONI_ANIMAL must cover 27 nakshatras");
  if (YONI_ARRAY.length !== 14 || YONI_ARRAY.some(r => r.length !== 14))
    throw new Error("YONI_ARRAY must be 14×14");
  for (let i = 0; i < 14; i++) if (YONI_ARRAY[i][i] !== 4) throw new Error("YONI_ARRAY diagonal must be 4");
  if (MAITRI_ARRAY.length !== 7 || MAITRI_ARRAY.some(r => r.length !== 7))
    throw new Error("MAITRI_ARRAY must be 7×7");
  const maxSum = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8;
  if (maxSum !== 36) throw new Error(`Kuta maxima must total 36, got ${maxSum}`);
})();

// --- Computation ------------------------------------------------------------

/**
 * @param {object} boy  { nakIndex 0-26, signIndex 0-11, degInSign 0-30 }
 * @param {object} girl same shape
 * @returns full guna-milan result
 */
function computeGunaMilan(boy, girl) {
  const kutas = [];

  // 1. Varna
  const bVarna = VARNA_RANK_BY_SIGN[boy.signIndex];
  const gVarna = VARNA_RANK_BY_SIGN[girl.signIndex];
  kutas.push({
    key: "varna", name: "Varna", governs: "Ego / spiritual maturity", max: 1,
    score: bVarna >= gVarna ? 1 : 0,
    detail: `${VARNA_NAMES[bVarna]} ↔ ${VARNA_NAMES[gVarna]}`
  });

  // 2. Vashya
  const bVash = vashyaCat(boy.signIndex, boy.degInSign);
  const gVash = vashyaCat(girl.signIndex, girl.degInSign);
  kutas.push({
    key: "vashya", name: "Vashya", governs: "Mutual attraction / control", max: 2,
    score: VASHYA_ARRAY[bVash][gVash],
    detail: `${VASHYA_CATS[bVash]} ↔ ${VASHYA_CATS[gVash]}`
  });

  // 3. Tara / Dina
  const t1 = taraIndex(boy.nakIndex, girl.nakIndex);
  const t2 = taraIndex(girl.nakIndex, boy.nakIndex);
  kutas.push({
    key: "tara", name: "Tara", governs: "Health & wellbeing / destiny", max: 3,
    score: TARA_ARRAY[t1][t2],
    detail: `${TARA_NAMES[t1]} / ${TARA_NAMES[t2]}`
  });

  // 4. Yoni
  const bYoni = YONI_ANIMAL[boy.nakIndex];
  const gYoni = YONI_ANIMAL[girl.nakIndex];
  const yoniScore = YONI_ARRAY[bYoni][gYoni];
  kutas.push({
    key: "yoni", name: "Yoni", governs: "Physical / intimate compatibility", max: 4,
    score: yoniScore,
    detail: `${YONI_CATS[bYoni]} ↔ ${YONI_CATS[gYoni]}` +
      (bYoni === gYoni ? " (same yoni)" : yoniScore === 0 ? " (sworn enemies)" : "")
  });

  // 5. Graha Maitri
  const bLord = SIGN_LORD_PLANET[boy.signIndex];
  const gLord = SIGN_LORD_PLANET[girl.signIndex];
  kutas.push({
    key: "maitri", name: "Graha Maitri", governs: "Mental / psychological affinity", max: 5,
    score: MAITRI_ARRAY[bLord][gLord],
    detail: `${PLANET_NAMES[bLord]} ↔ ${PLANET_NAMES[gLord]}`
  });

  // 6. Gana
  const bGana = GANA_BY_NAK[boy.nakIndex];
  const gGana = GANA_BY_NAK[girl.nakIndex];
  kutas.push({
    key: "gana", name: "Gana", governs: "Temperament", max: 6,
    score: GANA_ARRAY[bGana][gGana],
    detail: `${GANA_CATS[bGana]} ↔ ${GANA_CATS[gGana]}`
  });

  // 7. Bhakoot
  const distBtoG = ((girl.signIndex - boy.signIndex + 12) % 12) + 1; // 1..12
  const distGtoB = ((boy.signIndex - girl.signIndex + 12) % 12) + 1;
  const bhakootDosha = BHAKOOT_DOSHA_DISTANCES.has(distBtoG);
  kutas.push({
    key: "bhakoot", name: "Bhakoot", governs: "Love, finances & family growth", max: 7,
    score: bhakootDosha ? 0 : 7,
    dosha: bhakootDosha,
    detail: bhakootDosha
      ? `${distGtoB}/${distBtoG} relationship — Bhakoot dosha`
      : `${distGtoB}/${distBtoG} relationship`
  });

  // 8. Nadi
  const bNadi = NADI_BY_NAK[boy.nakIndex];
  const gNadi = NADI_BY_NAK[girl.nakIndex];
  const nadiDosha = bNadi === gNadi;
  kutas.push({
    key: "nadi", name: "Nadi", governs: "Health & progeny", max: 8,
    score: nadiDosha ? 0 : 8,
    dosha: nadiDosha,
    detail: nadiDosha
      ? `both ${NADI_CATS[bNadi]} — Nadi dosha`
      : `${NADI_CATS[bNadi]} ↔ ${NADI_CATS[gNadi]}`
  });

  const total = kutas.reduce((s, k) => s + k.score, 0);
  const verdict = verdictFor(total, nadiDosha, bhakootDosha);

  return {
    boy: labelPerson(boy),
    girl: labelPerson(girl),
    kutas,
    total: round1(total),
    max: 36,
    verdict,
    doshas: { nadi: nadiDosha, bhakoot: bhakootDosha }
  };
}

function labelPerson(p) {
  return {
    nakIndex: p.nakIndex,
    nakshatra: NAKSHATRAS[p.nakIndex],
    signIndex: p.signIndex,
    sign: SIGNS[p.signIndex]
  };
}

// Traditional bands, with the two serious doshas surfaced separately: a strong
// total does not erase a Nadi/Bhakoot dosha, which classically needs review.
function verdictFor(total, nadiDosha, bhakootDosha) {
  let band, label, recommended;
  if (total < 18) { band = "poor"; label = "Not recommended"; recommended = false; }
  else if (total < 25) { band = "average"; label = "Average — acceptable"; recommended = true; }
  else if (total < 33) { band = "good"; label = "Good match"; recommended = true; }
  else { band = "excellent"; label = "Excellent match"; recommended = true; }

  const caveats = [];
  if (nadiDosha) caveats.push("Nadi dosha present (health/progeny) — the gravest koota; classically needs remedy/review.");
  if (bhakootDosha) caveats.push("Bhakoot dosha present (emotional/financial harmony) — warrants review.");
  return { band, label, recommended, minimum: 18, caveats };
}

const round1 = x => Math.round(x * 10) / 10;

// Build the { nakIndex, signIndex, degInSign } input this module expects from a
// full chart object produced by astro.computeChart.
function moonInputFromChart(chart) {
  const m = chart.planets.find(p => p.key === "Moon");
  if (!m) throw new Error("Chart has no Moon position");
  const NAK_LEN = 360 / 27;
  return {
    nakIndex: Math.floor(m.lon / NAK_LEN) % 27,
    signIndex: m.signIndex,
    degInSign: m.degInSign
  };
}

// --- Manglik / Mangal (Kuja) dosha ------------------------------------------
// Separate from the 36-guna score: Mars in the 1st, 2nd, 4th, 7th, 8th or 12th
// counted from the Lagna, Moon or Venus. Classic cancellations (dosha bhanga):
// both partners Manglik (mutual), Mars in its own/exalted sign, and Mars
// conjunct/aspected by a benefic (Jupiter or Venus).
const MANGLIK_HOUSES = new Set([1, 2, 4, 7, 8, 12]);
const MARS_OWN_OR_EXALTED = new Set([0, 7, 9]); // Aries & Scorpio (own), Capricorn (exalted)

const houseFrom = (refSignIndex, marsSignIndex) => ((marsSignIndex - refSignIndex + 12) % 12) + 1;

// Per-person Manglik assessment from a full chart (astro.computeChart output).
function computeManglik(chart) {
  const mars = chart.planets.find(p => p.key === "Mars");
  const moon = chart.planets.find(p => p.key === "Moon");
  const venus = chart.planets.find(p => p.key === "Venus");
  if (!mars || !moon || !venus) throw new Error("Chart missing Mars/Moon/Venus");
  const ascSign = chart.ascendant.signIndex;

  const references = [
    { from: "Lagna", house: houseFrom(ascSign, mars.signIndex) },
    { from: "Moon", house: houseFrom(moon.signIndex, mars.signIndex) },
    { from: "Venus", house: houseFrom(venus.signIndex, mars.signIndex) }
  ];
  references.forEach(r => (r.dosha = MANGLIK_HOUSES.has(r.house)));
  const triggeredFrom = references.filter(r => r.dosha).map(r => r.from);

  const cancellations = [];
  if (MARS_OWN_OR_EXALTED.has(mars.signIndex)) {
    cancellations.push(`Mars in ${mars.sign} (own/exalted) weakens the dosha`);
  }
  const benefics = (mars.conjunctWith || []).concat(mars.aspectedBy || []);
  if (benefics.includes("Jupiter")) cancellations.push("Jupiter conjoins/aspects Mars");
  if (benefics.includes("Venus")) cancellations.push("Venus conjoins/aspects Mars");

  return {
    manglik: triggeredFrom.length > 0,
    marsSign: mars.sign,
    marsHouse: mars.house, // from the Lagna
    references,
    triggeredFrom,
    selfCancellations: cancellations
  };
}

// Combine two people's Manglik status into a match verdict, applying the mutual
// (both-Manglik) cancellation and single-side mitigation.
function manglikVerdict(boyM, girlM) {
  if (!boyM.manglik && !girlM.manglik) {
    return { status: "clear", cancelled: false, warning: false,
      label: "Neither partner is Manglik — no Mangal dosha to reconcile." };
  }
  if (boyM.manglik && girlM.manglik) {
    return { status: "cancelled", cancelled: true, warning: false,
      label: "Both partners are Manglik — the dosha is mutually cancelled (samshaya bhanga)." };
  }
  const who = boyM.manglik ? "groom" : "bride";
  const one = boyM.manglik ? boyM : girlM;
  if (one.selfCancellations.length) {
    return { status: "mitigated", cancelled: false, warning: true,
      label: `Only the ${who} is Manglik, but it's weakened — ${one.selfCancellations.join("; ")}.` };
  }
  return { status: "present", cancelled: false, warning: true,
    label: `Only the ${who} is Manglik with no mitigating factors — traditionally warrants review/remedies.` };
}

// Compact plain-text rendering of a match result for the LLM context window.
function matchToText(m) {
  const L = [];
  L.push(`Couple: ${m.boy.nakshatra} (${m.boy.sign}) [groom] × ${m.girl.nakshatra} (${m.girl.sign}) [bride]`);
  L.push(`Ashtakoot total: ${m.total} / ${m.max} — ${m.verdict.label} (traditional minimum ${m.verdict.minimum})`);
  L.push("Kutas (score / max — governs — detail):");
  for (const k of m.kutas) {
    L.push(`- ${k.name} ${k.score}/${k.max} — ${k.governs}${k.detail ? " — " + k.detail : ""}${k.dosha ? " [DOSHA]" : ""}`);
  }
  if (m.verdict.caveats && m.verdict.caveats.length) L.push("Caveats: " + m.verdict.caveats.join(" "));

  const mk = m.manglik;
  if (mk) {
    const one = (who, p) =>
      `- ${who}: ${p.manglik ? "Manglik" : "not Manglik"} (Mars in ${p.marsSign}` +
      `${p.manglik ? ", dosha from " + p.triggeredFrom.join("/") : ""})` +
      `${p.selfCancellations.length ? "; mitigators: " + p.selfCancellations.join("; ") : ""}`;
    L.push("");
    L.push(`Manglik / Mangal dosha: ${mk.verdict.label}`);
    L.push(one("Groom", mk.boy));
    L.push(one("Bride", mk.girl));
  }
  return L.join("\n");
}

module.exports = { computeGunaMilan, moonInputFromChart, computeManglik, manglikVerdict, matchToText };
