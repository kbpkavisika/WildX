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

export const SEVERITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type Severity = (typeof SEVERITIES)[keyof typeof SEVERITIES];

export const LOCATION_SOURCES = {
  GPS: "GPS",
  MANUAL: "MANUAL",
} as const;
export type LocationSource = (typeof LOCATION_SOURCES)[keyof typeof LOCATION_SOURCES];

export const SOURCE_TYPES = {
  INCIDENT: "INCIDENT",
  ALERT: "ALERT",
  COMMUNITY_REPORT: "COMMUNITY_REPORT",
} as const;
export type SourceType = (typeof SOURCE_TYPES)[keyof typeof SOURCE_TYPES];

export const DISPATCH_STATUSES = {
  ASSIGNED: "ASSIGNED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  COMPLETED: "COMPLETED",
  DECLINED: "DECLINED",
} as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[keyof typeof DISPATCH_STATUSES];
