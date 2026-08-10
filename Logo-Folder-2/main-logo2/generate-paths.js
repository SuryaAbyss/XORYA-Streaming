const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, 'node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff');
const letters = ['X', 'O', 'R', 'A', 'Y', 'A'];
const ids = ['svgX', 'svgO', 'svgR', 'svgA1', 'svgY', 'svgA2'];

const font = opentype.parse(fs.readFileSync(fontPath));

// Match original HENDY scale: ~1556px tall letters in path space
const TARGET_HEIGHT = 1556;
const LETTER_SPACING = 120;
const START_X = 1312;
const BASELINE_Y = 5808;

let cursorX = START_X;
const paths = [];

letters.forEach((char, i) => {
  const glyph = font.charToGlyph(char);
  const scale = TARGET_HEIGHT / (font.ascender - font.descender);
  const glyphPath = glyph.getPath(cursorX, BASELINE_Y, TARGET_HEIGHT * 0.72);
  const bbox = glyphPath.getBoundingBox();

  // Advance cursor using glyph advance width
  const advance = glyph.advanceWidth * (TARGET_HEIGHT * 0.72 / font.unitsPerEm);
  cursorX += advance + LETTER_SPACING;

  // Convert to original-style path commands (rounded integers)
  const d = glyphPath.toPathData(0).replace(/(\d+\.\d+)/g, (m) => Math.round(parseFloat(m)));
  paths.push({ id: ids[i], d, bbox });
});

// Paths use standard Y-down coordinates from opentype.js.
// Use positive Y scale (NOT the original CodePen's negative scale, which is for Y-up font paths).

console.log('Generated paths:');
paths.forEach((p) => {
  console.log(`\n<!-- ${p.id} -->`);
  console.log(`<path id="${p.id}" d="${p.d}"/>`);
});

// Write combined SVG snippet
const svgPaths = paths.map((p) => `<path id="${p.id}" d="${p.d}"/>`).join('\n');
fs.writeFileSync(path.join(__dirname, 'paths-output.txt'), svgPaths);
console.log('\nWritten to paths-output.txt');
