export const mobileEvents = ["app_opened", "assessment_entry_viewed", "existing_member_signin_clicked", "auth_login_success", "auth_login_failure", "auth_reset_requested", "auth_verified", "session_expired", "signout"] as const;
export type MobileEvent = typeof mobileEvents[number];
type SafeProperties = { route?: string; category?: "invalid_credentials" | "rate_limited" | "offline" | "service" | "unknown"; environment?: string };

let transport: ((event: MobileEvent, properties: SafeProperties) => void | Promise<void>) | null = null;
export function installAnalyticsTransport(next: typeof transport) { transport = next; }
export function track(event: MobileEvent, properties: SafeProperties = {}) { void transport?.(event, properties); }
