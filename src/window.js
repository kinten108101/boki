import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

/**
 * @param {Gtk.Application} application
 **/
export function Window(application) {
	const builder = new Gtk.Builder();
	GObject.type_ensure(Adw.Window.$gtype);
	builder.add_from_resource('/com/github/kinten108101/Boki/ui/window.ui');
	const window = /** @type {Gtk.Window | null} */ (builder.get_object('window'));
	if (!window) throw new Error;
	window.set_application(application);
	return window;
}
