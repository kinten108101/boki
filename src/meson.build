script = [
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
	},
)

install_data(
	exec,
	install_dir: get_option('bindir'),
	install_mode: 'rwxrwxrwx',
)
