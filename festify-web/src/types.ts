/* Types for the redesigned Festify postal landing page */

export interface StudentFeature {
  id: number;
  stampNo: string;
  denomination: string;
  tag: string;
  title: string;
  description: string;
  iconPath: string; // SVG path data for the line icon
}

export interface OrganizerFeature {
  id: number;
  stampNo: string;
  denomination: string;
  tag: string;
  title: string;
  description: string;
  iconPath: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  subtext: string;
}

export interface StatStrip {
  value: number;
  suffix: string;
  label: string;
  duration: number;
}
