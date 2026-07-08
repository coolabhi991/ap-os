import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

/* Projects */
import Projects from "./pages/projects/Projects";
import AddProject from "./pages/projects/AddProject";
import EditProject from "./pages/projects/EditProject";
import ViewProject from "./pages/projects/ViewProject";
import Documents from "./pages/projects/Documents";

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
      <Route
        path="/projects/:id/documents"
        element={<Documents />}
      />

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

      {/* Material Receipts */}
      <Route path="/material-receipts" element={<MaterialReceipts />} />
      <Route path="/material-receipts/new" element={<AddMaterialReceipt />} />
      <Route path="/material-receipts/:id" element={<ViewMaterialReceipt />} />
      <Route path="/material-receipts/:id/edit" element={<EditMaterialReceipt />} />

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

      {/* Default */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}