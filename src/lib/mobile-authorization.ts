export type MobileAuthorization = { roles: string[]; permissions: string[] };

const NEIGHBOR_PERMISSIONS = ["news.read", "alerts.read", "visits.read"] as const;
const ADMIN_PERMISSIONS = [
  "news.read", "news.manage", "alerts.read", "alerts.request", "alerts.approve", "alerts.send",
  "visits.read", "visits.manage", "activities.read", "activities.create", "activities.update",
  "activities.review", "compliance.read", "compliance.submit", "compliance.manage", "users.manage",
  "communities.manage", "reports.read", "audit.read",
] as const;

export function getMobileAuthorization(isAdmin: boolean): MobileAuthorization {
  return isAdmin
    ? { roles: ["admin"], permissions: [...ADMIN_PERMISSIONS] }
    : { roles: ["neighbor"], permissions: [...NEIGHBOR_PERMISSIONS] };
}
