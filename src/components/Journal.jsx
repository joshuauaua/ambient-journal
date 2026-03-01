import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { audioEngine } from '../audio/AudioEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download } from 'lucide-react';

const Journal = () => {
  const [content, setContent] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isEngineActive, setIsEngineActive] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef(null);

  const handleStart = async () => {
    await audioEngine.init();
    audioEngine.startDrone();
    audioEngine.startRecording();
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

  // Hook for starting on any key from the overlay screen
  useEffect(() => {
    const handleOverlayKeyDown = (e) => {
      // Ignore meta keys to not block normal OS shortcuts
      if (showOverlay && !isStarted && !e.metaKey && !e.ctrlKey) {
        handleStart();
      }
      // Also allow closing About sheet with Escape key
      if (e.key === 'Escape') {
        setShowAbout(false);
      }
    };
    
    window.addEventListener('keydown', handleOverlayKeyDown);
    return () => window.removeEventListener('keydown', handleOverlayKeyDown);
  }, [showOverlay, isStarted]);

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

  const handleExport = async () => {
    const blob = await audioEngine.stopRecording();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      
      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      anchor.download = `AmbientJournal${dateStr}.webm`;
      
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
      
      // Restart recording
      audioEngine.startRecording();
    }
  };

  const toggleEngine = () => {
    const nextState = !isEngineActive;
    setIsEngineActive(nextState);
    Tone.Destination.mute = !nextState;
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
              background: 'rgba(5, 5, 8, 0.4)',
              backdropFilter: 'blur(10px)',
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
                fontSize: 'min(100px, 80vw)', 
                fontFamily: '"Unbounded", sans-serif', 
                fontWeight: '200', 
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
              style={{ 
                opacity: 0.5, 
                fontSize: '1.2rem', 
                letterSpacing: '0.2em', 
                textTransform: 'uppercase',
                position: 'absolute',
                bottom: '15%'
              }}
            >
              Tap to begin
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={isStarted ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '30px 50px',
          display: isStarted || !showOverlay ? 'flex' : 'none',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 5,
          pointerEvents: isStarted ? 'auto' : 'none'
        }}
      >
        <div style={{
          fontFamily: '"Unbounded", sans-serif',
          fontWeight: 300,
          fontSize: '1.25rem',
          color: 'var(--text-color)',
          opacity: 0.8,
          textShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
          lineHeight: 1
        }}>
          Ambient Journal
        </div>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-color)',
            fontSize: '1rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.6,
            cursor: 'pointer',
            transition: 'opacity 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.6'}
          onClick={() => setShowAbout(true)}
        >
          About
        </button>
      </motion.div>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={isStarted ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 4, ease: "easeInOut" }}
        style={{
          display: isStarted || !showOverlay ? 'flex' : 'none',
          position: 'relative' // to position header items if needed
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', opacity: 0.8 }}>
          <span style={{ fontSize: '0.9rem', letterSpacing: '0.2em' }}>NEW ENTRY / {new Date().toLocaleDateString()}</span>
          <button 
            onClick={handleExport}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'inherit',
              padding: '4px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Download size={14} />
            Export Audio
          </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span 
              onClick={toggleEngine} 
              style={{ 
                cursor: 'pointer', 
                userSelect: 'none',
                opacity: isEngineActive ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}
            >
              Tone Engine: {isEngineActive ? (isStarted ? 'Active' : 'Warming up...') : 'Disabled'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* About Sheet */}
      <AnimatePresence>
        {showAbout && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#000',
                zIndex: 40,
                cursor: 'pointer'
              }}
              onClick={() => setShowAbout(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(400px, 100vw)',
                backgroundColor: 'rgba(20, 20, 25, 0.95)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 50,
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--text-color)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontFamily: '"Unbounded", sans-serif', fontSize: '2rem', margin: 0, fontWeight: '300' }}>About</h2>
                <button 
                  onClick={() => setShowAbout(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    opacity: 0.6,
                    padding: '0 10px'
                  }}
                >&times;</button>
              </div>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p>
                  <strong>Ambient Journal</strong> is a meditative space where your words become sound. It’s not just about recording your day; it’s about experiencing your thoughts through a unique, real-time soundscape. Every keystroke triggers a generative audio engine, turning the quiet act of reflection into a rich, multisensory event. Once you’ve completed your entry, you can export the session as an audio recording to keep forever.
                </p>
                <p>
                  This is an open-source project built with a React frontend, utilizing Tone.js for all procedural audio functionality.
                </p>
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: 0 }}>
                    Developed by: <a href="https://joshuauaua.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Joshua Ng</a>
                  </p>
                  <p style={{ margin: 0 }}>
                    Source Code: <a href="https://github.com/joshuauaua/ambient-journal" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>GitHub Repository</a>
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Journal;
