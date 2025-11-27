import React from 'react';
import { OrderDetails } from '../types';
import { Calendar, Tag, DollarSign, ShoppingBag, AlertOctagon } from 'lucide-react';

interface OrderDetailsCardProps {
  data: OrderDetails;
  onReset: () => void;
}

export const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({ data, onReset }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto animate-fade-in-up">
      <div className="bg-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center">
          <ShoppingBag className="mr-3 h-6 w-6" />
          Order Retrieved
        </h2>
        <p className="text-indigo-100 mt-1">Details fetched from Supabase database</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Header Info */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Product</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{data.name}</h3>
            <div className="flex items-center mt-2 space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                {data.category}
              </span>
              {data.sale_category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Tag className="w-3 h-3 mr-1" />
                  Sale Item
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Price</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {data.price.toFixed(2)}</p>
          </div>
        </div>

        {/* Dates & IDs */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
             <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Order ID</p>
                <p className="font-mono text-sm text-gray-700 font-medium">{data.order_id}</p>
             </div>
             <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Product ID</p>
                <p className="font-mono text-sm text-gray-700 font-medium">{data.product_id}</p>
             </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Ordered Date
              </p>
              <p className="text-sm text-gray-700">{data.ordered_date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Delivered Date
              </p>
              <p className="text-sm text-gray-700">{data.delivered_date}</p>
            </div>
          </div>
        </div>

        {/* Return Reason */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Customer Return Reason</p>
          <div className="flex items-start">
            <AlertOctagon className="w-5 h-5 text-indigo-500 mr-2 mt-0.5" />
            <p className="text-gray-800 font-medium">{data.reason}</p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-100">
           <button
            onClick={onReset}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            ← Search Again
          </button>
          <div className="text-sm text-gray-400 italic">
             Waiting for agent call...
          </div>
        </div>
      </div>
    </div>
  );
};
