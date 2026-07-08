    import { useState } from "react";
import type { ProjectFormData } from "../../services/projects";

    interface Props {
    initialData?: Partial<ProjectFormData>;
    onSubmit: (data: ProjectFormData) => void;
    saving?: boolean;
    }

    export default function ProjectForm({
    initialData,
    onSubmit,
    saving = false,
    }: Props) {
    const [form, setForm] = useState<ProjectFormData>({
        name: initialData?.name ?? "",
        code: initialData?.code ?? "",
        clientName: initialData?.clientName ?? "",
        projectTypeName: initialData?.projectTypeName ?? "",
        contractValue: initialData?.contractValue ?? "",
        manager: initialData?.manager ?? "",
        startDate: initialData?.startDate ?? "",
        endDate: initialData?.endDate ?? "",
        status: initialData?.status ?? "PLANNING",
        description: initialData?.description ?? "",
        location: initialData?.location ?? "",
    });

    const handleChange = (
        e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setForm({
        ...form,
        [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl bg-white p-8 shadow"
        >
        <div className="grid gap-6 md:grid-cols-2">

            <div>
            <label className="mb-2 block font-medium">
                Project Name
            </label>

            <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Project Code
            </label>

            <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Client
            </label>

            <input
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Project Type
            </label>

            <input
                name="projectTypeName"
                value={form.projectTypeName}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Contract Value (₹ Cr)
            </label>

            <input
                name="contractValue"
                value={form.contractValue}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Project Manager
            </label>

            <input
                name="manager"
                value={form.manager}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Start Date
            </label>

            <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                End Date
            </label>

            <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

        </div>

        <div>
            <label className="mb-2 block font-medium">
            Status
            </label>

            <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
            >
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            </select>
        </div>

        <div>
            <label className="mb-2 block font-medium">
            Description
            </label>

            <textarea
            rows={5}
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
            />
        </div>

        <div className="flex justify-end gap-4">

            <button
            type="button"
            className="rounded-lg border px-6 py-3"
            >
            Cancel
            </button>

            <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
            >
            {saving ? "Saving..." : "Save Project"}
            </button>

        </div>

        </form>
    );
    }