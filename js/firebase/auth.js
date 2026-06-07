/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
async function loginUser(email, password) {
  // TODO: implement Firebase signInWithEmailAndPassword
}

/**
 * Creates a Firebase user and writes name + email to users/{uid}.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
async function registerUser(name, email, password) {
  // TODO: implement Firebase createUserWithEmailAndPassword + write to users/{uid}
}

/**
 * Signs out the current user. Caller redirects to index.html — the intro animation
 * replays automatically on page load without any extra handling.
 * @returns {Promise<void>}
 */
async function logoutUser() {
  // TODO: implement Firebase signOut
}
