"use client";
import { useSession } from "next-auth/react";
import { BrowserProvider, ContractFactory, parseEther } from "ethers";
import React, { useEffect, useState } from "react";
import {
  GetCountries,
  GetState,
} from "react-country-state-city";

const SponsorerOccasion: React.FC<{ viewOnly?: boolean }> = ({
  viewOnly = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    typePreference: "scholarships",
    countryPreference: "233",
    statePreference: "1450",
    agePreference: "10-20",
    message: "",
  });

  const [searchResults, setSearchResults] = useState([]);

  const { data: session, status } = useSession();
  useEffect(() => {
    if (session) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name,
        email: session.user.email,
      }));
    }
  }, [session, status]);

  const [countriesList, setCountriesList] = useState([]);
  const [stateList, setStateList] = useState([]);

  // Load countries on mount
  useEffect(() => {
    GetCountries().then((result) => {
      setCountriesList(result);
      if (result.length > 0 && !formData.countryPreference) {
        setFormData((prev) => ({
          ...prev,
          countryPreference: result[0].id.toString(),
        }));
      }
    });
  }, []);

  // Load states when countryPreference changes
  useEffect(() => {
    if (formData.countryPreference) {
      GetState(Number(formData.countryPreference)).then((result) => {
        setStateList(result);
        if (result.length > 0 && !formData.statePreference) {
          setFormData((prev) => ({
            ...prev,
            statePreference: result[0].id.toString(),
          }));
        }
      });
    }
  }, [formData.countryPreference]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApproval = async (e: React.MouseEvent, occasionId: string) => {
    e.preventDefault();
    if (!session?.user?.id) {
      alert("Please sign in before approving an opportunity.");
      return;
    }

    try {
      const response = await fetch("/api/updateOccasion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasionId,
          occasionData: { status: "Approved" },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Unable to approve opportunity");
      }
      setSearchResults((current: any[]) =>
        current.map((row) =>
          String(row.occasion.id) === String(occasionId)
            ? { ...row, occasion: { ...row.occasion, status: "Approved" } }
            : row,
        ),
      );
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error("Connect a browser wallet to deploy the sponsorship agreement.");
      }
      const durationSeconds = Math.round(Number(durationDays) * 24 * 60 * 60);
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        throw new Error("Agreement duration must be greater than zero.");
      }
      const amountInWei = parseEther(amountInEther).toString();
      const prepareResponse = await fetch("/api/deployContract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          occasionId,
          amountInWei,
          durationSeconds,
        }),
      });
      const prepared = await prepareResponse.json().catch(() => ({}));
      if (!prepareResponse.ok) {
        throw new Error(prepared.error || "Unable to prepare sponsorship agreement");
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== prepared.deployment.from.toLowerCase()) {
        throw new Error("Connected wallet does not match the sponsor account.");
      }
      const factory = new ContractFactory(
        prepared.deployment.abi,
        prepared.deployment.bytecode,
        signer,
      );
      const contract = await factory.deploy(
        ...prepared.deployment.constructorArgs,
        { value: BigInt(prepared.deployment.value) },
      );
      await contract.waitForDeployment();
      const transactionHash = contract.deploymentTransaction()?.hash;
      if (!transactionHash) throw new Error("Wallet did not return a deployment transaction.");
      const network = await provider.getNetwork();
      const recordResponse = await fetch("/api/deployContract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recordDeployment",
          agreementId: prepared.agreementId,
          contractAddress: await contract.getAddress(),
          transactionHash,
          chainId: network.chainId.toString(),
        }),
      });
      const recorded = await recordResponse.json().catch(() => ({}));
      if (!recordResponse.ok) {
        throw new Error(recorded.error || "Agreement deployed but could not be recorded");
      }
      alert(
        `Agreement deployed. Contact ${result.fundraiser?.email || "the fundraiser"} for acceptance.`,
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to approve opportunity");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      alert("Please sign in before searching for opportunities.");
      return;
    }
    const searchParams = new URLSearchParams({
      agePreference: formData.agePreference,
      countryPreference: formData.countryPreference,
      statePreference: formData.statePreference,
      typePreference: formData.typePreference,
      status: "Searching",
    });

    try {
      const response = await fetch(`/api/searchOccasion?${searchParams.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to search opportunities");
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
    }
  };

  return (
    <div className="container">
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div
            className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
            data-wow-delay=".15s"
          >
            <form onSubmit={handleSubmit}>
              <div className="-mx-4 flex flex-wrap">
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="name"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Organization&apos;s Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.name}
                      disabled={viewOnly}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="email"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Organization Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.email}
                      disabled={viewOnly}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="type-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Type Preference
                    </label>
                    <select
                      id="type-preference"
                      name="typePreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.typePreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      <option value="scholarships">Scholarships</option>
                      <option value="events">Events</option>
                      <option value="research-groups">Research Groups</option>
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="country-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Country Preference
                    </label>
                    <select
                      id="country-preference"
                      name="countryPreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.countryPreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      {countriesList.map((countryInfo) => (
                        <option key={countryInfo.id} value={countryInfo.id}>
                          {countryInfo.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="state-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      State Preference
                    </label>
                    <select
                      id="state-preference"
                      name="statePreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.statePreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      {stateList.map((stateInfo) => (
                        <option key={stateInfo.id} value={stateInfo.id}>
                          {stateInfo.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="age-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Age Preference
                    </label>
                    <select
                      id="age-preference"
                      name="agePreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.agePreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        const start = i * 10 + 10;
                        const end = start + 9;
                        return (
                          <option key={i} value={`${start}-${end}`}>
                            {`${start}-${end}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label htmlFor="amount-in-ether" className="mb-3 block text-sm font-medium text-dark dark:text-white">
                      Sponsorship amount (ETH)
                    </label>
                    <input
                      id="amount-in-ether"
                      type="number"
                      min="0.000000000000000001"
                      step="any"
                      value={amountInEther}
                      disabled={viewOnly}
                      onChange={(event) => setAmountInEther(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label htmlFor="duration-days" className="mb-3 block text-sm font-medium text-dark dark:text-white">
                      Agreement duration (days)
                    </label>
                    <input
                      id="duration-days"
                      type="number"
                      min="1"
                      step="1"
                      value={durationDays}
                      disabled={viewOnly}
                      onChange={(event) => setDurationDays(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="w-full px-4">
                  <button className="rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark">
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div
            className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
            data-wow-delay=".15s"
          >
            <h3>Search Results</h3>
            <table className="min-w-full divide-y divide-gray-200 dark:bg-gray-dark">
              <thead>
                <tr>
                  <th>userid</th>
                  <th>message</th>
                  <th>score</th>
                  <th>status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(searchResults) && searchResults.length > 0 ? (
                  searchResults.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <button className="bg-gray-light text-black hover:text-white dark:bg-[#2C303B] dark:text-white dark:hover:bg-primary">
                          {row.userId}
                        </button>
                      </td>
                      <td className="max-w-xs whitespace-normal break-words">
                        {row.occasion.message}
                      </td>
                      <td>{row.occasion.score}</td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => handleApproval(e, row.occasion.id)}
                          disabled={row.occasion.status !== "Searching"}
                          className="bg-white text-black"
                        >
                          {row.occasion.status === "Searching"
                            ? "Approve?"
                            : "Approved"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No search results found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorerOccasion;
