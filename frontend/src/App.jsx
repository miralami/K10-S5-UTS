import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/SidebarLayout.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Chat from './pages/Chat.jsx';
import { ChatProvider } from './context/ChatContext.jsx';

function App() {
  return (
    <BrowserRouter>
      {/* ChatProvider membungkus seluruh aplikasi agar koneksi chat global */}
      {/* ChatProvider wraps the entire app for global chat connection */}
      <ChatProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Layout>
                  <Search />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ChatProvider>
    </BrowserRouter>
  );
}

export default App;
