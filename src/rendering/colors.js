import { settings, colors } from '../config/settings.js';

export function getBackgroundColor() {
  switch (settings.colorMode) {
    case 'mono-inv':
      return colors.natural; // Natural background
    case 'green-inv':
      return '#00ff00'; // Neon Green background
    case 'violet-inv':
      return '#9673ff'; // Electric Violet background
    default:
      return colors.dark; // Muted Black background
  }
}

export function getColor(charIndex, lineIndex, textLength, time) {
  // Use static time (0) for non-animated themes, otherwise use the provided time
  const isAnimated = settings.capabilities && settings.capabilities.animated;
  const effectiveTime = isAnimated ? time : 0;
  const t = effectiveTime * settings.animationSpeed * 0.5;

  switch (settings.colorMode) {
    case 'green': {
      if (!isAnimated) {
        // Static mode: Use primary green color only
        return colors.green[3]; // '#00ff00' - Primary
      }
      // Animated mode: Cycle through neon green tints
      const index = Math.floor((t * 2 + charIndex * 0.5 + lineIndex * 0.3) % colors.green.length);
      return colors.green[index];
    }

    case 'green-inv': {
      // Dark on Green: Use dark color
      return colors.dark;
    }

    case 'violet': {
      if (!isAnimated) {
        // Static mode: Use secondary violet color only
        return colors.violet[2]; // '#9673ff' - Secondary
      }
      // Animated mode: Cycle through electric violet tints
      const index = Math.floor((t * 2 + charIndex * 0.5 + lineIndex * 0.3) % colors.violet.length);
      return colors.violet[index];
    }

    case 'violet-inv': {
      // Dark on Violet: Use dark color
      return colors.dark;
    }

    case 'mono-inv': {
      // Dark on Natural: Use dark color
      return colors.dark;
    }

    default: // mono - Natural on Dark
      return colors.natural;
  }
}
