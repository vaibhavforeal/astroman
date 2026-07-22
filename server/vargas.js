// Divisional charts (vargas) beyond D1/D9, each with its correct Parashari rule.
// A varga maps a zodiacal longitude to a sign; houses are whole-sign from that
// chart's own ascendant (the varga lagna).
//
// Sign indices are 0-based: 0 = Aries … 11 = Pisces.

const SIGNS = [
  { en: "Aries", lord: "Mars" }, { en: "Taurus", lord: "Venus" },
  { en: "Gemini", lord: "Mercury" }, { en: "Cancer", lord: "Moon" },
  { en: "Leo", lord: "Sun" }, { en: "Virgo", lord: "Mercury" },
  { en: "Libra", lord: "Venus" }, { en: "Scorpio", lord: "Mars" },
  { en: "Sagittarius", lord: "Jupiter" }, { en: "Capricorn", lord: "Saturn" },
  { en: "Aquarius", lord: "Saturn" }, { en: "Pisces", lord: "Jupiter" }
];

// Vargas computed here (D1 = rashi and D9 = navamsa are handled in astro.js).
const VARGA_DEFS = [
  { key: "D2", n: 2, name: "Hora", governs: "Wealth & resources" },
  { key: "D3", n: 3, name: "Drekkana", governs: "Siblings, courage, initiative" },
  { key: "D4", n: 4, name: "Chaturthamsa", governs: "Home, property, fortune" },
  { key: "D7", n: 7, name: "Saptamsa", governs: "Children & progeny" },
  { key: "D10", n: 10, name: "Dasamsa", governs: "Career, profession, status" },
  { key: "D12", n: 12, name: "Dwadasamsa", governs: "Parents & ancestry" },
  { key: "D16", n: 16, name: "Shodasamsa", governs: "Vehicles, comforts, luxuries" },
  { key: "D20", n: 20, name: "Vimsamsa", governs: "Spiritual practice & devotion" },
  { key: "D24", n: 24, name: "Siddhamsa", governs: "Education & learning" },
  { key: "D27", n: 27, name: "Bhamsa", governs: "Strengths & weaknesses" },
  { key: "D30", n: 30, name: "Trimsamsa", governs: "Adversity, misfortune, character" },
  { key: "D40", n: 40, name: "Khavedamsa", governs: "Maternal legacy, auspicious effects" },
  { key: "D45", n: 45, name: "Akshavedamsa", governs: "Paternal legacy, overall conduct" },
  { key: "D60", n: 60, name: "Shashtiamsa", governs: "Past-life karma, overall fine-tuning" }
];

// Trimsamsa (D30): five UNEQUAL parts ruled by malefics, mapped to their signs.
function trimsamsa(deg, oddSign) {
  if (oddSign) {
    // Mars, Saturn, Jupiter, Mercury, Venus  →  Aries, Aquarius, Sagittarius, Gemini, Libra
    if (deg < 5) return 0;
    if (deg < 10) return 10;
    if (deg < 18) return 8;
    if (deg < 25) return 2;
    return 6;
  }
  // even sign: Venus, Mercury, Jupiter, Saturn, Mars → Taurus, Virgo, Pisces, Capricorn, Scorpio
  if (deg < 5) return 1;
  if (deg < 12) return 5;
  if (deg < 20) return 11;
  if (deg < 25) return 9;
  return 7;
}

// Sign index of a longitude in a given varga.
function vargaSignIndex(lon, key) {
  const s = Math.floor(lon / 30);
  const deg = lon - s * 30;
  const odd = s % 2 === 0; // 0-based even = 1-based odd sign (Aries, Gemini, …)
  const modality = s % 3; // 0 movable, 1 fixed, 2 dual
  const element = s % 4; // 0 fire, 1 earth, 2 air, 3 water
  const part = n => Math.floor(deg / (30 / n));

  switch (key) {
    case "D2": // Hora: Sun's (Leo) / Moon's (Cancer) hora
      return odd ? (part(2) === 0 ? 4 : 3) : part(2) === 0 ? 3 : 4;
    case "D3": // same, 5th, 9th
      return (s + [0, 4, 8][part(3)]) % 12;
    case "D4": // same, 4th, 7th, 10th
      return (s + [0, 3, 6, 9][part(4)]) % 12;
    case "D7": // odd from same sign, even from 7th
      return (s + (odd ? 0 : 6) + part(7)) % 12;
    case "D10": // odd from same sign, even from 9th
      return (s + (odd ? 0 : 8) + part(10)) % 12;
    case "D12": // from same sign
      return (s + part(12)) % 12;
    case "D16": // movable Aries, fixed Leo, dual Sagittarius
      return ([0, 4, 8][modality] + part(16)) % 12;
    case "D20": // movable Aries, fixed Sagittarius, dual Leo
      return ([0, 8, 4][modality] + part(20)) % 12;
    case "D24": // odd from Leo, even from Cancer
      return ((odd ? 4 : 3) + part(24)) % 12;
    case "D27": // fire Aries, earth Cancer, air Libra, water Capricorn
      return ([0, 3, 6, 9][element] + part(27)) % 12;
    case "D30":
      return trimsamsa(deg, odd);
    case "D40": // odd from Aries, even from Libra
      return ((odd ? 0 : 6) + part(40)) % 12;
    case "D45": // movable Aries, fixed Leo, dual Sagittarius
      return ([0, 4, 8][modality] + part(45)) % 12;
    case "D60":
      return (s + Math.floor(deg * 2)) % 12;
    default:
      return s;
  }
}

function signInfo(i) {
  return { signIndex: i, sign: SIGNS[i].en, signLord: SIGNS[i].lord };
}

// Build every varga chart. `planets` must carry { key, lon, signIndex }.
function computeDivisionals(planets, ascLon) {
  return VARGA_DEFS.map(def => {
    const ascIdx = vargaSignIndex(ascLon, def.key);
    return {
      key: def.key,
      name: def.name,
      governs: def.governs,
      ascendant: signInfo(ascIdx),
      planets: planets.map(p => {
        const i = vargaSignIndex(p.lon, def.key);
        return {
          key: p.key,
          ...signInfo(i),
          house: ((i - ascIdx + 12) % 12) + 1,
          sameAsRashi: i === p.signIndex
        };
      })
    };
  });
}

module.exports = { computeDivisionals, VARGA_DEFS };
