const { Error: GError } = imports.gi.GLib;
const { dialog_error_quark, DialogError, FileDialog, Window } = imports.gi.Gtk;

/**
 * @typedef {Error | GError['prototype']} ErrorType
 */

/**
 * A helper component for creating Promise wrappers for asynchronous presentation methods
 * in some window implementations. The goal is to help implement methods similar
 * to {@link FileDialog.open} or {@link FileDialog.save}.
 *
 * This component should be saved in the windowing object.
 * When the object's presentation method is invoked, the method should call
 * {@link WindowPromiser.promise} and return the resulting promise to the client. This
 * promise can then be remote-controlled via {@link WindowPromiser.resolve} and
 * {@link WindowPromiser.reject} respectively.
 *
 * You can run the below example in Workbench to try out this API.
 *
 * @example
 * import Gtk from 'gi://Gtk';
 * import Adw from 'gi://Adw';
 *
 * const InputDialog = () => {
 *     const promiser = WindowPromiser();
 *
 *     const window = new Adw.Window();
 *     window.set_modal(true);
 *     window.set_default_size(400, 400);
 *
 *     const start_button = new Gtk.Button();
 *     start_button.set_label('Start');
 *     start_button.set_halign(Gtk.Align.CENTER);
 *     start_button.set_valign(Gtk.Align.CENTER);
 *     start_button.add_css_class('pill');
 *     start_button.add_css_class('suggested-action');
 *     start_button.connect('clicked', () => {
 *         promiser.resolve(1);
 *         window.close();
 *     });
 *     window.set_content(start_button);
 *
 *     const input = (parent_window) => {
 *         window.set_transient_for(parent_window);
 *         return promiser.promise(window);
 *     };
 *
 *     return {
 *         input,
 *     }
 * };
 *
 * const window = workbench.window;
 *
 * const run = async () => {
 *     const dialog = InputDialog();
 *     const value = await dialog.input(window);
 *     console.log(value);
 * };
 *
 * run().catch(logError);
 *
 * @template {any} T
 */
const WindowPromiser = () => {
	const signals = (() => {
		const obj = {};
		imports.signals.addSignalMethods(obj);
		return (
			/**
			 * @type {{
			 * 	connect: {
			 * 		(signal: "resolve", handler: (obj: never, value: T) => void): number;
			 * 		(signal: "reject", handler: (obj: never, reason: ErrorType) => void): number;
	  		 * 	},
	  		 * 	emit: {
			 * 		(signal: "resolve", value: T): void;
			 * 		(signal: "reject", reason: ErrorType): void;
	  		 * 	}
			 * } & import('@girs/gjs').SignalMethods}
			 */
			(obj)
		);
  	})();

	/**
	 * @param {Window['prototype']} window
	 */
	const promise = (window) => {
		/**
		 * @type {Promise<T>}
		 */
		const promise = new Promise((_resolve, _reject) => {
			const handleCloseWindow = window.connect('close-request', () => {
				windowCloseReject();
			});
			const handleResolve = signals.connect('resolve', (_obj, value) => {
				window.disconnect(handleCloseWindow);
				signals.disconnect(handleResolve);
				signals.disconnect(handleReject);
				_resolve(value);
			});
			const handleReject = signals.connect('reject', (_obj, reason) => {
				window.disconnect(handleCloseWindow);
				signals.disconnect(handleResolve);
				signals.disconnect(handleReject);
				_reject(reason);
			});
		});
		window.present();
		return promise;
	}

	const windowCloseReject = () => {
		const error = new GError(
		  dialog_error_quark(), DialogError.DISMISSED, 'Dialog dismissed');
		console.debug('<<windowCloseReject>>');
		console.debug('If this is called multiple times, then there\'s a bug somewhere. Help me find it!');
		reject(error);
	}

	/**
	 * @param {T} value
	 */
	const resolve = (value) => {
		return signals.emit('resolve', value);
	};

	/**
	 * @param {ErrorType} reason
	 */
	const reject = (reason) => {
		return signals.emit('reject', reason);
	};

	return {
	  	promise,
	  	windowCloseReject,
	  	resolve,
	  	reject,
	};
};

export { WindowPromiser };
