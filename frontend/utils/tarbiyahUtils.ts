export const RANK_LEVELS = [
    { level: 1, minXP: 0 },
    { level: 2, minXP: 5 },
    { level: 3, minXP: 20 },
    { level: 4, minXP: 45 },
    { level: 5, minXP: 80 },
    { level: 6, minXP: 125 },
    { level: 7, minXP: 180 },
    { level: 8, minXP: 245 },
    { level: 9, minXP: 320 },
    { level: 10, minXP: 405 },
];

export interface Rank {
    level: number;
    minXP: number;
}

export interface RankCalculationResult {
    currentRank: Rank;
    nextRank: Rank | null;
    progressPercent: number;
    xpIntoRank: number;
    xpToNext: number;
}

/**
 * Calculates rank details based on total XP.
 * @param {number} totalXP 
 * @returns {RankCalculationResult}
 */
export const calculateRank = (totalXP: number): RankCalculationResult => {
    // Ensure XP is non-negative
    const xp = Math.max(0, totalXP || 0);

    // Find current rank (highest rank where minXP <= totalXP)
    const reversedRanks = [...RANK_LEVELS].reverse();
    const currentRank = reversedRanks.find(r => xp >= r.minXP) || RANK_LEVELS[0];

    // Find next rank
    const nextRank = RANK_LEVELS.find(r => r.minXP > xp) || null;

    let progressPercent = 100;
    let xpIntoRank = 0;
    let xpToNext = 0;

    if (nextRank) {
        const rankSpan = nextRank.minXP - currentRank.minXP;
        xpIntoRank = xp - currentRank.minXP;
        xpToNext = nextRank.minXP - xp;
        progressPercent = Math.min(100, Math.max(0, (xpIntoRank / rankSpan) * 100));
    } else {
        // Max rank achieved
        xpIntoRank = xp - currentRank.minXP; 
    }

    return {
        currentRank,
        nextRank,
        progressPercent,
        xpIntoRank,
        xpToNext
    };
};
