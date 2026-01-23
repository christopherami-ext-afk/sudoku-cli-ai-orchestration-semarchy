/**
 * Deterministic PRNG (LCG) for seeded generation.
 *
 * Parameters are common LCG constants (Numerical Recipes):
 *   state = (a*state + c) mod 2^32
 */
export function createPrng(seed) {
    if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
        throw new Error(`Seed must be an integer, got: ${seed}`);
    }
    let state = seed >>> 0;
    function nextUint32() {
        // LCG: (1664525*x + 1013904223) mod 2^32
        state = (Math.imul(1664525, state) + 1013904223) >>> 0;
        return state;
    }
    return {
        nextFloat() {
            // Divide by 2^32
            return nextUint32() / 0x1_0000_0000;
        },
        nextInt(maxExclusive) {
            if (!Number.isFinite(maxExclusive) || !Number.isInteger(maxExclusive) || maxExclusive <= 0) {
                throw new Error(`maxExclusive must be a positive integer, got: ${maxExclusive}`);
            }
            // Bias is negligible for our use; keep it simple + deterministic.
            return Math.floor(this.nextFloat() * maxExclusive);
        }
    };
}
