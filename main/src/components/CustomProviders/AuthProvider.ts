"use client"
import { signOut, useSession } from 'next-auth/react';
import { usePathname, redirect } from 'next/navigation';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext({});
const AUTHZ = {
    Fundraiser: ["/dashboard"],
    Sponsorer: ["/dashboard"],
    PUBLIC: ["/","/signin","/signup"]
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
      const [username, setUsername]= useState(null);
      const { data: session, status } = useSession();
      const currentRoute = usePathname();

    
      useEffect(()=>{
        if(status==='authenticated'){
            console.log('authenticated',session,  currentRoute);
            if(currentRoute in AUTHZ[session.user.role]){
                setUsername(session.user.name);
            }
            else {
                // redirect('/dashboard')
            }
        } else if(status==='unauthenticated' && !AUTHZ.PUBLIC.includes(currentRoute)) {
          redirect('/signin')
        }
      },[session, status]);

    return children;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;