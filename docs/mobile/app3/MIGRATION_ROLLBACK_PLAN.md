# Migration rollback plan

Before public use, rollback may drop the claim function, remove `assessments.source_anonymous_session_id`, and drop `anonymous_assessment_sessions`. After claims exist, do not drop: disable new session creation, retain claimed records for referential integrity, deploy the prior API/app, and migrate/audit data before schema removal.
