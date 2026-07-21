import { useEffect, useState } from 'react';

export default function RetainerBurnMonitor() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/retainer-burn-monitor')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-2">Retainer Burn Monitor</h2>
      <p className="text-gray-600 mb-6">Track client retainer consumption, margin exposure, and renewal risk.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {data && Object.entries(data.summary).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs uppercase text-gray-500">{key.split('_').join(' ')}</div>
            <div className="text-2xl font-bold">{String(value)}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        {(data?.clients || []).map((client: any) => (
          <div key={client.client} className="p-4 border-b border-gray-100 flex justify-between">
            <div>
              <div className="font-semibold">{client.client}</div>
              <div className="text-sm text-gray-600">${client.burned} burned of ${client.retainer}</div>
            </div>
            <div className="text-right text-sm">
              <div>{client.risk} risk</div>
              <div className="text-blue-700">{client.action}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
