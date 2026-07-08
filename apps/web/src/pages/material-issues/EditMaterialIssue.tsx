import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MaterialIssueForm from "../../components/material-issues/MaterialIssueForm";
import { getMaterialIssue, updateMaterialIssue } from "../../services/material-issues";
import type { MaterialIssue, MaterialIssueUpdateData, MaterialIssueFormData } from "../../services/material-issues";

export default function EditMaterialIssue() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<MaterialIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMaterialIssue(id)
      .then(setIssue)
      .catch(() => setError("Failed to load material issue."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: MaterialIssueFormData) => {
    if (!id) return;
    const update: MaterialIssueUpdateData = {
      purpose: data.purpose,
      issuedTo: data.issuedTo,
      approvedBy: data.approvedBy,
      remarks: data.remarks,
      attachmentFileName: data.attachmentFileName,
      attachmentFileUrl: data.attachmentFileUrl,
    };
    try {
      setSaving(true);
      setError(null);
      await updateMaterialIssue(id, update);
      navigate("/material-issues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update material issue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Material Issue</h1>
          <p className="mt-2 text-slate-500">Update administrative details — quantity and stock are locked after creation.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading || !issue ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>
        ) : (
          <MaterialIssueForm
            mode="edit"
            existingIssue={issue}
            initialData={{
              purpose: issue.purpose,
              issuedTo: issue.issuedTo,
              approvedBy: issue.approvedBy,
              remarks: issue.remarks,
              attachmentFileName: issue.attachmentFileName,
              attachmentFileUrl: issue.attachmentFileUrl,
            }}
            onSubmit={handleSubmit}
            saving={saving}
            projects={[]}
            materials={[]}
          />
        )}
      </div>
    </Layout>
  );
}
