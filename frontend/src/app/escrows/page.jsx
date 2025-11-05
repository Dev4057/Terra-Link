"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";
import EscrowCard from "../../components/EscrowCard";
import { LAND_REGISTRY_ADDRESS, ROW_ESCROW_ADDRESS } from "../../contracts/addresses";
import { LAND_REGISTRY_ABI } from "../../contracts/LandRegistryABI";
import { ROW_ESCROW_ABI } from "../../contracts/ROWEscrowABI";

export default function EscrowsPage() {
  const { account, isConnected } = useWallet();
  const [escrows, setEscrows] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form states
  const [selectedProperty, setSelectedProperty] = useState("");
  const [payeeAddress, setPayeeAddress] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isConnected && account) {
      loadData();
    }
  }, [isConnected, account]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadEscrows(),
      loadROWProperties(),
      checkAdmin()
    ]);
    setLoading(false);
  };

  const checkAdmin = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const escrowContract = new ethers.Contract(
        ROW_ESCROW_ADDRESS,
        ROW_ESCROW_ABI,
        provider
      );
      const adminAddr = await escrowContract.admin();
      setIsAdmin(adminAddr.toLowerCase() === account.toLowerCase());
    } catch (error) {
      console.error("Error checking admin:", error);
    }
  };

  const loadEscrows = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        ROW_ESCROW_ADDRESS,
        ROW_ESCROW_ABI,
        provider
      );
      
      const count = await contract.escrowCount();
      const escs = [];
      
      for (let i = 1; i <= Number(count); i++) {
        try {
          const esc = await contract.escrows(i);
          if (esc.exists) {
            escs.push({
              id: esc.id.toString(),
              propertyId: esc.propertyId.toString(),
              payer: esc.payer,
              payee: esc.payee,
              amount: esc.amount.toString(),
              released: esc.released,
              createdAt: esc.createdAt.toString()
            });
          }
        } catch (err) {
          console.log(`Escrow ${i} error:`, err.message);
        }
      }
      
      setEscrows(escs);
    } catch (error) {
      console.error("Error loading escrows:", error);
    }
  };

  const loadROWProperties = async () => {
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
          if (prop.rowAffected) {
            props.push({
              id: prop.id.toString(),
              location: prop.location,
              owner: prop.propOwner
            });
          }
        } catch (err) {
          console.log(`Property ${i} error:`, err.message);
        }
      }
      
      setProperties(props);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  const handleCreateEscrow = async (e) => {
    e.preventDefault();
    if (!window.ethereum || !selectedProperty || !payeeAddress || !amount) return;

    setCreating(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        ROW_ESCROW_ADDRESS,
        ROW_ESCROW_ABI,
        signer
      );

      const amountWei = ethers.parseEther(amount);
      
      console.log("Creating escrow...");
      const tx = await contract.createEscrow(selectedProperty, payeeAddress, {
        value: amountWei
      });
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Escrow created!");
      
      alert("✅ Escrow created successfully!");
      setSelectedProperty("");
      setPayeeAddress("");
      setAmount("");
      loadEscrows();
    } catch (error) {
      console.error("Error creating escrow:", error);
      alert("❌ Failed to create escrow: " + (error.reason || error.message));
    }
    setCreating(false);
  };

  const handleReleaseFunds = async (escrowId) => {
    if (!window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        ROW_ESCROW_ADDRESS,
        ROW_ESCROW_ABI,
        signer
      );

      const tx = await contract.releaseFunds(escrowId);
      await tx.wait();
      
      alert("✅ Funds released successfully!");
      loadEscrows();
    } catch (error) {
      console.error("Error releasing funds:", error);
      alert("❌ Failed to release: " + (error.reason || error.message));
    }
  };

  const handleRefund = async (escrowId) => {
    if (!window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        ROW_ESCROW_ADDRESS,
        ROW_ESCROW_ABI,
        signer
      );

      const tx = await contract.refundEscrow(escrowId);
      await tx.wait();
      
      alert("✅ Escrow refunded successfully!");
      loadEscrows();
    } catch (error) {
      console.error("Error refunding:", error);
      alert("❌ Failed to refund: " + (error.reason || error.message));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to manage escrows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Escrow Management</h1>
        <p className="text-gray-600">Create and manage escrow payments for ROW properties</p>
        {isAdmin && (
          <div className="mt-2 inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
            👑 Admin
          </div>
        )}
      </div>
      
      {/* Create Escrow Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Create New Escrow</h2>
        <form onSubmit={handleCreateEscrow} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                const prop = properties.find(p => p.id === e.target.value);
                if (prop) setPayeeAddress(prop.owner);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={creating}
            >
              <option value="">Select ROW Property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>
                  Property #{prop.id} - {prop.location}
                </option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Payee Address"
              value={payeeAddress}
              onChange={(e) => setPayeeAddress(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={creating}
            />
            
            <input
              type="number"
              placeholder="Amount (ETH)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              step="0.001"
              min="0.001"
              disabled={creating}
            />
          </div>
          
          <button
            type="submit"
            disabled={creating}
            className={`w-full px-6 py-2 rounded-lg font-medium transition ${
              creating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {creating ? "Creating Escrow..." : "Create Escrow"}
          </button>
        </form>
      </div>

      {/* Escrows List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 All Escrows</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading escrows...</p>
          </div>
        ) : escrows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Escrows Yet</h3>
            <p className="text-gray-600">Create your first escrow above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {escrows.map((esc) => (
              <EscrowCard 
                key={esc.id} 
                escrow={esc}
                onRefund={handleRefund}
                onRelease={handleReleaseFunds}
                isAdmin={isAdmin}
                userAddress={account}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}