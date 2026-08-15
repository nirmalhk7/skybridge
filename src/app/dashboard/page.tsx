import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";
import SkybridgeOccasions from "@/components/SkybridgeAllOccasions";


export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const DashboardPage = () => {
  
// TODO Change status between Fundraiser and Sponsorer
  return (
    <>
      <SkybridgeOccasions/>
    </>
  );
};

export default DashboardPage;