import path from 'path';
import { execSync } from 'node:child_process';

export const deploy = () => {
	const zeroDeployPermissionsPath = path.resolve('./node_modules/.bin/zero-deploy-permissions');
	return execSync(zeroDeployPermissionsPath, { stdio: 'inherit' });
};
