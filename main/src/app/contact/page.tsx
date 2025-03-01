import Breadcrumb from "@/components/Common/Breadcrumb";


import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Page | Free Next.js Template for Skybridge and SaaS",
  description: "This is Contact Page for Skybridge Nextjs Template",
  // other metadata
};

const ContactPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Contact Page"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In varius eros eget sapien consectetur ultrices. Ut quis dapibus libero."
      />
    </>
  );
};

export default ContactPage;
