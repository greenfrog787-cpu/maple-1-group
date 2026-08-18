#!/usr/bin/env node

const { UIBuilder } = require("../skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/RhythmGame.ui");

// ScoreText: Move to top-center with clear positioning
// Canvas is 1920x1080, so center-top would be x=0 (center), y=top
b.patch("ScoreText", {
  anchor: "top-center",
  pos: [0, -80],        // 80px down from very top center
  rect_size: [400, 60], // size to ensure visibility
});

// ComboText: Move to center-bottom
b.patch("ComboText", {
  anchor: "bottom-center",
  pos: [0, 80],         // 80px up from very bottom center
  rect_size: [300, 80], // size to ensure visibility
});

// HPLabel (also important): Make sure it's visible
b.patch("HPLabel", {
  anchor: "top-left",
  pos: [20, -20],       // 20px from top-left
});

console.log("✓ UI elements repositioned:");
console.log("  ScoreText → top-center");
console.log("  ComboText → bottom-center");
console.log("  HPLabel → top-left");

b.write("ui/RhythmGame.ui");
console.log("✓ RhythmGame.ui saved");
