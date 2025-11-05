"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";
import PropertyCard from "../../components/PropertyCard";
import { LAND_REGISTRY_ADDRESS } from "../../contracts/addresses";
import { LAND_REGISTRY_ABI } from "../../contracts/LandRegistryABI";

export default function PropertiesPage() {
  const { account, isConnected } = useWallet();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    if (isConnected && account) {
      loadProperties();
    }
  }, [isConnected, account]);

  const loadProperties = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        LAND_REGISTRY_ADDRESS, 
        LAND_REGISTRY_ABI, 
        provider
      );
      
      const count = await contract.propertyCount();
      const props = [];
      
      for (let i = 1; i <= Number(count); i++) {
        try {
          const prop = await contract.getProperty(i);
          if (prop.propOwner.toLowerCase() === account.toLowerCase()) {
            props.push({
              id: prop.id.toString(),
              location: prop.location,
              area: prop.area.toString(),
              owner: prop.propOwner,
              rowAffected: prop.rowAffected
            });
          }
        } catch (err) {
          console.log(`Property ${i} error:`, err.message);
        }
      }
      
      setProperties(props);
    } catch (error) {
      console.error("Error loading properties:", error);
      alert("Failed to load properties: " + error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!window.ethereum || !location || !area) return;

    setRegistering(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        LAND_REGISTRY_ADDRESS, 
        LAND_REGISTRY_ABI, 
        signer
      );

      console.log("Registering property...");
      const tx = await contract.registerProperty(location, area);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Transaction confirmed!");
      
      alert("✅ Property registered successfully!");
      setLocation("");
      setArea("");
      loadProperties();
    } catch (error) {
      console.error("Error registering property:", error);
      alert("❌ Failed to register: " + (error.reason || error.message));
    }
    setRegistering(false);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to manage properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Properties</h1>
        <p className="text-gray-600">Manage and register your land properties</p>
      </div>
      
      {/* Register Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Register New Property</h2>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Location (e.g., 123 Main St, Mumbai)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={registering}
          />
          <input
            type="number"
            placeholder="Area (sq meters)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="1"
            disabled={registering}
          />
          <button
            type="submit"
            disabled={registering}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              registering 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {registering ? "Registering..." : "Register Property"}
          </button>
        </form>
      </div>

      {/* Properties List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Your Properties</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Properties Yet</h3>
            <p className="text-gray-600">Register your first property above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}