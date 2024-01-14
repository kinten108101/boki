import _Adw from 'gi://Adw';

import { extract_from_appdata } from './new_from_appdata.js';
import { application } from '../application.js';

/**
 * @param {string} resource_path
 * @param {string} release_version
 */
const new_from_appdata = (resource_path, release_version) => {
	const window = new _Adw.AboutWindow(extract_from_appdata(resource_path, release_version));

	return window;
};

const Adw = {
	..._Adw,
	AboutWindow: {
		..._Adw.AboutWindow,
		new_from_appdata,
	},
};

/**
 * @returns {AboutController}
 */
export const AboutWindowController = () => {
	const window = Adw.AboutWindow.new_from_appdata('/com/github/kinten108101/Boki/com.github.kinten108101.Boki.metainfo.xml', 'beta');

	const parent_window = application.get_active_window();
	if (parent_window) {
		window.set_transient_for(parent_window);
	}

	window.set_debug_info(`flatpak=${globalThis.is_built_for_flatpak}\n`);

	return {
		present: () => window.present(),
	};
};
