import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { StudentsPage } from "./pages/StudentsPage.jsx";
import { SubjectsPage } from "./pages/SubjectsPage.jsx";
import { UploadPage } from "./pages/UploadPage.jsx";
import { StudentProfilePage } from "./pages/StudentProfilePage.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:studentId" element={<StudentProfilePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Layout>
  );
}
