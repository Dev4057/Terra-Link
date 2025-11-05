"use client";

import { useWallet } from "../context/WalletContext";

export default function Header() {
  const { account, connectWallet, disconnect, isConnected, chainId, switchToLocalhost } = useWallet();

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
      <div>
        <h1 className="text-xl font-bold text-blue-600">TerraLink</h1>
        <p className="text-gray-500 text-sm">Land & Escrow Management</p>
      </div>
      
      <div className="flex items-center gap-3">
        {isConnected && chainId !== 31337 && (
          <button
            onClick={switchToLocalhost}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition"
          >
            Switch to Localhost
          </button>
        )}
        
        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Connected</p>
              <p className="text-sm font-mono font-semibold text-gray-800">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}