begin;
select plan(8);

insert into internal.form_review_evaluation_runs(run_key,budget_usd) values('app6b2-test',5.00);
select lives_ok($$select internal.reserve_form_review_evaluation('app6b2-test','request-1','gpt-5.4-mini',4,800,0.10)$$,'first request reserves atomically');
select is((select reserved_usd from internal.form_review_evaluation_runs where run_key='app6b2-test'),0.100000::numeric,'reservation is held');
select is((select request_count from internal.form_review_evaluation_runs where run_key='app6b2-test'),1,'request count increments');
select throws_ok($$select internal.reserve_form_review_evaluation('app6b2-test','request-over','gpt-5.4-mini',4,800,5.00)$$,'P0001','EVALUATION_BUDGET_EXCEEDED','cap rejects oversized reservation');
select throws_ok($$select internal.reserve_form_review_evaluation('app6b2-test','request-frames','gpt-5.4-mini',6,800,0.10)$$,'P0001','EVALUATION_REQUEST_OUT_OF_BOUNDS','frame cap fails closed');
select internal.reconcile_form_review_evaluation((select id from internal.form_review_evaluation_requests where request_key='request-1'),0.004,'resp_test',1200,200);
select is((select reserved_usd from internal.form_review_evaluation_runs where run_key='app6b2-test'),0.000000::numeric,'unused reservation releases after known usage');
select is((select actual_usd from internal.form_review_evaluation_runs where run_key='app6b2-test'),0.004000::numeric,'actual measured cost persists');
select ok(not has_function_privilege('authenticated','internal.reserve_form_review_evaluation(text,text,text,integer,integer,numeric)','execute'),'member cannot reserve evaluation spend');

select * from finish();
rollback;
