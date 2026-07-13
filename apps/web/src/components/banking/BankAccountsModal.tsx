import { X } from "lucide-react";
import BankAccountsPanel from "./BankAccountsPanel";
import type { BankAccountOwnerType } from "../../services/bank-account-masters";

interface Props {
  ownerType: BankAccountOwnerType;
  ownerId: string;
  ownerName: string;
  onClose: () => void;
}

/** Modal shell around BankAccountsPanel, for owner types managed in a table (no dedicated detail page) — e.g. Partner, Liability. */
export default function BankAccountsModal({ ownerType, ownerId, ownerName, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-slate-50 p-2 shadow-lg">
        <div className="mb-2 flex items-center justify-between px-4 pt-2">
          <h2 className="text-sm font-medium text-slate-500">Bank Accounts — {ownerName}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-200"><X className="h-5 w-5" /></button>
        </div>
        <BankAccountsPanel ownerType={ownerType} ownerId={ownerId} />
      </div>
    </div>
  );
}
