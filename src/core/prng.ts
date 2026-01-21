/**
 * SUD-5: Deterministic PRNG (Pseudo-Random Number Generator)
 * 
 * Implements a Linear Congruential Generator (LCG) for deterministic randomness
 */

/**
 * Linear Congruential Generator (LCG)
 * 
 * Uses the formula: next = (a * seed + c) % m
 * 
 * Parameters chosen to match common LCG implementations:
 * - a = 1103515245 (multiplier)
 * - c = 12345 (increment)
 * - m = 2^31 (modulus)
 */
const LCG_A = 1103515245;
const LCG_C = 12345;
const LCG_M = 2147483648; // 2^31

export interface PRNG {
  /**
   * Generate next random number in range [0, 1)
   */
  random(): number;
  
  /**
   * Generate random integer in range [min, max] (inclusive)
   */
  nextInt(min: number, max: number): number;
  
  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[];
}

/**
 * Create a new PRNG with the given seed
 * 
 * @param seed - Initial seed value (any integer)
 * @returns PRNG instance with deterministic random methods
 */
export function createPrng(seed: number): PRNG {
  // Ensure seed is a positive integer
  let state = Math.abs(Math.floor(seed)) % LCG_M;
  if (state === 0) state = 1; // Avoid zero state
  
  return {
    random(): number {
      state = (LCG_A * state + LCG_C) % LCG_M;
      return state / LCG_M;
    },
    
    nextInt(min: number, max: number): number {
      const range = max - min + 1;
      return min + Math.floor(this.random() * range);
    },
    
    shuffle<T>(array: T[]): T[] {
      // Fisher-Yates shuffle
      for (let i = array.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i);
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  };
}
