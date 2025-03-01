import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const NewFundraiserPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="New Sponsor Opportunity"
        description="To effectively match you with an opportunity, please fill in some details"
      />
    </>
  );
};

export default NewFundraiserPage;