import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { MeetingNotesPage } from './pages/MeetingNotesPage';
import { NewNotePage } from './pages/NewNotePage';
import { NoteDetailPage } from './pages/NoteDetailPage';
import { BoardPage } from './pages/BoardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layouts';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/notes" element={<MeetingNotesPage />} />
        <Route path="/notes/new" element={<NewNotePage />} />
        <Route path="/notes/:id" element={<NoteDetailPage />} />
        <Route path="/board" element={<BoardPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/notes" replace />} />
      <Route path="*" element={<Navigate to="/notes" replace />} />
    </Routes>
  );
}

export default App;
