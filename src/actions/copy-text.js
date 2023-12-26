import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { gettext as _ } from "gettext";

import { TOAST_TIMEOUT_SHORT } from '../utils/gtk.js';

/**
 * @param {Gtk.Widget} provider
 * @param {Gtk.Builder=} builder
 * @param {Adw.ToastOverlay=} toaster
 */
export function useCopyText(provider, builder, toaster) {
	const action_group = new Gio.SimpleActionGroup();

	const action = new Gio.SimpleAction({
		name: 'copy-text',
		parameter_type: GLib.VariantType.new('s'),
	});
	action.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const [value] = parameter.get_string();
		if (value === null) throw new Error;
		let str = '';
		if (value.length > 9 && value.substring(0, 8) === 'builder(' && value.lastIndexOf(')') == (value.length - 1)) {
			if (!builder) throw new Error;
			const path = value.substring(8, value.length - 1);
			const segments = path.split('.');
			if (segments.length < 2) throw new Error;
			const obj_name = (/** @type {string} */(segments[0]));
			console.debug('obj_name', obj_name);
			const obj = builder.get_object(obj_name);
			if (!obj) throw new Error;
			/** @type {any} */
			let val = obj;
			for (let i = 1; i < segments.length; i++) {
				const key = (/** @type {string} */(segments[i]));
				console.debug('key', i, key);
				val = val[key];
			}
			if (typeof val !== 'string') throw new Error;
			str = val;
		} else {
			str = value;
		}
      	const display = Gdk.Display.get_default();
      	if (display === null) return;
      	const val = new GObject.Value();
      	val.init(GObject.TYPE_STRING);
      	val.set_string(str);
      	display.get_clipboard().set_content(Gdk.ContentProvider.new_for_value(val));
      	toaster?.add_toast(new Adw.Toast({
      		title: _('Copied to clipboard'),
      		timeout: TOAST_TIMEOUT_SHORT,
      	}));
	});
	action_group.add_action(action);

	provider.insert_action_group('copy-text', action_group);
}
