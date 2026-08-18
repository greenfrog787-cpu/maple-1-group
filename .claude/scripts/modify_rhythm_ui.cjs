#!/usr/bin/env node

const { UIBuilder } = require("../skills/msw-ui-system/scripts/msw_ui_builder.cjs");

// Load the existing RhythmGame.ui
const b = UIBuilder.load("ui/RhythmGame.ui");

// Modify ScoreText position to center-top
// Current: likely at top-left, Move to center-top
b.patch("ScoreText", {
  anchor: "top-center",
  pos: [0, -50],  // 50px down from the very top
  enable: true
});

// Modify ComboText position to center
// Current: likely at bottom, Move to center-bottom
b.patch("ComboText", {
  anchor: "bottom-center",
  pos: [0, 50],  // 50px up from the very bottom
  enable: true
});

// Write back
b.write("ui/RhythmGame.ui");
console.log("✓ RhythmGame.ui updated: ScoreText and ComboText moved to center");
