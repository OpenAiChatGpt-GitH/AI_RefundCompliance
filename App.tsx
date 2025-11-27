import React, { useState } from 'react';
import { ReturnForm } from './components/ReturnForm';
import { ResultCard } from './components/ResultCard';
import { getEnrichedOrderDetails, processReturnRequest } from './services/geminiService';
import { ReturnDecisionResponse, ReturnReason } from './types';
import { HelpCircle, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [result, setResult] = useState<ReturnDecisionResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSupport = () => {
    alert("Support feature: Connecting to an agent...");
  };

  const handleReturnSubmit = async (data: { orderId: string; productId: string; reason: ReturnReason; customReason: string }) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Step 1: Fetch details from Database
      const fetchedDetails = await getEnrichedOrderDetails(data.orderId, data.productId, data.reason, data.customReason);
      
      // Step 2: Directly call AI Agent with fetched details
      const aiDecision = await processReturnRequest(fetchedDetails);
      
      setResult(aiDecision);
      
    } catch (err) {
      setError("Failed to process request. Please check the Order ID/Product ID and try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-indigo-600">
                <LayoutGrid className="h-8 w-8 mr-2" />
                <span className="font-bold text-xl tracking-tight">AI Refund Compliance Checker</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSupport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                title="Reach out to support"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {error && (
             <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md animate-fade-in-down">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!result && (
            <ReturnForm onSubmit={handleReturnSubmit} isProcessing={isProcessing} />
          )}

          {result && (
            <ResultCard data={result} onReset={handleReset} />
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
         <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
           &copy; {new Date().getFullYear()} AI Refund Compliance Checker. All rights reserved.
         </div>
      </footer>
    </div>
  );
};

export default App;
