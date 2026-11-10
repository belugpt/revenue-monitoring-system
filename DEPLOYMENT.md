# Production release procedure

1. Merge the reviewed change into GitHub main after quality checks pass.
2. Run the Production release workflow and approve the production environment, if configured.
3. Use the Sites source workflow to synchronize the exact source commit into the Site's registered source repository and package the matching production artifact.
4. Save that pushed source commit and artifact using Sites `save_site_version`.
5. Deploy the returned saved version with `deploy_site_version` because this Site is public.
6. Confirm the deployment status is succeeded and retain the returned production URL.

The hosted frontend is public. Database records require ChatGPT authentication and are filtered by Site-scoped user ID server-side. Site sign-in is supplied by the hosting platform; deploying this build directly to an unrelated host without that integration will not provide login.

## Database changes
Append Drizzle schema migrations. Do not edit migrations after deployment. Inspect every generated SQL migration. Sites applies hosted migrations before the Worker is uploaded. Back up data before future destructive migrations.

## Rollback
Use Sites version history to deploy a previously saved version. Code rollback does not reverse a database migration. Schema changes should be compatible with the previous app version whenever possible.
