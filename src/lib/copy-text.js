import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { gettext as _ } from "gettext";

import { TOAST_TIMEOUT_SHORT } from './gtk.js';
import { get_value_from_formatting_string } from './builder-fmtstr.js';
import { toaster } from './toaster-provider.js';

/**
 * Implement for {@link provider} some generic clipboard-related actions.
 *
 * Currently copy-text.copy-text parameter does not support raw value, only a builder-fmtstr string.
 *
 * @param {Gtk.Widget} provider The ancestor widget that provides the action.
 * @param {Gtk.Builder=} builder A {@link Gtk.Builder} used for the builder-fmtstr system.
 */
export function useCopyText(provider, builder) {
	const action_group = new Gio.SimpleActionGroup();

	const action = new Gio.SimpleAction({
		name: 'copy-text',
		parameter_type: GLib.VariantType.new_tuple([GLib.VariantType.new('s')]),
	});
	action.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const values = parameter.recursiveUnpack();
		if (!Array.isArray(values))
			throw new Error;

		if (!builder)
			throw new Error('copy-text.copy-text with raw string value is not yet supported');

		const str = /** @type {string | null} */(get_value_from_formatting_string(values[0], builder));
		if (str === null) throw new Error;

      	const display = Gdk.Display.get_default();
      	if (display === null) return;
      	const val = new GObject.Value();
      	val.init(GObject.TYPE_STRING);
      	val.set_string(str);
      	display.get_clipboard().set_content(Gdk.ContentProvider.new_for_value(val));
      	toaster()?.add_toast(new Adw.Toast({
      		title: _('Copied to clipboard'),
      		timeout: TOAST_TIMEOUT_SHORT,
      	}));
	});
	action_group.add_action(action);

	provider.insert_action_group('copy-text', action_group);
}
