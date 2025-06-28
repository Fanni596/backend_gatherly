import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, HourglassEmpty, Error, Payment } from '@mui/icons-material';
import PaymentService from '../../../Services/PaymentServices';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';

const PaymentSuccessPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [manualDetails, setManualDetails] = useState({
    transactionId: '',
    amount: '',
    paymentMethod: ''
  });
  const [manualError, setManualError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const result = await PaymentService.verifyPayment(paymentId);
        
        if (result.status === 'completed') {
          setStatus('success');
        } else {
          setError('Payment verification failed');
          setStatus('failed');
        }
      } catch (error) {
        setError(error.message);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [paymentId]);

  const handleManualVerification = async () => {
    if (!manualDetails.transactionId || !manualDetails.amount || !manualDetails.paymentMethod) {
      setManualError('All fields are required');
      return;
    }

    try {
      const response = await PaymentService.manualVerifyPayment(
        paymentId,
        manualDetails.transactionId,
        manualDetails.amount,
        manualDetails.paymentMethod
      );

      if (response.success) {
        setStatus('success');
        setShowManualVerification(false);
      } else {
        setManualError(response.message || 'Manual verification failed');
      }
    } catch (err) {
      setManualError(err.message || 'Failed to manually verify payment');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <HourglassEmpty className="text-blue-500 text-6xl mx-auto mb-4 animate-pulse" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Verifying Payment</h1>
        <p className="text-lg text-gray-700 mb-6">
          Please wait while we confirm your payment...
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <Error className="text-red-500 text-6xl mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Verification Failed</h1>
        <p className="text-lg text-gray-700 mb-6">
          {error || 'We encountered an issue verifying your payment.'}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate(`/payment/status/${paymentId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
          >
            Check Payment Status
          </button>
          
          <button
            onClick={() => setShowManualVerification(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded flex items-center justify-center mx-auto"
          >
            <Payment className="mr-2" />
            Verify Payment Manually
          </button>
        </div>

        {/* Manual Verification Dialog */}
        <Dialog open={showManualVerification} onClose={() => setShowManualVerification(false)}>
          <DialogTitle>Manual Payment Verification</DialogTitle>
          <DialogContent className="space-y-4">
            {manualError && <Alert severity="error">{manualError}</Alert>}
            
            <TextField
              fullWidth
              label="Transaction ID"
              value={manualDetails.transactionId}
              onChange={(e) => setManualDetails({...manualDetails, transactionId: e.target.value})}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={manualDetails.amount}
              onChange={(e) => setManualDetails({...manualDetails, amount: e.target.value})}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Payment Method"
              value={manualDetails.paymentMethod}
              onChange={(e) => setManualDetails({...manualDetails, paymentMethod: e.target.value})}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowManualVerification(false)}>Cancel</Button>
            <Button 
              onClick={handleManualVerification}
              variant="contained"
              color="primary"
            >
              Verify Payment
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <CheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
      <p className="text-lg text-gray-700 mb-6">
        Your payment has been confirmed. You'll receive a confirmation email shortly.
      </p>
      <button
        onClick={() => navigate('/attendee/events')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
      >
        Back to Events
      </button>
    </div>
  );
};

export default PaymentSuccessPage;