import Gtk from 'gi://Gtk';
import { application, navstack_map } from '../application.js';

/**
 * @returns {import('./pref.js').PreferencesController}
 */
export const PreferencesPageController = () => {
	const present = () => {
		const parent_window = application.get_active_window();
		if (!parent_window)
			throw new Error;

		const navigation_stack = navstack_map.get(parent_window);
		if (!navigation_stack)
			throw new Error;

		navigation_stack.push_by_tag('preferences');
	};

	/** @type {Gtk.Widget['insert_action_group']} */
	const insert_action_group = (name, group) => {
		const parent_window = application.get_active_window();
		if (!parent_window)
			throw new Error;

		return parent_window.insert_action_group(name, group);
	};

	return [
		present,
		insert_action_group,
	];
};


