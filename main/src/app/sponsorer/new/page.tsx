import Breadcrumb from "@/components/Common/Breadcrumb";
import SponsorerOccasion from "@/components/SkybridgeOccasion/SponsorerOccasion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const NewSponsorerPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="New Sponsor Opportunity"
        description="To effectively match you with an opportunity, please fill in some details"
        breadcrumbs={[{name:"Dashboard",href:"/dashboard"},{name:"New Sponsor Opportunity",href:"/sponsorer/new"}]}
      />
      <SponsorerOccasion />
    </>
  );
};

export default NewSponsorerPage;