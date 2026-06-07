import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FundDetail from './pages/FundDetail';
import Comparison from './pages/Comparison';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Comparison />} />
          <Route path="/analysis" element={<Dashboard />} />
          <Route path="/fund/:code" element={<FundDetail />} />
          <Route path="/comparison" element={<Comparison />} />
        </Routes>
      </Layout>
    </Router>
  );
}
