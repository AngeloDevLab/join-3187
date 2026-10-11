const PAGE_FOLDER = {
    summary: 'summary',
    'add-task': 'add-task',
    board: 'board',
    contacts: 'contacts',
    help: 'help',
    imprint: 'legal',
    privacy: 'legal',
    request: 'request',
};


/**
 * Resolves an icon file name to its absolute URL in public/icons, independent
 * of which HTML page the calling module is running in.
 * @param {string} name - file name, e.g. 'urgent.svg'
 * @returns {string}
 */
export function iconUrl(name) {
    return new URL(`../../public/icons/${name}`, import.meta.url).href;
}


/**
 * Resolves a page name to its absolute URL; 'login' maps to the root index.html.
 * @param {'login'|keyof typeof PAGE_FOLDER} page
 * @returns {string}
 */
export function pageUrl(page) {
    if (page === 'login') return new URL('../../index.html', import.meta.url).href;
    return new URL(`../pages/${PAGE_FOLDER[page]}/${page}.html`, import.meta.url).href;
}
