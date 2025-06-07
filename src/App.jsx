import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom'
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
function App() {


  return (
    <>
      <AuthProvider>
        <SnackbarProvider maxSnack={3}>
          <Navbar />
          <Breadcrumbs />
          <Routes>
            
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/" element={<Navigate to="/attendee" replace />} />
            <Route path="/attendee" element={<AttendeeHome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/guestlists" element={<ListsPage />} />
            <Route path="/guestlists/manage/:listId" element={<AttendeesPage />} />
            <Route path="events-page" element={<OrgnizerEventsPage />} />
            <Route path="/create-event" element={<EventCreationPage />} />
            <Route path="/event/:id" element={<EventView />} />
            <Route path="/events/:eventId/send-invites" element={<SendInvitesPage />} />
            <Route path="/create-event-ai" element={<CreateEventAI />} />
            <Route path="/attendee/login" element={<AttendeeLogin />} />
            <Route path="/attendee/events" element={<EventsPage />} />
            <Route path="/attendee/events/:id" element={<AttendeeEventView />} />
            <Route path="/event/:eventId/invite/:attendeeIdentifier" element={<InviteVerificationPage />} />
            {/* <Route path="/events/create" element={<CreateEvent />} /> */}
            <Route path="/events/edit/:eventId" element={<EditEvent />} />
          </Routes>
          <Footer />
        </SnackbarProvider>
      </AuthProvider>
    </>
  )
}

export default App
