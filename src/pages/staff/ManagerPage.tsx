import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

const ManagerPage = () => {
  return (
    <div className="h-full w-full">
      <DashboardOverview basePath="/staff/manager" />
    </div>
  );
};

export default ManagerPage;
