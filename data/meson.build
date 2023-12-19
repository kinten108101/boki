interface = [
	'ui/window.blp',
]

interface_files = files(interface)

blueprints = custom_target('blueprints',
	input: interface_files,
	output: '.',
	build_by_default: true,
	build_always_stale: true,
	command: [blueprint_compiler,
		'batch-compile',
		'@OUTPUT@', '@CURRENT_SOURCE_DIR@', '@INPUT@'],
)

UI = ''
foreach x : interface
	UI = ''.join([UI, '<file>'])
	UI = ''.join([UI, x.replace('.blp', '.ui')])
	UI = ''.join([UI, '</file>'])
endforeach

icons = []
subdir('icons')

ICONS = ''
foreach x : icons
	ICONS = ''.join([ICONS, '<file alias="'])
	ICONS = ''.join([ICONS, x])
	ICONS = ''.join([ICONS, '">icons/'])
	ICONS = ''.join([ICONS, x])
	ICONS = ''.join([ICONS, '</file>'])
endforeach

data_manifest = configure_file(
	input:  'gresources.data.xml',
	output: 'com.github.kinten108101.Boki.data.xml',
	configuration: {
		'UI': UI,
		'ICONS': ICONS,
	},
)

data_resource = gnome.compile_resources(
	'com.github.kinten108101.Boki.data',
	data_manifest,
	dependencies: blueprints,
	gresource_bundle: true,
	install: true,
	install_dir: get_option('datadir') / 'com.github.kinten108101.Boki',
)

configure_file(
	input: 'gresources.metainfo.xml',
	output: 'com.github.kinten108101.Boki.metainfo.xml',
	copy: true,
	install_dir: get_option('datadir') / 'metainfo'
)

configure_file(
	input: 'app.desktop',
	output: 'com.github.kinten108101.Boki.desktop',
	copy: true,
	install_dir: get_option('datadir') / 'applications'
)


configure_file(
  configuration : {
  		'DATA_DIR': get_option('datadir'),
		},
  input : 'app.service',
  output : 'com.github.kinten108101.Boki.service',
  install : true,
  install_dir : get_option('datadir') / 'dbus-1' / 'services',
)

configure_file(
	input: 'gresources.gschema.xml',
	output: 'com.github.kinten108101.Boki.gschema.xml',
	copy: true,
	install_dir: get_option('datadir') / 'glib-2.0' / 'schemas',
)
