import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Background from './components/Background';
import Journal from './components/Journal';
import NorrskenPage from './pages/NorrskenPage';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <Background />
          <Journal />
        </>
      } />
      <Route path="/norrsken" element={<NorrskenPage />} />
    </Routes>
  );
}

export default App;
