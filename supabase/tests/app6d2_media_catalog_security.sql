begin;
select plan(18);

select has_table('public','exercise_media_assets','private media provenance table exists');
select has_table('public','exercise_media_derivatives','media derivative table exists');
select has_table('public','exercise_media_links','reversible media link table exists');
select has_table('public','exercise_media_review_events','media review audit table exists');

select ok(not has_table_privilege('anon','public.exercise_media_assets','select'),'anonymous users cannot read private provenance');
select ok(not has_table_privilege('authenticated','public.exercise_media_assets','select'),'members cannot read private provenance');
select ok(not has_table_privilege('anon','public.exercise_media_review_events','select'),'anonymous users cannot read review audit data');
select ok(not has_table_privilege('authenticated','public.exercise_media_review_events','select'),'members cannot read review audit data');
select ok(has_table_privilege('anon','public.exercise_media_derivatives','select'),'anonymous API may read approved derivative metadata');
select ok(has_table_privilege('authenticated','public.exercise_media_derivatives','select'),'member API may read approved derivative metadata');
select ok(has_table_privilege('anon','public.exercise_media_links','select'),'anonymous API may read active reviewed links');
select ok(has_table_privilege('authenticated','public.exercise_media_links','select'),'member API may read active reviewed links');
select ok(not has_table_privilege('anon','public.exercise_media_links','insert'),'anonymous users cannot create links');
select ok(not has_table_privilege('authenticated','public.exercise_media_links','update'),'members cannot activate links');

select is((select relrowsecurity from pg_class where oid='public.exercise_media_assets'::regclass),true,'provenance RLS is enabled');
select is((select relrowsecurity from pg_class where oid='public.exercise_media_derivatives'::regclass),true,'derivative RLS is enabled');
select is((select relrowsecurity from pg_class where oid='public.exercise_media_links'::regclass),true,'link RLS is enabled');
select is((select relrowsecurity from pg_class where oid='public.exercise_media_review_events'::regclass),true,'review-event RLS is enabled');

select * from finish();
rollback;
