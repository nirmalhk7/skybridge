import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";
import SkybridgeOccasions from "@/components/SkybridgeOccasions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const NewFundraiserPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="New Sponsor Opportunity"
        description=""
      />

      <SkybridgeOccasions/>
    </>
  );
};

export default NewFundraiserPage;