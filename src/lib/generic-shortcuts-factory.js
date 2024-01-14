import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import GenericShortcuts from './generic-shortcuts.js';
import { ShortcutLabel } from './stvpk-shortcut-label.js';

/**
 * @typedef {{
 * resource: string | null,
 * output: 'gtk_shortcuts' | 'adw_preferences',
 * }} FactoryIfaceProperties
 */

/**
 * @typedef {FactoryIfaceProperties & typeof Factory.prototype} FactoryIface
 */

const Factory = GObject.registerClass({
	GTypeName: 'GenericShortcutsFactory',
	Properties: {
		resource: GObject.ParamSpec.string(
			'resource', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
		output: GObject.ParamSpec.string(
			'output', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
	},
}, class extends Adw.Bin {

	/**
	 * @this FactoryIfaceProperties
	 */
	constructor(params = {}) {
		super(params);
		if (this.resource === null
			|| this.output === null) {
			throw new Error;
		}
		// @ts-expect-error
		this._call_methods();
	}

	/**
	 * @this FactoryIface
	 */
	_call_methods() {
		const builder = Gtk.Builder.new_from_resource(this.resource);

		// TODO(kinten): Use current object?

		const root = /** @type {GenericShortcuts['Section']['prototype'] | null} */ (builder.get_object('root'));
		if (!root) throw new Error;

		const widget = this._create_widget(root);
		if (!widget) throw new Error;

		this.set_child(widget);
	}

	/**
	 * @param {GenericShortcuts['Section']['prototype']} section
	 * @this FactoryIface
	 */
	_create_widget(section) {
		switch (this.output) {
		case 'adw_preferences':
			return this._create_adw_preferences(section);
		case 'gtk_shortcuts':
			return this._create_gtk_shortcuts(section);
		default:
			return null;
		}
	}

	/**
	 * @param {GenericShortcuts['Section']['prototype']} section
	 */
	_create_adw_preferences(section) {
		const adw_prefpage = new Adw.PreferencesPage();
		section.get_child_nodes().forEach(x => {
			if (!(x instanceof GenericShortcuts.Group)) return;
			const { title } = x;
			const group = new Adw.PreferencesGroup({
				title,
			});
			x.get_child_nodes().forEach(y => {
				if (!(y instanceof GenericShortcuts.Shortcut)) return;
				const { title, action_name, accelerator } = y;
				const row = new Adw.ActionRow({
					title,
				});
				const label = new ShortcutLabel({
					action_name,
					accelerator,
				});
				label.set_valign(Gtk.Align.CENTER);
				row.add_suffix(label);
				group.add(row);
			});
			adw_prefpage.add(group);
		});
		return adw_prefpage;
	}

	/**
	 * @param {GenericShortcuts['Section']['prototype']} section
	 */
	_create_gtk_shortcuts(section) {
		const gtk_shortcuts = new Gtk.ShortcutsSection();
		section.get_child_nodes().forEach(x => {
			if (!(x instanceof GenericShortcuts.Group)) return;
			const { title } = x;
			const group = new Gtk.ShortcutsGroup({
				title,
			});
			x.get_child_nodes().forEach(y => {
				if (!(y instanceof GenericShortcuts.Shortcut)) return;
				const { title, action_name, accelerator } = y;
				const row = new Gtk.ShortcutsShortcut({
					title,
					action_name,
				});
				if (accelerator) row.accelerator = accelerator;
				group.append(row);
			});
			gtk_shortcuts.append(group);
		});
		return gtk_shortcuts;
	}
});

/**
 * @template {{}} IfaceType
 * @template {typeof GObject.Object} OriginalKlassType
 * @typedef {{ new(...params: ConstructorParameters<OriginalKlassType>): IfaceType; prototype: IfaceType } & OriginalKlassType} ClassFromConstructor
 */

export default {
	/**
	 * Example use case of the {@link GenericShortcuts} API.
	 */
	Factory: /** @type {ClassFromConstructor<FactoryIfaceProperties, typeof Factory>} */(/** @type {unknown} */(Factory)),
}
