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
        pageName="New Fundraise Opportunity"
        description="To effectively match you with a sponsorer, please fill in some details"
        breadcrumbs={[{name:"Dashboard",href:"/dashboard"},{name:"New Fundraise Opportunity",href:"/fundraiser/new"}]}
      />
    </>
  );
};

export default NewFundraiserPage;