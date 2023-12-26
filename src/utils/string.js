/**
 * @param {string} str
 * @returns {boolean}
 */
export function is_number_string(str) {
	if (str.length === 0) return false;
	for (let i = 0; i < str.length; i++) {
		if (str.charCodeAt(i) < 48 || str.charCodeAt(i) > 57) return false;
	}
	return true;
}
