export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export type Suggestion = string;

export type ContentType = 'welcome' | 'insurance_list' | 'insurance_detail' | 'faq' | 'support' | 'none';

export interface InsuranceProduct {
  id: string;
  name: string;
  description: string;
  monthlyPremium: string;
  coverage: string;
  category: 'Health' | 'Auto' | 'Home' | 'Life';
  imageUrl: string;
}

export interface AIResponse {
  responseText: string;
  suggestions: Suggestion[];
  contentType: ContentType;
  contentData: {
    products?: InsuranceProduct[];
    product?: InsuranceProduct;
    faqs?: { question: string; answer: string }[];
    title?: string;
    message?: string;
  };
}