script = [
	'lib/builder-fmtstr.js',
	'lib/builder.js',
	'lib/copy-text.js',
	'lib/dynamic-toaster.js',
	'lib/file.js',
	'lib/forward-methods.js',
	'lib/functional.js',
	'lib/gtk.js',
	'lib/message.js',
	'lib/pjxml.js',
	'lib/toaster-provider.js',
	'lib/tracker-functional.js',
	'lib/tracker.js',
	'services/database.js',
	'services/download.js',
	'services/history.js',
	'services/steamworks.js',
	'utils/error.js',
	'utils/files.js',
	'utils/markup.js',
	'utils/string.js',
	'widgets/about.js',
	'widgets/shortcut-label.js',
	'widgets/spinning-button.js',
	'application.js',
	'main.js',
	'window.js',
]

script_files = files(script)

SRC = ''
foreach x : script
	SRC = ''.join([SRC, '<file>'])
	SRC = ''.join([SRC, x])
	SRC = ''.join([SRC, '</file>'])
endforeach

src_manifest = configure_file(
	input:  'gresources.src.xml',
	output: 'com.github.kinten108101.Boki.src.xml',
	configuration: {
		'SRC': SRC,
	},
)

src_resource = gnome.compile_resources(
	'com.github.kinten108101.Boki.src',
	src_manifest,
	dependencies: script_files,
	gresource_bundle: true,
	install: true,
	install_dir: get_option('datadir') / 'com.github.kinten108101.Boki',
)

exec = configure_file(
	input: 'index.js',
	output: 'com.github.kinten108101.Boki',
	configuration: {
		'GJS': gjs_console,
		'VERSION': meson.project_version(),
		'PREFIX': get_option('prefix'),
		'LIBDIR': get_option('prefix') / get_option('libdir'),
		'BUILD_TYPE': get_option('buildtype'),
		'BUILD_FOR_FLATPAK': get_option('built_for_flatpak'),
	},
)

install_data(
	exec,
	install_dir: get_option('bindir'),
	install_mode: 'rwxrwxrwx',
)
