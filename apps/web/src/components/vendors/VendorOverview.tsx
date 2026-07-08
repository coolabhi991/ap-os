import type { Vendor } from "../../services/vendors";

interface Props {
  vendor: Vendor;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function VendorOverview({ vendor }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{vendor.name}</h1>
            <p className="mt-2 text-slate-500">
              {vendor.vendorCode && <span>Code: {vendor.vendorCode} • </span>}
              {vendor.category && <span>{vendor.category}</span>}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 font-medium ${
              vendor.status === "Active"
                ? "bg-green-100 text-green-700"
                : vendor.status === "Review"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {vendor.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Contact Information</h2>
          <div className="space-y-4">
            <Row label="Contact Person" value={vendor.contactPerson} />
            <Row label="Mobile" value={vendor.mobile} />
            <Row label="Email" value={vendor.email} />
            <Row label="Address" value={vendor.address} />
            <Row label="City" value={vendor.city} />
            <Row label="State" value={vendor.state} />
            <Row label="Pincode" value={vendor.pincode} />
          </div>
        </div>

        {/* Tax */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Tax Information</h2>
          <div className="space-y-4">
            <Row label="GST Number" value={vendor.gst} />
            <Row label="PAN Number" value={vendor.pan} />
          </div>
        </div>

        {/* Notes */}
        {vendor.notes && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Notes</h2>
            <p className="text-slate-700">{vendor.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
