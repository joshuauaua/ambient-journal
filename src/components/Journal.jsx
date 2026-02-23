import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music, Pen } from 'lucide-react';

const Journal = () => {
  const [content, setContent] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef(null);

  const handleStart = async () => {
    await audioEngine.init();
    setIsStarted(true);
    // Focus textarea after a short delay to allow transition
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (!isStarted) return;
    
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
        {!isStarted && (
          <motion.div 
            className="start-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            onClick={handleStart}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
              background: 'rgba(5, 5, 8, 0.8)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Music size={64} color="#6366f1" style={{ marginBottom: '20px', opacity: 0.8 }} />
            </motion.div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '300', marginBottom: '10px' }}>Ambient Journal</h1>
            <p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Tap anywhere to begin your session</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="glass-panel fade-in"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', opacity: 0.8 }}>
          <Pen size={18} style={{ marginRight: '10px' }} />
          <span style={{ fontSize: '0.9rem', letterSpacing: '0.1em' }}>NEW ENTRY / {new Date().toLocaleDateString()}</span>
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
            <span>Tone Engine: {isStarted ? 'Active' : 'Offline'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Journal;
