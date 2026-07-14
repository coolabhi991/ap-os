import DocumentUploadPanel from "../../documents/DocumentUploadPanel";
import { getDocumentsBySite, DOCUMENT_TYPE_OPTIONS } from "../../../services/documents";
import type { Site } from "../../../services/sites";

export default function DocumentsTab({ site }: { site: Site }) {
  return (
    <DocumentUploadPanel
      title="Documents"
      documentTypeOptions={DOCUMENT_TYPE_OPTIONS}
      fetchDocuments={() => getDocumentsBySite(site.id)}
      createParams={{ projectId: site.projectId, siteId: site.id }}
    />
  );
}
