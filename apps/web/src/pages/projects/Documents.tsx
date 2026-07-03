import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";

export default function Documents() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Project Documents
            </h1>

            <p className="mt-2 text-slate-500">
              Project ID : {id}
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="rounded-lg bg-slate-900 px-5 py-3 text-white"
          >
            Back
          </button>

        </div>

        <div className="rounded-xl bg-white p-12 text-center shadow-sm">

          <h2 className="text-2xl font-bold">
            📁 Documents Module
          </h2>

          <p className="mt-4 text-slate-500">
            No documents uploaded yet.
          </p>

          <button className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
            Upload Document
          </button>

        </div>

      </div>
    </Layout>
  );
}