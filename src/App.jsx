import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './Pages/Dashboard'
import Signup from './Pages/Signup'
import LoginPage from './Pages/Login'
import Navbar from './Components/Global/Navbar'
import Footer from './Components/Global/Footer'
import { AuthProvider } from './Contexts/authContext'
import NotFoundPage from './Pages/NotFoundPage'
import 'react-toastify/dist/ReactToastify.css';
import './App.css'
import ListsPage from './Pages/User/Organizer/ListPage';
import { SnackbarProvider } from 'notistack';
import AttendeesPage from './Pages/User/Organizer/ListAttendees';
import Breadcrumbs from './Components/Global/BreadCrumbs';
import OrgnizerEventsPage from './Pages/User/Organizer/Events'
import EventCreationPage from './Pages/User/Organizer/CreateEvent';
import EditEvent from './Pages/User/Organizer/EditEvent';
import EventView from './Pages/User/Organizer/EventView';
import AttendeeEventView from './Pages/User/Attendee/AttendeeEventView'
import SendInvitesPage from './Pages/User/Organizer/SendInvitesPage'
import CreateEventAI from './Pages/User/Organizer/CreateEventAI';
import AttendeeHome from './Pages/User/Attendee/AttendeeHome'
import AttendeeLogin from './Pages/User/Attendee/AttendeeLogin'
import EventsPage from './Pages/User/Attendee/EventsPage'
import InviteVerificationPage from './Pages/InviteVerificationPage'
import RegistrationPage from './Pages/User/Attendee/RegistrationPage'
import ProfilePage from './Pages/User/Organizer/ProfilePage'
import AttendeeProfilePage from './Pages/User/Attendee/AttendeeProfilePage'
import PaymentSuccessPage from './Pages/User/Attendee/PaymentSuccessPage'
import PaymentCancelPage from './Pages/User/Attendee/PaymentCancelPage'
import EventMonitoring from './Pages/User/Organizer/eventMonitoring'
import FeedbackPage from './Pages/User/Attendee/FeedbackPage'
import ThankYouPage from './Pages/User/Attendee/ThankYouPage'
import AttendedEventsFeedbackPage from './Pages/User/Attendee/AttendedEventsFeedbackPage'
import AttendeeSelfCheckin from './Pages/User/Attendee/AttendeeSelfCheckin'
import QRCodeScanner from './Pages/User/Attendee/QRCodeScanner'
import HelpAndSupport from './Pages/HelpAndSupport'
import BS from './Auths/bs'

function App() {


  return (
    <>
      <AuthProvider>
        <SnackbarProvider maxSnack={3}>
          <Navbar />
          <Breadcrumbs />
          <Routes>
            {/* Global */}
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/" element={<Navigate to="/attendee" replace />} />
            <Route path="/help" element={<HelpAndSupport />} />
            <Route path="attendee/help" element={<HelpAndSupport />} />
            <Route path="/bs" element={<BS />} />



            {/* Organizer Pages */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/guestlists" element={<ListsPage />} />
            <Route path="/guestlists/manage/:listId" element={<AttendeesPage />} />
            <Route path="/events-page" element={<OrgnizerEventsPage />} />
            <Route path="/create-event" element={<EventCreationPage />} />
            <Route path="/event/:id" element={<EventView />} />
            <Route path="/events/:eventId/send-invites" element={<SendInvitesPage />} />
            <Route path="/create-event-ai" element={<CreateEventAI />} />
            <Route path="/events/edit/:eventId" element={<EditEvent />} />
            <Route path="/events/:eventId/monitoring" element={<EventMonitoring />} />



            {/* Attendee Pages */}



            <Route path="/attendee" element={<AttendeeHome />} />
            <Route path="/attendee/login" element={<AttendeeLogin />} />
            <Route path="/attendee/events" element={<EventsPage />} />
            <Route path="/attendee/events/:id" element={<AttendeeEventView />} />
            <Route path="/attendee/event/:eventId/invite/:attendeeIdentifier" element={<InviteVerificationPage />} />
            <Route path="/attendee/events/:id/register" element={<RegistrationPage />} />
            <Route path="/attendee/profile" element={<AttendeeProfilePage />} />
            <Route path="/payment/success/:paymentId" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel/:paymentId" element={<PaymentCancelPage />} />
            {/* // Inside your router */}
            <Route path="/attendee/events/:eventId/feedback" element={<FeedbackPage />} />
            <Route path="/attendee/events/:eventId/feedback/thank-you" element={<ThankYouPage />} />
            <Route path="/attendee/events/feedback" element={<AttendedEventsFeedbackPage />} />
            <Route path="/attendee/events/:id/self-checkin" element={<AttendeeSelfCheckin />} />
            <Route path="attendee/qr-scanner" element={<QRCodeScanner />} />

            {/* Fallback */}


          </Routes>
          <Footer />
        </SnackbarProvider>
      </AuthProvider>
    </>
  )
}

export default App
