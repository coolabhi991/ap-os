import DocumentUploadPanel from "../../documents/DocumentUploadPanel";
import { getDocumentsByVendor, VENDOR_ATTACHMENT_TYPE_OPTIONS } from "../../../services/documents";

export default function VendorDocumentsTab({ vendorId }: { vendorId: string }) {
  return (
    <DocumentUploadPanel
      title="Vendor Documents"
      documentTypeOptions={VENDOR_ATTACHMENT_TYPE_OPTIONS}
      fetchDocuments={() => getDocumentsByVendor(vendorId)}
      createParams={{ vendorId }}
    />
  );
}
