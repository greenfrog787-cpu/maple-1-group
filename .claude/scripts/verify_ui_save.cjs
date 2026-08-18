#!/usr/bin/env node

const { UIBuilder } = require("../skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const fs = require("fs");
const path = require("path");

// Check file size and modification time
const filePath = "ui/RhythmGame.ui";
if (fs.existsSync(filePath)) {
  const stats = fs.statSync(filePath);
  console.log("✓ File exists");
  console.log("  Size:", stats.size, "bytes");
  console.log("  Modified:", stats.mtime);
} else {
  console.log("✗ File NOT FOUND");
  process.exit(1);
}

// Load and verify UI structure
const b = UIBuilder.load(filePath);

console.log("\n=== Verifying UI Elements ===");
const scoreText = b.find("ScoreText");
const comboText = b.find("ComboText");
const hpLabel = b.find("HPLabel");

console.log("\nScoreText found:", !!scoreText);
console.log("ComboText found:", !!comboText);
console.log("HPLabel found:", !!hpLabel);

// Check actual transform values
if (scoreText) {
  console.log("\nScoreText transform:");
  const json = scoreText.jsonString;
  const transform = json["@components"]?.find(c => c["@type"]?.includes("UITransformComponent"));
  if (transform) {
    console.log("  AnchoredPosition:", transform.anchoredPosition);
    console.log("  AnchorsMin:", transform.anchorsMin);
    console.log("  AnchorsMax:", transform.anchorsMax);
  }
}

console.log("\n✓ Verification complete");
