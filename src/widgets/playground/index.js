import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { ExtendedBuilder } from '../../lib/builder.js';
import { WindowPromiser } from '../../lib/window-promiser.js';

/**
 * @typedef {import('../../lib/window-promiser.js').WindowPromiser} WindowPromiserReturns
 */

const Builder = ExtendedBuilder;

/**
 * @typedef {[
 * () => void,
 * Gtk.Widget['insert_action_group'],
 * ]} usePlayground
 */

const InputDialog = () => {
	const promiser = WindowPromiser();

	const window = new Adw.Window();
	window.set_modal(true);
	window.set_default_size(400, 400);

	const page = new Adw.PreferencesPage();
	window.set_content(page);

	const group_one = new Adw.PreferencesGroup();
	group_one.set_description('A Storybook web application is installed per project. Select the project to start the application.');
	page.add(group_one);

	const row_path = new Adw.ActionRow();
	row_path.set_title('Storybook Project');
	group_one.add(row_path);

	const group_two = new Adw.PreferencesGroup();
	page.add(group_two);

	const start_button = new Gtk.Button();
	start_button.set_label('Start');
	start_button.set_halign(Gtk.Align.CENTER);
	start_button.set_valign(Gtk.Align.CENTER);
	start_button.add_css_class('pill');
	start_button.add_css_class('suggested-action');
	start_button.connect('clicked', () => {
		promiser.resolve(1);
		window.close();
	});
	group_two.add(start_button);

	/**
	 * @param {Gtk.Window | null} parent_window
	 */
	const input = (parent_window) => {
		window.set_transient_for(parent_window);
		return promiser.promise(window);
	};

	return {
		input,
	}
};

/**
 * @param {ReturnType<typeof Builder>} builder
 * @param {Gtk.Window} window
 */
export const Playground = (builder, window) => {
	const playground_set_file_button = builder.get_object('playground_set_file_button', Gtk.Button);
	playground_set_file_button.connect('clicked', () => {
		(async () => {
			const dialog = InputDialog();
			const value = await dialog.input(window);
			console.log(value);
		})().catch(logError);
	});
};
