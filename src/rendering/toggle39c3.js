import { settings, defaultTexts, themePresets } from '../config/settings.js';
import { getBackgroundColor, getColor } from './colors.js';
import { getContext } from './canvas.js';
import { drawToggle } from './toggle.js';

function setFont(weight, size) {
  const ctx = getContext();
  ctx.font = `${weight} ${size}px Kario39C3`;
}

function measureText(text, weight, size) {
  setFont(weight, size);
  const ctx = getContext();
  return ctx.measureText(text).width;
}

function getToggleWidth(height) {
  return height * 2.5;
}

export function renderToggle39C3Theme(canvas) {
  const ctx = getContext();
  ctx.fillStyle = getBackgroundColor();
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const logoText = defaultTexts.ccc;
  const userText = settings.text;
  if (!userText) return;

  // Determine if animations should be active
  const isAnimated = settings.capabilities && settings.capabilities.animated;
  const preset = themePresets[settings.theme];

  const textColor = getColor(0, 0, 1, settings.time);

  // Scale initial sizes proportionally to canvas size for consistent export behavior
  const baseFactor = settings.canvasSize / 1000;
  let toggleHeight = 150 * baseFactor;
  let toggleWidth = getToggleWidth(toggleHeight);
  let logoSize = 200 * baseFactor;

  let logoWidth = measureText(logoText, settings.maxWeight, logoSize);
  let firstRowWidth = toggleWidth + logoWidth;

  let userTextSize = 200 * baseFactor;
  const usableWidth = settings.canvasSize - 2 * settings.margin;

  // First, scale down first row if needed
  if (firstRowWidth > usableWidth) {
    const scaleFactorRow1 = usableWidth / firstRowWidth;
    toggleHeight *= scaleFactorRow1;
    toggleWidth = getToggleWidth(toggleHeight);
    logoSize *= scaleFactorRow1;
    logoWidth = measureText(logoText, settings.maxWeight, logoSize);
    firstRowWidth = toggleWidth + logoWidth;
  }

  // Measure user text width with dynamic condensing
  let userTextWidth = measureText(userText, settings.maxWeight, userTextSize);
  let secondRowWidth = userTextWidth;

  // Calculate width scale factor to fit user text in one line with condensed feature
  let widthScaleFactor = 1.0;
  if (secondRowWidth > usableWidth) {
    widthScaleFactor = usableWidth / secondRowWidth;
    secondRowWidth = usableWidth;
  }

  const maxRowWidth = Math.max(firstRowWidth, secondRowWidth);
  if (maxRowWidth > usableWidth) {
    const globalScale = usableWidth / maxRowWidth;

    toggleHeight *= globalScale;
    toggleWidth = getToggleWidth(toggleHeight);
    logoSize *= globalScale;
    logoWidth = measureText(logoText, settings.maxWeight, logoSize);
    firstRowWidth = toggleWidth + logoWidth;

    userTextSize *= globalScale;
    userTextWidth = measureText(userText, settings.maxWeight, userTextSize);
    secondRowWidth = userTextWidth * widthScaleFactor;
  }

  const rowSpacing = userTextSize * 0.15; // Reduced from 0.3 to 0.15
  const totalHeight = toggleHeight + rowSpacing + userTextSize;
  const startY = (settings.canvasSize - totalHeight) / 2;

  // === Draw First Row: Toggle + Logo ===
  const row1CenterY = startY + toggleHeight / 2;
  const row1StartX = (settings.canvasSize - firstRowWidth) / 2;

  const toggleX = row1StartX;
  const toggleY = startY;
  // Use static time (π/2) for non-animated themes to position toggle in ON state, otherwise use settings.time
  const toggleTime = isAnimated ? settings.time : Math.PI / 2;
  drawToggle(toggleX, toggleY, toggleHeight, textColor, toggleTime, 0, true);

  const logoX = row1StartX + toggleWidth;
  setFont(settings.maxWeight, logoSize);
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(logoText, logoX, row1CenterY);

  // === Draw Second Row: User Text with Condensed Feature ===
  const row2Y = startY + toggleHeight + rowSpacing + userTextSize / 2;
  const row2StartX = (settings.canvasSize - secondRowWidth) / 2;

  // Create offscreen canvas to avoid Chrome glyph cache bug
  // Render at normal width, then scale once when drawing to main canvas
  const offscreen = document.createElement('canvas');
  const offscreenWidth = userTextWidth * 1.2;
  const offscreenHeight = userTextSize * 2;
  offscreen.width = offscreenWidth;
  offscreen.height = offscreenHeight;
  const offCtx = offscreen.getContext('2d', { alpha: true });

  offCtx.textBaseline = 'middle';
  const offscreenY = offscreenHeight / 2;

  let currentX = 0;
  for (let charIndex = 0; charIndex < userText.length; charIndex++) {
    const char = userText[charIndex];

    // Determine weight based on animation capability
    let weight;
    if (isAnimated) {
      // Each character cycles through full weight range (min to max)
      const t = settings.time * settings.animationSpeed;
      const phase = charIndex * 0.3;
      const cycle = (Math.sin(t + phase) + 1) / 2;
      weight = settings.minWeight + (settings.maxWeight - settings.minWeight) * cycle;
    } else {
      // Use static weight from preset
      weight = preset && preset.staticWeight ? preset.staticWeight : settings.maxWeight;
    }

    offCtx.font = `${weight} ${userTextSize}px Kario39C3`;
    offCtx.fillStyle = getColor(charIndex, 0, userText.length, settings.time);
    offCtx.fillText(char, currentX, offscreenY);

    // Move to next character position
    const metrics = offCtx.measureText(char);
    currentX += metrics.width;
  }

  // Draw the offscreen canvas once with horizontal scaling applied
  // This avoids per-character transforms in Chrome's renderer
  ctx.drawImage(
    offscreen,
    0, 0, offscreenWidth, offscreenHeight,
    row2StartX, row2Y - offscreenHeight / 2, offscreenWidth * widthScaleFactor, offscreenHeight
  );
}
