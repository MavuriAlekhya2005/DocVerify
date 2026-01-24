/**
 * DocVerify Animation Components Library
 * 
 * Organized by category for easy discovery and usage.
 * All components are built with GSAP, Three.js, or OGL for high-performance animations.
 */

// ============================================
// � GLOBAL BACKGROUND
// Full-site immersive backgrounds
// ============================================
export { default as GlobalBackground } from './GlobalBackground/GlobalBackground';

// ============================================
// 🎨 UI ELEMENTS
// Glass morphism and modern UI components
// ============================================
export { default as GlassIcons } from './GlassIcons/GlassIcons';
export { default as GlassNavIcon } from './GlassIcons/GlassNavIcon';

// ============================================
// ✨ PARTICLE & 3D EFFECTS
// WebGL and Three.js based visual effects
// ============================================
export { default as Galaxy } from './Galaxy/Galaxy';

// ============================================
// 📝 TEXT ANIMATIONS
// Animated text reveal and split effects
// ============================================
export { default as SplitText } from './SplitText/SplitText';

// ============================================
// 🖱️ CURSOR EFFECTS
// Custom cursor and interaction effects
// ============================================
export { default as TargetCursor } from './TargetCursor/TargetCursor';
export { default as GlassCursor } from './GlassCursor/GlassCursor';

/**
 * COMPONENT CATEGORIES:
 * 
 * 1. GLOBAL BACKGROUND
 *    - GlobalBackground: Full-viewport galaxy with mouse interaction
 * 
 * 2. UI ELEMENTS
 *    - GlassIcons: Glassmorphism icon buttons with 3D hover effect
 *    - GlassNavIcon: Navigation links with glass effect
 * 
 * 3. PARTICLE & 3D EFFECTS
 *    - Galaxy: Animated starfield with mouse interaction (OGL/WebGL)
 * 
 * 4. TEXT ANIMATIONS
 *    - SplitText: Character/word split animation with scroll trigger
 * 
 * 5. CURSOR EFFECTS
 *    - TargetCursor: Custom targeting cursor with hover detection
 *    - GlassCursor: Simple glass-morphism cursor
 * 
 * USAGE EXAMPLES:
 * 
 * import { GlobalBackground, GlassCursor } from '@/components/animations';
 */
