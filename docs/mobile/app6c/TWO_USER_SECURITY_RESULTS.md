# Two-user security results

The App 6C pgTAP suite adds explicit A/B ownership and cross-user decision tests to the existing App 4.7 isolation matrix. It is wired into `.github/workflows/app47-zero-cost-validation.yml`.

Local execution was not possible on this workstation because Docker and Podman are absent. The test is therefore CI-required before migration promotion; no production database claim is made from local static inspection alone.
