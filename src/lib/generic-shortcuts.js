/**
 * @namespace {GenericShortcuts}
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

const TreeNode = GObject.registerClass({
	GTypeName: 'GenericShortcutsTreeNode',
	Implements: [Gtk.Buildable],
},
/**
 * @implements {Gtk.Buildable}
 */
class extends GObject.Object {

	constructor(params = {}) {
		super(params);
		/** @type {(typeof TreeNode.prototype)[]} */
		this._child_nodes = [];
	}

	/**
	 * @param {Gtk.Builder} _builder
	 * @param {GObject.Object} child
	 * @param {string} _type
	 */
	vfunc_add_child(_builder, child, _type) {
		if (!(child instanceof TreeNode)) return;
		this._child_nodes.push(child);
	}

	/**
	 * @returns {Readonly<this['_child_nodes']>}
	 */
	get_child_nodes() {
		// @ts-expect-error
		return this._child_nodes;
	}
});

/**
 * @typedef {{
 * section_name: string | null;
 * title: string | null;
 * max_height: number;
 * } & typeof Section.prototype} GenericShortcutsSection
 */

const Section = GObject.registerClass({
	GTypeName: 'GenericShortcutsSection',
	Properties: {
		section_name: GObject.ParamSpec.string(
			'section-name', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
		title: GObject.ParamSpec.string(
			'title', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
		max_height: GObject.ParamSpec.uint(
			'max-height', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			1, 1028, 10),
	},
},
class extends TreeNode {

});

/**
 * @typedef {{
 * title: string | null;
 * } & typeof Group.prototype} GenericShortcutsGroup
 */

const Group = GObject.registerClass({
	GTypeName: 'GenericShortcutsGroup',
	Properties: {
		title: GObject.ParamSpec.string(
			'title', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
	},
},
class extends TreeNode {

});

/**
 * @typedef {{
 * title: string | null;
 * action_name: string | null;
 * accelerator: string | null;
 * } & typeof Shortcut.prototype} GenericShortcutsShortcut
 */

const Shortcut = GObject.registerClass({
	GTypeName: 'GenericShortcutsShortcut',
	Properties: {
		title: GObject.ParamSpec.string(
			'title', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
		action_name: GObject.ParamSpec.string(
			'action-name', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
		accelerator: GObject.ParamSpec.string(
			'accelerator', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			null),
	},
},
class extends TreeNode {
	static lol = 10;
});

/**
 * @template {{}} IfaceType
 * @template {typeof GObject.Object} OriginalKlassType
 * @typedef {{ new(...params: ConstructorParameters<OriginalKlassType>): IfaceType; prototype: IfaceType } & OriginalKlassType} ClassFromConstructor
 */

export default {
	/**
	 * Open skeletal building blocks for laying out content of a shortcuts view.
	 */
	Section: /** @type {ClassFromConstructor<GenericShortcutsSection, typeof Section>} */( /** @type {unknown} */ (Section)),
	/**
	 * Open skeletal building blocks for laying out content of a shortcuts view.
	 */
	Group: /** @type {ClassFromConstructor<GenericShortcutsGroup, typeof Group>} */( /** @type {unknown} */ (Group)),
	/**
	 * Open skeletal building blocks for laying out content of a shortcuts view.
	 */
	Shortcut: /** @type {ClassFromConstructor<GenericShortcutsShortcut, typeof Shortcut>} */( /** @type {unknown} */ (Shortcut)),
};


