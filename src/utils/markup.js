/**
 * @param {string} text
 * @returns {string}
 */
export function MakeCompatPango(text) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&#60;').replaceAll('>', '&#62;');
}

/**
 * @param {string} text
 * @returns {string}
 */
export function MakeTitleCompat(text) {
	return MakeCompatPango(text).replaceAll('\\n', '');
}
