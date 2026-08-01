import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { useHeartbeat } from "./hooks/useHeartbeat";
import { HomePage } from "./pages/HomePage";
import { JoinPage } from "./pages/JoinPage";
import { MePage } from "./pages/MePage";
import { ProfilePage } from "./pages/ProfilePage";

function AppRoutes() {
  useHeartbeat();

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/p/:slug" element={<ProfilePage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
