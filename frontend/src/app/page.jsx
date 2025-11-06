"use client";

import Link from "next/link";
import { useWallet } from "../context/WalletContext";

export default function HomePage() {
  const { isConnected } = useWallet();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">TerraLink</span> 🌍
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your decentralized land registry and escrow management platform
        </p>
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
            <p className="text-yellow-800">
              👆 Connect your wallet to get started
            </p>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <Link href="/properties">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-500">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Properties</h2>
            <p className="text-gray-600">
              Register and manage your land properties on the blockchain
            </p>
          </div>
        </Link>

        <Link href="/escrows">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-500">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Escrows</h2>
            <p className="text-gray-600">
              Create and manage secure escrow payments for ROW properties
            </p>
          </div>
        </Link>

        <Link href="/admin">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-500">
            <div className="text-5xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Admin</h2>
            <p className="text-gray-600">
              Manage ROW flags and administrative functions
            </p>
          </div>
        </Link>
      </div>

      {/* Info Boxes */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🔗 Blockchain Powered
          </h3>
          <p className="text-blue-800 text-sm">
            All property records are stored immutably on Ethereum, ensuring transparency and security
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            🛡️ Secure Escrows
          </h3>
          <p className="text-green-800 text-sm">
            Smart contract escrows protect both buyers and sellers with automated fund management
          </p>
        </div>
      </div>

      {/* Instructions */}
      {isConnected && (
        <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Quick Start Guide</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">1</span>
              <span>Go to <strong>Properties</strong> page and register your land</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">2</span>
              <span>If you're the admin, go to <strong>Admin</strong> panel to mark properties as ROW affected</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">3</span>
              <span>Create <strong>Escrows</strong> for ROW properties to secure compensation payments</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">4</span>
              <span>Admin can release funds when conditions are met</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}