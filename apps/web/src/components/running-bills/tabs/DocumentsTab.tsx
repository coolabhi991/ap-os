import DocumentUploadPanel from "../../documents/DocumentUploadPanel";
import { getDocumentsByRunningBill, RUNNING_BILL_ATTACHMENT_TYPE_OPTIONS, RUNNING_BILL_DOCUMENT_GROUPS } from "../../../services/documents";
import type { RunningBill } from "../../../services/running-bills";

export default function DocumentsTab({ bill }: { bill: RunningBill }) {
  return (
    <DocumentUploadPanel
      title="Documents & Attachments"
      documentTypeOptions={RUNNING_BILL_ATTACHMENT_TYPE_OPTIONS}
      fetchDocuments={() => getDocumentsByRunningBill(bill.id)}
      createParams={{ projectId: bill.projectId, runningBillId: bill.id }}
      groups={RUNNING_BILL_DOCUMENT_GROUPS}
    />
  );
}
