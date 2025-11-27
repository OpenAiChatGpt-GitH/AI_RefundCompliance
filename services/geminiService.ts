import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ReturnDecisionResponse, ReturnReason, OrderDetails } from "../types";

// Initialize Supabase Client
const SUPABASE_URL = "https://swcrhkgohnbroywpzser.supabase.co";
// CAUTION: Using the Secret (Service Role) key on the client-side is for prototyping only.
// This bypasses Row Level Security (RLS) to ensure data access for this demo.
const SUPABASE_KEY = "sb_secret_0yuqOyLipoQSjXPQ5_umHw_Wwn5srER";

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
 * Fetches sequentially to avoid Foreign Key configuration issues.
 */
const fetchOrderDetails = async (
  orderId: string,
  productId: string
): Promise<Partial<OrderDetails>> => {
  try {
    // 1. Fetch the specific product item from order_products
    const { data: productData, error: productError } = await supabase
      .from('order_products')
      .select('*')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();

    if (productError) {
      console.error("Supabase Product Fetch Error:", productError);
      throw new Error(`Product not found: ${productError.message}`);
    }

    if (!productData) {
      throw new Error(`Product ${productId} not found in Order ${orderId}`);
    }

    // 2. Fetch the order details using the order_id from the product line item
    // (This ensures we get the parent order even if the input ID format varied slightly)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId) // Assuming 'order_id' is the column name in orders table
      .single();

    if (orderError) {
      console.error("Supabase Order Fetch Error:", orderError);
      // We continue even if order fetch fails, using product data, but strictly it should succeed
      throw new Error(`Order Details not found: ${orderError.message}`);
    }

    // Normalize sale category from various potential column names
    const isSale = 
      productData.sale_category === true || 
      productData.sale_product === true || 
      productData.is_sale === true ||
      String(productData.sale_category).toLowerCase() === 'true' ||
      String(productData.sale_product).toLowerCase() === 'true';

    return {
      name: productData.name || productData.product_name || "Unknown Product",
      category: productData.category || "General",
      price: Number(productData.price || 0),
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

  // We intentionally do NOT catch errors here anymore. 
  // If DB fails, we want the UI to show the error, not fall back to fake data.
  const dbDetails = await fetchOrderDetails(orderId, productId);

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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