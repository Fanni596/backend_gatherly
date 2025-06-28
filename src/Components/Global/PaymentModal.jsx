import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  Button, 
  CircularProgress, 
  Typography, 
  Box,
  DialogActions,
  Divider,
  Alert
} from '@mui/material';
import { CheckCircle, Error, Payment, Close, Info, ArrowForward } from '@mui/icons-material';
import PaymentService from '../../Services/PaymentServices';

const PaymentModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  amount, 
  currency, 
  eventId, 
  attendeeId,
  eventTitle,
  attendeeName
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('initial'); // 'initial', 'pending', 'completed', 'failed'
  const [paymentWindow, setPaymentWindow] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStatus('initial');
      setError(null);
      setPaymentData(null);
      initiatePayment();
    } else {
      // Clean up any payment window reference
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    }
  }, [open]);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setStatus('pending');
      setError(null);
      
      const data = await PaymentService.initiatePayment(eventId, attendeeId);
      
      if (!data.requiresPayment) {
        // No payment required (free event or non-paying attendee)
        onSuccess();
        onClose();
        return;
      }

      setPaymentData(data);
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };



const verifyPaymentStatus = async (paymentId) => {
  setLoading(true);
  try {
    const status = await PaymentService.verifyPayment(paymentId);
    
    if (status.status === 'completed') {
      setStatus('completed');
      onSuccess();
      setTimeout(onClose, 3000);
    } else {
      setError(`Payment status: ${status.status}`);
      setStatus('failed');
    }
  } catch (err) {
    setError(err.message || 'Failed to verify payment');
    setStatus('failed');
  } finally {
    setLoading(false);
  }
};

const handleProceedToPayment = async () => {
  try {
    setLoading(true);
    const data = await PaymentService.initiatePayment(eventId, attendeeId);

    if (data.success && data.paymentUrl) {
      setPaymentData(data);
      
      // Open payment in new tab
      const newWindow = window.open(data.paymentUrl, '_blank');
      setPaymentWindow(newWindow);
      
      // Start polling for payment status
      const intervalId = setInterval(async () => {
        try {
          const status = await PaymentService.getPaymentStatus(data.paymentId);
          
          if (status.status === 'completed') {
            clearInterval(intervalId);
            setStatus('completed');
            onSuccess();
            setTimeout(onClose, 3000);
          } else if (status.status === 'failed' || status.status === 'expired') {
            clearInterval(intervalId);
            setError(status.message || 'Payment failed or expired');
            setStatus('failed');
          }
          // Continue polling if status is still pending
        } catch (err) {
          console.error('Error checking payment status:', err);
          // Don't stop polling for network errors
        }
      }, 5000); // Check every 5 seconds

      // Cleanup interval when component unmounts
      return () => clearInterval(intervalId);
    } else {
      throw new Error(data.message || 'Failed to initiate payment');
    }
  } catch (err) {
    setError(err.message);
    setStatus('failed');
  } finally {
    setLoading(false);
  }
};

const startPaymentStatusPolling = (paymentId) => {
  const interval = setInterval(async () => {
    try {
      const status = await PaymentService.getPaymentStatus(paymentId);
      
      if (status.status === 'completed') {
        clearInterval(interval);
        setStatus('completed');
        onSuccess();
        setTimeout(onClose, 2000); // Show success message briefly
      } else if (status.status === 'failed') {
        clearInterval(interval);
        setError('Payment failed. Please try again.');
        setStatus('failed');
      }
      // Continue polling if status is still pending
    } catch (err) {
      console.error('Error checking payment status:', err);
      // Don't stop polling for network errors
    }
  }, 5000); // Check every 5 seconds

  // Cleanup interval when component unmounts
  return () => clearInterval(interval);
};

  const renderPaymentDetails = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Payment Summary
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Event:</Typography>
        <Typography variant="body2">{eventTitle}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Attendee:</Typography>
        <Typography variant="body2">{attendeeName}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Ticket Price:</Typography>
        <Typography variant="body2">{amount} {currency}</Typography>
      </Box>
      {paymentData?.processingFees && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Processing Fees:</Typography>
          <Typography variant="body2">
            {paymentData.processingFees} {currency}
          </Typography>
        </Box>
      )}
      {paymentData?.gatewayFees && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Gateway Fees:</Typography>
          <Typography variant="body2">
            {paymentData.gatewayFees} {currency}
          </Typography>
        </Box>
      )}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">Total Amount:</Typography>
        <Typography variant="subtitle2" fontWeight="bold">
          {paymentData?.totalAmount || (amount * 1.04).toFixed(2)} {currency}
        </Typography>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (status) {
      case 'completed':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Payment Successful!</Typography>
            <Typography color="text.secondary" align="center">
              Your payment has been processed successfully.
            </Typography>
            <Button 
              variant="contained" 
              color="success" 
              onClick={onClose}
              sx={{ mt: 3 }}
              endIcon={<ArrowForward />}
            >
              Continue
            </Button>
          </Box>
        );
      
      case 'failed':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
            <Error color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Payment Failed</Typography>
            <Typography color="text.secondary" align="center" sx={{ mb: 2 }}>
              {error || 'There was an issue processing your payment.'}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={initiatePayment}
              sx={{ mt: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </Button>
          </Box>
        );
      
      case 'pending':
        return (
          <>
            {renderPaymentDetails()}
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You'll be redirected to WorkupPay's secure payment page to complete your transaction.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Payment />}
                onClick={handleProceedToPayment}
                disabled={loading || !paymentData?.paymentUrl}
                sx={{ py: 1.5, px: 4 }}
              >
                {loading ? 'Preparing...' : 'Proceed to Payment'}
              </Button>
            </Box>
          </>
        );
      
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 3 }}>
              Preparing payment...
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!loading ? onClose : undefined} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        <span>
          {status === 'completed' ? 'Payment Successful' : 
           status === 'failed' ? 'Payment Failed' : 'Complete Your Payment'}
        </span>
        {status !== 'completed' && (
          <Button 
            onClick={onClose} 
            sx={{ 
              minWidth: 'auto',
              color: 'primary.contrastText'
            }}
            disabled={loading}
          >
            <Close />
          </Button>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        {renderContent()}
      </DialogContent>
      {status !== 'completed' && (
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <Info fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Secure payment processed by WorkupPay
          </Typography>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PaymentModal;