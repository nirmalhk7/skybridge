import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const NewSponsorerPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="New Fundraiser"
        description="To effectively match you with a sponsorer, please fill in some details"
      />
    </>
  );
};

export default NewSponsorerPage;