
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
}

export const TaxSettings = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', rate: 0 });

  useEffect(() => {
    // Load tax rates from localStorage
    const saved = localStorage.getItem('tax_rates');
    if (saved) {
      setTaxRates(JSON.parse(saved));
    } else {
      // Default tax rates
      const defaultRates = [
        { id: '1', name: 'No Tax', rate: 0, isDefault: true },
        { id: '2', name: 'State Tax', rate: 8.25, isDefault: false },
        { id: '3', name: 'City Tax', rate: 2.5, isDefault: false }
      ];
      setTaxRates(defaultRates);
      localStorage.setItem('tax_rates', JSON.stringify(defaultRates));
    }
  }, []);

  const saveTaxRates = (rates: TaxRate[]) => {
    setTaxRates(rates);
    localStorage.setItem('tax_rates', JSON.stringify(rates));
  };

  const addTaxRate = () => {
    const newRate: TaxRate = {
      id: Date.now().toString(),
      name: 'New Tax Rate',
      rate: 0,
      isDefault: false
    };
    const updated = [...taxRates, newRate];
    saveTaxRates(updated);
    setIsEditing(newRate.id);
    setEditForm({ name: newRate.name, rate: newRate.rate });
  };

  const startEdit = (rate: TaxRate) => {
    setIsEditing(rate.id);
    setEditForm({ name: rate.name, rate: rate.rate });
  };

  const saveEdit = () => {
    if (!isEditing) return;
    
    const updated = taxRates.map(rate => 
      rate.id === isEditing 
        ? { ...rate, name: editForm.name, rate: editForm.rate }
        : rate
    );
    saveTaxRates(updated);
    setIsEditing(null);
  };

  const deleteTaxRate = (id: string) => {
    const updated = taxRates.filter(rate => rate.id !== id);
    saveTaxRates(updated);
  };

  const setDefault = (id: string) => {
    const updated = taxRates.map(rate => ({
      ...rate,
      isDefault: rate.id === id
    }));
    saveTaxRates(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Tax Rates</h3>
        <button
          onClick={addTaxRate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tax Rate
        </button>
      </div>

      <div className="space-y-3">
        {taxRates.map((rate) => (
          <div key={rate.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            {isEditing === rate.id ? (
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  step="0.01"
                  value={editForm.rate}
                  onChange={(e) => setEditForm({ ...editForm, rate: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-1 border border-gray-300 rounded w-20"
                />
                <span className="text-sm text-gray-600">%</span>
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
                  <span className="text-gray-600">{rate.rate}%</span>
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
                      onClick={() => deleteTaxRate(rate.id)}
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
