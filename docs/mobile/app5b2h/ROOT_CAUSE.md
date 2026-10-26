# Root cause

The retained baseline proved that assessment completion and Blueprint generation worked but claim never ran. A valid Supabase session triggered member API bootstrap before the anonymous assessment was claimed; missing member/program records set auth status to error, while Blueprint required signed-in bootstrap success before initiating the claim. Each side waited on the other.

The claim gate now uses the actual security prerequisites: a valid Auth session and finalized assessment capability. Follow-up evidence then identified and corrected independent native-runtime issues: routed callback parameters, the missing `4.0.0` assessment registry row, Hermes UUID generation, Android safe areas, debug-overlay interception, and authenticated cold-start routing.

Final run `40414407657` proves the corrected architecture end to end: verification, claim `201`, replay `200`, real Program, one-record database cardinality, and restored Member Today after force-stop.
