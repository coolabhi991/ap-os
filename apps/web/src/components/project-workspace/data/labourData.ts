import { CalendarClock, Clock3, HardHat, Users, Wallet2 } from "lucide-react";

export const labourSummaryStats = [
  {
    title: "Active Workforce",
    value: "84",
    subtitle: "Workers currently assigned",
    icon: Users,
    trend: "+6 this week",
  },
  {
    title: "Attendance",
    value: "96%",
    subtitle: "Daily attendance compliance",
    icon: CalendarClock,
    trend: "Steady",
  },
  {
    title: "Overtime Hours",
    value: "12h",
    subtitle: "Recorded this week",
    icon: Clock3,
    trend: "Within limit",
  },
  {
    title: "Labour Cost",
    value: "₹42 L",
    subtitle: "Current pay cycle cost",
    icon: Wallet2,
    trend: "On budget",
  },
];

export const attendanceRows = [
  {
    worker: "Ramesh K.",
    role: "Mason",
    shift: "Day",
    status: "Present",
    hours: "8h",
  },
  {
    worker: "Sujit P.",
    role: "Bar Bender",
    shift: "Day",
    status: "Late",
    hours: "7h",
  },
  {
    worker: "Ajay M.",
    role: "Helper",
    shift: "Night",
    status: "Present",
    hours: "8h",
  },
  {
    worker: "Nitin S.",
    role: "Operator",
    shift: "Day",
    status: "Absent",
    hours: "0h",
  },
];

export const contractorRows = [
  {
    contractor: "Crew Alpha",
    trade: "Civil",
    strength: "28",
    rate: "₹760/day",
    status: "Active",
  },
  {
    contractor: "Rapid Formworks",
    trade: "Shuttering",
    strength: "16",
    rate: "₹720/day",
    status: "Active",
  },
  {
    contractor: "Metro Finishing",
    trade: "Finishing",
    strength: "12",
    rate: "₹690/day",
    status: "Pending",
  },
];

export const dailyStrengthRows = [
  { day: "Mon", count: 76, note: "Foundation crew active" },
  { day: "Tue", count: 79, note: "Rebar work continued" },
  { day: "Wed", count: 81, note: "Steel fixing peak" },
  { day: "Thu", count: 84, note: "Concrete pour support" },
  { day: "Fri", count: 82, note: "Finishing works" },
];

export const wageRows = [
  { worker: "Ramesh K.", category: "Skilled", wage: "₹1,100", status: "Processed" },
  { worker: "Sujit P.", category: "Skilled", wage: "₹980", status: "Pending" },
  { worker: "Ajay M.", category: "Semi-Skilled", wage: "₹760", status: "Processed" },
];

export const overtimeRows = [
  { worker: "Ramesh K.", hours: "4h", reason: "Concrete pour", approved: "Yes" },
  { worker: "Sujit P.", hours: "3h", reason: "Steel fixing", approved: "Yes" },
  { worker: "Nitin S.", hours: "2h", reason: "Night shift", approved: "Pending" },
];

export const productivityRows = [
  { task: "Foundation work", output: "92%", efficiency: "High" },
  { task: "Rebar placement", output: "86%", efficiency: "Stable" },
  { task: "Finishing", output: "79%", efficiency: "Monitor" },
];

export const labourDailyIcon = HardHat;
