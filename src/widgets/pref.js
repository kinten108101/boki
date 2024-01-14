import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { gettext as _ } from "gettext";

import { settings } from '../utils/settings.js';
import { useFile } from '../lib/file.js';
import { sync_create } from '../lib/functional.js';
import { retract_path } from '../utils/files.js';

/**
 * @typedef {{ present: () => void; }} PreferencesController
 */

/**
 * @param {Gtk.Builder} builder
 */
export const Preferences = (builder) => {
	const preferences_page = /** @type {Adw.PreferencesPage | null} */ (builder.get_object('preferences_page'));
	if (!preferences_page)
		throw new Error;

	const { output: _files, output_signals: file_signals, enable_action, disable_action } = useFile(preferences_page, builder);

	const default_directory_row = /** @type {Adw.ActionRow | null} */ (builder.get_object('default_directory_row'));
	if (!default_directory_row) throw new Error;

	settings.connect('changed::download-directory', sync_create(() => {
		const value = settings.get_string('download-directory');
		if (value === '') {
			default_directory_row.set_subtitle(_('Select Location'));
			disable_action('file.set', 'download-directory');
		} else {
			default_directory_row.set_subtitle(value);
			enable_action('file.set', 'download-directory');
		}
	}));

	file_signals.connect('changed::download-directory', (_obj, key, file) => {
		const value = file.get_path() || '';
		settings.set_string(key, retract_path(value));
	});
};
