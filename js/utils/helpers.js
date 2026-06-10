export const AVATAR_COLORS = [
    '#FF7A00',
    '#9327FF',
    '#6E52FF',
    '#FC71FF',
    '#FFBB2B',
    '#1FD7C1',
    '#462F8A',
    '#FF4646',
    '#00BEE8',
];

/**
 * Returns a deterministic avatar background color for a given index.
 * @param {number} index
 * @returns {string} CSS hex color
 */
export function getAvatarColor(index) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
