import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Error } from '@mui/icons-material';
import PaymentService from '../../../Services/PaymentServices';

const PaymentCancelPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const status = await PaymentService.getPaymentStatus(paymentId);
        if (status.status === 'completed') {
          // If payment was actually completed, redirect to success
          navigate(`/payment/success/${paymentId}`, { replace: true });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    checkPaymentStatus();
  }, [paymentId, navigate]);

  const errorMessage = location.state?.error || 'Your payment was not completed.';

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <Error className="text-red-500 text-6xl mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Cancelled</h1>
      <p className="text-lg text-gray-700 mb-6">
        {errorMessage} You can try again if you wish.
      </p>
      <button
        onClick={() => navigate(-1)} // Go back to payment page
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
      >
        Try Again
      </button>
    </div>
  );
};

export default PaymentCancelPage;