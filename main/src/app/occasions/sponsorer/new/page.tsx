import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";
import SkybridgeOccasions from "@/components/SkybridgeOccasions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const NewSponsorerPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="New Fundraiser"
        description=""
      />

      <SkybridgeOccasions/>
    </>
  );
};

export default NewSponsorerPage;