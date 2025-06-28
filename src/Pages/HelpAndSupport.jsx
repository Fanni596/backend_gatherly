import { useState } from "react";
import { FiHelpCircle, FiMail, FiPhone, FiMessageSquare, FiClock, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion } from "framer-motion";

const HelpAndSupport = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I create an event?",
      answer: "To create an event, navigate to the 'Create Event' page from the main menu or click the plus (+) button in the bottom navigation. Fill out all required details about your event and click 'Publish' when you're ready."
    },
    {
      question: "How can I invite attendees to my event?",
      answer: "After creating an event, you can invite attendees by sharing the event link or using the built-in invitation system. Go to your event dashboard and click on 'Invite Attendees' to access sharing options."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and in some regions, Apple Pay and Google Pay."
    },
    {
      question: "How do I register as an attendee?",
      answer: "You can register for events either by creating an account or as a guest. Simply find the event you're interested in and click 'Register' or 'Get Tickets' to begin the process."
    },
    {
      question: "Can I get a refund for my ticket?",
      answer: "Refund policies are set by the event organizer. Please check the event details for the refund policy. If you need assistance, you can contact the organizer directly through the event page."
    }
  ];

  const contactMethods = [
    {
      icon: <FiMail className="text-blue-600" size={24} />,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      details: "support@gatherly.com",
      action: "mailto:support@gatherly.com"
    },
    {
      icon: <FiPhone className="text-blue-600" size={24} />,
      title: "Phone Support",
      description: "Call us during business hours (9am-5pm EST)",
      details: "+1 (800) 123-4567",
      action: "tel:+18001234567"
    },
    {
      icon: <FiMessageSquare className="text-blue-600" size={24} />,
      title: "Live Chat",
      description: "Chat with a support agent in real-time",
      details: "Available 9am-9pm EST",
      action: "#chat"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-3 rounded-full bg-blue-100 mb-4"
        >
          <FiHelpCircle className="h-8 w-8 text-blue-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-3">How can we help you?</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions or contact our support team directly.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            placeholder="Search help articles..."
            className="w-full px-5 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Popular Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Getting Started", icon: "🚀", count: 12 },
            { title: "Account Settings", icon: "⚙️", count: 8 },
            { title: "Event Management", icon: "📅", count: 15 },
            { title: "Ticketing", icon: "🎟️", count: 10 },
            { title: "Payments", icon: "💳", count: 7 },
            { title: "Troubleshooting", icon: "🔧", count: 5 }
          ].map((topic, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-start">
                <span className="text-2xl mr-4">{topic.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{topic.title}</h3>
                  <p className="text-sm text-gray-500">{topic.count} articles</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
              >
                <h3 className="font-medium text-gray-900">{faq.question}</h3>
                {activeFaq === index ? (
                  <FiChevronUp className="text-gray-500" />
                ) : (
                  <FiChevronDown className="text-gray-500" />
                )}
              </button>
              {activeFaq === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-5 text-gray-600"
                >
                  {faq.answer}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">{method.icon}</div>
                <h3 className="font-medium text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                <p className="text-gray-700 font-medium mb-4">{method.details}</p>
                <a
                  href={method.action}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Contact Now
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Help Resources */}
      <div className="mt-16 bg-gray-50 rounded-xl p-8">
        <div className="max-w-3xl mx-auto text-center">
          <FiClock className="mx-auto h-10 w-10 text-blue-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Need help right away?</h2>
          <p className="text-gray-600 mb-6">
            Check out our comprehensive documentation and community forums for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#documentation"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              View Documentation
            </a>
            <a
              href="#community"
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium"
            >
              Visit Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;