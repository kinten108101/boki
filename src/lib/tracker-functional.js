import Tracker from 'gi://Tracker';

/**
 * @template {any[]} T
 * @template {any} Iface
 *
 * @typedef {(dependency: T, execute: (obj: Iface, ...args: Parameters<Parameters<T['forEach']>[0]>) => void) => Iface} ForEach
 */

/**
 * @template {any} T
 * @typedef {{
 *   forEach: ForEach<any[], T>;
 * } & T} Functional
 */

/**
 * @template {object} ThisType
 * @param {ThisType} _this
 * @returns {Functional<ThisType>}
 */
const addFunctionalMethods = (_this) => {
	// @ts-expect-error
	_this['forEach'] = (dependency, execute) => {
		// @ts-expect-error
		dependency.forEach((...params) => {
			execute(_this, ...params);
		});
		return _this;
	}
	// @ts-expect-error
	return _this;
};

/**
 * @param {Tracker.Batch} batch
 */
const make_batch_wrapper = (batch) => {
	const wrapper = {};
	[
		'add_resource',
		'add_sparql',
		'add_statement',
		'execute_async',
		'connect_after',
		'emit',
		'connect',
		'connect_after',
		'emit',
		'disconnect'
	].forEach(method_name => {
		// @ts-expect-error
		wrapper[method_name] = (...params) => {
			// @ts-expect-error
			return batch[method_name](...params);
		};
	});
	return /** @type {Tracker.Batch} */(wrapper);
};

/**
 * @param {Tracker.SparqlConnection} connection
 */
const make_connection_wrapper = (connection) => {
	const wrapper = {};
	[
		'close',
		'close_async',
		'close_finish',
		'create_batch',
		'create_notifier',
		'deserialize_async',
		'deserialize_finish',
		'get_namespace_manager',
		'load_statement_from_gresource',
		'map_connection',
		'query',
		'query_async',
		'query_finish',
		'query_statement',
		'serialize_async',
		'serialize_finish',
		'update',
		'update_array_async',
		'update_array_finish',
		'update_async',
		'update_blank',
		'update_blank_async',
		'update_blank_finish',
		'update_finish',
		'update_resource',
		'update_resource_async',
		'update_resource_finish',
		'update_statement',
		'connect',
		'connect_after',
		'emit',
		'disconnect'
	].forEach(method_name => {
		// @ts-expect-error
		wrapper[method_name] = (...params) => {
			// @ts-expect-error
			return connection[method_name](...params);
		};
	});
	return /** @type {Tracker.SparqlConnection} */(wrapper);
};

/**
 * @param {Parameters<Tracker.SparqlConnection.new>} params
 * @returns {{
 *   create_batch(): Functional<Tracker.Batch>
 * } & Tracker.SparqlConnection}
 */
export const SparqlConnection = (...params) => {
	const connection = Tracker.SparqlConnection.new(...params);
	const wrapper = make_connection_wrapper(connection);
	wrapper['create_batch'] = () => {
		const batch = connection.create_batch();
		const batch_wrapper = addFunctionalMethods(make_batch_wrapper(batch));
		return batch_wrapper;
	};
	// @ts-expect-error
	return wrapper;
};

