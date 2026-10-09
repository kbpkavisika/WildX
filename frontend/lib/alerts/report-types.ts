export interface AlertReportMetric {
  label: string;
  value: string;
}

export interface AlertReportRow {
  key: string;
  type: string;
  zone: string;
  hasZone: boolean;
  count: number;
  acknowledge: string;
  resolve: string;
}

export interface AlertReportView {
  total: number;
  metrics: AlertReportMetric[];
  rows: AlertReportRow[];
}
