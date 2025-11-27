import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ReturnDecisionResponse, ReturnReason, OrderDetails } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Initialize Supabase Client
const SUPABASE_URL = "https://swcrhkgohnbroywpzser.supabase.co";
// Using the publishable key for client-side operations as requested
const SUPABASE_KEY = "sb_publishable_WXpXr6RmwCu-5x280moCPQ_Fyf9RuOO";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    decision: {
      type: Type.STRING,
      enum: ["APPROVE", "REJECT", "ESCALATE"],
    },
    confidence: {
      type: Type.NUMBER,
    },
    product_details: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        category: { type: Type.STRING },
        refund_amount: { type: Type.NUMBER },
      },
      required: ["product_name", "category", "refund_amount"],
    },
    reasons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    referenced_policy_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    }
  },
  required: ["decision", "confidence", "product_details"],
};

/**
 * Fetches order and product details from Supabase.
 * Tries to join 'order_products' with 'orders'.
 */
const fetchOrderDetails = async (
  orderId: string,
  productId: string
): Promise<Partial<OrderDetails>> => {
  try {
    // Attempt to fetch from 'order_products' and join with 'orders'
    const { data, error } = await supabase
      .from('order_products')
      .select(`
        *,
        orders (
          *
        )
      `)
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();

    if (error) {
      console.warn("Supabase fetch error:", error.message);
      throw new Error(`Order not found: ${error.message}`);
    }

    if (!data) {
      throw new Error("Order/Product combination not found.");
    }

    const orderData = Array.isArray(data.orders) ? data.orders[0] : data.orders;
    
    // Normalize sale category from various potential column names
    // Prioritize explicit true values
    const isSale = 
      data.sale_category === true || 
      data.sale_product === true || 
      data.is_sale === true ||
      String(data.sale_category).toLowerCase() === 'true' ||
      String(data.sale_product).toLowerCase() === 'true';

    return {
      name: data.name || data.product_name || "Unknown Product",
      category: data.category || "General",
      price: Number(data.price || 0),
      sale_category: isSale,
      ordered_date: orderData?.created_at || orderData?.ordered_date || new Date().toISOString(),
      delivered_date: orderData?.delivered_at || orderData?.delivered_date || new Date().toISOString(),
    };

  } catch (error) {
    console.error("Failed to fetch from Supabase:", error);
    throw error;
  }
};

/**
 * Public function to get enriched order details including user input and DB data.
 */
export const getEnrichedOrderDetails = async (
  orderId: string,
  productId: string,
  reason: ReturnReason,
  customReason?: string
): Promise<OrderDetails> => {
  const actualReason = reason === ReturnReason.OTHER ? customReason || "Other" : reason;
  const currentDate = new Date().toISOString().split('T')[0];

  let dbDetails: Partial<OrderDetails>;

  try {
    dbDetails = await fetchOrderDetails(orderId, productId);
  } catch (e) {
    console.warn("Using simulated data due to DB fetch failure");
    // Fallback simulation for demo/testing if DB isn't reachable
    dbDetails = {
      name: "Simulated Product Item",
      category: "electronics",
      price: 199.99,
      sale_category: false, // Default to false unless specific test case
      ordered_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      delivered_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    };
  }

  return {
    order_id: orderId,
    product_id: productId,
    reason: actualReason,
    ordered_date: dbDetails.ordered_date?.split('T')[0] || currentDate,
    delivered_date: dbDetails.delivered_date?.split('T')[0] || currentDate,
    name: dbDetails.name || "Unknown",
    category: dbDetails.category || "General",
    price: dbDetails.price || 0,
    sale_category: !!dbDetails.sale_category,
    current_date: currentDate
  };
};

/**
 * Processes the return request using Gemini AI based on enriched OrderDetails.
 */
export const processReturnRequest = async (
  enrichedData: OrderDetails
): Promise<ReturnDecisionResponse> => {
  
  const prompt = `
    You are an AI Return Policy Compliance Agent.
    
    Here is the Data from Database/User:
    ${JSON.stringify(enrichedData, null, 2)}

    REFUND POLICY TO APPLY:
    
    1. GENERAL RULES
    - Refunds are allowed based on product category rules.
    - Refund must be issued only to the original payment method.
    - For all calculations, use Delivered Date from the database and the current date (Input: ${enrichedData.current_date}).
    - SaleCategory = true -> Product is NON-REFUNDABLE.

    2. CATEGORY-SPECIFIC RULES
    A. ELECTRONICS
    - Refund window: 15 days from Delivered Date.
    - Must include original box and accessories. (Assume "included" unless reason suggests missing)
    - If price > 5000 -> ESCALATE for manual approval.
    - Customer-caused damage (broken, scratched) -> REJECT.

    B. CLOTHING
    - Refund window: 30 days.
    - Must have tags attached. (Assume attached unless reason indicates otherwise)
    - Clothing must not be worn, washed, or altered.

    3. NON-REFUNDABLE RULES
    - Any product with SaleCategory = true.
    - Digital products
    - Gift cards

    4. ESCALATION RULES
    ESCALATE when:
    - Refund amount (product price) > 5000 (electronics only).
    - OrderID or ProductID not found.
    - Delivery date not available.
    - Scenario unclear from provided reason.
    - Indications of fraud or abuse.

    5. REJECTION RULES
    REJECT when:
    - Outside refund window.
    - Sale product.
    - Clothing reason suggests used/washed/no tags.
    - Electronics reason suggests customer-caused damage.

    Your tasks:
    1. Use the Input details provided. Carefully Analyze.
    2. Use today's date (${enrichedData.current_date}) to calculate refund eligibility window against 'delivered_date'.
    3. Apply the refund policy precisely.
    4. Decide: APPROVE, REJECT, or ESCALATE.
    5. Provide reasoning tied directly to policy points.

    IMPORTANT:
    - SaleCategory = true -> Product is NON-REFUNDABLE.
    - If refund window exceeded -> REJECT.
    - If electronics price > 5000 -> ESCALATE.
    - If reason indicates damage or worn condition -> REJECT.

    OUTPUT FORMAT (MANDATORY):
    Return ONLY a JSON object.
    
    If Approved:
    - "decision": "APPROVE"
    - "product_details": include "refund_amount" (equal to price).
    - DO NOT include "reasons" or "referenced_policy_points" in the final JSON output if Approved.

    If Rejected or Escalated:
    - "decision": "REJECT" or "ESCALATE"
    - "product_details": include "refund_amount" (0 for REJECT, equal to price for ESCALATE).
    - "reasons": ["clear policy-based explanations"]
    - "referenced_policy_points": ["specific policy rules used"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for strict rule adherence
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const parsedResponse = JSON.parse(text) as ReturnDecisionResponse;
    
    // Post-processing to ensure UI logic is respected
    if (parsedResponse.decision === "APPROVE") {
      delete parsedResponse.reasons;
    }
    
    return parsedResponse;
  } catch (error) {
    console.error("Error processing return:", error);
    throw error;
  }
};
