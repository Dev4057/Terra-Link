export default function PropertyCard({ property }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-800">Property #{property.id}</h3>
        {property.rowAffected && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded">
            ⚠️ ROW
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</p>
          <p className="font-medium text-gray-800">{property.location}</p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Area</p>
          <p className="font-medium text-gray-800">{property.area} sq meters</p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Owner</p>
          <p className="font-mono text-xs text-gray-600 break-all">
            {property.owner}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <span className={`text-xs px-2 py-1 rounded ${
            property.rowAffected 
              ? 'bg-red-50 text-red-600' 
              : 'bg-green-50 text-green-600'
          }`}>
            {property.rowAffected ? '🚧 Affected by ROW' : '✓ Clear'}
          </span>
        </div>
      </div>
    </div>
  );
}