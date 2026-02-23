import React from 'react';
import PrismaticBurst from './PrismaticBurst';

const Background = () => {
  return (
    <div className="background-blobs">
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={0.1}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={0}
          mixBlendMode="screen"
          colors={['#61ff3dff', '#ff007a', '#000000']}
        />
      </div>
    </div>
  );
};

export default Background;
