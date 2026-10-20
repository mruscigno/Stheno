# Migration schema diff

`20261020192810_app5b1_workout_protocol_integration.sql` is additive/privilege-hardening SQL. It creates `private`, moves the App 5A privileged implementation from exposed `public` to `private`, recreates the public operation name as a security-invoker adapter, and adds an owner-scoped receipt lookup RPC. No fitness-domain columns, exercise records, media records, assessment records, or billing records change.
