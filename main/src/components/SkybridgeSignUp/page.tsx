"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const SkybridgeSignUp = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Fundraiser");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Sign up failed");
      }
    const data = await res.json();  
    localStorage.setItem("userId", data.userId);

      router.push("/dashboard");
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  return (
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="shadow-three mx-auto max-w-[500px] rounded bg-white px-6 py-10 dark:bg-dark sm:p-[60px]">
              <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Create your account
              </h3>
              <p className="mb-11 text-center text-base font-medium text-body-color">
                It’s totally free and super easy
              </p>
              {errorMsg && <p className="mb-4 text-center text-red-500">{errorMsg}</p>}
              <form onSubmit={handleSubmit}>
                <div className="mb-8">
                  <label htmlFor="name" className="mb-3 block text-sm text-dark dark:text-white">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none"
                    required
                  />
                </div>
                <div className="mb-8">
                  <label htmlFor="email" className="mb-3 block text-sm text-dark dark:text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none"
                    required
                  />
                </div>
                <div className="mb-8">
                  <label htmlFor="password" className="mb-3 block text-sm text-dark dark:text-white">
                    Your Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none"
                    required
                  />
                </div>
                <div className="mb-8">
                  <label htmlFor="role" className="mb-3 block text-sm text-dark dark:text-white">
                    Select Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none"
                  >
                    <option value="fundraiser">Fundraiser</option>
                    <option value="sponsorer">Sponsorer</option>
                  </select>
                </div>
                <div className="mb-6">
                  <button
                    type="submit"
                    className="w-full rounded-sm bg-primary px-9 py-4 text-base font-medium text-white hover:bg-primary/90"
                  >
                    Sign up
                  </button>
                </div>
              </form>
              <p className="text-center text-base font-medium text-body-color">
                Already using Skybridge? {" "}
                <Link href="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkybridgeSignUp;
