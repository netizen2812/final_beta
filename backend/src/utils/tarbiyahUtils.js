/**
 * Deterministically maps a string ID (MongoDB object id, UUID or Clerk ID)
 * to a distinct 32-bit positive integer (for Agora UID).
 * @param {string} strId The string ID
 * @returns {number} Numeric positive integer (safe for Agora)
 */
export const getNumericUid = (strId) => {
    if (!strId) return 1;
    let hash = 0;
    for (let i = 0; i < strId.length; i++) {
        hash = ((hash << 5) - hash) + strId.charCodeAt(i);
        hash |= 0;
    }
    const pHash = Math.abs(hash);
    return (pHash === 0 || pHash === 2147483647) ? 1 : pHash;
};
