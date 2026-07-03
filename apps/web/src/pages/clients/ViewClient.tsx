import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientOverview from "../../components/clients/ClientOverview";

import { getClient } from "../../services/clients";

export default function ViewClient() {
  const { id } = useParams();

  const client = getClient(Number(id));

  if (!client) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Client Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            This client does not exist.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ClientOverview
        companyName={client.companyName}
        clientCode={client.clientCode}
        contactPerson={client.contactPerson}
        mobile={client.mobile}
        email={client.email}
        gst={client.gst}
        pan={client.pan}
        address={client.address}
        city={client.city}
        state={client.state}
        pincode={client.pincode}
        website={client.website}
        status={client.status}
        notes={client.notes}
      />
    </Layout>
  );
}