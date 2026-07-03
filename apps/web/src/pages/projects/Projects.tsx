import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectFilters from "../../components/projects/ProjectFilters";
import ProjectTable from "../../components/projects/ProjectTable";

import {
  getProjects,
  deleteProject,
} from "../../services/projects";

import type { Project } from "../../services/projects";

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setProjects(getProjects());
  }, [location.pathname]);

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    deleteProject(id);
    setProjects(getProjects());
  };

  const filteredProjects = projects.filter((project) => {
    const keyword = search.toLowerCase();

    return (
      project.name.toLowerCase().includes(keyword) ||
      project.client.toLowerCase().includes(keyword) ||
      project.code.toLowerCase().includes(keyword)
    );
  });

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Projects
            </h1>

            <p className="mt-2 text-slate-500">
              Manage all construction projects.
            </p>
          </div>

          <button
            onClick={() => navigate("/projects/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Project
          </button>

        </div>

        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
        />

        <ProjectTable
          projects={filteredProjects}
          onView={(id) => navigate(`/projects/${id}`)}
          onEdit={(id) => navigate(`/projects/${id}/edit`)}
          onDelete={handleDelete}
        />

      </div>
    </Layout>
  );
}