import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup';

import { DefaultEncoder, read_json_bytes } from '../utils/files.js';
import { is_number_string } from '../utils/string.js';
import { DbServiceErrorEnum, db_service_error_quark } from '../utils/error.js';

const WEBAPI = '6169ADBAC88B2021C279E28693AEF6A9';

const URL_GPFD = GLib.Uri.parse('https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/', GLib.UriFlags.NONE);

/**
 * @param {string} url
 * @returns {string}
 */
const extract_workshop_ttem_id = (url) => {
    const idxParam = url.indexOf('?id=', 0);
    if (idxParam === undefined) {
      	throw new GLib.Error(
        	db_service_error_quark(),
        	DbServiceErrorEnum.IdNotFound,
        	`Could not extract id parameter from url \"${url}\"`);
    }

    let idxParamEnd = url.indexOf('&', idxParam);
    if (idxParamEnd === -1) idxParamEnd = idxParam + 14;

    const fileId = url.substring(idxParam + 4, idxParamEnd);
    if (!is_number_string(fileId)) {
      	throw new GLib.Error(
        	db_service_error_quark(),
        	DbServiceErrorEnum.IdNotDecimal,
        	`Supposed id parameter in url \"${url}\" is not in decimal format`);
    }
    return fileId;
}

/**
 * @param {any} playerDetails
 * @returns {string}
 */
const extract_author_name = playerDetails => {
	const personaname = playerDetails['personaname'];
    if (!(typeof personaname !== 'string' || personaname === ''))
      	return personaname;

    const profileurl = playerDetails['profileurl'];
    const idIdx = profileurl?.indexOf('/id/') || -1;
    const vanityId = profileurl?.substring(idIdx + 4, profileurl?.length - 1) || '';
    if (!(idIdx === -1 || is_number_string(vanityId))) // not vanityid found
      	return vanityId;

    const realname = playerDetails['realname'];
    if (!(typeof realname !== 'string' || realname === ''))
      	return realname;

    throw new GLib.Error(
    	db_service_error_quark(),
        DbServiceErrorEnum.NotFound,
        `Could not extract author name from response`);
}

/**
 * @param {Soup.Session} session
 * @param {{ current: Gio.Cancellable | null }} cancellable_ref
 */
export const Steamworks = (session, cancellable_ref) => {
	/**
	 * @param {string} url
	 * @returns A JSON response. If fails then NULL.
	 */
	const fetch_item = async (url) => {
		const steam_id = extract_workshop_ttem_id(url);

		const msg = new Soup.Message({
	    	method: 'POST',
	    	uri: URL_GPFD,
	    });
	    const requestBody = new GLib.Bytes(DefaultEncoder.encode(`itemcount=1&publishedfileids%5B0%5D=${steam_id}`));
	    msg.set_request_body_from_bytes(
	      	'application/x-www-form-urlencoded',
	      	requestBody,
	    );
	    const gbytes = await session.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, cancellable_ref?.current);
	    if (msg.status_code !== 200) {
	      	throw new GLib.Error(
	        	db_service_error_quark(),
	        	DbServiceErrorEnum.RequestNotSuccessful,
	        	`Request was not successful. Received a response status code of \"${msg.status_code}\"`);
	    }
	    const bytes = gbytes.get_data();
	    if (bytes === null) throw new Error;
	    const response = read_json_bytes(bytes);
	    const data = response['response']?.['publishedfiledetails']?.[0];
	    return data;
	};

	/**
	 * @param {string} user_id
	 */
	const fetch_author_name = async (user_id) => {
		const uri = GLib.Uri.parse(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${WEBAPI}&steamids=${user_id}`, GLib.UriFlags.NONE);

	    const msg = new Soup.Message({
	      	method: 'GET',
	      	uri,
	    });

	    const gbytes = await session.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null);
	    const bytes = gbytes.get_data();
	    if (msg.status_code !== 200) {
	      	throw new GLib.Error(
	        	db_service_error_quark(),
	        	DbServiceErrorEnum.RequestNotSuccessful,
	        	`Request was not successful. Received a response status code of \"${msg.status_code}\"`);
	    }
	    if (bytes === null) throw new Error;
	    const response = read_json_bytes(bytes);
	    const summary = response['response']?.['players']?.[0];
	    if (summary === undefined) throw new Error;
	    return extract_author_name(summary);
	}

	return {
		fetch_item,
		fetch_author_name,
	};
}
