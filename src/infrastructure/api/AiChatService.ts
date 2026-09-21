export interface GarmentDraft {
  type: string | null;
  gender: string | null;
  measurementOption: string | null;
  measurementsData?: Record<string, any> | null;
}

export interface BookingDraft {
  garments: GarmentDraft[];
  address: string | null;
  pickupDate: string | null;
  pickupTimeWindow: string | null;
  paymentMethod: string | null;
  readyForConfirmation: boolean;
}

export interface ChatOption {
  id: string;
  label: string;
  icon?: string;
}

export interface ChatResponse {
  reply: string;
  bookingDraft: BookingDraft | null;
  missingFields: string[];
  nextStep: string | null;
  options: ChatOption[];
}

const API_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'http://localhost:4000';

export const AiChatService = {
  sendMessage: async (message: string, sessionId: string): Promise<ChatResponse> => {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, sessionId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to communicate with AI Assistant');
    }

    return await res.json();
  }
};
