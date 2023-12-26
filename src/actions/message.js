import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

/**
 * 	@typedef {{
 *  	connect: {
 *			(sigName: `response::${string}`, callback: ($obj: any, key: string, response: string) => void): number;
 *		};
 *		emit: {
 *			(sigName: `response::${string}`, key: string, response: string): void;
 *		}
 * 	} & import("@girs/gjs").SignalMethods} Signals
 */

const signals = /** @type {Signals} */({});
imports.signals.addSignalMethods(signals);

/**
 * 	@param {Gtk.Widget} provider
 * 	@param {Gtk.Builder} builder
 * 	@param {Gtk.Window=} parent_window
 * 	@returns {[null, Signals]}
 */
export const useMessage = (provider, builder, parent_window) => {
	const action_group = new Gio.SimpleActionGroup();

	const choose = new Gio.SimpleAction({
		name: 'choose',
		parameter_type: GLib.VariantType.new_tuple([GLib.VariantType.new('s'), GLib.VariantType.new('s')]),
	});
	choose.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const values = parameter.recursiveUnpack();
		if (!Array.isArray(values))
			throw new Error;

		/** @type {string} */
		const filters_query = values[1];
		if (filters_query[0] != '{' || filters_query[filters_query.length - 1] != '}') throw new Error;
		const obj_name = filters_query.substring(1, filters_query.length - 1);

		const dialog = /** @type {Adw.MessageDialog | null} */ (builder.get_object(obj_name));
		if (!dialog) throw new Error;

		dialog.set_transient_for(parent_window || null);

		(/** @type {{ choose: (cancellable: Gio.Cancellable | null) => Promise<string>; }} */ (/** @type {unknown} */ (dialog)))
        	.choose(null)
        	.then(
        		response => {
        			const buffer_name = values[0];
        			signals.emit(`response::${buffer_name}`, buffer_name, response);
        		},
        		error => {
        			if (error instanceof GLib.Error && error.matches(Gtk.dialog_error_quark(), Gtk.DialogError.DISMISSED)) {}
        			else {
        				logError(error);
        			}
        		}
        	);
	});
	action_group.add_action(choose);

	provider.insert_action_group('message', action_group);

	return [null, signals];
};
