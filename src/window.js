import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Soup from 'gi://Soup';
import { gettext as _ } from "gettext";

import { useFile } from './lib/file.js';
import { DynamicToaster } from './lib/dynamic-toaster.js';
import { useCopyText } from './lib/copy-text.js';
import { useMessage } from './lib/message.js';
import { useToasterProvider, toaster } from './lib/toaster-provider.js';
import { sequence, sync_create } from './lib/functional.js';
import { TOAST_TIMEOUT_SHORT } from './lib/gtk.js';

import { Steamworks } from './services/steamworks.js';
import { MakeCompatPango, MakeTitleCompat } from './utils/markup.js';
import { DownloadOrder } from './services/download.js';
import { bytes2humanreadable, expand_path, retract_path } from './utils/files.js';
import { DbServiceErrorEnum, db_service_error_quark } from './utils/error.js';
import { HistoryItem } from './services/history.js';
import { history } from './application.js';

const g_list_box_bind_model =
/**
 * @type {{
 *                        (list_box: Gtk.ListBox, model: Gio.ListModel,                                             widget_create_func: (item: GObject.Object) => Gtk.Widget): () => void;
 *   <T extends any = any>(list_box: Gtk.ListBox, model: { model: Readonly<T[]>, signals: ListModelSignalMethods }, widget_create_func: (item: T) => Gtk.Widget): () => void;
 * }}
 */
 ((list_box, model, widget_create_func) => {
	if (model instanceof Gio.ListModel) {
		list_box.bind_model(model, widget_create_func);
		return () => {};
	}

	// NOTE(kinten): It's good practice to remove any existing rows.
	// Also, in our app, there are placeholder rows in the list
	list_box.remove_all();
	sequence(model.model.length).forEach(x => {
		const item = model.model[x];
		list_box.append(widget_create_func(item));
	});

	const using_items_changed = model.signals.connect('items-changed',
		/**
		 * @param {never} _obj
		 * @param {number} position
		 * @param {number} removed
		 * @param {number} added
		 */
		(_obj, position, removed, added) => {
			sequence(removed).forEach(() => {
				list_box.remove(list_box.get_row_at_index(position));
			});
			sequence(added).forEach(x => {
				const item = model.model[x];
				list_box.append(widget_create_func(item));
			});
		}
	);

	return () => {
		model.signals.disconnect(using_items_changed);
	};
});

/**
 * @param {Gtk.Builder} builder
 * @param {Readonly<typeof HistoryItem.prototype[]>} history_model
 * @param {ListModelSignalMethods} signals
 */
const HistoryPage = (builder, history_model, signals) => {
	const history_list = /** @type {Gtk.ListBox | null} */ (builder.get_object('history_list'));
	if (!history_list) throw new Error;

	const bind_cleanup = g_list_box_bind_model(history_list, { model: history_model, signals }, item => {
		const builder = Gtk.Builder.new_from_resource('/com/github/kinten108101/Boki/ui/history-row.ui');
		const row = /** @type {Adw.ActionRow | null} */ (builder.get_object('row'));
		if (!row) throw new Error;
		useCopyText(row, builder);
		row.set_title(MakeCompatPango(item.display_name));
		row.set_subtitle(MakeCompatPango(item.steam_url.to_string() || ''));

		const show_in_folder = /** @type {Gtk.Button | null} */ (builder.get_object('show_in_folder'));
		if (!show_in_folder) throw new Error;

		show_in_folder.connect('clicked', () => {
			// TODO(kinten): Check hash for file identity?
			if (!item.saved_location.query_exists(null)) {
				toaster()?.add_toast(new Adw.Toast({
					title: _('File was moved or deleted'),
					timeout: TOAST_TIMEOUT_SHORT,
				}));
				return;
			}
			const folder = item.saved_location.get_parent();
			if (folder === null || (folder !== null && !folder?.query_exists(null))) {
				toaster()?.add_toast(new Adw.Toast({
					title: _('Cannot open folder'),
					timeout: TOAST_TIMEOUT_SHORT,
				}));
				return;
			}
			Gtk.show_uri(null, folder.get_uri() || '', Gdk.CURRENT_TIME);
		});

		return row;
	});

	const history_content_stack = /** @type {Gtk.Stack | null} */ (builder.get_object('history_content_stack'));
	if (!history_content_stack) throw new Error;

	const using_items_changed = signals.connect('items-changed', sync_create(() => {
		if (history_model.length > 0) {
			history_content_stack.set_visible_child_name('default');
		} else {
			history_content_stack.set_visible_child_name('empty');
		}
	}));

	return {
		cleanup: () => {
			bind_cleanup();
			signals.disconnect(using_items_changed);
		}
	};
};

/**
 * @param {Gtk.Builder} builder
 * @param {Adw.NavigationView} navigation_stack
 */
const ProgressPage = (builder, navigation_stack) => {
	const running_bar = /** @type {Gtk.ProgressBar | null} */ (builder.get_object('running_bar'));
	if (!running_bar) throw new Error;

	const progress_page_status_stack = /** @type {Gtk.Stack | null} */ (builder.get_object('progress_page_status_stack'));
	if (!progress_page_status_stack) throw new Error;

	/**
	 * @type {{
	 * (name: 'running-prepare', arg1: undefined): void;
	 * (name: 'running-percent', fraction: number): void;
	 * (name: 'finished', arg1: Gio.File): void;
	 * (name: 'cancelled', arg1: undefined): void;
	 * (name: 'error', msg: string): void;
	 * }}
	 */
	const set_state = (name, arg1) => {
		switch (name) {
		case 'running-prepare':
			progress_page_status_stack.set_visible_child_name('running');
			running_bar.set_fraction(0);
			running_bar.set_text(_('Loading...'));
			break;
		case 'running-percent':
			const num = Math.fround((/** @type {number} */(arg1)) * 100);
			progress_page_status_stack.set_visible_child_name('running');
			running_bar.set_fraction((/** @type {number} */(arg1)));
			running_bar.set_text(`${Math.trunc(num)}.${String(num % 1).substring(2, 4).padEnd(2, '0')}%`);
			break;
		case 'finished':
			navigation_stack.pop_to_tag('home');
			toaster()?.add_toast(new Adw.Toast({
				title: _('Finished downloading'),
				button_label: _('Open in Explorer'),
				action_name: 'file.explore',
				action_target: GLib.Variant.new_tuple([GLib.Variant.new_string(/** @type {Gio.File} */(arg1).get_path() || '')]),
			}));
			break;
		case 'cancelled':
			navigation_stack.pop();
			toaster()?.add_toast(new Adw.Toast({
				title: _('Download cancelled'),
			}));
			break;
		case 'error':
			console.debug('progress-page', 'error:', arg1);
			navigation_stack.pop();
			toaster()?.add_toast(new Adw.Toast({
				title: _('An error occurred'),
			}));
			break;
		default:
			throw new Error;
		}
	};

	return {
		running_bar,
		progress_page_status_stack,
		set_state,
	};
};

/**
 * @param {Gtk.Builder} builder
 */
const PreviewPage = (builder) => {
	const _addon_name = /** @type {Gtk.Label | null} */ (builder.get_object('addon_name'));
	if (!_addon_name) throw new Error;

	const _creator = /** @type {Gtk.Label | null} */ (builder.get_object('creator'));
	if (!_creator) throw new Error;

	const _excerpt = /** @type {Gtk.Label | null} */ (builder.get_object('excerpt'));
	if (!_excerpt) throw new Error;

	const _size = /** @type {Adw.ActionRow | null} */ (builder.get_object('size'));
	if (!_size) throw new Error;

	const set_location_row = /** @type {Adw.ActionRow | null} */ (builder.get_object('set_location_row'));
	if (!set_location_row) throw new Error;

	const set_location_error = /** @type {Gtk.Label | null} */ (builder.get_object('set_location_error'));
	if (!set_location_error) throw new Error;

	const _download_button = /** @type {import('./widgets/spinning-button.js').SpinningButton | null} */ (builder.get_object('download_button'));
	if (!_download_button) throw new Error;

	const set_location_dialog = /** @type {Gtk.FileDialog | null} */ (builder.get_object('set_location_dialog'));
	if (!set_location_dialog) throw new Error;

	const saved_location_buffer = {
		signals: (() => {
			const obj = {};
			imports.signals.addSignalMethods(obj);
			return (/** @type {import("@girs/gjs").SignalMethods} */(obj));
		})(),
		/** @type {Gio.File | null} */
		_val: null,
		get current() {
			return this._val;
		},
		/** @param {Gio.File | null} val */
		set current(val) {
			this._val = val;
			this.signals.emit('changed');
		}
	};

	/** @type {boolean | undefined} */
	let prev_error_responded = undefined;

	/**
	 * @param {boolean} error_responded
	 */
	const _update_error_responded = (error_responded) => {
		if (prev_error_responded === error_responded) return;
	    prev_error_responded = error_responded;
	    if (error_responded) {
	      _download_button.sensitize();
	    } else {
	      _download_button.insensitize();
	    }
	}

    saved_location_buffer.signals.connect('changed', () => {
      _update_error_responded(true);
    });

    /**
     * @param {string} error
     */
	const set_error = (error) => {
		if (error === '') {
			set_location_row.remove_css_class('error');
	      	set_location_error.set_label('');
		} else {
			set_location_row.add_css_class('error');
	      	set_location_error.set_label(error);
      		_update_error_responded(false);
		}
	};

	const on_saved_location_changed = () => {
		const file = saved_location_buffer.current;
		let text = file?.get_path();
		if (text === null || text === undefined) {
			text = _('Select Location');
		} else {
			text = retract_path(text);
		}
		set_location_row.set_subtitle(text);
	};

	saved_location_buffer.signals.connect('changed', on_saved_location_changed);
	on_saved_location_changed();

	/**
	 * @param {string} addon_name
	 * @param {string} creator
	 * @param {string} excerpt
	 * @param {number} size
	 */
	const present_item = (addon_name, creator, excerpt, size) => {
		_addon_name.set_label(MakeTitleCompat(addon_name));
		_creator.set_label(creator);
		_excerpt.set_label(MakeCompatPango(excerpt));
		_size.set_subtitle(bytes2humanreadable(size));
	};

	/**
	 * @param {boolean} val
	 */
	const set_loading = val => {
		_download_button.is_spinning = val;
	};

	const resolve_error = () => {
		set_error('');
	};

	return {
		present_item,
		set_loading,
		set_error,
		resolve_error,
		saved_location_buffer,
		set_location_dialog,
	};
};

/**
 * @param {Gtk.Builder} builder
 */
const UrlPage = (builder) => {
	const signals = /** @type {{
		connect: {
			(sigName: 'error', callback: ($obj: any) => void): number;
			(sigName: 'error-responded', callback: ($obj: any) => void): number;
			(sigName: 'loading', callback: ($obj: any) => void): number;
		};
		emit: {
			(sigName: 'error'): void;
			(sigName: 'error-responded'): void;
			(sigName: 'loading'): void;
		}
	} & import("@girs/gjs").SignalMethods} */ ({});
	imports.signals.addSignalMethods(signals);

	const url_bar = /** @type {Adw.EntryRow | null} */ (builder.get_object('url_bar'));
	if (!url_bar) throw new Error;

	const msg = /** @type {Gtk.Label | null} */ (builder.get_object('msg'));
	if (!msg) throw new Error;

	const validate_button = /** @type {import('./widgets/spinning-button.js').SpinningButton | null} */ (builder.get_object('validate_button'));
	if (!validate_button) throw new Error;

	let error = '';
	let error_responded = true;
	let loading = false;

	url_bar.bind_property_full(
      'text', validate_button, 'action-target',
      GObject.BindingFlags.SYNC_CREATE,
      /**
       * @param {string | null} from
       * @returns {[boolean, GLib.Variant]}
       */
      (_binding, from) => {
        if (from === null) return [true, GLib.Variant.new_string('')];
        return [true, GLib.Variant.new_string(from)];
      },
      () => {});

	const _update_error_responded = () => {
	    if (error_responded) {
	      validate_button.sensitize();
	    } else {
	      validate_button.insensitize();
	    }
	}

	signals.connect('error-responded', _update_error_responded);

    signals.connect('error', () => {
      if (error === '') return;
      error_responded = false;
      signals.emit('error-responded');
    });

    url_bar.connect('notify::text', () => {
      error_responded = true;
      signals.emit('error-responded');
    });

    const _update_error_state = () => {
	    if (error === '') {
	      url_bar.remove_css_class('error');
	      msg.set_label('');
	    } else {
	      url_bar.add_css_class('error');
	      msg.set_label(error);
	    }
	}

    signals.connect('error', _update_error_state);

    const _update_loading = () => {
	    validate_button.is_spinning = loading;
	}

    signals.connect('loading', _update_loading);
    _update_loading();

	/**
	 * @param {string} val
	 */
	const set_url = (val) => {
	    url_bar.set_text(val);
	    url_bar.grab_focus();
	};

	/**
	 * @param {string} msg
	 */
	const set_error = (msg) => {
		error = msg;
		signals.emit('error');
	};

	/**
	 * @param {boolean} val
	 */
	const set_loading = (val) => {
		loading = val;
		signals.emit('loading');
	}

	const resolve_error = () => {
		error = '';
		signals.emit('error');
	};

	return {
		set_url,
		set_error,
		set_loading,
		resolve_error,
	};
};

const Downloader = () => {
	/** @type {import('./services/download.js').DownloadOrder | null} */
	let current_order = null;

	return {
		/** @type {import('./services/download.js').DownloadOrder | null} */
		current_order,
	};
};

export const SingletonBuilder = GObject.registerClass({}, class extends Gtk.Builder {
	/** @type {Gtk.Builder | null} */
	static _instance = null;

	static get_instance() {
		return this._instance;
	}

	constructor(params = {}) {
		super(params);
		SingletonBuilder._instance = this;
	}
});

const Builder = SingletonBuilder;

/**
 * @param {Gtk.Application} application
 * @param {Gio.Settings} settings
 **/
export function Window(application, settings) {
	const builder = new Builder();
	GObject.type_ensure(Adw.Window.$gtype);
	builder.add_from_resource('/com/github/kinten108101/Boki/ui/window.ui');

	const window = /** @type {Gtk.ApplicationWindow | null} */ (builder.get_object('window'));
	if (!window) throw new Error;
	window.set_application(application);

	if (globalThis.is_devel) {
		window.add_css_class('devel');
	}

	const navigation_stack = /** @type {Adw.NavigationView | null} */ (builder.get_object('navigation_stack'));
	if (!navigation_stack) throw new Error;

	useToasterProvider(window, DynamicToaster(() => {
		const child = navigation_stack.get_visible_page()?.get_child();
		if (!child) throw new Error;
		return child;
	}));

	// @ts-expect-error
	window.builder = builder;

	const history_page = HistoryPage(builder, history, history);

	const url_page = UrlPage(builder);

	const preview_page = PreviewPage(builder);

	const progress_page = ProgressPage(builder, navigation_stack);

	useCopyText(window, builder);

	const { output_signals: file_pick_signals } = useFile(window, builder, window);

	file_pick_signals.connect('changed::set-location', (_obj, _key, file) => {
		preview_page.saved_location_buffer.current = file;
	});

	const [, message_signals] = useMessage(window, builder, window);

	const session = new Soup.Session();

	const cancellable_ref = {
		current: new Gio.Cancellable(),
	};

	const db = Steamworks(session, cancellable_ref);

	const downloader = Downloader();

	const updateUrlBarContent = async () => {
		const display = Gdk.Display.get_default();
		if (display === null) {
			console.debug('no display');
			return false;
		}
		/** @type {string | null} */
		let url;
		try {
			url = await display.get_clipboard().read_text_async(null);
		} catch (error) {
			if (error instanceof GLib.Error && error.matches(Gio.io_error_quark(), Gio.IOErrorEnum.NOT_FOUND)) {
				console.debug('Clipboard is empty');
			} else if (error instanceof GLib.Error && error.matches(Gio.io_error_quark(), Gio.IOErrorEnum.NOT_SUPPORTED)) {
				console.debug('Clipboard content is not text');
			} else {
				logError(error);
			}
			return false;
		}
		if (url === null) {
			console.debug('no value inside gvalue')
			return false;
		}

		url_page.set_url(url);
		return true;
	}

	navigation_stack.connect('pushed', ($obj) => {
		const tag = $obj.get_visible_page()?.get_tag();
		if (tag === 'url') {
			updateUrlBarContent().catch(logError);
			url_page.resolve_error();
		} else if (tag === 'preview') {
			preview_page.resolve_error();
		}
	});

	/**
	 * @param {string} url
	 */
	const on_validate = (url) => {
		const on_exit = () => {
	    	url_page.set_loading(false);
	    };

	    (async () => {
	      	url_page.set_loading(true);
	    	url_page.resolve_error();
	    	const item = await db.fetch_item(url);
	    	if (item === null) {
	    	  	on_exit();
	    	  	return;
	    	}
	    	console.debug('item:', item);
	    	const author = await db.fetch_author_name(item['creator']);
	    	downloader.current_order = new DownloadOrder(
	    		item['file_url'],
	    		item['file_size'],
	    		'',
	    		session,
	    		{
	    			...item,
	    			request_url: url,
	    		});
	    	preview_page.present_item(
	    		item['title'],
	    		author,
	    		item['description'],
	    		item['file_size']
	    	);

			preview_page.set_location_dialog.set_initial_name((() => {
				const raw = item['filename'] || '';
				if (raw === '') return '';
				const name = Gio.File.new_for_path(raw).get_basename();
				if (!name) return '';
				return name;
			})());

	    	let default_dir_raw = settings.get_string('download-directory');
	    	if (default_dir_raw === null || default_dir_raw === '') {
	    		const default_dir = Gio.File.new_for_path(GLib.get_home_dir());
	    		preview_page.set_location_dialog.set_initial_folder(default_dir);
	    		preview_page.saved_location_buffer.current = null;
	    	} else {
	    		const default_dir = Gio.File.new_for_path(expand_path(default_dir_raw));
				preview_page.set_location_dialog.set_initial_folder(default_dir);
		    	preview_page.saved_location_buffer.current = default_dir.get_child(item['filename']);
	    	}

	    	navigation_stack.push_by_tag('preview');
	    })()
	    	.catch(error => {
	    		if (error instanceof GLib.Error && error.matches(db_service_error_quark(), DbServiceErrorEnum.IdNotDecimal)) {
	    			url_page.set_error(_('Could not identify a Workshop item with this URL. Make sure that the URL follows the format of \"https://steamcommunity.com/sharedfiles/filedetails/?id=X\".'));
	    		} else if (error instanceof GLib.Error
	    			&& (
	    				error.matches(Gio.resolver_error_quark(), Gio.ResolverError.NOT_FOUND)
	    				|| error.matches(Gio.resolver_error_quark(), Gio.ResolverError.TEMPORARY_FAILURE)
	    				)
	    		) {
	    			url_page.set_error(_('Could not connect to the internet. Make sure that internet access is available and allowed for this application.'));
	    		} else if (error instanceof Error && error.message.includes('Expected type string for argument \'uri_string\'')) {
	    			url_page.set_error(_('Could not detect an associated file for this Workshop item.'));
	    		} else if (error instanceof GLib.Error && error.matches(GLib.uri_error_quark(), GLib.UriError.FAILED)) {
	    			url_page.set_error(_('This Steam Workshop item has no associated file.'));
	    		} else {
	    			url_page.set_error(`${_('An error occurred')}: \"${error}\"`);
	    			console.debug(error);
	    		}
	    		if (error instanceof GLib.Error) {
	    			console.debug('domain:', GLib.quark_to_string(error.domain));
	    			console.debug('code:', error.code);
	    		}
	    	})
		    .finally(() => {
		    	on_exit();
		    });
	};

	const url_validate = new Gio.SimpleAction({
		name: 'url-validate',
		parameter_type: GLib.VariantType.new('s'),
	});
	url_validate.connect('activate', (_action, parameter) => {
		if (!parameter) throw new Error;
		const [val] = parameter.get_string();
		if (val === null) throw new Error;
		on_validate(val);
	});
	window.add_action(url_validate);

	const on_download = () => {
		const saved_location = preview_page.saved_location_buffer.current;
		if (!(saved_location?.get_path())) {
			preview_page.set_error(_('Must specify a location to save.'));
			return;
		}

		const order = downloader.current_order;
    	if (order === null) throw new Error;

    	order.saved_location = saved_location;

      	preview_page.set_loading(true);
    	preview_page.resolve_error();

    	progress_page.set_state('running-prepare', undefined);

    	const announcer = setInterval(() => {
    		const val = order.get_percentage();
	    	console.debug('Progress:', val);
	    	progress_page.set_state('running-percent', val);
	    }, 100);

	    order.connect('completed', (/** @type {typeof DownloadOrder.prototype} */ obj) => {
	    	// @ts-expect-error
      	  	announcer.destroy();
      	  	const parent = obj.saved_location.get_parent();
      	  	if (!parent) throw new Error;
      	  	progress_page.set_state('finished', parent);
      	  	history.add({
	    		display_name: order.steam_response['title'],
	    		steam_url: GLib.Uri.parse(order.steam_response['request_url'], GLib.UriFlags.NONE),
	    		saved_location: order.saved_location,
	    	}).catch(logError);
      	  	console.debug('Download completed');
	    });

		const on_exit = () => {
	    	preview_page.set_loading(false);
	    };

	    (async () => {
		    if (order.is_stopped()) {
		    	await order.reset();
		    }

		    order.start()
			    .catch(error => {
		    		console.debug("shit");
		    		// @ts-expect-error
		    		announcer.destroy();
		    		if (error instanceof GLib.Error && error.matches(Gio.io_error_quark(), Gio.IOErrorEnum.CANCELLED)) {
		    			progress_page.set_state('cancelled', undefined);
		    		} else {
		    			progress_page.set_state('error', String(error));
		    		}
		    		order.cleanup().catch(logError);
		    	});

	    	navigation_stack.push_by_tag('progress');
	    })()
	    	.catch(error => {
	    		preview_page.set_error(`${_('An error occurred')}: \"${error}\"`);
	    	})
		    .finally(() => {
		    	on_exit();
		    });
	};

	const download = new Gio.SimpleAction({
		name: 'download',
	});
	download.connect('activate', () => {
		on_download();
	});
	window.add_action(download);

	message_signals.connect('response::cancel-download', (_obj, _key, response) => {
		switch (response) {
		case 'cancel':
		default:
			return;
		case 'stop':
			break;
		}
		downloader.current_order?.stop();
	});

	const download_return = new Gio.SimpleAction({
		name: 'return',
	});
	download_return.connect('activate', () => {
		navigation_stack.pop_to_tag('home');
	});
	window.add_action(download_return);

	window.connect('close-request', () => {
		history_page.cleanup();
		return false;
	});

	return { window, navigation_stack };
}
