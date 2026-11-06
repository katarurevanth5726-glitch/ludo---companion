/**
 * Cryptographically secure pseudo-random number generator for fair 1-6 dice rolls.
 * Uses window.crypto.getRandomValues to eliminate bias.
 */
export function generateCryptoRoll(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Unbiased modulo reduction for 1-6:
    return (array[0] % 6) + 1;
  }
  // Fallback if Web Crypto is unavailable
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Browser haptic feedback where supported by device hardware (Android Chrome, etc.)
 */
export function triggerHaptic(type: 'roll' | 'six' | 'click' = 'click', enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    if (type === 'six') {
      // Celebratory triple pulse for rolling a 6
      navigator.vibrate([60, 40, 100, 50, 140]);
    } else if (type === 'roll') {
      // Crisp roll landing pulse
      navigator.vibrate([45]);
    } else {
      // Subtle click pulse
      navigator.vibrate([20]);
    }
  } catch {
    // Ignore if device permissions restrict vibration
  }
}
