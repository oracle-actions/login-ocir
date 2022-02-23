/* Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as core from '@actions/core';

import * as artifacts from 'oci-artifacts';
import * as identity from 'oci-identity';
import { Region, SimpleAuthenticationDetailsProvider } from 'oci-common';


interface configJson {
  auths?: {
    [key: string]: {
      auth: string;
    };
  };
}

async function login() {
  // Required environment variables
  const tenancy = process.env.OCI_CLI_TENANCY || '';
  const user = process.env.OCI_CLI_USER || '';
  const fingerprint = process.env.OCI_CLI_FINGERPRINT || '';
  const privateKey = process.env.OCI_CLI_KEY_CONTENT || '';
  const region = Region.fromRegionId(process.env.OCI_CLI_REGION || '');

  const authProvider = new SimpleAuthenticationDetailsProvider(
    tenancy,
    user,
    fingerprint,
    privateKey,
    null,
    region
  );

  const ac = new artifacts.ArtifactsClient({
    authenticationDetailsProvider: authProvider
  });
  const ic = new identity.IdentityClient({
    authenticationDetailsProvider: authProvider
  });

  const regionCode = (await ic.listRegions({})).items
    .find(x => x.name === authProvider.getRegion().regionId)
    ?.key?.toLocaleLowerCase();

  if (regionCode) {
    const ocir = `${regionCode}.ocir.io`;

    const namespace = (
      await ac.getContainerConfiguration({
        compartmentId: authProvider.getTenantId()
      })
    ).containerConfiguration.namespace;

    const ociUser = (await ic.getUser({userId: authProvider.getUser()})).user
      .name;
    const ociToken = core.getInput('auth_token', {required: true});
    const authToken = Buffer.from(
      `${namespace}/${ociUser}:${ociToken}`
    ).toString('base64');

    const dockerConfigPath = path.join(os.homedir(), '.docker', 'config.json');

    let currentConfig: configJson | undefined;

    if (fs.existsSync(dockerConfigPath)) {
      const currentConfig = <configJson>(
        JSON.parse(
          fs.readFileSync(dockerConfigPath, {encoding: 'utf-8', flag: 'r'})
        )
      );
      if (!currentConfig.auths) {
        currentConfig.auths = {};
      }
      currentConfig.auths[ocir] = {auth: authToken};
    }

    if (!currentConfig) {
      currentConfig = {auths: {[ocir]: {auth: authToken}}};
    }

    fs.writeFileSync(dockerConfigPath, JSON.stringify(currentConfig), {
      encoding: 'utf-8',
      mode: 0o600
    });

    core.setOutput('ocir_endpoint', ocir);
    core.setOutput('ocir_username', `${namespace}/${ociUser}`);

    core.saveState('registry', ocir);
    core.saveState('logout', 'true');
  } else {
    core.setFailed('Unable to determine OCIR endpoint.');
  }
}

function logout(registry: string) {
  const dockerConfigPath = path.join(os.homedir(), '.docker', 'config.json');
  let currentConfig: configJson;

  try {
    currentConfig = <configJson>(
      JSON.parse(fs.readFileSync(dockerConfigPath, 'utf-8'))
    );

    if (currentConfig.auths && currentConfig.auths[registry]) {
      delete currentConfig.auths[registry];
    }

    fs.writeFileSync(dockerConfigPath, JSON.stringify(currentConfig), {
      encoding: 'utf-8',
      mode: 0o600
    });
    core.info('Oracle Cloud Infrastructure Registry login token removed.');
  } catch (e) {
    if (e instanceof Error) {
      core.setFailed(e.message);
    }
  }
}

if (core.getState('logout') === 'true') {
  logout(core.getState('registry'));
} else {
  login().catch(e => {
    if (e instanceof Error) core.setFailed(e.message);
  });
}
