begin;
select plan(12);

select has_schema('private','private implementation schema exists');
select has_function('private','apply_workout_operation',array['uuid','uuid','text','bigint','integer','timestamp with time zone','jsonb','text'],'privileged implementation exists');
select is_definer('private','apply_workout_operation',array['uuid','uuid','text','bigint','integer','timestamp with time zone','jsonb','text'],'private implementation is definer');
select has_function('public','apply_workout_operation',array['uuid','uuid','text','bigint','integer','timestamp with time zone','jsonb','text'],'public adapter exists');
select isnt_definer('public','apply_workout_operation',array['uuid','uuid','text','bigint','integer','timestamp with time zone','jsonb','text'],'public adapter is invoker');
select ok(not has_function_privilege('anon','public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text)','execute'),'anon cannot execute mutations');
select ok(has_function_privilege('authenticated','public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text)','execute'),'authenticated can execute adapter');
select ok(not has_function_privilege('anon','public.get_workout_operation_receipt(uuid)','execute'),'anon cannot read receipts');
select ok(has_function_privilege('authenticated','public.get_workout_operation_receipt(uuid)','execute'),'authenticated can read owned receipts');
select ok(not has_schema_privilege('anon','private','usage'),'anon cannot address private schema');
select ok(has_schema_privilege('authenticated','private','usage'),'authenticated adapter may address private schema');
select has_index('public','workout_operation_receipts','workout_operation_receipts_user_id_operation_id_key','receipt owner/operation lookup is indexed');

select * from finish();
rollback;
