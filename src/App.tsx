import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FundDetail from './pages/FundDetail';
import FundAdvisor from './pages/FundAdvisor';
import Comparison from './pages/Comparison';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Comparison />} />
          <Route path="/fund-advisor" element={<FundAdvisor />} />
          <Route path="/fund-search" element={<FundAdvisor />} />
          <Route path="/analysis" element={<Dashboard />} />
          <Route path="/fund/:code" element={<FundDetail />} />
          <Route path="/comparison" element={<Comparison />} />
        </Routes>
      </Layout>
    </Router>
  );
}
