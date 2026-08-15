"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import OccasionDetail from "@/components/SkybridgeOccasion/OccasionDetail";
import { useParams } from "next/navigation";

const SponsorerStatus = () => {
  const { sponsorerId } = useParams<{ sponsorerId: string }>();

  return (
    <>
      <Breadcrumb
        pageName="Match Status"
        description="View the current status and details of this sponsorship match"
        breadcrumbs={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Match Status", href: `/sponsorer/${sponsorerId}` },
        ]}
      />
      <OccasionDetail occasionId={sponsorerId} />
    </>
  );
};

export default SponsorerStatus;
