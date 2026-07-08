import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Client } from "../../services/clients";

interface Props {
  clients?: Client[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ClientTable({
  clients = [],
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      <table className="min-w-full">

        <thead className="bg-slate-100">

          <tr>

            <th className="px-6 py-4 text-left">
              Company
            </th>

            <th className="px-6 py-4 text-left">
              Contact Person
            </th>

            <th className="px-6 py-4 text-left">
              Mobile
            </th>

            <th className="px-6 py-4 text-left">
              GST
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {clients.length === 0 ? (
            <tr>

              <td
                colSpan={6}
                className="py-10 text-center text-slate-500"
              >
                No clients found.
              </td>

            </tr>
          ) : (
            clients.map((client) => (

              <tr
                key={client.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-6 py-4 font-medium">
                  {client.companyName}
                </td>

                <td className="px-6 py-4">
                  {client.contactPerson}
                </td>

                <td className="px-6 py-4">
                  {client.mobile}
                </td>

                <td className="px-6 py-4">
                  {client.gst}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      client.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {client.status}
                  </span>

                </td>

                <td className="px-6 py-4">

                  <div className="flex justify-center gap-4">

                    <button
                      onClick={() => onView(client.id)}
                    >
                      <Eye
                        size={18}
                        className="text-blue-600"
                      />
                    </button>

                    <button
                      onClick={() => onEdit(client.id)}
                    >
                      <Pencil
                        size={18}
                        className="text-green-600"
                      />
                    </button>

                    <button
                      onClick={() => onDelete(client.id)}
                    >
                      <Trash2
                        size={18}
                        className="text-red-600"
                      />
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