import {describe,expect,it} from "vitest";
import {payloadHash} from "./payload-hash";

describe("App 5A normalized operation hashing",()=>{
 const a={kind:"upsert_set",sessionId:"s",baseRevision:3,schemaVersion:1,payload:{repetitions:8,load:50}};
 it("is stable across object key order",()=>expect(payloadHash(a)).toBe(payloadHash({schemaVersion:1,payload:{load:50,repetitions:8},baseRevision:3,sessionId:"s",kind:"upsert_set"})));
 it("changes when mutation content changes",()=>expect(payloadHash(a)).not.toBe(payloadHash({...a,payload:{repetitions:9,load:50}})));
});
