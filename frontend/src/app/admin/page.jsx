"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { LAND_REGISTRY_ADDRESS } from "../../contracts/addresses";
import { LAND_REGISTRY_ABI } from "../../contracts/LandRegistryABI";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkOwner();
      loadAllProperties();
    }
  }, [isConnected, address]);

  const checkOwner = async () => {
    if (!window.ethereum) return;
    
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        LAND_REGISTRY_ADDRESS,
        LAND_REGISTRY_ABI,
        provider
      );
      
      const ownerAddr = await contract.owner();
      setIsOwner(ownerAddr.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error("Error checking owner:", error);
    }
    setLoading(false);
  };

  const loadAllProperties = async () => {
    if (!window.ethereum) return;
    
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
          props.push({
            id: prop.id.toString(),
            location: prop.location,
            area: prop.area.toString(),
            owner: prop.propOwner,
            rowAffected: prop.rowAffected
          });
        } catch (err) {
          console.log(`Property ${i} error:`, err.message);
        }
      }
      
      setProperties(props);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  const handleToggleROW = async (propertyId, currentStatus) => {
    if (!window.ethereum) return;
    
    setUpdating(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        LAND_REGISTRY_ADDRESS,
        LAND_REGISTRY_ABI,
        signer
      );

      const tx = await contract.setROWFlag(propertyId, !currentStatus);
      await tx.wait();
      
      alert(`✅ ROW status updated for Property #${propertyId}`);
      loadAllProperties();
    } catch (error) {
      console.error("Error updating ROW flag:", error);
      alert("❌ Failed to update: " + (error.reason || error.message));
    }
    setUpdating(false);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to access admin panel</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You are not the contract owner</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
            👑 Owner
          </span>
        </div>
        <p className="text-gray-600">Manage ROW flags for all properties</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROW Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{prop.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {prop.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {prop.area} m²
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                    {prop.owner.slice(0, 6)}...{prop.owner.slice(-4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      prop.rowAffected 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {prop.rowAffected ? '⚠️ Affected' : '✓ Clear'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleROW(prop.id, prop.rowAffected)}
                      disabled={updating}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        updating
                          ? 'bg-gray-300 cursor-not-allowed'
                          : prop.rowAffected
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }`}
                    >
                      {prop.rowAffected ? 'Clear ROW' : 'Mark as ROW'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600">No properties registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}