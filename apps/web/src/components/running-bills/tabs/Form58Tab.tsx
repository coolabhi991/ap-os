import type { RunningBill } from "../../../services/running-bills";
import { formatCurrency as inr } from "../../../lib/utils";

// Site -> Recapitulation -> Sub Work -> Items hierarchy — grouped for display, never a flat
// list, and never an "Unassigned" bucket (every item always belongs to a real Sub Work).
function groupItems(bill: RunningBill) {
  const order: string[] = [];
  const byKey = new Map<string, { key: string; subWorkName: string; items: typeof bill.items; current: number; previous: number; upToDate: number }>();
  for (const item of bill.items) {
    const key = item.subWorkId || item.subWorkName;
    if (!byKey.has(key)) {
      order.push(key);
      byKey.set(key, { key, subWorkName: item.subWorkName, items: [], current: 0, previous: 0, upToDate: 0 });
    }
    const group = byKey.get(key)!;
    group.items.push(item);
    group.current += Number(item.currentAmount);
    group.previous += Number(item.previousAmount);
    group.upToDate += Number(item.totalAmount);
  }
  return order.map((key) => byKey.get(key)!);
}

export default function Form58Tab({ bill }: { bill: RunningBill }) {
  const itemGroups = groupItems(bill);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Item Amount (Bill)</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{inr(bill.currentCertifiedAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs text-white/70">Bill Total (Final)</p>
          <p className="mt-1 text-lg font-bold text-white">{inr(bill.finalBillAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Above/Below %</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{Number(bill.tenderAboveBelowPercent) >= 0 ? "+" : ""}{bill.tenderAboveBelowPercent || 0}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">GST %</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{bill.gstPercent || 0}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Form No. 58 — Abstract of Items</h2>
        <div className="space-y-4">
          {itemGroups.map((group, groupIndex) => (
            <div key={group.key} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="bg-slate-800 px-3 py-2 text-sm font-semibold text-white">Sub Work No. {groupIndex + 1} : {group.subWorkName}</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-2 text-left">Sr No</th>
                      <th className="px-2 py-2 text-left">Item of Work</th>
                      <th className="px-2 py-2 text-left">Unit</th>
                      <th className="px-2 py-2 text-right">Rate</th>
                      <th className="px-2 py-2 text-right">Up To Date Qty</th>
                      <th className="px-2 py-2 text-right">Since Previous Qty</th>
                      <th className="px-2 py-2 text-right">Now To Pay Qty</th>
                      <th className="px-2 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-2 py-2">{i + 1}</td>
                        <td className="px-2 py-2">
                          {item.boqItemNo && <span className="mr-1 font-mono text-xs text-slate-400">{item.boqItemNo}</span>}
                          {item.boqDescription}
                        </td>
                        <td className="px-2 py-2">{item.unit}</td>
                        <td className="px-2 py-2 text-right">{inr(item.boqRate)}</td>
                        <td className="px-2 py-2 text-right">{Number(item.totalQuantity).toFixed(4)}</td>
                        <td className="px-2 py-2 text-right">{Number(item.previousQuantity).toFixed(4)}</td>
                        <td className="px-2 py-2 text-right font-medium">{Number(item.currentQuantity).toFixed(4)}</td>
                        <td className="px-2 py-2 text-right font-medium">{inr(item.currentAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-slate-50 font-bold">
                      <td className="px-2 py-2" colSpan={7}>Sub Work Total</td>
                      <td className="px-2 py-2 text-right">{inr(group.current)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
          <div className="flex justify-end rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-base font-bold">
            Grand Total of all Sub Works&nbsp;&nbsp;{inr(bill.currentCertifiedAmount)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Form 58 Calculation Flow</h2>
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Grand Total of Items</span><span className="font-medium">{inr(bill.currentCertifiedAmount)}</span></div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tender Above/Below Adjustment ({Number(bill.tenderAboveBelowPercent) >= 0 ? "+" : ""}{bill.tenderAboveBelowPercent || 0}%)</span>
              <span className="font-medium">{inr(bill.tenderAdjustmentAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2"><span className="text-slate-500">Adjusted Total</span><span className="font-medium">{inr(bill.adjustedTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">GST ({bill.gstPercent || 0}%)</span><span className="font-medium">{inr(bill.gstAmount)}</span></div>
            {Number(bill.gstDifferencePercent) !== 0 && (
              <>
                <div className="flex justify-between"><span className="text-slate-500">GST Difference ({bill.gstDifferencePercent}%)</span><span className="font-medium">{inr(bill.gstDifferenceAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total GST</span><span className="font-medium">{inr(bill.totalGstAmount)}</span></div>
              </>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-t pt-2 md:border-t-0 md:pt-0"><span className="text-slate-500">Gross Bill Amount</span><span className="font-medium">{inr(bill.grossBillAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Round Off</span><span className="font-medium">{inr(bill.roundOff)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Final Bill Amount</span><span>{inr(bill.finalBillAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Deductions</span><span className="font-medium text-red-600">− {inr(bill.totalDeductions)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold"><span>Net Payable</span><span>{inr(bill.netPayable)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
