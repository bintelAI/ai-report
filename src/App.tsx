import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardEditor from './pages/DashboardEditor';


const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
