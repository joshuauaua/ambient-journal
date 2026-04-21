import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Background from './components/Background';
import Journal from './components/Journal';
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
    </Routes>
  );
}

export default App;
