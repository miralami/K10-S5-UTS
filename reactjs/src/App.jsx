import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/SidebarLayout.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element=
            <Layout>
              <Home />
            </Layout>
        />
        <Route
          path="/dashboard"
          element=
            <Layout>
              <Dashboard />
            </Layout>
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
