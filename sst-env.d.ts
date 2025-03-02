/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */

declare module "sst" {
  export interface Resource {
    "DeepseekApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GithubOauthClientID": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GithubOauthClientSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ZchatAuth": {
      "type": "sst.aws.Auth"
      "url": string
    }
    "ZchatDB": {
      "database": string
      "host": string
      "password": string
      "port": number
      "type": "sst.aws.Postgres"
      "username": string
    }
    "ZchatReplicationBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "ZchatReplicationManager": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
    "ZchatViewSyncer": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
    "ZchatVpc": {
      "bastion": string
      "type": "sst.aws.Vpc"
    }
    "ZchatWeb": {
      "type": "sst.aws.SvelteKit"
      "url": string
    }
    "ZeroAuthSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ZeroPermissionsDeployer": {
      "name": string
      "type": "sst.aws.Function"
    }
  }
}
/// <reference path="sst-env.d.ts" />

import "sst"
export {}