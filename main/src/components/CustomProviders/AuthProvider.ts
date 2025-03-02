"use client"
import { signOut, useSession } from 'next-auth/react';
import { usePathname, redirect } from 'next/navigation';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext({});
const AuthZ_Public=["/","/signin","/signup"]

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
      const { data: session, status } = useSession();
      const currentRoute = usePathname();

    
      useEffect(()=>{
        if(status==='authenticated'){
            // If authenticated and on public route, redirect to dashboard
            if(AuthZ_Public.includes(currentRoute)){
                redirect('/dashboard')
            }
        } else if(status==='unauthenticated' && !AuthZ_Public.includes(currentRoute)) {
            // If unauthenticated and not on public route, redirect to signIn
            redirect('/')
        }
      },[session, status]);

    return children;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;