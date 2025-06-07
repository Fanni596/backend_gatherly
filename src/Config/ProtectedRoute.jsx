import { useContext, useState } from "react";
import { AuthContext } from "../Contexts/authContext";
import { Link } from "react-router-dom";
import UnauthorizedPage from "../Components/Global/UnAuthPage/unAuth";

const ProtectedRoute = ({ children }) => {
  const CurrentPath = location.pathname

const match = CurrentPath.match(/\/attendee/)

  const [userRole, setUserRole] = useState(match ? "attendee" : "organizer") // 'attendee' or 'organizer'
  
  const { user, attendeeUser, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  return (userRole === "organizer" && user || userRole === "attendee" &&  attendeeUser) ? children : <UnauthorizedPage/>;
};

export default ProtectedRoute;