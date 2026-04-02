export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  interest: string;
  message?: string;
}

export interface PersonalizedMessages {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

export interface OutreachResult {
  lead: LeadFormData;
  messages: PersonalizedMessages;
  smsSent: boolean;
  emailSent: boolean;
  smsError?: string;
  emailError?: string;
  timestamp: string;
}
