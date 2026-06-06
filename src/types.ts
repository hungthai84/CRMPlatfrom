export type NavItem = {
  name: string;
  icon: string;
  id: string;
};

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  tier: 'Member' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  loyaltyPoints: number;
  segment: string;
  lifetimeValue: number;
  lastInteraction: string;
  churnRisk: 'Low' | 'Medium' | 'High';
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  amount: number;
  stage: 'Lead' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  expectedClose: string;
}

export type TicketCategory = 'technical' | 'billing' | 'product' | 'complaint' | 'consultancy' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'new' | 'processing' | 'pending' | 'resolved' | 'closed';

export interface Ticket {
  id: string; // Firestore doc ID
  ticketId: string; // YT-2026-XXXXX
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customerId: string;
  customerName: string;
  ownerId: string; // The user who owns the customer/ticket
  agentId?: string;
  agentName?: string;
  source: 'portal' | 'agent' | 'email' | 'chat' | 'zalo' | 'fanpage';
  slaDeadline: number;
  createdAt: number;
  updatedAt: number;
  metadata?: any;
}

export interface TicketCommentAttachment {
  url: string;
  type: string;
  name: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: 'customer' | 'agent';
  ticketOwnerId: string; // The user who owns the parent ticket
  content: string;
  isPrivate: boolean;
  attachments: TicketCommentAttachment[] | string[];
  createdAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'Email' | 'Social' | 'SMS' | 'Call';
  status: 'Draft' | 'Active' | 'Paused' | 'Completed';
  budget: number;
  spent: number;
  leads: number;
  conversion: number;
  startDate: string;
  endDate: string;
}

export interface AIInsight {
  id: string;
  type: 'churn_risk' | 'upsell_opportunity' | 'sentiment_alert' | 'revenue_forecast';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  targetId: string; // CustomerId or OpportunityId
  targetName: string;
  recommendation: string;
  createdAt: number;
}
