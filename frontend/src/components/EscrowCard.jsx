"use client";

import { ethers } from "ethers";

export default function EscrowCard({ escrow, onRefund, onRelease, isAdmin, userAddress }) {
  const amount = ethers.formatEther(escrow.amount);
  const date = new Date(Number(escrow.createdAt) * 1000).toLocaleDateString();
  
  const canRefund = !escrow.released && (
    escrow.payer.toLowerCase() === userAddress?.toLowerCase() || isAdmin
  );
  
  const canRelease = !escrow.released && isAdmin;

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
      escrow.released ? 'border-green-500' : 'border-yellow-500'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Escrow #{escrow.id}</h3>
          <p className="text-sm text-gray-500">Property #{escrow.propertyId}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          escrow.released 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {escrow.released ? '✓ Released' : '⏳ Pending'}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
          <p className="text-2xl font-bold text-blue-600">{amount} ETH</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payer</p>
            <p className="font-mono text-xs text-gray-600 break-all">
              {escrow.payer.slice(0, 6)}...{escrow.payer.slice(-4)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payee</p>
            <p className="font-mono text-xs text-gray-600 break-all">
              {escrow.payee.slice(0, 6)}...{escrow.payee.slice(-4)}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
          <p className="text-sm text-gray-700">{date}</p>
        </div>
      </div>

      {!escrow.released && (
        <div className="flex gap-2 pt-4 border-t">
          {canRefund && (
            <button
              onClick={() => onRefund(escrow.id)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              Refund
            </button>
          )}
          {canRelease && (
            <button
              onClick={() => onRelease(escrow.id)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
            >
              Release Funds
            </button>
          )}
        </div>
      )}
    </div>
  );
}