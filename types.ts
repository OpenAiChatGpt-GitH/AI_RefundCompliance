export enum ReturnReason {
  NOT_AS_DESCRIBED = "Item not as described",
  DAMAGED = "Received damaged",
  WRONG_ITEM = "Wrong item delivered",
  SIZE_ISSUE = "Size issue",
  COLOR_MISMATCH = "Color mismatch",
  CHANGED_MIND = "Changed my mind",
  OTHER = "Other"
}

export enum Decision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ESCALATE = "ESCALATE"
}

export interface ProductDetails {
  product_name: string;
  category: string;
  refund_amount: number;
}

export interface ReturnDecisionResponse {
  decision: Decision;
  confidence: number;
  product_details: ProductDetails;
  reasons?: string[];
  referenced_policy_points?: string[];
}

export interface OrderDetails {
  order_id: string;
  product_id: string;
  reason: string;
  ordered_date: string;
  delivered_date: string;
  name: string;
  category: string;
  price: number;
  sale_category: boolean;
  current_date: string;
}

export interface User {
  email: string;
  name: string;
}
