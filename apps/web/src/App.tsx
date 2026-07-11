import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

/* Projects */
import Projects from "./pages/projects/Projects";
import AddProject from "./pages/projects/AddProject";
import EditProject from "./pages/projects/EditProject";
import ViewProject from "./pages/projects/ViewProject";

/* Sites */
import AddSite from "./pages/sites/AddSite";
import EditSite from "./pages/sites/EditSite";
import SiteWorkspacePage from "./pages/sites/SiteWorkspacePage";

/* Clients */
import Clients from "./pages/clients/Clients";
import AddClient from "./pages/clients/AddClient";
import EditClient from "./pages/clients/EditClient";
import ViewClient from "./pages/clients/ViewClient";

/* Vendors */
import Vendors from "./pages/vendors/Vendors";
import AddVendor from "./pages/vendors/AddVendor";
import EditVendor from "./pages/vendors/EditVendor";
import ViewVendor from "./pages/vendors/ViewVendor";

/* Purchase Requisitions */
import PurchaseRequisitions from "./pages/purchase-requisitions/PurchaseRequisitions";
import AddPurchaseRequisition from "./pages/purchase-requisitions/AddPurchaseRequisition";
import EditPurchaseRequisition from "./pages/purchase-requisitions/EditPurchaseRequisition";
import ViewPurchaseRequisition from "./pages/purchase-requisitions/ViewPurchaseRequisition";

/* Purchase Orders */
import PurchaseOrders from "./pages/purchase-orders/PurchaseOrders";
import AddPurchaseOrder from "./pages/purchase-orders/AddPurchaseOrder";
import EditPurchaseOrder from "./pages/purchase-orders/EditPurchaseOrder";
import ViewPurchaseOrder from "./pages/purchase-orders/ViewPurchaseOrder";

/* Material Receipts */
import MaterialReceipts from "./pages/material-receipts/MaterialReceipts";
import AddMaterialReceipt from "./pages/material-receipts/AddMaterialReceipt";
import EditMaterialReceipt from "./pages/material-receipts/EditMaterialReceipt";
import ViewMaterialReceipt from "./pages/material-receipts/ViewMaterialReceipt";

/* Material Issues */
import MaterialIssues from "./pages/material-issues/MaterialIssues";
import AddMaterialIssue from "./pages/material-issues/AddMaterialIssue";
import EditMaterialIssue from "./pages/material-issues/EditMaterialIssue";
import ViewMaterialIssue from "./pages/material-issues/ViewMaterialIssue";
import MaterialIssuesDashboard from "./pages/material-issues/MaterialIssuesDashboard";
import MaterialIssueReports from "./pages/material-issues/MaterialIssueReports";

/* Inventory */
import Inventory from "./pages/inventory/Inventory";
import AddInventoryItem from "./pages/inventory/AddInventoryItem";
import EditInventoryItem from "./pages/inventory/EditInventoryItem";
import ViewInventoryItem from "./pages/inventory/ViewInventoryItem";
import InventoryDashboard from "./pages/inventory/InventoryDashboard";

/* Vendor Bills */
import VendorBills from "./pages/vendor-bills/VendorBills";
import AddVendorBill from "./pages/vendor-bills/AddVendorBill";
import EditVendorBill from "./pages/vendor-bills/EditVendorBill";
import ViewVendorBill from "./pages/vendor-bills/ViewVendorBill";
import VendorBillsDashboard from "./pages/vendor-bills/VendorBillsDashboard";

/* Vendor Payments */
import VendorPayments from "./pages/vendor-payments/VendorPayments";
import AddVendorPayment from "./pages/vendor-payments/AddVendorPayment";
import ViewVendorPayment from "./pages/vendor-payments/ViewVendorPayment";
import VendorPaymentsDashboard from "./pages/vendor-payments/VendorPaymentsDashboard";
import VendorLedger from "./pages/vendor-payments/VendorLedger";

/* Site Expenses */
import Expenses from "./pages/expenses/Expenses";
import AddExpense from "./pages/expenses/AddExpense";
import EditExpense from "./pages/expenses/EditExpense";
import ViewExpense from "./pages/expenses/ViewExpense";
import ExpensesDashboard from "./pages/expenses/ExpensesDashboard";
import ExpenseCategories from "./pages/expenses/ExpenseCategories";
import ExpenseReports from "./pages/expenses/ExpenseReports";

/* Labour Management */
import LabourGroups from "./pages/labour/LabourGroups";
import Labour from "./pages/labour/Labour";
import AddLabour from "./pages/labour/AddLabour";
import EditLabour from "./pages/labour/EditLabour";
import ViewLabour from "./pages/labour/ViewLabour";
import LabourContractors from "./pages/labour/LabourContractors";
import MarkAttendance from "./pages/labour/MarkAttendance";
import AttendanceRegister from "./pages/labour/AttendanceRegister";
import Advances from "./pages/labour/Advances";
import AddAdvance from "./pages/labour/AddAdvance";
import Payments from "./pages/labour/Payments";
import AddPayment from "./pages/labour/AddPayment";
import LabourDashboard from "./pages/labour/LabourDashboard";
import LabourReports from "./pages/labour/LabourReports";

/* Daily Progress Reports */
import DPRs from "./pages/dpr/DPRs";
import AddDPR from "./pages/dpr/AddDPR";
import EditDPR from "./pages/dpr/EditDPR";
import ViewDPR from "./pages/dpr/ViewDPR";

/* Measurement Books */
import MeasurementBooks from "./pages/measurement-books/MeasurementBooks";
import AddMB from "./pages/measurement-books/AddMB";
import EditMB from "./pages/measurement-books/EditMB";
import ViewMB from "./pages/measurement-books/ViewMB";
import MBReports from "./pages/measurement-books/MBReports";

/* Running Bills */
import RunningBills from "./pages/running-bills/RunningBills";
import AddRunningBill from "./pages/running-bills/AddRunningBill";
import EditRunningBill from "./pages/running-bills/EditRunningBill";
import ViewRunningBill from "./pages/running-bills/ViewRunningBill";
import RunningBillReports from "./pages/running-bills/RunningBillReports";

/* Banking */
import Banking from "./pages/banking/Banking";
import BankAccountStatement from "./pages/banking/BankAccountStatement";
import BankingReports from "./pages/banking/BankingReports";

/* AP AI */
import ApAi from "./pages/ai/ApAi";

/* Partnership */
import Partnership from "./pages/partnership/Partnership";

/* Finance */
import Finance from "./pages/finance/Finance";

/* Reports */
import Reports from "./pages/reports/Reports";
import VendorReports from "./pages/reports/VendorReports";

export default function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/" element={<Login />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Projects */}
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/new" element={<AddProject />} />
      <Route path="/projects/:id" element={<ViewProject />} />
      <Route path="/projects/:id/edit" element={<EditProject />} />

      {/* Sites */}
      <Route path="/projects/:projectId/sites/new" element={<AddSite />} />
      <Route path="/sites/:id" element={<SiteWorkspacePage />} />
      <Route path="/sites/:id/edit" element={<EditSite />} />

      {/* Clients */}
      <Route path="/clients" element={<Clients />} />
      <Route path="/clients/new" element={<AddClient />} />
      <Route path="/clients/:id" element={<ViewClient />} />
      <Route path="/clients/:id/edit" element={<EditClient />} />

      {/* Vendors */}
      <Route path="/vendors" element={<Vendors />} />
      <Route path="/vendors/new" element={<AddVendor />} />
      <Route path="/vendors/:id" element={<ViewVendor />} />
      <Route path="/vendors/:id/edit" element={<EditVendor />} />

      {/* Purchase Requisitions */}
      <Route path="/purchase-requisitions" element={<PurchaseRequisitions />} />
      <Route path="/purchase-requisitions/new" element={<AddPurchaseRequisition />} />
      <Route path="/purchase-requisitions/:id" element={<ViewPurchaseRequisition />} />
      <Route path="/purchase-requisitions/:id/edit" element={<EditPurchaseRequisition />} />

      {/* Purchase Orders */}
      <Route path="/purchase-orders" element={<PurchaseOrders />} />
      <Route path="/purchase-orders/new" element={<AddPurchaseOrder />} />
      <Route path="/purchase-orders/:id" element={<ViewPurchaseOrder />} />
      <Route path="/purchase-orders/:id/edit" element={<EditPurchaseOrder />} />

      {/* Vendor Payments */}
      <Route path="/vendor-payments" element={<VendorPayments />} />
      <Route path="/vendor-payments/new" element={<AddVendorPayment />} />
      <Route path="/vendor-payments/dashboard" element={<VendorPaymentsDashboard />} />
      <Route path="/vendor-payments/ledger" element={<VendorLedger />} />
      <Route path="/vendor-payments/:id" element={<ViewVendorPayment />} />

      {/* Site Expenses */}
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/expenses/new" element={<AddExpense />} />
      <Route path="/expenses/dashboard" element={<ExpensesDashboard />} />
      <Route path="/expenses/reports" element={<ExpenseReports />} />
      <Route path="/expenses/categories" element={<ExpenseCategories />} />
      <Route path="/expenses/:id" element={<ViewExpense />} />
      <Route path="/expenses/:id/edit" element={<EditExpense />} />

      {/* Labour Management */}
      <Route path="/labour" element={<Labour />} />
      <Route path="/labour/new" element={<AddLabour />} />
      <Route path="/labour/dashboard" element={<LabourDashboard />} />
      <Route path="/labour/reports" element={<LabourReports />} />
      <Route path="/labour/groups" element={<LabourGroups />} />
      <Route path="/labour/contractors" element={<LabourContractors />} />
      <Route path="/labour/attendance" element={<AttendanceRegister />} />
      <Route path="/labour/attendance/mark" element={<MarkAttendance />} />
      <Route path="/labour/advances" element={<Advances />} />
      <Route path="/labour/advances/new" element={<AddAdvance />} />
      <Route path="/labour/payments" element={<Payments />} />
      <Route path="/labour/payments/new" element={<AddPayment />} />
      <Route path="/labour/:id" element={<ViewLabour />} />
      <Route path="/labour/:id/edit" element={<EditLabour />} />

      {/* Material Receipts */}
      <Route path="/material-receipts" element={<MaterialReceipts />} />
      <Route path="/material-receipts/new" element={<AddMaterialReceipt />} />
      <Route path="/material-receipts/:id" element={<ViewMaterialReceipt />} />
      <Route path="/material-receipts/:id/edit" element={<EditMaterialReceipt />} />

      {/* Material Issues */}
      <Route path="/material-issues" element={<MaterialIssues />} />
      <Route path="/material-issues/new" element={<AddMaterialIssue />} />
      <Route path="/material-issues/dashboard" element={<MaterialIssuesDashboard />} />
      <Route path="/material-issues/reports" element={<MaterialIssueReports />} />
      <Route path="/material-issues/:id" element={<ViewMaterialIssue />} />
      <Route path="/material-issues/:id/edit" element={<EditMaterialIssue />} />

      {/* Inventory */}
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventory/new" element={<AddInventoryItem />} />
      <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
      <Route path="/inventory/:id" element={<ViewInventoryItem />} />
      <Route path="/inventory/:id/edit" element={<EditInventoryItem />} />

      {/* Vendor Bills */}
      <Route path="/vendor-bills" element={<VendorBills />} />
      <Route path="/vendor-bills/new" element={<AddVendorBill />} />
      <Route path="/vendor-bills/dashboard" element={<VendorBillsDashboard />} />
      <Route path="/vendor-bills/:id" element={<ViewVendorBill />} />
      <Route path="/vendor-bills/:id/edit" element={<EditVendorBill />} />

      {/* Daily Progress Reports */}
      <Route path="/dpr" element={<DPRs />} />
      <Route path="/dpr/new" element={<AddDPR />} />
      <Route path="/dpr/:id" element={<ViewDPR />} />
      <Route path="/dpr/:id/edit" element={<EditDPR />} />

      {/* Measurement Books */}
      <Route path="/measurement-books" element={<MeasurementBooks />} />
      <Route path="/measurement-books/new" element={<AddMB />} />
      <Route path="/measurement-books/reports" element={<MBReports />} />
      <Route path="/measurement-books/:id" element={<ViewMB />} />
      <Route path="/measurement-books/:id/edit" element={<EditMB />} />

      {/* Running Bills */}
      <Route path="/running-bills" element={<RunningBills />} />
      <Route path="/running-bills/new" element={<AddRunningBill />} />
      <Route path="/running-bills/reports" element={<RunningBillReports />} />
      <Route path="/running-bills/:id" element={<ViewRunningBill />} />
      <Route path="/running-bills/:id/edit" element={<EditRunningBill />} />

      {/* Banking */}
      <Route path="/banking" element={<Banking />} />
      <Route path="/banking/accounts/:id" element={<BankAccountStatement />} />
      <Route path="/banking/reports" element={<BankingReports />} />

      {/* AP AI */}
      <Route path="/ai" element={<ApAi />} />

      {/* Partnership */}
      <Route path="/partnership" element={<Partnership />} />

      {/* Finance */}
      <Route path="/finance" element={<Finance />} />

      {/* Reports */}
      <Route path="/reports" element={<Reports />} />
      <Route path="/reports/vendors" element={<VendorReports />} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}