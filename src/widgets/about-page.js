import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

/**
 * @typedef {import('@girs/adw-1').default} Adw
 */

import { application, navstack_map } from "../application.js";
import { extract_from_appdata } from './new_from_appdata.js';

/**
 * @returns {AboutController}
 */
export const AboutPageController = () => {
	const present = () => {
		const parent_window = application.get_active_window();
		if (!parent_window)
			throw new Error;

		const navigation_stack = navstack_map.get(parent_window);
		if (!navigation_stack)
			throw new Error;

		navigation_stack.push_by_tag('about');
	};

	return {
		present,
	};
};

/**
 * Implementation of {@link Adw.AboutWindow}'s content in an {@link Adw.NavigationPage}. Try to look as close to {@link Adw.AboutWindow} as possible, use CSS styles in the `about` namespace whenever possible.
 *
 * Since it's only internal, for now, data is taken directly from {@link extract_from_appdata}.
 *
 * @param {Gtk.Builder} builder
 */
export const AboutPage = (builder) => {
	const data = extract_from_appdata('/com/github/kinten108101/Boki/com.github.kinten108101.Boki.metainfo.xml', 'beta');

	const application_icon_image = /** @type {Gtk.Image | null} */ (builder.get_object('application_icon_image'));
	if (!application_icon_image) throw new Error;

	application_icon_image.set_from_icon_name(data.application_icon);
	//application_icon_image.add_css_class('rotate');

	const application_name_label = /** @type {Gtk.Label | null} */ (builder.get_object('application_name_label'));
	if (!application_name_label) throw new Error;

	application_name_label.bind_property_full(
		'label', application_name_label, 'visible',
		GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE,
		/**
		 * @param {string} from
		 * @returns [boolean, boolean]
		 */
		(_obj, from) => {
			return [true, from !== ''];
		},
		() => {});

	application_name_label.set_label(data.application_name);

	const developer_name_label = /** @type {Gtk.Label | null} */ (builder.get_object('developer_name_label'));
	if (!developer_name_label) throw new Error;

	developer_name_label.bind_property_full(
		'label', developer_name_label, 'visible',
		GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE,
		/**
		 * @param {string} from
		 * @returns [boolean, boolean]
		 */
		(_obj, from) => {
			return [true, from !== ''];
		},
		() => {});

	developer_name_label.set_label(data.developer_name);

	const version_button = /** @type {Gtk.Button | null} */ (builder.get_object('version_button'));
	if (!version_button) throw new Error;

	version_button.set_label(data.version);
};
