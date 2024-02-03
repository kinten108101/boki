import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { application } from '../application.js';
import { Preferences } from './pref.js';

/**
 * @returns {import('./pref.js').PreferencesController}
 */
export const PreferencesWindowController = () => {
	const builder = new Gtk.Builder();
	builder.add_from_resource('/com/github/kinten108101/Boki/ui/preferences.ui');

	Preferences(builder);

	const window = (/** @type {Adw.PreferencesWindow | null} */(builder.get_object('preferences')));
	if (!window)
		throw new Error;

	const parent_window = application.get_active_window();
	if (parent_window) {
		window.set_transient_for(parent_window);
	}

	return [
		() => window.present(),
	];
};
