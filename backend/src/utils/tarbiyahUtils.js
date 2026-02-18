export const RANK_LEVELS = [
    { level: 1, title: 'Little Learner', minXP: 0, icon: '📚' },
    { level: 2, title: 'Quran Explorer', minXP: 100, icon: '🔍' },
    { level: 3, title: 'Story Seeker', minXP: 200, icon: '📜' },
    { level: 4, title: 'Miracle Learner', minXP: 300, icon: '✨' },
    { level: 5, title: 'Wise Thinker', minXP: 400, icon: '🧠' },
    { level: 6, title: "Ka'bah Guardian", minXP: 500, icon: '🕋' },
    { level: 7, title: 'Anbiya Champion', minXP: 600, icon: '🌟' },
    { level: 8, title: 'Quranic Scholar', minXP: 700, icon: '🎓' },
    { level: 9, title: "Prophet's Follower", minXP: 800, icon: '📋' },
    { level: 10, title: 'Ramadan Champion 🏆', minXP: 900, icon: '🏆' },
];

/**
 * Calculates rank details based on total XP.
 * @param {number} totalXP 
 * @returns {object} { currentRank, nextRank, progressPercent, xpIntoRank, xpToNext }
 */
export const calculateRank = (totalXP) => {
    // Ensure XP is non-negative
    const xp = Math.max(0, totalXP || 0);

    // Find current rank (highest rank where minXP <= totalXP)
    // We reverse to find the highest match first
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
        xpIntoRank = xp - currentRank.minXP; // XP above max rank base
    }

    return {
        currentRank,
        nextRank,
        progressPercent,
        xpIntoRank,
        xpToNext
    };
};

/**
 * Returns the number of badges earned based on rank level.
 * @param {number} rankLevel 
 * @returns {number}
 */
export const getBadgesCount = (rankLevel) => {
    return rankLevel;
};
