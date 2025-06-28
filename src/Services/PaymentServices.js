import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const PaymentService = {
  initiatePayment: async (eventId, attendeeId) => {
    try {
      const response = await api.post(`/Payment/initiate/${eventId}/${attendeeId}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to initiate payment';
      throw new Error(errorMessage);
    }
  },

  getPaymentStatus: async (paymentId) => {
    try {
      console.log("Getting payment status for payment ID:", paymentId);
      const response = await api.get(`/Payment/status/${paymentId}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to check payment status';
      throw new Error(errorMessage);
    }
  },

  verifyPayment: async (paymentId) => {
    try {
        // First try immediate verification
        const immediateStatus = await PaymentService.getPaymentStatus(paymentId);
        if (immediateStatus.status === 'completed') {
            return immediateStatus;
        }

        // If not completed, retry with increasing delays
        const delays = [1000, 2000, 3000, 5000, 8000];
        
        for (const delay of delays) {
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const status = await PaymentService.getPaymentStatus(paymentId);
            if (status.status === 'completed') {
                return status;
            }
        }
        
        // Final check
        const finalStatus = await PaymentService.getPaymentStatus(paymentId);
        return finalStatus;
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
  },

  manualVerifyPayment: async (paymentId, transactionId, amount, paymentMethod) => {
    try {
      const response = await api.post(`/payment/manual-verify/${paymentId}`, {
        transactionId,
        amount,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to manually verify payment';
      throw new Error(errorMessage);
    }
  },

  handlePaymentCallback: async (paymentId, status) => {
    try {
      const response = await api.post(`/payment/callback`, {
        paymentId,
        status
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to process payment callback';
      throw new Error(errorMessage);
    }
  },

  isPaymentPending: async (paymentId) => {
    try {
      const status = await PaymentService.getPaymentStatus(paymentId);
      return status.status === 'pending' && 
             new Date(status.paymentExpiry) > new Date();
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }
};

export default PaymentService;