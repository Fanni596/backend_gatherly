// QRCodeScanner.jsx
import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';

const QRCodeScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Add a ref to track the stream

  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  // Camera setup
  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream; // Store the stream in the ref
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      } catch (err) {
        setError('Camera access denied or not available');
        console.error(err);
      }
    };

    getCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop(); // Stop each track
        });
      }
      
      // Also clean up the video element reference
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // QR scanning loop
  useEffect(() => {
    let animationFrameId = null;
    
    const scan = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        setQrData(code.data);
        setScanning(false);
      } else if (scanning) {
        animationFrameId = requestAnimationFrame(scan);
      }
    };

    if (videoRef.current && scanning) {
      if (videoRef.current.readyState >= videoRef.current.HAVE_METADATA) {
        animationFrameId = requestAnimationFrame(scan);
      } else {
        videoRef.current.onloadedmetadata = () => {
          animationFrameId = requestAnimationFrame(scan);
        };
      }
    }

    // Cleanup function for scanning loop
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
      }
    };
  }, [scanning]);

  const isUrl = (text) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleVisit = () => {
    if (isUrl(qrData)) {
      window.open(qrData, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRescan = () => {
    setQrData(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white p-4 flex flex-col items-center justify-center space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        QR Code Scanner
      </h1>

      {error && (
        <p className="text-red-400 text-center">{error}</p>
      )}

      {!qrData && (
        <>
          <div className="rounded-xl overflow-hidden shadow-lg border border-white/10">
            <video
              ref={videoRef}
              className="w-[90vw] max-w-md h-80 object-cover rounded-xl"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <p className="text-sm text-white/80">Point your camera at a QR code</p>
        </>
      )}

      {qrData && (
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/10 max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-semibold text-green-300">QR Code Detected</h2>
          <p className="text-sm text-white break-words">{qrData}</p>

          {isUrl(qrData) && (
            <button
              onClick={handleVisit}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 transition-all rounded-full text-white font-medium"
            >
              Open Link
            </button>
          )}

          <button
            onClick={handleRescan}
            className="w-full px-4 py-2 border border-white/30 hover:bg-white/10 transition-all rounded-full text-white font-medium"
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;