"use client"

import { useState, useEffect, useContext } from "react"
import ProtectedRoute from "../Config/ProtectedRoute"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { FiActivity, FiUsers, FiCalendar, FiList } from "react-icons/fi"
import { AuthContext } from "../Contexts/authContext"
import eventService from "../Services/eventServices"
// import attendeeListService from "../services/attendeeListService"
import { Link } from "react-router-dom"

const Dashboard = () => {
  const [chartWidth, setChartWidth] = useState(800)
  const { user, checkAuth } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    totalLists: 0,
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, action: "User login", timestamp: "2023-10-01 10:00 AM" },
    { id: 2, action: "New event created", timestamp: "2023-10-02 02:30 PM" },
    { id: 3, action: "Attendee added", timestamp: "2023-10-03 09:15 AM" },
    { id: 4, action: "Settings updated", timestamp: "2023-10-04 11:45 AM" },
  ])
  const [data, setData] = useState([
    { name: "Jan", events: 4, attendees: 24 },
    { name: "Feb", events: 3, attendees: 13 },
    { name: "Mar", events: 2, attendees: 98 },
    { name: "Apr", events: 2, attendees: 39 },
    { name: "May", events: 1, attendees: 48 },
    { name: "Jun", events: 2, attendees: 38 },
  ])


  useEffect(() => {
    checkAuth()
    fetchDashboardData()
  }, [])
  
if (user && user.role === "Attendee") {
  Navigate("/events")
}
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch all events
      const events = await eventService.getAllEvents()

      // Fetch all attendee lists
      const lists = await eventService.getAllLists()

      // Calculate stats
      const now = new Date()
      const upcoming = Array.isArray(events) ? events.filter((event) => new Date(event.start_date) >= now) : []

      // Set stats
      setStats({
        totalEvents: Array.isArray(events) ? events.length : 0,
        upcomingEvents: upcoming.length,
        totalLists: Array.isArray(lists) ? lists.length : 0,
        totalAttendees: Array.isArray(lists) ? lists.reduce((total, list) => total + (list.AttendeeCount || 0), 0) : 0,
      })

      // Set recent events (last 5)
      if (Array.isArray(events)) {
        const sortedEvents = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

        setRecentEvents(sortedEvents)
      }

      // Generate chart data based on events per month
      const chartData = generateChartData(events)
      setData(chartData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (events) => {
    if (!Array.isArray(events) || events.length === 0) return []

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Initialize counts for each month
    const monthlyCounts = months.map((month) => ({
      name: month,
      events: 0,
      attendees: 0,
    }))

    // Count events per month
    events.forEach((event) => {
      const date = new Date(event.start_date)
      const monthIndex = date.getMonth()
      monthlyCounts[monthIndex].events += 1
    })

    return monthlyCounts
  }

  console.log(user)
  // Sample data for the chart

  // Handle window resize for responsive chart
  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(window.innerWidth - 48, 800) // 48px for padding
      setChartWidth(width)
    }

    handleResize() // Set initial width
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.firstName + " " + user?.lastName || "User"}</h1>
          <p className="text-sm text-gray-500">Here's an overview of your activities and metrics.</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <FiCalendar className="text-2xl text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Total Events</p>
                    <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <FiActivity className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Upcoming Events</p>
                    <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FiUsers className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Total Attendees</p>
                    <p className="text-2xl font-bold">{stats.totalAttendees}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <FiList className="text-2xl text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Attendee Lists</p>
                    <p className="text-2xl font-bold">{stats.totalLists}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section - Now Responsive */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
              <h2 className="text-xl font-bold mb-4">Monthly Performance</h2>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="events" fill="#8884d8" name="Events" />
                    <Bar dataKey="attendees" fill="#82ca9d" name="Attendees" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Events Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Recent Events</h2>
                  <Link to="/events-page" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View All
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  {recentEvents.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentEvents.map((event) => (
                          <tr key={event.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {event.title || "Untitled Event"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(event.start_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  event.status === "published"
                                    ? "bg-green-100 text-green-800"
                                    : event.status === "draft"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {event.status || "draft"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No events found.{" "}
                      <Link to="/create-event" className="text-indigo-600">
                        Create your first event
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentActivity.map((activity) => (
                        <tr key={activity.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Gatherly. All rights reserved.</p>
        </footer>
      </div>
    </ProtectedRoute>
  )
}

export default Dashboard
