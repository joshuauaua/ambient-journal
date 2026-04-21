import React from 'react';
import Norrsken from '../components/Norrsken';

const NorrskenPage = () => {
  return (
    <div style={{ width: '100vw', height: '200vh', background: '#000', position: 'relative', overflowX: 'hidden' }}>
      {/* Background Effect */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Norrsken />
      </div>

      {/* Mask Layer */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)'
      }} />

      {/* Content Layer (200vh for scrolling effect - empty as per request) */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '200vh',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

export default NorrskenPage;
