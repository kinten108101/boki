/**
 * @param {string} str
 * @returns {boolean}
 */
function is_number_string(str) {
	if (str.length === 0) return false;
	for (let i = 0; i < str.length; i++) {
		if (str.charCodeAt(i) < 48 || str.charCodeAt(i) > 57) return false;
	}
	return true;
}

/**
 * The signal methods interface is not always part of the overall object interface. For example, an object may be created through the compositional pattern or the function-based constructor pattern, and signal methods are accessible through a child object e.g. `obj._signals.connect` instead of `obj.connect`. However, sometimes you may want to merge these signal methods into the overall object interface, for ease of access e.g. you want to use `obj.connect`. Perhaps these signal methods are only merged into the *public* object interface. In this case, this function achieves that by forwarding signal methods from `obj` to `obj._signals`.
 * @template {import("@girs/gjs").SignalMethods} K
 * @param {K} signal_methods
 */
export const forwardSignalMethods = (signal_methods) => {
	/**
	 * @template {object} T
	 * @param {T} iface
	 * @returns {T & K}
	 */
	return (iface) => {
		// @ts-expect-error
		return new Proxy({}, {
			get(_, property_name) {
				if (typeof property_name === 'string' && [
					'connect',
					'disconnect',
					'disconnectAll',
					'emit',
					'signalHandlerIsConnected',
				].includes(property_name) /** What about in keyword? */) {
					// @ts-expect-error
					return signal_methods[property_name].bind(signal_methods);
				}
				// @ts-expect-error
				return iface[property_name].bind(iface);
			}
		});
	};
};

/**
 * @template {any} B
 * @template {Array<B> | Readonly<Array<B>>} K
 * @param {K} array
 */
export const forwardArrayMethods = (array) => {
	/**
	 * @template {object} T
	 * @param {T} iface
	 * @returns {T & Readonly<K>}
	 */
	return (iface) => {
		// @ts-expect-error
		return new Proxy({}, {
			get(_target, property_name) {
				if (typeof property_name === 'string' && [
				    'toString',
				    'toLocaleString',
				    'pop',
				    'push',
				    'concat',
				    'join',
				    'reverse',
				    'shift',
				    'slice',
				    'sort',
				    'splice',
				    'unshift',
				    'indexOf',
				    'lastIndexOf',
				    'every',
				    'some',
				    'forEach',
				    'map',
				    'filter',
				    'reduce',
				    'reduceRight'
				].includes(property_name)) {
					// @ts-expect-error
					return array[property_name].bind(array);
				} else if (typeof property_name === 'string' && [
				    'length',
				].includes(property_name)) {
					// @ts-expect-error
					return array[property_name];
				} else if (typeof property_name === 'string' && is_number_string(property_name)) {
					// @ts-expect-error
					return array[property_name];
				}
				// @ts-expect-error
				return iface[property_name].bind(iface);
			}
		});
	};
}
