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


/**
 * Returns a deterministic avatar background color based on a contact's id,
 * so the same contact always gets the same color regardless of list order.
 * @param {string|number} id
 * @returns {string} CSS hex color
 */
export function getAvatarColorForId(id) {
    const text = String(id);
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) % AVATAR_COLORS.length;
    }

    return AVATAR_COLORS[hash];
}


/**
 * Gets initials from a person's name (max 2 letters).
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
    const nameParts = name.split(' ');
    let initials = '';

    for (let i = 0; i < nameParts.length; i++) {
        if (nameParts[i] !== '' && initials.length < 2) {
            initials += nameParts[i].charAt(0).toUpperCase();
        }
    }

    return initials;
}
