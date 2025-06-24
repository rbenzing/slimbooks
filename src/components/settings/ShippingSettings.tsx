
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface ShippingRate {
  id: string;
  name: string;
  amount: number;
  isDefault: boolean;
}

export const ShippingSettings = () => {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', amount: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('shipping_rates');
    if (saved) {
      setShippingRates(JSON.parse(saved));
    } else {
      const defaultRates = [
        { id: '1', name: 'No Shipping', amount: 0, isDefault: true },
        { id: '2', name: 'Standard Shipping', amount: 10, isDefault: false },
        { id: '3', name: 'Express Shipping', amount: 25, isDefault: false },
        { id: '4', name: 'Overnight Shipping', amount: 50, isDefault: false }
      ];
      setShippingRates(defaultRates);
      localStorage.setItem('shipping_rates', JSON.stringify(defaultRates));
    }
  }, []);

  const saveShippingRates = (rates: ShippingRate[]) => {
    setShippingRates(rates);
    localStorage.setItem('shipping_rates', JSON.stringify(rates));
  };

  const addShippingRate = () => {
    const newRate: ShippingRate = {
      id: Date.now().toString(),
      name: 'New Shipping Rate',
      amount: 0,
      isDefault: false
    };
    const updated = [...shippingRates, newRate];
    saveShippingRates(updated);
    setIsEditing(newRate.id);
    setEditForm({ name: newRate.name, amount: newRate.amount });
  };

  const startEdit = (rate: ShippingRate) => {
    setIsEditing(rate.id);
    setEditForm({ name: rate.name, amount: rate.amount });
  };

  const saveEdit = () => {
    if (!isEditing) return;
    
    const updated = shippingRates.map(rate => 
      rate.id === isEditing 
        ? { ...rate, name: editForm.name, amount: editForm.amount }
        : rate
    );
    saveShippingRates(updated);
    setIsEditing(null);
  };

  const deleteShippingRate = (id: string) => {
    const updated = shippingRates.filter(rate => rate.id !== id);
    saveShippingRates(updated);
  };

  const setDefault = (id: string) => {
    const updated = shippingRates.map(rate => ({
      ...rate,
      isDefault: rate.id === id
    }));
    saveShippingRates(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Shipping Rates</h3>
        <button
          onClick={addShippingRate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Shipping Rate
        </button>
      </div>

      <div className="space-y-3">
        {shippingRates.map((rate) => (
          <div key={rate.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            {isEditing === rate.id ? (
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-1 border border-gray-300 rounded w-20"
                />
                <button
                  onClick={saveEdit}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div>
                    <span className="font-medium">{rate.name}</span>
                    {rate.isDefault && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600">${rate.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {!rate.isDefault && (
                    <button
                      onClick={() => setDefault(rate.id)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(rate)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {rate.id !== '1' && (
                    <button
                      onClick={() => deleteShippingRate(rate.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
