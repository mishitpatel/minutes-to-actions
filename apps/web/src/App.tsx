import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { MeetingNotesPage } from './pages/MeetingNotesPage';
import { NewNotePage } from './pages/NewNotePage';
import { NoteDetailPage } from './pages/NoteDetailPage';
import { BoardPage } from './pages/BoardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <MeetingNotesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/new"
        element={
          <ProtectedRoute>
            <NewNotePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/:id"
        element={
          <ProtectedRoute>
            <NoteDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/notes" replace />} />
      <Route path="*" element={<Navigate to="/notes" replace />} />
    </Routes>
  );
}

export default App;
