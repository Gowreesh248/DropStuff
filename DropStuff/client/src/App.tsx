import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { DropCreatedPage } from './pages/DropCreatedPage.js';
import { RecipientDropPage } from './pages/RecipientDropPage.js';
import { ExpiredDropPage } from './pages/ExpiredDropPage.js';
import { RevokedDropPage } from './pages/RevokedDropPage.js';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/drop/:token/created" element={<DropCreatedPage />} />
            <Route path="/drop/expired" element={<ExpiredDropPage />} />
            <Route path="/drop/revoked" element={<RevokedDropPage />} />
            <Route path="/drop/:token" element={<RecipientDropPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};
