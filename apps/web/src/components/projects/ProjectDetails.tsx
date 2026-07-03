import Layout from "../../components/layout/Layout";
import ProjectInfo from "../../components/projects/ProjectInfo";

export default function ProjectDetails() {
  return (
    <Layout>
      <div className="space-y-6">
        <ProjectInfo
          projectName="Water Supply Project - Nashik"
          status="Running"
          client="XYZ Infrastructure Pvt Ltd"
          manager="Abhijit Patil"
          budget="₹27 Cr"
          spent="₹18.4 Cr"
          startDate="01 Jan 2026"
          endDate="31 Dec 2026"
        />
      </div>
    </Layout>
  );
}