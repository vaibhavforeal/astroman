// Loads the Vedic Astrology skill markdown as Claude's system prompt.
const fs = require("fs");
const path = require("path");

function loadSkill() {
  const p = path.join(__dirname, "..", "Vedic Astrology Skill.md");
  const raw = fs.readFileSync(p, "utf8");
  // Strip the YAML frontmatter block (--- ... ---) if present.
  return raw.replace(/^---[\s\S]*?\n---\s*\n?/, "").trim();
}

module.exports = { loadSkill };
