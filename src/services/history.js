import _Tracker from 'gi://Tracker';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { is_number_string } from '../utils/string.js';
import { sparql_unpack_value } from '../lib/tracker.js';

const Tracker = {
	..._Tracker,
	/**
	 * @param {_Tracker.SparqlCursor} cursor
	 */
	ExtendedCursor: cursor => {
		const unpack = sparql_unpack_value(cursor);

		return {
			unpack,
		};
	},
};

/** @param {any} obj */
const speak = (obj) => {
	console.log(obj);
	return obj;
};

export const HistoryItem = class {

	/**
	 * @param {{ uuid: string, display_name: string, steam_url: GLib.Uri }} params
	 */
	constructor({uuid, display_name, steam_url}) {
		this.uuid = uuid;
		this.display_name = display_name;
		this.steam_url = steam_url;
	}
};

/**
 * @param {number} length
 */
const sequence = length => {
	return (Array(length).fill(0).map((_, i) => i));
};

/**
 * The signal methods interface is not always part of the overall object interface. For example, an object may be created through the compositional pattern or the function-based constructor pattern, and signal methods are accessible through a child object e.g. `obj._signals.connect` instead of `obj.connect`. However, sometimes you may want to merge these signal methods into the overall object interface, for ease of access e.g. you want to use `obj.connect`. Perhaps these signal methods are only merged into the *public* object interface. In this case, this function achieves that by forwarding signal methods from `obj` to `obj._signals`.
 * @template {import("@girs/gjs").SignalMethods} K
 * @param {K} signal_methods
 */
const forwardSignalMethods = (signal_methods) => {
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
					return signal_methods[property_name];
				}
				// @ts-expect-error
				return iface[property_name];
			}
		});
	};
};

/**
 * @template {any} B
 * @template {Readonly<Array<B>>} K
 * @param {K} array
 */
const forwardArrayMethods = (array) => {
	/**
	 * @template {object} T
	 * @param {T} iface
	 * @returns {T & K}
	 */
	return (iface) => {
		// @ts-expect-error
		return new Proxy({}, {
			get(_target, property_name) {
				if ((typeof property_name === 'string' && [
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
				].includes(property_name)) || (typeof property_name === 'string' && is_number_string(property_name))) {
					// @ts-expect-error
					return array[property_name];
				}
				// @ts-expect-error
				return iface[property_name];
			}
		});
	};
}

/**
 * @template {any} KeyType
 * @template {any} ValueType
 * @typedef {{
 * 		get(key: KeyType): ValueType | undefined;
 *      set(key: KeyType, value: ValueType): any;
 * }} MapEntry
 */

/**
 * @param {ReturnType<import('./database.js').Database>} database
 */
export const History = (database) => {
	const signals = (() => {
		const obj = {};
		imports.signals.addSignalMethods(obj);
		return /** @type {ListModelSignalMethods} */(obj);
	})();
	/** @type {(typeof HistoryItem.prototype)[]} */
	const items = [];
	/** @type {Gio.Cancellable?} */
	let _cancellable = null;

	const start = () => {
		restore().catch(logError);
	};

	const restore = async () => {
		const cursor = await database.query(
			`SELECT ?uuid ?steam_url ?display_name {
				?history_item a boki:HistoryItem;
					boki:uuid ?uuid;
					boki:steam_url ?steam_url;
					boki:display_name ?display_name.
			}`);

		(await (
		/**
		  * @param {Array<{ key:string, value: ReturnType<ReturnType<Tracker["ExtendedCursor"]>["unpack"]> }>[]} arr
		  */
		async function __(arr = []) {
			if (!await cursor.next_async(_cancellable)) {
				return arr;
			}
			return __([
				...arr,
				sequence(cursor.nColumns).map(
					x => ({
						key: cursor.get_variable_name(x) || '',
						value: Tracker.ExtendedCursor(cursor).unpack(x)
					})),
			]);
		})([[]])).map(dict_entries =>
			/** @type {MapEntry<'', null>
			 *  & MapEntry<'steam_url', GLib.Uri>
			 * 	& MapEntry<'display_name', string>
			 *  & MapEntry<'uuid', string>
			 *  & Map<any, any>}
			 **/
			(new Map(/** @type {any} */(
				dict_entries.length > 0 ? sequence(dict_entries.length).map(x => {
					const entry = dict_entries[x];
					if (entry === undefined) return ['', null];
					const {key, value} = entry;
					switch (key) {
					case 'uuid':
						if (typeof value !== 'string') break;
						return [key, value];
					case 'display_name':
						if (typeof value !== 'string') break;
						console.log('display name in pipeline:', value);
						return [key, value];
					case 'steam_url':
						if (typeof value !== 'string') break;
						/** @type {GLib.Uri} */
						let url;
						try {
							url = GLib.Uri.parse(value, GLib.UriFlags.NONE);
						} catch (error) {
							console.error('Encounted error while parsing SELECT query, refuse to continue');
							logError(error);
							break;
						}
						return [key, url];
					}
					console.debug('Bad prop:', key);
					return ['', null];
				}) : undefined
			)))
		).map(dict => {
			const uuid = dict.get('uuid');
			const display_name = dict.get('display_name');
			const steam_url = dict.get('steam_url');

			if (steam_url) {
				console.log('good url case:', uuid, display_name, steam_url);
			}

			if (uuid === undefined
				|| display_name === undefined
				|| steam_url === undefined) {
				return null;
			}

			return new HistoryItem({ uuid, display_name, steam_url });
		}).forEach(x => {
			if (x) items.push(x);
		});

		signals.emit('items-changed', 0, 0, items.length);
	};

	/**
	 * @param {{ display_name: string, steam_url: GLib.Uri }} params
	 */
	const add = async ({ display_name, steam_url }) => {
		const uuid = GLib.uuid_string_random();
		if (!uuid) throw new Error;

		const item = new HistoryItem({uuid, display_name, steam_url});

		const resource = Tracker.Resource.new(null);
		resource.set_uri('rdf:type', 'boki:HistoryItem');
		resource.set_string('boki:uuid', item.uuid);
		resource.set_string('boki:display_name', item.display_name);
		const url = item.steam_url.to_string();
		resource.set_string('boki:steam_url', url || '');

		await database.batch(resource);

		/*
		database.query(
			`INSERT DATA {
				GRAPH <> {

				}
			}`);
		*/

		items.push(item);

		signals.emit('items-changed', items.length - 1, 0, 1);
	};

	/**
	 * @param {HistoryItem} item
	 */
	const remove = async (item) => {
		await database.update(
			`DELETE {
				?history_item a rdfs:Resource
			} WHERE {
				?history_item a boki:HistoryItem;
					boki:uuid ?uuid.
				FILTER (?uuid = "${Tracker.sparql_escape_string(item.uuid)}")
			}`);

		const index = items.findIndex(x => x === item);

		items.splice(index, 1);

		signals.emit('items-changed', index, 1, 0);
	};

	const removeAll = async () => {
		await database.update(
			`DELETE {
				?history_item a rdfs:Resource
			} WHERE {
				?history_item a boki:HistoryItem;
					boki:uuid ?uuid.
			}`);

		const deleteCount = items.length;

		items.splice(0, deleteCount);

		signals.emit('items-changed', 0, deleteCount, 0);
	};

	signals.connect('items-changed', (_obj, position, added, removed) => {
		console.debug('!!!');
		console.debug('!!!');
		console.debug('!!!');
		console.debug(position, added, removed);
		console.debug(items);
		console.debug('!!!');
		console.debug('!!!');
		console.debug('!!!');
	});

	return {
		start,
		restore,
		add,
		remove,
		removeAll,
		/** @type {Readonly<(typeof HistoryItem.prototype)[]>} */
		items,
		signals,
	};
};