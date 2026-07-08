import { BarChart3, Bike, Fuel, HardHat, Wrench } from "lucide-react";

export const equipmentSummaryStats = [
  {
    title: "Active Equipment",
    value: "18",
    subtitle: "Assets currently assigned",
    icon: HardHat,
    trend: "2 new additions",
  },
  {
    title: "Utilization",
    value: "81%",
    subtitle: "Average machine utilization",
    icon: BarChart3,
    trend: "Stable",
  },
  {
    title: "Fuel Consumption",
    value: "1,240 L",
    subtitle: "This month total usage",
    icon: Fuel,
    trend: "Within forecast",
  },
  {
    title: "Maintenance Due",
    value: "4",
    subtitle: "Units scheduled this week",
    icon: Wrench,
    trend: "2 overdue",
  },
];

export const equipmentRows = [
  {
    asset: "Excavator EX-12",
    type: "Heavy Machinery",
    status: "Running",
    site: "North Zone",
    hours: "182h",
  },
  {
    asset: "Loader LK-08",
    type: "Earthmoving",
    status: "Idle",
    site: "North Zone",
    hours: "96h",
  },
  {
    asset: "Concrete Mixer CM-04",
    type: "Site Equipment",
    status: "Maintenance",
    site: "Central Yard",
    hours: "64h",
  },
];

export const allocationRows = [
  { project: "Water Supply Phase 3", asset: "Excavator EX-12", shift: "Day", status: "Active" },
  { project: "Water Supply Phase 3", asset: "Loader LK-08", shift: "Night", status: "Standby" },
  { project: "Water Supply Phase 3", asset: "Concrete Mixer CM-04", shift: "Day", status: "Maintenance" },
];

export const fuelRows = [
  { asset: "Excavator EX-12", liters: "320L", cost: "₹24,000", period: "Jun 2026" },
  { asset: "Loader LK-08", liters: "210L", cost: "₹15,750", period: "Jun 2026" },
  { asset: "Concrete Mixer CM-04", liters: "150L", cost: "₹11,250", period: "Jun 2026" },
];

export const maintenanceRows = [
  { asset: "Excavator EX-12", task: "Hydraulic inspection", date: "12 Jul", status: "Scheduled" },
  { asset: "Loader LK-08", task: "Brake service", date: "14 Jul", status: "Pending" },
  { asset: "Concrete Mixer CM-04", task: "Gearbox review", date: "16 Jul", status: "Scheduled" },
];

export const breakdownRows = [
  { asset: "Loader LK-08", issue: "Battery fault", date: "03 Jul", severity: "Medium" },
  { asset: "Concrete Mixer CM-04", issue: "Engine overheating", date: "05 Jul", severity: "High" },
];

export const utilizationRows = [
  { asset: "Excavator EX-12", utilization: "89%", productivity: "High" },
  { asset: "Loader LK-08", utilization: "72%", productivity: "Stable" },
  { asset: "Concrete Mixer CM-04", utilization: "58%", productivity: "Monitor" },
];

export const operatingCostRows = [
  { item: "Fuel", amount: "₹50,000" },
  { item: "Maintenance", amount: "₹18,000" },
  { item: "Operator wages", amount: "₹28,000" },
  { item: "Misc. consumables", amount: "₹7,000" },
];

export const equipmentCostIcon = Bike;
