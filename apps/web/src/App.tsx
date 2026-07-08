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

      {/* Default */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}