#!/usr/bin/env node

const { UIBuilder } = require("../skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/RhythmGame.ui");

// Check current positions
const scoreText = b.find("ScoreText");
const comboText = b.find("ComboText");

console.log("=== Current UI Layout ===");
console.log("\nScoreText:");
if (scoreText) {
  const json = scoreText.jsonString;
  console.log("  Path:", json.path);
  console.log("  Position:", json.UITransformComponent?.anchoredPosition || "N/A");
  console.log("  Anchor:", json.UITransformComponent?.anchorsMin, json.UITransformComponent?.anchorsMax);
  console.log("  Size:", json.UITransformComponent?.sizeDelta || "N/A");
} else {
  console.log("  NOT FOUND");
}

console.log("\nComboText:");
if (comboText) {
  const json = comboText.jsonString;
  console.log("  Path:", json.path);
  console.log("  Position:", json.UITransformComponent?.anchoredPosition || "N/A");
  console.log("  Anchor:", json.UITransformComponent?.anchorsMin, json.UITransformComponent?.anchorsMax);
  console.log("  Size:", json.UITransformComponent?.sizeDelta || "N/A");
} else {
  console.log("  NOT FOUND");
}

// List all entities
console.log("\n=== All Root Entities ===");
const entities = b.listEntities();
const roots = entities.filter(e => e.depth === 1);
roots.forEach(e => console.log(`  ${e.name} (${e.kind})`));
