import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import pjXML from "./lib/pjxml.js";
import { DefaultDecoder } from './utils/files.js';

/**
 * @param {string} resource_path
 * @param {string} release_version
 */
export function new_from_appdata(resource_path, release_version) {
	const appdata_file = Gio.File.new_for_uri('resource://' + resource_path);
	const [, bytes] = appdata_file.load_contents(null);
	const xml = DefaultDecoder.decode(bytes);
	const xmlTree = pjXML.parse(xml);

	const url_els = xmlTree.selectAll('/component/url');
	console.log(url_els);

	const window = new Adw.AboutWindow({
		application_icon: xmlTree.select('/component/id').content[0],
		application_name: xmlTree.select('/component/name').content[0],
		developer_name: xmlTree.select('/component/developer_name').content[0],
		version: release_version,
		website: url_els.filter(x => x.attributes.type === 'homepage')[0].content[0],
		issue_url: url_els.filter(x => x.attributes.type === 'bugtracker')[0].content[0],
		license_type: /** @type {Gtk.License} */(/** @type {unknown} */(Gtk.License[xmlTree.select('/component/project_license').content[0]])),
		developers: [`${xmlTree.select('/component/developer_name').content[0]} <${xmlTree.select('/component/update_contact').content[0]}>`],
		copyright: '© 2023 Kinten Le',
	});
	return window;
}
