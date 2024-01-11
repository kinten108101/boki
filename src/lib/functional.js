/**
 * Create an array of value from 0 to `length - 1` inclusive.
 *
 * @param {number} length
 */
export const sequence = length => {
	return (
		/** Create a buffer of undefined values */
		Array(length)
			/** Fix an issue where Array(1) can be skipped */
			.fill(undefined)
			/** Use index as value */
			.map((_, i) => i)
	);
};

/**
 * Callback will be executed as IIFE and will return itself so as to be used later.
 *
 * @template {any[]} ArgTypes
 * @param {(...params: ArgTypes) => void} cb
 * @param {ArgTypes} args
 */
export const sync_create = (cb, ...args) => {
	cb(...args);
	return cb;
};

/** @param {any} obj */
export const speak = (obj) => {
	console.log(obj);
	return obj;
};
