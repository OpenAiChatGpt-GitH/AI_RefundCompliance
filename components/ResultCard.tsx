import React from 'react';
import { ReturnDecisionResponse, Decision } from '../types';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';

interface ResultCardProps {
  data: ReturnDecisionResponse;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, onReset }) => {
  const getDecisionIcon = (decision: Decision) => {
    switch (decision) {
      case Decision.APPROVE: return <CheckCircle className="w-16 h-16 text-green-500" />;
      case Decision.REJECT: return <XCircle className="w-16 h-16 text-red-500" />;
      case Decision.ESCALATE: return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto animate-fade-in-up">
      <div className={`p-8 flex flex-col items-center justify-center border-b-4 ${
        data.decision === Decision.APPROVE ? 'border-green-500' :
        data.decision === Decision.REJECT ? 'border-red-500' : 'border-yellow-500'
      }`}>
        <div className="mb-4 transform hover:scale-110 transition-transform duration-300">
          {getDecisionIcon(data.decision)}
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{data.decision}</h2>
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Confidence</span>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-bold shadow-sm">
            {(data.confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Product & Refund Details */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-inner">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
              Details
            </h3>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Refund Amount</p>
              <p className={`text-2xl font-bold ${data.product_details.refund_amount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                Rs. {data.product_details.refund_amount.toFixed(2)}
              </p>
            </div>
          </div>
         
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Product Name</p>
              <p className="text-gray-900 font-semibold">{data.product_details.product_name}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Category</p>
              <p className="text-gray-900 font-medium capitalize">{data.product_details.category}</p>
            </div>
          </div>
        </div>

        {/* Reasons Section - Only shown if REJECT or ESCALATE */}
        {(data.decision === Decision.REJECT || data.decision === Decision.ESCALATE) && data.reasons && data.reasons.length > 0 && (
          <div className="animate-fade-in-up delay-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reasoning</h3>
            <div className={`rounded-lg p-5 border ${data.decision === Decision.REJECT ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
              <ul className="space-y-3">
                {data.reasons.map((reason, idx) => (
                  <li key={idx} className={`flex items-start ${data.decision === Decision.REJECT ? 'text-red-800' : 'text-yellow-800'}`}>
                    <span className={`flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full mr-3 ${data.decision === Decision.REJECT ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 pb-8 pt-2">
        <button
          onClick={onReset}
          className="w-full group flex items-center justify-center py-4 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
          Process Another Request
        </button>
      </div>
    </div>
  );
};