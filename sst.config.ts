/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: 'zchat-tej-ai',
			removal: input?.stage === 'production' ? 'retain' : 'remove',
			protect: ['production'].includes(input?.stage),
			home: 'aws',
			region: process.env.AWS_REGION || 'us-east-1',
			providers: { cloudflare: '5.49.1' }
		};
	},
	async run() {
		const vpc = new sst.aws.Vpc(`ZchatVpc`, {
		});
	}
});
