import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const Journal = () => {
  const [content, setContent] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef(null);

  const handleStart = async () => {
    await audioEngine.init();
    audioEngine.startDrone();
    setShowOverlay(false);
    
    // Smooth transition to active state
    setTimeout(() => {
      setIsStarted(true);
    }, 4000); // 4 second fade in for the UI
  };

  useEffect(() => {
    if (isStarted) {
      textareaRef.current?.focus();
    }
  }, [isStarted]);

  const handleKeyDown = (e) => {
    if (!isStarted) return;
    
    // Stop drone when user starts typing
    if (content.length === 0 && e.key.length === 1) {
      audioEngine.stopDrone();
    }

    // Trigger sound on any key except modifiers
    if (e.key.length === 1 || e.key === ' ' || e.key === 'Enter' || e.key === 'Backspace') {
      audioEngine.handleType(e.key);
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  return (
    <div className="app-container">
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            className="start-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            onClick={handleStart}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
              background: 'rgba(5, 5, 8, 0.9)',
              backdropFilter: 'blur(30px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '20px'
            }}
          >
            <motion.h1 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 3, ease: "easeOut" }}
              style={{ 
                fontSize: 'min(400px, 80vw)', 
                fontFamily: 'Rochester, cursive', 
                fontWeight: '400', 
                marginBottom: '20px',
                lineHeight: '0.8',
                color: 'var(--text-color)',
                textShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
              }}
            >
              Ambient Journal
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 2, duration: 2 }}
              style={{ opacity: 0.5, fontSize: '1.2rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              Tap to begin session
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={isStarted ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 4, ease: "easeInOut" }}
        style={{
          display: isStarted || !showOverlay ? 'flex' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', opacity: 0.8 }}>
          <span style={{ fontSize: '0.9rem', letterSpacing: '0.2em' }}>NEW ENTRY / {new Date().toLocaleDateString()}</span>
        </div>

        <textarea
          ref={textareaRef}
          className="journal-textarea"
          placeholder="Start typing your thoughts..."
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck="false"
        />

        <div className="status-bar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Sparkles size={14} style={{ marginRight: '6px' }} />
            <span>Words: {wordCount}</span>
          </div>
          <div>
            <span>Tone Engine: {isStarted ? 'Active' : 'Warming up...'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Journal;
