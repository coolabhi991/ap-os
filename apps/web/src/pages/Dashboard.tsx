import Layout from "../components/layout/Layout";
import StatCard from "../components/dashboard/StatCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import RecentActivity from "../components/dashboard/RecentActivity";

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Construction Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Welcome back, Abhijit.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Projects" value="18" subtitle="7 Active" />
          <StatCard title="Clients" value="26" subtitle="3 New" />
          <StatCard title="Pending Bills" value="₹2.60 Cr" subtitle="Awaiting Approval" />
          <StatCard title="Employees" value="42" subtitle="38 Present" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>

          <RecentActivity />
        </div>
      </div>
    </Layout>
  );
}