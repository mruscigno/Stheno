import{describe,expect,it}from"vitest";import{evaluateMemberAccess}from"./trial";
describe("first-party trial access",()=>{
 it("starts at account creation and grants access before day 14",()=>{const result=evaluateMemberAccess({accountCreatedAt:"2026-01-01T00:00:00Z",now:new Date("2026-01-14T23:59:59Z")});expect(result.hasAccess).toBe(true);expect(result.state).toBe("trial");expect(result.daysRemaining).toBe(1)});
 it("expires exactly 14 days after account creation",()=>{const result=evaluateMemberAccess({accountCreatedAt:"2026-01-01T00:00:00Z",now:new Date("2026-01-15T00:00:00Z")});expect(result).toMatchObject({hasAccess:false,state:"expired",daysRemaining:0})});
 it("allows an active paid member after trial expiry",()=>{const result=evaluateMemberAccess({accountCreatedAt:"2026-01-01T00:00:00Z",subscriptionStatus:"active",now:new Date("2026-02-01T00:00:00Z")});expect(result).toMatchObject({hasAccess:true,state:"paid"})});
 it("does not let Stripe trialing status extend the site trial",()=>{const result=evaluateMemberAccess({accountCreatedAt:"2026-01-01T00:00:00Z",subscriptionStatus:"trialing",now:new Date("2026-02-01T00:00:00Z")});expect(result).toMatchObject({hasAccess:false,state:"expired"})});
});
