import GLib from 'gi://GLib';
import { gettext as _ } from "gettext";

export const DefaultDecoder = new TextDecoder('utf8');
export const DefaultEncoder = new TextEncoder();

/**
 * @param {Uint8Array} bytes
 */
export function read_json_bytes(bytes) {
	const serial = DefaultDecoder.decode(bytes);
	const jsobject = JSON.parse(serial);
	return jsobject;
}

let fraction_symbol = _('fraction-symbol');
if (fraction_symbol === 'fraction-symbol') fraction_symbol = '.';

/**
 * @param {number} bytes
 * @returns {string}
 */
export function bytes2humanreadable(bytes) {
  const precision = 3;
  const kbs = bytes / 1000;
  if (bytes < 1000)
    return `${bytes} B`.replaceAll('.', fraction_symbol);

  const mbs = kbs / 1000;
  if (kbs < 1000)
    return `${kbs.toPrecision(precision)} KB`.replaceAll('.', fraction_symbol);

  const gbs = mbs / 1000;
  if (mbs < 1000)
    return `${mbs.toPrecision(precision)} MB`.replaceAll('.', fraction_symbol);

  return `${gbs.toPrecision(precision)} GB`.replaceAll('.', fraction_symbol);
}

/**
 * @param {string} path
 * @returns {string}
 */
export function expand_path(path) {
	return path.replace('~', GLib.get_home_dir());
}

/**
 * @param {string} path
 * @returns {string}
 */
export function retract_path(path) {
	return path.replace(GLib.get_home_dir(), '~');
}
