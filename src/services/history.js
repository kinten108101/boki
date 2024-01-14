import _Tracker from 'gi://Tracker';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { sparql_unpack_value } from '../lib/tracker.js';
import { sequence } from '../lib/functional.js';
import { forwardArrayMethods } from '../lib/forward-methods.js';
import { forwardSignalMethods } from '../lib/forward-methods.js';

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

export const HistoryItem = class {

	/**
	 * @param {{ uuid: string, display_name: string, steam_url: GLib.Uri, saved_location: Gio.File }} params
	 */
	constructor({uuid, display_name, steam_url, saved_location}) {
		this.uuid = uuid;
		this.display_name = display_name;
		this.steam_url = steam_url;
		this.saved_location = saved_location;
	}
};


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
			`SELECT ?uuid ?steam_url ?display_name ?saved_location {
				?history_item a boki:HistoryItem;
					boki:uuid ?uuid;
					boki:steam_url ?steam_url;
					boki:display_name ?display_name;
					boki:saved_location ?saved_location.
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
			 *  & MapEntry<'saved_location', Gio.File>
			 *  & Map<any, any>}
			 **/
			(new Map(/** @type {any} */(
				sequence(dict_entries.length).map(x => {
					const entry = dict_entries[x];
					if (entry === undefined) return null;
					const {key, value} = entry;
					switch (key) {
					case 'uuid':
						if (typeof value !== 'string') break;
						return [key, value];
					case 'display_name':
						if (typeof value !== 'string') break;
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
					case 'saved_location':
						if (typeof value !== 'string') break;
						const path = Gio.File.new_for_path(value);
						return [key, path];
					}
					console.debug('Bad prop:', key);
					return null;
				}).filter(x => x !== null)
			)))
		).map(dict => {
			const uuid = dict.get('uuid');
			const display_name = dict.get('display_name');
			const steam_url = dict.get('steam_url');
			const saved_location = dict.get('saved_location');

			console.debug('dict data:', uuid, display_name, steam_url, saved_location);

			if (uuid === undefined
				|| display_name === undefined
				|| steam_url === undefined
				|| saved_location === undefined) {
				return null;
			}

			return new HistoryItem({ uuid, display_name, steam_url, saved_location });
		}).forEach(x => {
			if (x) items.push(x);
		});

		signals.emit('items-changed', 0, 0, items.length);
	};

	/**
	 * @param {{ display_name: string, steam_url: GLib.Uri, saved_location: Gio.File }} params
	 */
	const add = async ({ display_name, steam_url, saved_location }) => {
		const uuid = GLib.uuid_string_random();
		if (!uuid) throw new Error;

		const item = new HistoryItem({ uuid, display_name, steam_url, saved_location });

		const resource = Tracker.Resource.new(null);
		resource.set_uri('rdf:type', 'boki:HistoryItem');
		resource.set_string('boki:uuid', item.uuid);
		resource.set_string('boki:display_name', item.display_name);
		const url = item.steam_url.to_string();
		resource.set_string('boki:steam_url', url || '');
		resource.set_string('boki:saved_location', item.saved_location.get_path() || '');

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

	const methods = {
		start,
		restore,
		add,
		remove,
		removeAll,
	};

	return forwardArrayMethods(items)(forwardSignalMethods(signals)(methods));
};
