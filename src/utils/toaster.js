import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

/** @type {WeakMap<Gtk.Widget, Adw.ToastOverlay>} */
const toasters = new WeakMap;

/**
 * @param {Gtk.Widget} owner
 * @param {Adw.ToastOverlay} toaster
 */
export const useToasterProvider = (owner, toaster) => {
	toasters.set(owner, toaster);
};

/**
 * @param {Gtk.Widget} owner
 */
export const toaster = owner => {
	const provider = toasters.get(owner);
	return provider;
};
