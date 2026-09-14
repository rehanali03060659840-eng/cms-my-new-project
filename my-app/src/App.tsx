import { useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Home } from "./Pages/home";
import { Category } from "./Pages/Category";
import { AuthProvider } from "./context/AuthContext";
import { LiveMeetSocketProvider } from "./context/LiveMeetSocketContext";
import { AppLayout } from "./SideBar/AppLayout";
import { Login } from "./Pages/Login";
import { Register } from "./Pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/Role.Routes";
import { BlogPage } from "./Pages/Blogging/blogPage";
import { BlogFormPage } from "./Pages/Blogging/BlogFormPage";
import { BlogDetailPage } from "./Pages/Blogging/BlogDetailPage";
import { PrivacyPolicy } from "./Pages/privacypolicy";
import { TermConditions } from "./Pages/term&condition";
import { TrendingReelsList } from "./Pages/trendingreellist";
import { Users } from "./Pages/Users";
import { LiveMeetEntry } from "./Pages/live meet/Livemeetpages/LiveMeetEntry";
import { LiveMeetRoom } from "./Pages/live meet/Livemeetpages/LiveMeetRoom";
import { AnimeHome } from "./Pages/Anime/AnimeHome";
import { SeriesDetail } from "./Pages/Anime/SeriesDetail";
import { Watch } from "./Pages/Anime/Watch";
import { Upload } from "./Pages/Anime/Upload";
import { AdminPanel } from "./Pages/Anime/AdminPanel";
import { UserRoom } from "./Pages/Anime/UserRoom";
import { AnimeProvider } from "./context/AnimeContext";
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
              <Route
                index
                element={
                  <RoleRoute
                    allowedRoles={["super_admin", "admin", "moderator"]}
                  >
                    <Home />
                  </RoleRoute>
                }
              />
              <Route element={<AnimeProvider><Outlet /></AnimeProvider>}>
                <Route path="anime" element={<AnimeHome />} />
                <Route path="anime/series/:id" element={<SeriesDetail />} />
                <Route path="anime/watch/:episodeId" element={<Watch />} />
                <Route
                  path="anime/upload"
                  element={
                    <RoleRoute allowedRoles={["super_admin", "admin", "moderator", "user"]}>
                      <Upload />
                    </RoleRoute>
                  }
                />
                <Route
                  path="anime/admin"
                  element={
                    <RoleRoute allowedRoles={["super_admin"]}>
                      <AdminPanel />
                    </RoleRoute>
                  }
                />
                <Route
                  path="anime/room"
                  element={
                    <RoleRoute allowedRoles={["super_admin", "admin", "moderator", "user"]}>
                      <UserRoom />
                    </RoleRoute>
                  }
                />
              </Route>
              <Route
                path="category"
                element={
                  <RoleRoute allowedRoles={["super_admin", "admin"]}>
                    <Category />
                  </RoleRoute>
                }
              />
              <Route
                path="blogs"
                element={
                  <RoleRoute
                    allowedRoles={["super_admin", "admin", "moderator"]}
                  >
                    <BlogPage />
                  </RoleRoute>
                }
              />
              <Route path="blogs/new" element={<BlogFormPage />} />
              <Route path="blogs/edit/:slug" element={<BlogFormPage />} />
              <Route path="blogs/:slug" element={<BlogDetailPage />} />
              <Route
                path="trendingreelslist"
                element={
                  <RoleRoute
                    allowedRoles={["super_admin", "admin", "moderator"]}
                  >
                    <TrendingReelsList />
                  </RoleRoute>
                }
              />
              <Route
                path="users"
                element={
                  <RoleRoute allowedRoles={["super_admin"]}>
                    <Users />
                  </RoleRoute>
                }
              />
              <Route
                path="setting/privacy-and-policy"
                element={
                  <RoleRoute allowedRoles={["super_admin"]}>
                    <PrivacyPolicy />
                  </RoleRoute>
                }
              />
              <Route
                path="setting/terms-and-conditions"
                element={
                  <RoleRoute allowedRoles={["super_admin"]}>
                    <TermConditions />
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
