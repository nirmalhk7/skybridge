import { Metadata } from "next";
import SkybridgeSignUp from "@/components/SkybridgeSignUp/page";

export const metadata: Metadata = {
  title: "Sign Up Page | Free Next.js Template for Skybridge and SaaS",
  description: "This is Sign Up Page for Skybridge Nextjs Template",
  // other metadata
};

const SignupPage = () => {
    return (<SkybridgeSignUp />);
};

export default SignupPage;
