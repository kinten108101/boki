import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup';

export class DownloadOrder extends GObject.Object {
  static {
	GObject.registerClass({
	  Signals: {
		'completed': {},
	  }
	}, this);
  }

  /** @type {string} */
  id;

  /** @type {Soup.Message} */
  msg;

  /** @type {number} */
  bytesread;

  /** @type {number?} */
  size;

  /** @type {Gio.InputStream | undefined} */
  input_stream;

  /** @type {Gio.Cancellable} */
  cancellable;

  /** @type {Soup.Session} */
  session;

  /** @type {GLib.Bytes[]} */
  gbytes;

  /** @type {Gio.File} */
  saved_location;

  /** @type {Gio.FileOutputStream | undefined} */
  output_stream;

  // this is temporary i swear
  /** @type {Gio.FileMonitor | undefined} */
  monitor;

  /** @type {Gio.Cancellable | undefined} */
  monitor_cancellable;

  /** @type {GLib.Uri} */
  uri;

  /**
   * @param {string} uri
   * @param {number?} size
   * @param {string} saved_location
   * @param {Soup.Session} session
   **/
  constructor(uri, size, saved_location, session) {
	super({});
	this.id = String(uri) + String(saved_location);
	this.uri = GLib.Uri.parse(uri, GLib.UriFlags.NONE);
	this.msg = new Soup.Message({ method: 'GET', uri: this.uri });
	this.size = size;
	this.bytesread = 0;
	this.cancellable = new Gio.Cancellable();
	const _path = Gio.File.new_for_path(saved_location);
	this.saved_location = _path;
	this.session = session;
	this.gbytes = [];
  }

  stop() {
	this.cancellable.cancel();
  }

  is_stopped() {
  	return this.cancellable.is_cancelled();
  }

  async reset() {
  	this.bytesread = 0;
	this.cancellable = new Gio.Cancellable();
	this.msg = new Soup.Message({ method: 'GET', uri: this.uri });
  }

  async request_download() {
	console.time('send-async');
	this.input_stream = await this.session.send_async(this.msg, GLib.PRIORITY_DEFAULT, this.cancellable);
	console.timeEnd('send-async');
	this.saved_location.get_parent()?.make_directory_with_parents(this.cancellable);
	this.output_stream = await this.saved_location.replace_async(null, false, Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, this.cancellable);
	console.debug(1);

	this.monitor_cancellable = new Gio.Cancellable;
	this.monitor = this.saved_location.monitor_file(Gio.FileMonitorFlags.NONE, this.monitor_cancellable);
	this.monitor.connect('changed', () => {
	  (async () => {
		let info;
		try {
		  info = await this.saved_location.query_info_async(Gio.FILE_ATTRIBUTE_STANDARD_SIZE, Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, this.cancellable);
		} catch (error) {
		  if (error instanceof GLib.Error) {
			if (error.matches(Gio.io_error_quark(), Gio.IOErrorEnum.CANCELLED)) { return; }
		  } else throw error;
		}
		if (info) this.bytesread = info.get_size();
	  })().catch(logError);
	});
  }

  async run() {
	if (this.input_stream === undefined) {
	  console.warn('Have not established downstream connection. Download aborted.');
	  return;
	}
	if (this.output_stream === undefined) {
	  console.warn('Have not established disk outputstream. Download aborted.');
	  return;
	}
	this.monitor_cancellable?.cancel();
	console.time('download');
	// FIXME(kinten):
	// This commented-out code section will lead to error for >300MB orders, sometimes less.
	// Error has to do with GC or something. A JS callback ran duing GC sweep, but which??
	// As a workaround, we can use splice but we don't control the retrieval of each chunk.
	// We monitor progress externally using a file monitor.
	// It's fucking bad.
	/*
	let size = 1;
	while (size !== 0) {
	  const gbytes = await this.input_stream.read_bytes_async(4096, GLib.PRIORITY_DEFAULT, this.cancellable);
	  size = await this.output_stream.write_bytes_async(gbytes, GLib.PRIORITY_DEFAULT, this.cancellable);
	  this.bytesread += size;
	}
	*/
	await this.output_stream.splice_async(this.input_stream, Gio.OutputStreamSpliceFlags.NONE, GLib.PRIORITY_DEFAULT, this.cancellable);
	console.debug(2);
	console.timeEnd('download');

  await this.input_stream.close_async(GLib.PRIORITY_DEFAULT, this.cancellable);
  await this.output_stream.flush_async(GLib.PRIORITY_DEFAULT, null);
  await this.output_stream.close_async(GLib.PRIORITY_DEFAULT, this.cancellable);
	console.debug('Download completed!');
	this.emit('completed');
  }

  async start() {
	await this.request_download();
	await this.run();
  }

  async cleanup() {
  	await this.saved_location.delete_async(GLib.PRIORITY_DEFAULT, null);
  }

  get_percentage() {
	if (!this.size) return -1;
	return this.bytesread / this.size;
  }

  is_running() {
	return !this.cancellable.is_cancelled();
  }
}
