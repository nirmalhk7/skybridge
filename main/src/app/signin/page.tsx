import { Metadata } from "next";
import SkybridgeSignIn from "@/components/SkybridgeSignIn/page";

export const metadata: Metadata = {
  title: "Sign In Page | Free Next.js Template for Skybridge and SaaS",
  description: "This is Sign In Page for Skybridge Nextjs Template",
  // other metadata
};

const SigninPage = () => {
    return (<SkybridgeSignIn />);
};

export default SigninPage;
