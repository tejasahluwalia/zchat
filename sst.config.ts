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
		const replicationBucket = new sst.aws.Bucket(`ZchatReplicationBucket`, {});

		const vpc = new sst.aws.Vpc(`ZchatVpc`, {
			az: 2,
			bastion: true,
			nat: 'ec2'
		});

		const database = new sst.aws.Postgres('ZchatDB', {
			vpc
			// proxy: true // Proxy is not supported by Zero, but I need it to use sst shell commands with drizzle-kit
		});

		const githubOauthClientID = new sst.Secret('GithubOauthClientID');
		const githubOauthClientSecret = new sst.Secret('GithubOauthClientSecret');

		const auth = new sst.aws.Auth('ZchatAuth', {
			domain: {
				name: 'zchat-auth.tej.ai',
				dns: sst.cloudflare.dns()
			},
			issuer: {
				handler: 'auth/index.handler',
				link: [database, githubOauthClientID, githubOauthClientSecret],
				vpc
			}
		});

		const cluster = new sst.aws.Cluster(`ZchatCluster`, {
			vpc
		});

		const conn = $interpolate`postgres://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`;
		const zeroAuthSecret = new sst.Secret('ZeroAuthSecret');

		const commonEnv = {
			ZERO_UPSTREAM_DB: conn,
			ZERO_CVR_DB: conn,
			ZERO_CHANGE_DB: conn,
			ZERO_AUTH_SECRET: zeroAuthSecret.value,
			ZERO_REPLICA_FILE: 'sync-replica.db',
			ZERO_LITESTREAM_BACKUP_URL: $interpolate`s3://${replicationBucket.name}/backup`,
			ZERO_IMAGE_URL: `rocicorp/zero:0.16.2025022800`,
			ZERO_CVR_MAX_CONNS: '10',
			ZERO_UPSTREAM_MAX_CONNS: '10'
		};

		const replicationManager = new sst.aws.Service(`ZchatReplicationManager`, {
			cluster: cluster,
			cpu: '2 vCPU',
			memory: '8 GB',
			dev: false,
			image: commonEnv.ZERO_IMAGE_URL,
			link: [replicationBucket, database],
			health: {
				command: ['CMD-SHELL', 'curl -f http://localhost:4849/ || exit 1'],
				interval: '5 seconds',
				retries: 3,
				startPeriod: '300 seconds'
			},
			environment: {
				...commonEnv,
				ZERO_CHANGE_MAX_CONNS: '3',
				ZERO_NUM_SYNC_WORKERS: '0'
			},
			loadBalancer: {
				public: false,
				ports: [
					{
						listen: '80/http',
						forward: '4849/http'
					}
				]
			},
			transform: {
				loadBalancer: {
					idleTimeout: 3600
				},
				target: {
					healthCheck: {
						enabled: true,
						path: '/keepalive',
						protocol: 'HTTP',
						interval: 5,
						healthyThreshold: 2,
						timeout: 3
					}
				}
			}
		});

		const viewSyncer = new sst.aws.Service(`ZchatViewSyncer`, {
			cluster: cluster,
			cpu: '2 vCPU',
			memory: '8 GB',
			image: commonEnv.ZERO_IMAGE_URL,
			dev: false,
			link: [replicationBucket, database],
			health: {
				command: ['CMD-SHELL', 'curl -f http://localhost:4848/ || exit 1'],
				interval: '5 seconds',
				retries: 3,
				startPeriod: '300 seconds'
			},
			environment: {
				...commonEnv,
				ZERO_CHANGE_STREAMER_URI: replicationManager.url
			},
			logging: {
				retention: '1 month'
			},
			loadBalancer: {
				public: true,
				domain: { name: 'zchat-view-syncer.tej.ai', dns: sst.cloudflare.dns() },
				rules: [
					{ listen: '80/http', forward: '4848/http' },
					{ listen: '443/https', forward: '4848/http' }
				]
			},
			transform: {
				target: {
					healthCheck: {
						enabled: true,
						path: '/keepalive',
						protocol: 'HTTP',
						interval: 5,
						healthyThreshold: 2,
						timeout: 3
					},
					stickiness: {
						enabled: true,
						type: 'lb_cookie',
						cookieDuration: 120
					},
					loadBalancingAlgorithmType: 'least_outstanding_requests'
				}
			}
		});

		const permissionsDeployer = new sst.aws.Function('ZeroPermissionsDeployer', {
			handler: './functions/src/permissions.deploy',
			vpc,
			link: [database],
			environment: { ['ZERO_UPSTREAM_DB']: conn },
			copyFiles: [
				{ from: './src/lib/schemas/drizzleSchema.ts', to: './drizzleSchema.ts' },
				{ from: './src/lib/schemas/zeroSchema.ts', to: './schema.ts' }
			],
			dev: false,
			nodejs: { install: [`@rocicorp/zero`, 'drizzle-zero', 'drizzle-orm'] }
		});

		new aws.lambda.Invocation(
			'InvokeZeroPermissionsDeployer',
			{
				// Invoke the Lambda on every deploy.
				input: Date.now().toString(),
				functionName: permissionsDeployer.name
			},
			{ dependsOn: viewSyncer }
		);

		const deepseekApiKey = new sst.Secret('DeepseekApiKey');

		new sst.aws.Service('ZchatWeb', {
			cluster,
			link: [database, viewSyncer, auth, zeroAuthSecret, deepseekApiKey],
			loadBalancer: {
				public: true,
				domain: { name: 'zchat.tej.ai', dns: sst.cloudflare.dns() },
				rules: [
					{ listen: '80/http', redirect: '443/https' },
					{ listen: '443/https', forward: '3000/http' }
				]
			},
			dev: {
				command: 'npm run dev'
			}
		});

		new sst.x.DevCommand('Studio', {
			link: [database],
			dev: {
				command: 'npx drizzle-kit studio'
			}
		});
	}
});
