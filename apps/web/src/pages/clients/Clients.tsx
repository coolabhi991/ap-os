import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientFilters from "../../components/clients/ClientFilters";
import ClientTable from "../../components/clients/ClientTable";

import {
  getClients,
  deleteClient,
} from "../../services/clients";

import type { Client } from "../../services/clients";

export default function Clients() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setClients(getClients());
  }, [location.pathname]);

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this client?")) return;

    deleteClient(id);
    setClients(getClients());
  };

  const filteredClients = clients.filter((client) => {
    const keyword = search.toLowerCase();

    return (
      client.companyName.toLowerCase().includes(keyword) ||
      client.contactPerson.toLowerCase().includes(keyword) ||
      client.mobile.toLowerCase().includes(keyword) ||
      client.gst.toLowerCase().includes(keyword)
    );
  });

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-slate-900">
              Clients
            </h1>

            <p className="mt-2 text-slate-500">
              Manage all clients.
            </p>

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
        />

        <ClientTable
          clients={filteredClients}
          onView={(id) => navigate(`/clients/${id}`)}
          onEdit={(id) => navigate(`/clients/${id}/edit`)}
          onDelete={handleDelete}
        />

      </div>
    </Layout>
  );
}