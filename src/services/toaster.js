import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

/**
 *
 * Detect a toast overlay as context provider then send your toast there.
 *
 * Since we're not employing the functional component pattern, we must manually provide a strategy for retrieving the consumer widget from which we search for a context provider.
 *
 * @param {() => Gtk.Widget} get_current_child_func A handler to get the consumer widget from which the search for nearest begins.
 *
 * @returns A controller object that resembles a ToastOverlay except for the GObject parts.
 */
export const DynamicToaster = (
	get_current_child_func,
) => {
	/**
	 * @param {Adw.Toast} toast
	 */
	const add_toast = toast => {
		const child = get_current_child_func();
		if (!child) throw new Error;
		if (child instanceof Adw.ToastOverlay) {
			child.add_toast(toast);
			return;
		}
		const overlay = child.get_ancestor(Adw.ToastOverlay.$gtype);
		if (!overlay) throw new Error;
		(/** @type {Adw.ToastOverlay} */(overlay)).add_toast(toast);
	};

	return {
		add_toast,
	};
};
