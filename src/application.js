import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { gettext as _ } from "gettext";

import { Window } from './window.js';
import { useFile } from './actions/file.js';
import { retract_path } from './utils/files.js';
import { AboutWindow } from './widgets/about.js';

const get_xdg_download_dir = async () => {
	const proc = Gio.Subprocess.new(['xdg-user-dir', 'DOWNLOAD'], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
	const [stdout, stderr] = await proc.communicate_utf8_async(null, null);

	if (proc.get_successful() && stdout !== null)
        return stdout.replaceAll('\n', '');
    else
    	throw new Error(stderr || '');
};

export function Application() {
	GLib.log_set_debug_enabled(globalThis.is_devel);

	GLib.set_application_name('Boki');

	const application = new Adw.Application({
		application_id: 'com.github.kinten108101.Boki',
	});

	const settings = new Gio.Settings({
		schema_id: 'com.github.kinten108101.Boki',
	});

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

	const new_window = new Gio.SimpleAction({
		name: 'new-window',
	});
	new_window.connect('activate', () => {
		const mainWindow = Window(application, settings);
    	mainWindow.present();
	});
	application.add_action(new_window);
	application.set_accels_for_action('app.new-window', ['<Primary>n']);


	const show_pref = new Gio.SimpleAction({
		name: 'show-preferences'
	});
	show_pref.connect('activate', () => {
		const builder = new Gtk.Builder();
		builder.add_from_resource('/com/github/kinten108101/Boki/ui/preferences.ui');


		const window = (/** @type {Adw.PreferencesWindow | null} */(builder.get_object('preferences')));
		if (!window)
			throw new Error;

		if (globalThis.is_devel) {
			const devel_page = (/** @type {Adw.PreferencesPage | null} */(builder.get_object('devel_page')));
			if (!devel_page)
				throw new Error;

			window.add(devel_page);
		}

		const { output: _files, output_signals: file_signals, enable_action, disable_action } = useFile(window, builder, window);

		const default_directory_row = /** @type {Adw.ActionRow | null} */ (builder.get_object('default_directory_row'));
		if (!default_directory_row) throw new Error;

		const on_download_directory_changed = () => {
			const value = settings.get_string('download-directory');
			if (value === '') {
				default_directory_row.set_subtitle(_('Select Location'));
				disable_action('file.set', 'download-directory');
			} else {
				default_directory_row.set_subtitle(value);
				enable_action('file.set', 'download-directory');
			}
		};

		on_download_directory_changed();

		settings.connect('changed::download-directory', on_download_directory_changed);

		file_signals.connect('changed::download-directory', (_obj, key, file) => {
			const value = file.get_path() || '';
			settings.set_string(key, retract_path(value));
		});

		const parent_window = application.get_active_window();
		if (parent_window) {
			window.set_transient_for(parent_window);
		}

		window.present();
	});
	application.add_action(show_pref);
	application.set_accels_for_action('app.show-preferences', ['<Primary>comma']);

	const show_about = new Gio.SimpleAction({
		name: 'show-about',
	});
	show_about.connect('activate', () => {
		const window = AboutWindow.new_from_appdata(`/com/github/kinten108101/Boki/com.github.kinten108101.Boki.metainfo.xml`, 'beta');

		window.set_debug_info(`flatpak=${globalThis.is_built_for_flatpak}\n`);

		const parent_window = application.get_active_window();
		if (parent_window) {
			window.set_transient_for(parent_window);
		}

		window.present();
	});
	application.add_action(show_about);

	application.set_accels_for_action('window.close', ['<Primary>w']);

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

  	application.connect('activate', () => {
    	const mainWindow = Window(application, settings);
    	mainWindow.present();
  	});
  
	return application;
}
