export interface Job {
  id: string;
  customer_id: string;
  user_id: string;
  description: string;
  price: number;
  frequency: string;
  last_completed: string | null;
  estimated_duration: number | null;
  active: boolean;
  payment_status: string;
  created_at: string;
  updated_at: string;
}


