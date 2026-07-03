import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientForm from "../../components/clients/ClientForm";

import {
  getClient,
  updateClient,
} from "../../services/clients";

export default function EditClient() {
  const navigate = useNavigate();
  const { id } = useParams();

  const client = getClient(Number(id));

  if (!client) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Client Not Found
          </h1>
        </div>
      </Layout>
    );
  }

  const handleSubmit = (data: any) => {
    updateClient(client.id, data);

    navigate("/clients");
  };

  return (
    <Layout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            Edit Client
          </h1>

          <p className="mt-2 text-slate-500">
            Update client information.
          </p>
        </div>

        <ClientForm
          initialData={client}
          onSubmit={handleSubmit}
        />

      </div>
    </Layout>
  );
}