// Enforce specific library version
import 'gi://Gdk?version=4.0';
import 'gi://Gtk?version=4.0';
import 'gi://Soup?version=3.0';

import { Application } from "./application.js";

export function main(/** @type {string[] | null} */ argv) {
	return Application().run(argv);
}
