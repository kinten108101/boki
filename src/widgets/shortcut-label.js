import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Adw from 'gi://Adw';

import { sync_create } from '../lib/functional.js';

import { application } from '../application.js';

/**
 * @typedef {{
 * action_name: string | null;
 * accelerator: string | null;
 * child: Gtk.ShortcutLabel;
 * } & Adw.Bin} ShortcutLabelPrototype
 */

/**
 * Why can't {@link Gtk.ShortcutLabel} be like {@link Gtk.ShortcutsShortcut}? This custom implementation of {@link Gtk.ShortcutLabel} tries to rectify that.
 */
export const ShortcutLabel = GObject.registerClass({}, class extends Adw.Bin {
	static [GObject.GTypeName] = 'StvpkShortcutLabel';

	// @ts-expect-error
	static [GObject.properties] = {
		action_name: GObject.ParamSpec.string(
			'action-name', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
		accelerator: GObject.ParamSpec.string(
			'accelerator', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
	};

	/**
	 * @this {ShortcutLabelPrototype}
	 */
	constructor(params = {}) {
		const child = new Gtk.ShortcutLabel;
		super({
			child,
			...params,
		});
		this.connect('notify::action-name', sync_create(() => {
			if (this.action_name === null) return;
			const accels = application.get_accels_for_action(this.action_name);
			if (accels.length < 1) return;
			const accel = accels[0];
			if (accel === undefined) return;
			this.child.set_accelerator(accel);
		}));
		this.connect('notify::accelerator', sync_create(() => {
			if (this.accelerator === null) return;
			this.child.set_accelerator(this.accelerator);
		}));
	}
});
