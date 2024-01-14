import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { gettext as _ } from "gettext";

import { registerOwnerResolver, toaster } from './lib/toaster-provider.js';
import { TOAST_TIMEOUT_SHORT } from './lib/gtk.js';

import { Window } from './window.js';
import { retract_path } from './utils/files.js';
import { Database } from './services/database.js';
import { History } from './services/history.js';
import { settings } from './utils/settings.js';
import { PreferencesPageController as PreferencesController } from './widgets/pref-page.js';
import { AboutPageController as AboutController } from './widgets/about-page.js';
import { ShortcutsPageController as ShortcutsViewController } from './widgets/shortcuts-page.js';

const get_xdg_download_dir = async () => {
	const proc = Gio.Subprocess.new(['xdg-user-dir', 'DOWNLOAD'], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
	const [stdout, stderr] = await proc.communicate_utf8_async(null, null);

	if (proc.get_successful() && stdout !== null)
        return stdout.replaceAll('\n', '');
    else
    	throw new Error(stderr || '');
};

GLib.log_set_debug_enabled(globalThis.is_devel);

GLib.set_application_name('Boki');

export const application = new Adw.Application({
	application_id: 'com.github.kinten108101.Boki',
});

export const database = Database();
export const history = History(database);

database.start();
history.start();

/** @type {Gtk.Window | null} */
let _prev_active_window = null;

registerOwnerResolver(() => {
	const window = application.get_active_window();
	if (window !== null) {
		_prev_active_window = window;
		return window;
	}
	if (_prev_active_window !== null) {
		return _prev_active_window;
	}
	return null;
});

const clear_history = new Gio.SimpleAction({
	name: 'clear-history',
});
clear_history.connect('activate', () => {
	history.removeAll()
		.then(() => {
			toaster()?.add_toast(new Adw.Toast({
				title: _('Cleared history'),
				timeout: TOAST_TIMEOUT_SHORT,
			}));
		})
		.catch(logError);
});
application.add_action(clear_history);

if (settings.get_boolean('first-launch')) {
	(async () => {
		const download_dir = await get_xdg_download_dir();
		settings.set_string('download-directory', retract_path(download_dir));

		settings.set_boolean('first-launch', false);
	})().catch(logError);
}

const quit = new Gio.SimpleAction({
	name: 'quit',
});
quit.connect('activate', () => {
	application.quit();
});
application.add_action(quit);
application.set_accels_for_action('app.quit', ['<Primary>q']);

/** @type {WeakMap<Gtk.Window, Adw.NavigationView>} */
export const navstack_map = new WeakMap;

const on_new_window = () => {
	const { window, navigation_stack } = Window(application, settings);
	navstack_map.set(window, navigation_stack);
	window.present();
};

const new_window = new Gio.SimpleAction({
	name: 'new-window',
});
new_window.connect('activate', () => {
	on_new_window();
});
application.add_action(new_window);
application.set_accels_for_action('app.new-window', ['<Primary>n']);

const show_hist = new Gio.SimpleAction({
	name: 'show-history',
});
show_hist.connect('activate', () => {
	const parent_window = application.get_active_window();
	if (!parent_window)
		throw new Error;

	const navigation_stack = navstack_map.get(parent_window);
	if (!navigation_stack)
		throw new Error;

	navigation_stack.push_by_tag('history');
});
application.add_action(show_hist);
application.set_accels_for_action('app.show-history', ['<Primary>h']);

const show_pref = new Gio.SimpleAction({
	name: 'show-preferences'
});
show_pref.connect('activate', () => {
	PreferencesController().present();
});
application.add_action(show_pref);
application.set_accels_for_action('app.show-preferences', ['<Primary>comma']);

const show_help_alt = new Gio.SimpleAction({
	name: 'show-help-alt',
});
show_help_alt.connect('activate', () => {
	ShortcutsViewController().present();
});
application.add_action(show_help_alt);
application.set_accels_for_action('app.show-help-alt', ['<Primary>question']);

const show_about = new Gio.SimpleAction({
	name: 'show-about',
});
show_about.connect('activate', () => {
	AboutController().present();
});
application.add_action(show_about);
application.set_accels_for_action('window.close', ['<Primary>w']);

if (globalThis.is_devel) {
	const test_click_widget = new Gio.SimpleAction({
		name: 'test.click-widget',
		parameter_type: GLib.VariantType.new('s'),
	});
	test_click_widget.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const [name] = parameter.get_string();
		if (name === null) throw new Error;
		const window = application.get_windows()[0];
		if (!window) {
			console.debug('Cannot get active window');
			return;
		}
		// @ts-expect-error
		const obj = window.builder.get_object(name);
		obj.activate();
	});
	application.add_action(test_click_widget);
}

application.connect('activate', () => {
	on_new_window();
});
