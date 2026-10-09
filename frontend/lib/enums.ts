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

export const ALERT_TYPES = {
  ZONE_BREACH: "ZONE_BREACH",
  MORTALITY: "MORTALITY",
  DEVICE_HEALTH: "DEVICE_HEALTH",
  HUMAN_DETECTED: "HUMAN_DETECTED",
} as const;
export type AlertType = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];

export const ALERT_STATUSES = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
} as const;
export type AlertStatus = (typeof ALERT_STATUSES)[keyof typeof ALERT_STATUSES];

export const DISPOSITIONS = {
  CONFLICT_AVERTED: "CONFLICT_AVERTED",
  CONFLICT_OCCURRED: "CONFLICT_OCCURRED",
  NO_ACTION: "NO_ACTION",
  FALSE_ALARM: "FALSE_ALARM",
} as const;
export type Disposition = (typeof DISPOSITIONS)[keyof typeof DISPOSITIONS];

export const ZONE_TYPES = {
  FARMLAND: "FARMLAND",
  ROAD: "ROAD",
  VILLAGE_BUFFER: "VILLAGE_BUFFER",
  RESTRICTED: "RESTRICTED",
} as const;
export type ZoneType = (typeof ZONE_TYPES)[keyof typeof ZONE_TYPES];

export const COMMUNITY_REPORT_STATUSES = {
  NEW: "NEW",
  NEEDS_LOCATION: "NEEDS_LOCATION",
  VALIDATED: "VALIDATED",
  DISPATCHED: "DISPATCHED",
  CLOSED: "CLOSED",
  INVALID: "INVALID",
  DUPLICATE: "DUPLICATE",
} as const;
export type CommunityReportStatus = (typeof COMMUNITY_REPORT_STATUSES)[keyof typeof COMMUNITY_REPORT_STATUSES];

export const REPORT_TYPES = {
  SIGHTING: "SIGHTING",
  CROP_DAMAGE: "CROP_DAMAGE",
  OTHER: "OTHER",
} as const;
export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

export const REPORT_CHANNELS = {
  WEB: "WEB",
  SMS: "SMS",
} as const;
export type ReportChannel = (typeof REPORT_CHANNELS)[keyof typeof REPORT_CHANNELS];

export const DEVICE_TYPES = {
  COLLAR: "COLLAR",
  CAMERA: "CAMERA",
} as const;
export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];
