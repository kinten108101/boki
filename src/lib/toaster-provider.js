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
 * @type {(() => (Gtk.Widget | null)) | null}
 */
let _resolver = null;

/**
 * @param {() => (Gtk.Widget | null)} resolver
 */
export const registerOwnerResolver = (resolver) => {
	_resolver = resolver;
}

export const toaster = () => {
	const owner = _resolver?.() || null;
	if (owner === null) return undefined;
	const provider = toasters.get(owner);
	return provider;
};
