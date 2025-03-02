import Breadcrumb from "@/components/Common/Breadcrumb";
import FundraiserOccasion from "@/components/SkybridgeOccasion/FundraiserOccasion";
import { Metadata } from "next";
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
};

const FundraiserStatus = ({
  params,
}: {
  params: Promise<{ fundraiserId: string }>;
}) => {
  return (
    <>
      {params.then(({ fundraiserId }) => (
        <>
          <Breadcrumb
            pageName="Opportunity Status"
            description={`View status of current / previous fundraising opportunity "${fundraiserId}"`}
            breadcrumbs={[
              { name: "Dashboard", href: "/dashboard" },
              { name: "Opportunity Status", href: "/fundraiser/new" },
            ]}
          />
          <FundraiserOccasion viewOnly={true} />
        </>
      )).catch(e=>redirect("/dashboard"))}
    </>
  );
};

export default FundraiserStatus;
