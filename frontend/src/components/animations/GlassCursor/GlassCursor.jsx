import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';
import './GlassCursor.css';

/**
 * GlassCursor - Enhanced glass-morphism cursor with improved button detection
 * Responds to all interactive elements including styled buttons
 * Smooth animations with GSAP and click feedback
 */
const GlassCursor = memo(function GlassCursor() {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);
  const isHovering = useRef(false);
  const mousePos = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    // Skip on mobile/touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && window.innerWidth <= 768) return;
    
    const cursor = cursorRef.current;
    const dot = cursorDotRef.current;
    if (!cursor || !dot) return;
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    document.body.classList.add('glass-cursor-active');
    
    // Initial position
    gsap.set([cursor, dot], {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    
    // Check if element is interactive (improved detection)
    const isInteractive = (element) => {
      if (!element) return false;
      
      // Direct tag checks
      const tagName = element.tagName?.toLowerCase();
      if (['a', 'button', 'input', 'textarea', 'select', 'label'].includes(tagName)) return true;
      
      // Role-based checks
      const role = element.getAttribute('role');
      if (['button', 'link', 'menuitem', 'tab', 'option', 'checkbox', 'radio'].includes(role)) return true;
      
      // Attribute checks
      if (element.hasAttribute('onclick') || element.getAttribute('tabindex') === '0') return true;
      if (element.hasAttribute('data-cursor-hover')) return true;
      
      // Class-based checks for styled buttons
      const className = element.className || '';
      if (typeof className === 'string' && (
        className.includes('btn') || 
        className.includes('button') ||
        className.includes('cursor-hover') ||
        className.includes('clickable')
      )) return true;
      
      // Check computed cursor style
      try {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.cursor === 'pointer') return true;
      } catch (e) {
        // Ignore errors for elements that can't be styled
      }
      
      // Check parent chain for interactive elements
      const interactiveSelectors = 'a, button, [role="button"], input, textarea, select, label, [data-cursor-hover], .cursor-hover, [class*="btn"], .nav-link';
      if (element.closest && element.closest(interactiveSelectors)) return true;
      
      return false;
    };
    
    // Mouse move handler with hover state checking
    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Check hover state on move for instant responsiveness
      const hoverable = isInteractive(e.target);
      if (hoverable && !isHovering.current) {
        activateHover();
      } else if (!hoverable && isHovering.current) {
        deactivateHover();
      }
      
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.25,
        ease: 'power2.out'
      });
      
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.08,
        ease: 'power2.out'
      });
    };
    
    // Activate hover state
    const activateHover = () => {
      if (isHovering.current) return;
      isHovering.current = true;
      
      gsap.to(cursor, {
        scale: 1.6,
        opacity: 0.7,
        borderColor: 'rgba(139, 92, 246, 0.9)',
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
        duration: 0.2,
        ease: 'power2.out'
      });
      
      gsap.to(dot, {
        scale: 0,
        duration: 0.15,
        ease: 'power2.out'
      });
    };
    
    // Deactivate hover state
    const deactivateHover = () => {
      if (!isHovering.current) return;
      isHovering.current = false;
      
      gsap.to(cursor, {
        scale: 1,
        opacity: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        duration: 0.2,
        ease: 'power2.out'
      });
      
      gsap.to(dot, {
        scale: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        duration: 0.15,
        ease: 'power2.out'
      });
    };
    
    // Click animation with feedback
    const onMouseDown = () => {
      gsap.to(cursor, { 
        scale: isHovering.current ? 1.2 : 0.8, 
        duration: 0.08,
        ease: 'power2.out'
      });
    };
    
    const onMouseUp = () => {
      gsap.to(cursor, { 
        scale: isHovering.current ? 1.6 : 1, 
        duration: 0.15,
        ease: 'elastic.out(1, 0.5)'
      });
    };
    
    // Hide cursor when leaving window
    const onMouseLeaveWindow = () => {
      gsap.to([cursor, dot], { opacity: 0, duration: 0.2 });
    };
    
    const onMouseEnterWindow = () => {
      gsap.to([cursor, dot], { opacity: 1, duration: 0.2 });
    };
    
    // Attach events
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeaveWindow);
    document.addEventListener('mouseenter', onMouseEnterWindow);
    
    return () => {
      document.body.style.cursor = '';
      document.body.classList.remove('glass-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeaveWindow);
      document.removeEventListener('mouseenter', onMouseEnterWindow);
    };
  }, []);
  
  return (
    <>
      <div ref={cursorRef} className="glass-cursor" aria-hidden="true">
        <div className="glass-cursor__ring" />
      </div>
      <div ref={cursorDotRef} className="glass-cursor__dot" aria-hidden="true" />
    </>
  );
});

export default GlassCursor;
