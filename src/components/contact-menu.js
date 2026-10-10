/** Toggles the mobile contact action menu (edit/delete) open/closed. */
export function toggleContactMenu() {
    document.getElementById('contactMenu').classList.toggle('contact_menu_open');
    document.getElementById('menuContactBtn').classList.toggle('menu_contact_btn_active');
    document.getElementById('contactMenuBackdrop').classList.toggle('contact_menu_backdrop_open');
}


/** Closes the mobile contact action menu. */
export function closeContactMenu() {
    document.getElementById('contactMenu').classList.remove('contact_menu_open');
    document.getElementById('menuContactBtn').classList.remove('menu_contact_btn_active');
    document.getElementById('contactMenuBackdrop').classList.remove('contact_menu_backdrop_open');
}


/** Closes the mobile menu only when it exists in the DOM (i.e. a contact's details are shown). */
export function closeContactMenuIfRendered() {
    if (document.getElementById('contactMenu')) closeContactMenu();
}
