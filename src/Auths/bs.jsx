import React, { useState, useRef, useEffect } from 'react';
import { Gift, Heart, Sparkles, Music, Star, Moon } from 'lucide-react';

const Confetti = ({ active }) => {
  if (!active) return null;
  
  const confettiPieces = Array.from({ length: 100 }, (_, i) => (
    <div
      key={i}
      className="absolute animate-bounce"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
        transform: `rotate(${Math.random() * 360}deg)`
      }}
    >
      <div className={`w-2 h-2 rounded-full ${['bg-blue-400', 'bg-indigo-400', 'bg-yellow-400', 'bg-pink-400', 'bg-green-400'][Math.floor(Math.random() * 5)]}`} />
    </div>
  ));
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces}
    </div>
  );
};

const FloatingBalloons = () => {
  const balloons = Array.from({ length: 10 }, (_, i) => (
    <div
      key={i}
      className="absolute animate-float"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${100 + Math.random() * 20}%`,
        animationDelay: `${i * 0.5}s`,
        animationDuration: `${15 + Math.random() * 10}s`,
        fontSize: `${20 + Math.random() * 20}px`
      }}
    >
      <Moon 
        className={`${['text-blue-400', 'text-indigo-400', 'text-yellow-400', 'text-pink-400', 'text-green-400', 'text-white'][i % 6]} drop-shadow-lg`}
      />
    </div>
  ));
  
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {balloons}
    </div>
  );
};

const SurpriseVideo = ({ src, title, description, isVisible }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [isVisible]);
  
  return (
    <div className={`mb-16 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">{description}</p>
      </div>
      
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-auto max-h-[70vh] object-cover"
          muted
          loop
          playsInline
          autoPlay
          controls={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

const BirthdayMessage = ({ message, author, index }) => {
  return (
    <div
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg transform transition-all duration-300 border border-white/20"
      style={{
        animationDelay: `${index * 0.1}s`
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white/90 mb-3 leading-relaxed">{message}</p>
          <div className="text-sm">
            <span className="text-white/70 font-medium">— {author}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function bs() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [isVisible, setIsVisible] = useState({});
  const observerRef = useRef();
  
  // Your video files from assets folder
  const surpriseVideos = [
    {
      id: 1,
      src: "/assets/1.mp4",
      title: "🎈 Special Birthday Message!",
      description: "A heartfelt wish for your special day"
    },
    {
      id: 2,
      src: "/assets/2.mp4",
      title: "🎂 Birthday Memories",
      description: "Beautiful moments to cherish"
    }
  ];
  
  // Predefined birthday messages
  const birthdayMessages = [
    {
      message: "Wishing you a day as wonderful as you are! May all your dreams come true this year.",
      author: "Your Loved Ones"
    },
    {
      message: "Another year of amazing adventures awaits you. Happy birthday!",
      author: "Friends & Family"
    }
  ];

  useEffect(() => {
    // Start with confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Set up intersection observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );
    
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observerRef.current?.observe(el));
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 relative overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <FloatingBalloons />
      <Confetti active={showConfetti} />
      
      <div className="relative z-20 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div
          id="hero"
          data-animate
          className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible.hero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="inline-flex items-center gap-4 mb-6">
            <Gift className="w-12 h-12 text-yellow-400 animate-bounce" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              HAPPY BIRTHDAY!
            </h1>
            <Star className="w-12 h-12 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            A special celebration created just for you!
          </p>
        </div>
        
        {/* Your Videos from Assets Folder */}
        {surpriseVideos.map((video) => (
          <SurpriseVideo
            key={video.id}
            src={video.src}
            title={video.title}
            description={video.description}
            isVisible={isVisible[`video-${video.id}`]}
            id={`video-${video.id}`}
            data-animate
          />
        ))}
        
        {/* Birthday Messages Section */}
        <div
          id="messages"
          data-animate
          className={`mb-16 transform transition-all duration-1000 ${
            isVisible.messages ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ❤️ Heartfelt Wishes
            </h2>
          </div>
          
          <div className="grid gap-6 max-w-4xl mx-auto">
            {birthdayMessages.map((message, index) => (
              <BirthdayMessage 
                key={index}
                message={message.message}
                author={message.author}
                index={index}
              />
            ))}
          </div>
        </div>
        
        {/* Final Greeting */}
        <div
          id="final"
          data-animate
          className={`text-center py-16 transform transition-all duration-1000 ${
            isVisible.final ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enjoy Your Special Day! 🎉
            </h2>
            <p className="text-white/80 text-xl leading-relaxed">
              May this birthday be the start of your best year yet!
            </p>
          </div>
        </div>
      </div>
      
      {/* Balloon float animation */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-100vh) rotate(180deg); }
          100% { transform: translateY(-200vh) rotate(360deg); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}

export default bs;