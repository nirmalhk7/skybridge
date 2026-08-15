"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import OccasionDetail from "@/components/SkybridgeOccasion/OccasionDetail";
import { useParams } from "next/navigation";

const FundraiserStatus = () => {
  const { fundraiserId } = useParams<{ fundraiserId: string }>();

  return (
    <>
      <Breadcrumb
        pageName="Opportunity Status"
        description="View the current status and details of this fundraising opportunity"
        breadcrumbs={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Opportunity Status", href: `/fundraiser/${fundraiserId}` },
        ]}
      />
      <OccasionDetail occasionId={fundraiserId} />
    </>
  );
};

export default FundraiserStatus;
