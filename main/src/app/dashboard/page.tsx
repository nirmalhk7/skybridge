import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";
import SkybridgeOccasions from "@/components/SkybridgeOccasions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const DashboardPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Skybridge Dashboard"
        description="You're using a Fundraiser account"
      />

      <SkybridgeOccasions/>
    </>
  );
};

export default DashboardPage;