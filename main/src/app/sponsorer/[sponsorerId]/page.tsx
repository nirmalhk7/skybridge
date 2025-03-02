import Breadcrumb from "@/components/Common/Breadcrumb";
import SponsorerOccasion from "@/components/SkybridgeOccasion/SponsorerOccasion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const SponsorerStatus = () => {
  return (
    <>
      <Breadcrumb
        pageName="Opportunity Status"
        description="View status of current / previous fundraising opportunity"
        breadcrumbs={[{name:"Dashboard",href:"/dashboard"},{name:"New Fundraise Opportunity",href:"/fundraiser/new"}]}
      />
      <SponsorerOccasion />
    </>
  );
};

export default SponsorerStatus;