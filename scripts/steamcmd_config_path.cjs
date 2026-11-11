'use strict';

const path = require('node:path');

function resolveSteamcmdConfigPath(home) {
	if (typeof home !== 'string' || home.trim() === '') {
		throw new Error('SteamCMD HOME must be provided');
	}
	return path.join(path.resolve(home), 'Steam', 'config', 'config.vdf');
}

if (require.main === module) {
	try {
		process.stdout.write(`${resolveSteamcmdConfigPath(process.argv[2])}\n`);
	} catch {
		process.stderr.write('SteamCMD config path could not be resolved.\n');
		process.exitCode = 1;
	}
}

module.exports = { resolveSteamcmdConfigPath };
