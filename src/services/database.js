import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Tracker from 'gi://Tracker';
import { SparqlConnection as sparqlconnection_new } from '../lib/tracker-functional.js';

const SparqlConnection = {
	new: sparqlconnection_new,
};

const DATABASE_PATH = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(), pkg.name || '', 'db']));
const ONTOLOGY_PATH = Gio.File.new_for_path(GLib.build_filenamev([pkg.pkgdatadir || '', 'ontology']));

export const Database = () => {
	/** @type {ReturnType<SparqlConnection['new']> | null} */
	let _connection = null;
	/** @type {Gio.Cancellable | null} */
	let _cancellable = null;

	const start = () => {
		_connection = SparqlConnection.new(
			Tracker.SparqlConnectionFlags.NONE,
			DATABASE_PATH,
			ONTOLOGY_PATH,
			null
		);
		_cancellable = new Gio.Cancellable();
	};

	const exit = () => {
		_cancellable?.cancel();
		if (!_connection)
			return;
		_connection.close();
		_connection = null;
	};

	const connection = () => {
		if (_connection === null) throw new Error('Not connected to database');
		return _connection;
	}

	/**
	 * @param {Tracker.Resource[]} resources
	 */
	const batch = async (...resources) => {
		return connection()
			.create_batch()
			.forEach(resources, (batch, x, _, ) => batch.add_resource(null, x))
			.execute_async(_cancellable);
	};

	/**
	 * @param {string} sparql
	 */
	const query = async (sparql) => {
		const query = connection().query_statement(sparql, _cancellable);
		if (!query) throw new Error;
		return query.execute(_cancellable);
	};

	/**
	 * @param {string} sparql
	 */
	const update = async (sparql) => {
		await connection().update(sparql, _cancellable);
	};

	return {
		start,
		exit,
		batch,
		query,
		update,
	}
};
