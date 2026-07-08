import { PAYMENT_MODE_LABELS } from "../../services/vendor-payments";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  vendorFilter: string;
  onVendorChange: (v: string) => void;
  vendors: { id: string; name: string }[];
  modeFilter: string;
  onModeChange: (v: string) => void;
  fromDate: string;
  onFromDateChange: (v: string) => void;
  toDate: string;
  onToDateChange: (v: string) => void;
}

export default function VendorPaymentFilters({
  search, onSearchChange,
  vendorFilter, onVendorChange, vendors,
  modeFilter, onModeChange,
  fromDate, onFromDateChange,
  toDate, onToDateChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search payment no., bill, vendor..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />

        <select
          value={vendorFilter}
          onChange={(e) => onVendorChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        <select
          value={modeFilter}
          onChange={(e) => onModeChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        >
          <option value="">All Modes</option>
          {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 md:col-span-3">
          <label className="whitespace-nowrap text-sm text-slate-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          />
          <label className="whitespace-nowrap text-sm text-slate-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
