import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

/**
 * @typedef {{
 * 		is_spinning: boolean;
 *      sensitive_requests: number;
 *      spinner: Gtk.Spinner;
 *      _prev_is_spinning: boolean;
 *      sensitize(): void;
 *      insensitize(): void;
 * } & Gtk.Button} SpinningButton
 */

export const SpinningButton = GObject.registerClass({
	GTypeName: 'StvpkSpinningButton',
	Properties: {
		is_spinning: GObject.ParamSpec.boolean(
			'is-spinning', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			false),
		sensitive_requests: GObject.ParamSpec.uint(
			'sensitive-requests', '', '',
			GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
			0, 1024,
			0),
	},
}, class extends Gtk.Button {

	constructor(params = {}) {
		super({
			...params,
		});
		const _this = /** @type {SpinningButton} */ (/** @type {unknown} */ (this));
		this.spinner = new Gtk.Spinner({ spinning: true });
		this._prev_is_spinning = _this.is_spinning;
		this._update_spinning();
		this.connect('notify::is-spinning', this._update_spinning.bind(this));
		this._update_insensitize();
		this.connect('notify::sensitive-requests', this._update_insensitize.bind(this));
	}

	_update_insensitize() {
		if (this.sensitive_requests > 0) {
			this.set_sensitive(false);
		} else {
			this.set_sensitive(true);
		}
	}

	insensitize() {
		this.sensitive_requests++;
	}

	sensitize() {
		this.sensitive_requests = Math.max(0, this.sensitive_requests - 1);
	}

	_update_spinning() {
		const _this = /** @type {SpinningButton} */ (/** @type {unknown} */ (this));
		if (this._prev_is_spinning === _this.is_spinning) return;
		this._prev_is_spinning = _this.is_spinning;
		if (_this.is_spinning) {
			this.add_css_class('invisible-text');
			this.spinner.set_parent(this);
			this.insensitize();
			return;
		}
		this.remove_css_class('invisible-text');
		this.spinner.unparent();
		this.sensitize();
	}
});
