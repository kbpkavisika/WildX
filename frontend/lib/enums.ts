export const ROLES = {
  RANGER: "RANGER",
  SUPERVISOR: "SUPERVISOR",
  MANAGER: "MANAGER",
  CLO: "CLO",
  LEL: "LEL",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PATROL_STATUSES = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type PatrolStatus = (typeof PATROL_STATUSES)[keyof typeof PATROL_STATUSES];

export const INCIDENT_STATUSES = {
  NEW: "NEW",
  ASSIGNED: "ASSIGNED",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[keyof typeof INCIDENT_STATUSES];
