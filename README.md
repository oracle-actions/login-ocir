# login-ocir v1.0

GitHub Action that logs into the Oracle Cloud Infrastructure Registry (OCIR)
endpoint in the Oracle Cloud Infrastructure (OCI) region provided in the
`configure-oci-credentials` step of the workflow.

The login credentials are provided to both the Docker and Podman container
tools, so you may use either of them in the subsequent workflow steps.

## Dependency requirement

This action depends on the use of the [`oracle-actions/configure-oci-credentials@v1.0`][1]
action in a prior step to configure the required OCI credentials.

## Inputs

* `auth_token`: an Oracle-generated string that allow third-party services to
  authenticate to OCI service endpoints. See [working with Auth Tokens][AUTH]
  for details on how to create a token.

## Outputs

* `ocir_endpoint`
* `ocir_username`

## Sample workflow

```yaml
jobs:
  my-instances:
    runs-on: ubuntu-latest
    name: List the display name and shape of the instances in my compartment
    steps:
      - name: Configure OCI Credentials
        uses: oracle-actions/configure-oci-credentials@v1
        with:
          user: ${{ secrets.OCI_USER }}
          fingerprint: ${{ secrets.OCI_FINGERPRINT }}
          private_key: ${{ secrets.OCI_PRIVATE_KEY }}
          tenancy: ${{ secrets.OCI_TENANCY }}
          region: 'us-ashburn-1'

      - name: Login to OCIR
        uses: oracle-actions/login-ocir@v1
        id: login-ocir
        with:
          auth_token: ${{ secrets.OCIR_AUTH_TOKEN }}

      - name: Get private OCIR repository
        uses: oracle-actions/get-ocir-repository@v1
        id: get-ocir-repository
        with:
          compartment: ${{ secrets.OCI_COMPARTMENT }}
          name: 'gh-action/alpine'

      - name: Push the image to OCIR
        run: docker push "${{ steps.get-ocir-repository.outputs.repo_path }}:latest"
```

See [`action.yml`](./action.yml) for more details.

## Contributing

We welcome contributions from the community. Before submitting a pull
request, please [review our contribution guide](./CONTRIBUTING.md).

## Security

Please consult the [security guide](./SECURITY.md) for our responsible security
vulnerability disclosure process.

## License

Copyright (c) 2021 Oracle and/or its affiliates.

Released under the Universal Permissive License v1.0 as shown at
<https://oss.oracle.com/licenses/upl/>.

[1]: http://github.com/oracle-actions/configure-oci-credentials
[AUTH]: https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingcredentials.htm#Working
