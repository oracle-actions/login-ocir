# login-ocir

GitHub Action that logs into the Oracle Cloud Infrastructure Registry (OCIR) endpoint in the Oracle Cloud Infrastructure
(OCI) region and using the credentials provided via the required environment variables.

The login credentials are provided to both the Docker and Podman container tools, so you may use either of them in the
subsequent workflow steps.

## Required environment variables

The following [OCI CLI environment variables][1] must be defined for the `login-ocir` task to work:

- `OCI_CLI_USER`
- `OCI_CLI_TENANCY`
- `OCI_CLI_FINGERPRINT`
- `OCI_CLI_KEY_CONTENT`
- `OCI_CLI_REGION`

We recommend using GitHub Secrets to store these values. If you have more than one OCI-related task, consider [defining
your environment variables][2] at the job or workflow level.

## Inputs

- `auth_token`: an Oracle-generated string that allow third-party services to authenticate to OCI service endpoints. See
  [working with Auth Tokens][3] for details on how to create a token.

## Outputs

- `ocir_endpoint`
- `ocir_username`

## Sample workflow

This sample workflow uses the [`login-ocir`][3] action which uses the provided `OCI_AUTH_TOKEN` to login to OCIR as well
as the [`get-ocir-repository`][4] action to retrieve the path of an existing repository.

```yaml
jobs:
  get-ocir-repository-test:
    runs-on: ubuntu-22.04
    name: Get OCIR Repository Test
    env:
      OCI_CLI_USER: ${{ secrets.OCI_CLI_USER }}
      OCI_CLI_TENANCY: ${{ secrets.OCI_CLI_TENANCY }}
      OCI_CLI_FINGERPRINT: ${{ secrets.OCI_CLI_FINGERPRINT }}
      OCI_CLI_KEY_CONTENT: ${{ secrets.OCI_CLI_KEY_CONTENT }}
      OCI_CLI_REGION: ${{ secrets.OCI_CLI_REGION }}
    steps:
      - name: Get or create an OCIR Repository
        uses: oracle-actions/get-ocir-repository@v1.3.0
        id: get-ocir-repository
        with:
          name: oraclelinux
          compartment: ${{ secrets.OCI_COMPARTMENT_OCID }}

      - name: Log into OCIR
        uses: oracle-actions/login-ocir@v1.3.0
        id: login-ocir
        with:
          auth_token: ${{ secrets.OCI_AUTH_TOKEN }}

      - name: Tag and push a container image
        id: tag-and-push-image
        run: |
          docker pull oraclelinux:8-slim
          docker tag "oraclelinux:8-slim" "${{ steps.get-ocir-repository.outputs.repo_path }}:8-slim"
          docker push "${{ steps.get-ocir-repository.outputs.repo_path }}:8-slim"
```

See [`action.yml`](./action.yml) for more details.

## Contributing

We welcome contributions from the community. Before submitting a pull request, please
[review our contribution guide](./CONTRIBUTING.md).

## Security

Please consult the [security guide](./SECURITY.md) for our responsible security vulnerability disclosure process.

## License

Copyright (c) 2021, 2022 Oracle and/or its affiliates.

Released under the Universal Permissive License v1.0 as shown at <https://oss.oracle.com/licenses/upl/>.

[1]: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/clienvironmentvariables.htm
[2]: https://docs.github.com/en/actions/learn-github-actions/environment-variables
[3]: https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingcredentials.htm#Working
[4]: https://github.com/oracle-actions/get-ocir-repository
