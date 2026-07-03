    import { useState } from "react";

    export interface ProjectFormData {
    name: string;
    code: string;
    client: string;
    projectType: string;
    budget: string;
    manager: string;
    startDate: string;
    endDate: string;
    status: string;
    description: string;
    }

    interface Props {
    initialData?: Partial<ProjectFormData>;
    onSubmit: (data: ProjectFormData) => void;
    }

    export default function ProjectForm({
    initialData,
    onSubmit,
    }: Props) {
    const [form, setForm] = useState<ProjectFormData>({
        name: initialData?.name ?? "",
        code: initialData?.code ?? "",
        client: initialData?.client ?? "",
        projectType: initialData?.projectType ?? "",
        budget: initialData?.budget ?? "",
        manager: initialData?.manager ?? "",
        startDate: initialData?.startDate ?? "",
        endDate: initialData?.endDate ?? "",
        status: initialData?.status ?? "Planning",
        description: initialData?.description ?? "",
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
                name="client"
                value={form.client}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Project Type
            </label>

            <input
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
            />
            </div>

            <div>
            <label className="mb-2 block font-medium">
                Budget
            </label>

            <input
                name="budget"
                value={form.budget}
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
            <option>Planning</option>
            <option>Running</option>
            <option>On Hold</option>
            <option>Completed</option>
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
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
            Save Project
            </button>

        </div>

        </form>
    );
    }