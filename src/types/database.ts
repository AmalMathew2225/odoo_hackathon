export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "staff" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  company_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  sales_price: number; // in paise
  cost_price: number; // in paise
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  extra_price: number; // in paise
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number; // in paise
  billing_period: "daily" | "weekly" | "monthly" | "yearly";
  min_quantity: number;
  start_date: string | null;
  end_date: string | null;
  auto_close: boolean;
  can_close_early: boolean;
  can_pause: boolean;
  can_renew: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  is_active: boolean;
  created_at: string;
}

export interface Tax {
  id: string;
  name: string;
  rate_percent: number;
  is_active: boolean;
  created_at: string;
}

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: "fixed" | "percentage";
  value: number; // paise or percent basis points
  min_purchase_amount: number;
  min_quantity: number;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  times_used: number;
  product_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  plan_id: string;
  valid_days: number;
  notes: string;
  created_at: string;
}

export interface QuotationTemplateLine {
  id: string;
  template_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

export interface Subscription {
  id: string;
  subscription_number: string;
  customer_id: string;
  plan_id: string;
  status: "draft" | "quotation" | "confirmed" | "active" | "paused" | "closed";
  start_date: string;
  expiry_date: string | null;
  next_billing_date: string | null;
  paused_at: string | null;
  total_paused_days: number;
  payment_terms_id: string;
  quotation_valid_until: string | null;
  discount_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionLine {
  id: string;
  subscription_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  customer_id: string;
  status: "draft" | "confirmed" | "paid" | "cancelled";
  issue_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: "Bank Transfer" | "Cash" | "Cheque" | "UPI" | "Other";
  payment_date: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}
