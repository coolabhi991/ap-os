import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientForm from "../../components/clients/ClientForm";

import { createClient } from "../../services/clients";

export default function AddClient() {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    createClient(data);

    navigate("/clients");
  };

  return (
    <Layout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Add Client
          </h1>

          <p className="mt-2 text-slate-500">
            Create a new client.
          </p>
        </div>

        <ClientForm onSubmit={handleSubmit} />

      </div>
    </Layout>
  );
}