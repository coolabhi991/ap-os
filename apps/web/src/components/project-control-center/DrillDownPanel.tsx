import type { ReactNode } from "react";
import { X } from "lucide-react";
import { COST_HEAD_LABELS } from "../../services/project-control-center";
import type { CostHeadKey, DrillDownData, MaterialDrillDown, LabourDrillDown, ExpenseDrillDown, VendorBillsDrillDown } from "../../services/project-control-center";

interface Props {
  head: CostHeadKey;
  data: DrillDownData | null;
  loading: boolean;
  onClose: () => void;
}

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200">{children}</div>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-slate-500">No records.</td>
    </tr>
  );
}

function MaterialDrillDownView({ data }: { data: MaterialDrillDown }) {
  return (
    <>
      <Section title="Material Issues">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Issue #</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th></tr></thead>
          <tbody>
            {data.materialIssues.length === 0 ? <EmptyRow colSpan={4} /> : data.materialIssues.map((mi) => (
              <tr key={mi.id} className="border-t"><td className="px-3 py-2">{mi.issueNumber}</td><td className="px-3 py-2">{mi.issuedDate}</td><td className="px-3 py-2">{mi.itemName}</td><td className="px-3 py-2 text-right">{mi.quantity} {mi.unit ?? ""}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Material Receipts">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Receipt #</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
          <tbody>
            {data.materialReceipts.length === 0 ? <EmptyRow colSpan={5} /> : data.materialReceipts.map((mr) => (
              <tr key={mr.id} className="border-t"><td className="px-3 py-2">{mr.receiptNumber}</td><td className="px-3 py-2">{mr.receivedDate}</td><td className="px-3 py-2">{mr.itemName}</td><td className="px-3 py-2 text-right">{mr.quantity} {mr.unit ?? ""}</td><td className="px-3 py-2">{mr.status}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Vendor Bills (material-linked)">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Bill #</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Vendor</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
          <tbody>
            {data.vendorBills.length === 0 ? <EmptyRow colSpan={5} /> : data.vendorBills.map((vb) => (
              <tr key={vb.id} className="border-t"><td className="px-3 py-2">{vb.billNumber}</td><td className="px-3 py-2">{vb.billDate}</td><td className="px-3 py-2">{vb.vendor?.name ?? "—"}</td><td className="px-3 py-2 text-right">{inr(vb.totalAmount)}</td><td className="px-3 py-2">{vb.status}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}

function LabourDrillDownView({ data }: { data: LabourDrillDown }) {
  return (
    <>
      <Section title="Attendance (this Sub Work)">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Worker</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-right">Wage</th></tr></thead>
          <tbody>
            {data.attendance.length === 0 ? <EmptyRow colSpan={4} /> : data.attendance.map((a) => (
              <tr key={a.id} className="border-t"><td className="px-3 py-2">{a.attendanceDate}</td><td className="px-3 py-2">{a.labour?.name ?? "—"}</td><td className="px-3 py-2">{a.status}</td><td className="px-3 py-2 text-right">{inr(a.wageAmount)}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Advances (whole project — not Sub-Work specific)">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Worker</th><th className="px-3 py-2 text-left">Mode</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {data.advances.length === 0 ? <EmptyRow colSpan={4} /> : data.advances.map((a) => (
              <tr key={a.id} className="border-t"><td className="px-3 py-2">{a.advanceDate}</td><td className="px-3 py-2">{a.labour?.name ?? "—"}</td><td className="px-3 py-2">{a.mode}</td><td className="px-3 py-2 text-right">{inr(a.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Payments (whole project — not Sub-Work specific)">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Worker</th><th className="px-3 py-2 text-left">Mode</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {data.payments.length === 0 ? <EmptyRow colSpan={4} /> : data.payments.map((p) => (
              <tr key={p.id} className="border-t"><td className="px-3 py-2">{p.paymentDate}</td><td className="px-3 py-2">{p.labour?.name ?? "—"}</td><td className="px-3 py-2">{p.mode}</td><td className="px-3 py-2 text-right">{inr(p.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}

function ExpenseDrillDownView({ data, showMachineColumns }: { data: ExpenseDrillDown; showMachineColumns: boolean }) {
  return (
    <Section title="Expense Entries">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left">Expense #</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Vendor</th>
            {showMachineColumns && <th className="px-3 py-2 text-left">Machine</th>}
            {showMachineColumns && <th className="px-3 py-2 text-right">Hours</th>}
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.expenses.length === 0 ? (
            <EmptyRow colSpan={showMachineColumns ? 5 : 4} />
          ) : (
            data.expenses.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2">{e.expenseNumber}</td>
                <td className="px-3 py-2">{e.expenseDate}</td>
                <td className="px-3 py-2">{e.vendor?.name ?? "—"}</td>
                {showMachineColumns && <td className="px-3 py-2">{e.machineType ?? "—"}</td>}
                {showMachineColumns && <td className="px-3 py-2 text-right">{e.machineHours ?? "—"}</td>}
                <td className="px-3 py-2 text-right">{inr(e.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Section>
  );
}

function VendorBillsDrillDownView({ data }: { data: VendorBillsDrillDown }) {
  return (
    <>
      <Section title="Bills">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Bill #</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Vendor</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">Outstanding</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
          <tbody>
            {data.bills.length === 0 ? <EmptyRow colSpan={6} /> : data.bills.map((b) => (
              <tr key={b.id} className="border-t"><td className="px-3 py-2">{b.billNumber}</td><td className="px-3 py-2">{b.billDate}</td><td className="px-3 py-2">{b.vendor?.name ?? "—"}</td><td className="px-3 py-2 text-right">{inr(b.totalAmount)}</td><td className="px-3 py-2 text-right">{inr(b.outstandingBalance)}</td><td className="px-3 py-2">{b.status}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Payments">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Payment #</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Mode</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {data.payments.length === 0 ? <EmptyRow colSpan={4} /> : data.payments.map((p) => (
              <tr key={p.id} className="border-t"><td className="px-3 py-2">{p.paymentNumber}</td><td className="px-3 py-2">{p.paymentDate}</td><td className="px-3 py-2">{p.mode ?? "—"}</td><td className="px-3 py-2 text-right">{inr(p.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}

export default function DrillDownPanel({ head, data, loading, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{COST_HEAD_LABELS[head]} — Drill Down</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {loading && <div className="py-10 text-center text-slate-500">Loading...</div>}

        {!loading && data && head === "material" && <MaterialDrillDownView data={data as MaterialDrillDown} />}
        {!loading && data && head === "labour" && <LabourDrillDownView data={data as LabourDrillDown} />}
        {!loading && data && (head === "machinery" || head === "fuel" || head === "other" || head === "siteExpenses") && (
          <ExpenseDrillDownView data={data as ExpenseDrillDown} showMachineColumns={head === "machinery"} />
        )}
        {!loading && data && head === "vendorBills" && <VendorBillsDrillDownView data={data as VendorBillsDrillDown} />}
      </div>
    </div>
  );
}
