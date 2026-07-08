import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientFilters from "../../components/clients/ClientFilters";
import ClientTable from "../../components/clients/ClientTable";

import { getClients, deleteClient } from "../../services/clients";
import type { Client } from "../../services/clients";

export default function Clients() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getClients({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setClients(result.data);
    } catch {
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Failed to delete client.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
            <p className="mt-2 text-slate-500">Manage all clients.</p>
          </div>
          <button
            onClick={() => navigate("/clients/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            New Client
          </button>
        </div>

        <ClientFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
            Loading clients...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <ClientTable
            clients={clients}
            onView={(id) => navigate(`/clients/${id}`)}
            onEdit={(id) => navigate(`/clients/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
