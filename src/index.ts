/* Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as core from '@actions/core'

import { loginOcir, logoutOcir } from './main'

if (core.getState('logout') === 'true') {
  logoutOcir(core.getState('registry'))
} else {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  try {
    loginOcir()
  } catch (e) {
    if (e instanceof Error) {
      core.setFailed
    }
  }
}
