import Gtk from 'gi://Gtk';

import { application, navstack_map } from '../application.js';

/**
 * @returns {ShortcutsViewController}
 */
export const ShortcutsPageController = () => {
	const present = () => {
		const parent_window = application.get_active_window();
		if (!parent_window)
			throw new Error;

		const navigation_stack = navstack_map.get(parent_window);
		if (!navigation_stack)
			throw new Error;

		navigation_stack.push_by_tag('shortcuts');
	};

	return {
		present,
	};
};

/**
 * @param {Gtk.Builder} builder
 */
export const ShortcutsPage = (builder) => {
};
