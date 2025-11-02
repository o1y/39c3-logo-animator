import { settings, defaultTexts } from '../config/settings.js';
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
  drawToggle(toggleX, toggleY, toggleHeight, textColor, settings.time, 0, true);

  const logoX = row1StartX + toggleWidth;
  setFont(settings.maxWeight, logoSize);
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(logoText, logoX, row1CenterY);

  // === Draw Second Row: User Text with Condensed Feature ===
  const row2Y = startY + toggleHeight + rowSpacing + userTextSize / 2;
  let row2StartX = (settings.canvasSize - secondRowWidth) / 2;

  ctx.textBaseline = 'middle';

  // Render each character with individual weight animation
  for (let charIndex = 0; charIndex < userText.length; charIndex++) {
    const char = userText[charIndex];

    // Each character cycles through full weight range (min to max)
    const t = settings.time * settings.animationSpeed;
    const phase = charIndex * 0.3;
    const cycle = (Math.sin(t + phase) + 1) / 2;
    const weight = settings.minWeight + (settings.maxWeight - settings.minWeight) * cycle;

    setFont(weight, userTextSize);
    ctx.fillStyle = getColor(charIndex, 0, userText.length, settings.time);

    ctx.save();
    ctx.translate(row2StartX, row2Y);
    ctx.scale(widthScaleFactor, 1);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    // Move to next character position
    const metrics = ctx.measureText(char);
    row2StartX += metrics.width * widthScaleFactor;
  }
}
