"use client";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, ReactNode, useContext, useEffect } from "react";

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext({});
const publicRoutes = new Set(["/", "/contact", "/error", "/signin", "/signup"]);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
      const { data: session, status } = useSession();
      const currentRoute = usePathname();
      const router = useRouter();

    
      useEffect(()=>{
        if(status==='authenticated'){
            // If authenticated and on public route, redirect to dashboard
            if(currentRoute === "/signin" || currentRoute === "/signup"){
                router.replace("/dashboard");
            }
        } else if(status==='unauthenticated' && !publicRoutes.has(currentRoute)) {
            // If unauthenticated and not on public route, redirect to signIn
            router.replace("/signin");
        }
      },[currentRoute, router, session, status]);

    return children;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
