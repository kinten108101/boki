import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

const pick_dir_dialog = new Gtk.FileDialog();

/**
 * @template {string} V
 * @type {Map<V, Gio.File>}
 */
const output = new Map;

/**
 * 	@typedef {{
 *  	connect: {
 *			(sigName: `changed::${string}`, callback: ($obj: any, key: string, file: Gio.File) => void): number;
 *		};
 *		emit: {
 *			(sigName: `changed::${string}`, key: string, file: Gio.File): void;
 *		}
 * 	} & import("@girs/gjs").SignalMethods} OutputSignals
 */

const output_signals = /** @type {OutputSignals} */({});
imports.signals.addSignalMethods(output_signals);

/**
 * 	@param {Gtk.Widget} widget
 * 	@param {Gtk.Builder} builder
 * 	@param {Gtk.Window=} parent_window
 */
export const useFile = (widget, builder, parent_window) => {
	const action_group = new Gio.SimpleActionGroup();

	const save_file = new Gio.SimpleAction({
		name: 'save-file',
		parameter_type: GLib.VariantType.new_tuple([GLib.VariantType.new('s'), GLib.VariantType.new('s')]),
	});
	save_file.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const values = parameter.recursiveUnpack();
		if (!Array.isArray(values))
			throw new Error;

		/** @type {string} */
		const filters_query = values[1];
		if (filters_query[0] != '{' || filters_query[filters_query.length - 1] != '}') throw new Error;
		const obj_name = filters_query.substring(1, filters_query.length - 1);

		const dialog = /** @type {Gtk.FileDialog | null} */ (builder.get_object(obj_name));
		if (!dialog) throw new Error;

        (/** @type {{ save: (window: Gtk.Window | null, cancellable: Gio.Cancellable | null) => Promise<Gio.File>; }} */ (/** @type {unknown} */ (dialog)))
        	.save(parent_window || null, null)
        	.then(
        		file => {
					/** @type {V} */
        			const buffer_name = values[0];
        			output.set((buffer_name), file);
        			output_signals.emit(`changed::${buffer_name}`, buffer_name, file);
        		},
        		error => {
        			if (error instanceof GLib.Error && error.matches(Gtk.dialog_error_quark(), Gtk.DialogError.DISMISSED)) {}
        			else {
        				logError(error);
        			}
        		}
        	);
	});
	action_group.add_action(save_file);

	const pick_dir = new Gio.SimpleAction({
		name: 'select-folder',
		parameter_type: GLib.VariantType.new_tuple([GLib.VariantType.new('s')]),
	});
	pick_dir.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const values = parameter.recursiveUnpack();
		if (!Array.isArray(values))
			throw new Error;

        (/** @type {{ select_folder: (window: Gtk.Window | null, cancellable: Gio.Cancellable | null) => Promise<Gio.File>; }} */ (/** @type {unknown} */ (pick_dir_dialog)))
        	.select_folder(parent_window || null, null)
        	.then(
        		file => {
        			/** @type {V} */
        			const buffer_name = values[0];
        			output.set((buffer_name), file);
        			output_signals.emit(`changed::${buffer_name}`, buffer_name, file);
        		},
        		error => {
        			if (error instanceof GLib.Error && error.matches(Gtk.dialog_error_quark(), Gtk.DialogError.DISMISSED)) {}
        			else {
        				logError(error);
        			}
        		}
        	);
  	});
  	action_group.add_action(pick_dir);

  	const set_dir = new Gio.SimpleAction({
  		name: 'set',
  		parameter_type: GLib.VariantType.new_tuple([GLib.VariantType.new('s'), GLib.VariantType.new('s')]),
  	});
  	set_dir.connect('activate', (_action, parameter) => {
  		if (!parameter) throw new Error;
		const values = parameter.recursiveUnpack();
		if (!Array.isArray(values))
			throw new Error;

		/** @type {V} */
		const buffer_name = values[0];
		/** @type {string} */
		const path = values[1];
		const file = Gio.File.new_for_path(path);
		output.set((buffer_name), file);
		output_signals.emit(`changed::${buffer_name}`, buffer_name, file);
  	});
  	action_group.add_action(set_dir);

	widget.insert_action_group('file', action_group);

	/**
	 * @param {string} action_name
	 * @param {string} key
	 */
	const disable_action = (action_name, key) => {
		for (const x of builder.get_objects()) {
			if ('action_name' in x && 'action_target' in x && x.action_name === action_name && /** @type {any[]} */((/** @type {GLib.Variant} */(x.action_target)).recursiveUnpack())[0] === key) {
				/** @type {Gtk.Widget} */(/** @type {unknown} */(x)).set_sensitive(false);
				return;
			}
		}
	}

	/**
	 * @param {string} action_name
	 * @param {string} key
	 */
	const enable_action = (action_name, key) => {
		for (const x of builder.get_objects()) {
			if ('action_name' in x && 'action_target' in x && x.action_name === action_name && /** @type {any[]} */((/** @type {GLib.Variant} */(x.action_target)).recursiveUnpack())[0] === key) {
				/** @type {Gtk.Widget} */(/** @type {unknown} */(x)).set_sensitive(true);
				return;
			}
		}
	}

	return { output, output_signals, enable_action, disable_action };
};
