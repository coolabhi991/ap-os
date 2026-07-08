import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Vendor } from "../../services/vendors";

interface Props {
  vendors?: Vendor[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function VendorTable({
  vendors = [],
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Vendor</th>
            <th className="px-6 py-4 text-left">Category</th>
            <th className="px-6 py-4 text-left">Contact</th>
            <th className="px-6 py-4 text-left">Mobile</th>
            <th className="px-6 py-4 text-left">GST</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {vendors.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">
                No vendors found.
              </td>
            </tr>
          ) : (
            vendors.map((vendor) => (
              <tr key={vendor.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{vendor.name}</td>
                <td className="px-6 py-4">{vendor.category || "—"}</td>
                <td className="px-6 py-4">{vendor.contactPerson || "—"}</td>
                <td className="px-6 py-4">{vendor.mobile || "—"}</td>
                <td className="px-6 py-4">{vendor.gst || "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      vendor.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : vendor.status === "Review"
                        ? "bg-amber-100 text-amber-700"
                        : vendor.status === "Pending"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(vendor.id)}>
                      <Eye size={18} className="text-blue-600" />
                    </button>
                    <button onClick={() => onEdit(vendor.id)}>
                      <Pencil size={18} className="text-green-600" />
                    </button>
                    <button onClick={() => onDelete(vendor.id)}>
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
