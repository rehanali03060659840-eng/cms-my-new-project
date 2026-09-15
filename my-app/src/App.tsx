import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { LiveMeetSocketProvider } from "./context/LiveMeetSocketContext";
import { AppLayout } from "./SideBar/AppLayout";
import { Login } from "./Pages/Login";
import { Register } from "./Pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/Role.Routes";
import { Users } from "./Pages/Users";
import { LiveMeetEntry } from "./Pages/live meet/Livemeetpages/LiveMeetEntry";
import { LiveMeetRoom } from "./Pages/live meet/Livemeetpages/LiveMeetRoom";
import "./index.css";
import { getFcmToken } from "./firebase/useFcmToken";

const App = () => {
  useEffect(() => {
    getFcmToken()
      .then((token) => {
        if (token) console.log("FCM token:", token);
      })
      .catch(console.error);
  }, []);
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthProvider>
        <LiveMeetSocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              
                {/* <Route
                  path="anime/admin"
                  element={
                    <RoleRoute allowedRoles={["super_admin"]}>
                      <AdminPanel />
                    </RoleRoute>
                  }
                /> */}
                
              
              <Route index
                path="users"
                element={
                  <RoleRoute allowedRoles={["super_admin"]}>
                    <Users />
                  </RoleRoute>
                }
              />
              
              <Route path="live-meet" element={<LiveMeetEntry />} />
              <Route
                path="live-meet/room/:meetingId"
                element={<LiveMeetRoom />}
              />
              <Route path="*" element={<h2>404: Page Not Found</h2>} />
            </Route>
          </Routes>
        </LiveMeetSocketProvider>
      </AuthProvider>
    </>
  );
};
export default App;
