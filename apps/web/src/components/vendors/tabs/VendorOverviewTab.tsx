import VendorOverview from "../VendorOverview";
import VendorBankAccountsPanel from "../VendorBankAccountsPanel";
import type { Vendor } from "../../../services/vendors";

export default function VendorOverviewTab({ vendor }: { vendor: Vendor }) {
  return (
    <div className="space-y-6">
      <VendorOverview vendor={vendor} />
      <VendorBankAccountsPanel vendorId={vendor.id} />
    </div>
  );
}
