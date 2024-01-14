import Gtk from 'gi://Gtk';

/**
 * @typedef {import('@girs/adw-1').default} Adw
 */

/**
 * @typedef {{
 * connect: {
 *   (signal: 'begin-swipe', callback: (object: SwipeTracker) => void): number;
 *   (signal: 'update-swipe', callback: (object: SwipeTracker, delta: number) => void): number;
 * };
 * emit: {
 *   (signal: 'begin-swipe'): void;
 *   (signal: 'update-swipe', delta: number): void;
 * }
 * } & SharedSignalMethods} SwipeTracker
 */

/**
 * @returns {import('@girs/gjs').SignalMethods}
 */
const createSignalMethods = () => {
	const obj = {};
	imports.signals.addSignalMethods(obj);
	// @ts-expect-error
	return obj;
};

/**
 * I didn't know how to use {@link Adw.SwipeTracker} so I made this, which uses {@link Gtk.EventControllerScroll} as backend.
 *
 * @param {Gtk.Widget} widget
 * @param {Gtk.Orientation} direction
 * @returns {SwipeTracker}
 */
export const CustomSwipeTracker = (widget, direction) => {
	/** @type {SwipeTracker} */
	const signals = createSignalMethods();

	let delta = 0;

	const scroller = new Gtk.EventControllerScroll();
	scroller.set_flags(
		Gtk.EventControllerScrollFlags.KINETIC |
			Gtk.EventControllerScrollFlags.VERTICAL,
	);
	scroller.connect("scroll-begin", (_object) => {
		signals.emit("begin-swipe");
	});
	scroller.connect("scroll", (_object, dx, dy) => {
		delta = direction === Gtk.Orientation.HORIZONTAL ? dx : dy;
		signals.emit('update-swipe', delta);
	});
	widget.add_controller(scroller);

	return signals;
}
