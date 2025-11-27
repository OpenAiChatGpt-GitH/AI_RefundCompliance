import React, { useState } from 'react';
import { ReturnReason } from '../types';
import { Box, Hash, MessageSquare, AlertCircle } from 'lucide-react';

interface ReturnFormProps {
  onSubmit: (data: { orderId: string; productId: string; reason: ReturnReason; customReason: string }) => void;
  isProcessing: boolean;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ onSubmit, isProcessing }) => {
  const [orderId, setOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [reason, setReason] = useState<ReturnReason>(ReturnReason.NOT_AS_DESCRIBED);
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ orderId, productId, reason, customReason });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full mx-auto">
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Initiate Return</h2>
        <p className="text-gray-500 mt-1">Please provide the details of the item you wish to return.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Order ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="ORD-12345-XY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Box className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="PROD-98765"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Return</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors"
            >
              {Object.values(ReturnReason).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {reason === ReturnReason.OTHER && (
          <div className="animate-fade-in-down">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Please specify details</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                required
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Describe the issue..."
              />
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Request...
              </>
            ) : (
              'Send Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
