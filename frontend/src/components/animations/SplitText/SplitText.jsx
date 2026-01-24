import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    if (animationCompletedRef.current) return;

    const el = ref.current;
    const chars = text.split('');
    
    // Clear and rebuild with spans
    el.innerHTML = '';
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';
      span.textContent = char === ' ' ? '\u00A0' : char;
      el.appendChild(span);
    });

    const targets = el.querySelectorAll('.split-char');
    
    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign = marginValue === 0 ? '' : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    gsap.fromTo(
      targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          fastScrollEnd: true
        },
        onComplete: () => {
          animationCompletedRef.current = true;
          onCompleteRef.current?.();
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [text, delay, duration, ease, splitType, from, to, threshold, rootMargin, fontsLoaded]);

  const style = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };

  const classes = `split-parent ${className}`;

  const props = { ref, style, className: classes };

  switch (tag) {
    case 'h1': return <h1 {...props}>{text}</h1>;
    case 'h2': return <h2 {...props}>{text}</h2>;
    case 'h3': return <h3 {...props}>{text}</h3>;
    case 'h4': return <h4 {...props}>{text}</h4>;
    case 'h5': return <h5 {...props}>{text}</h5>;
    case 'h6': return <h6 {...props}>{text}</h6>;
    default: return <p {...props}>{text}</p>;
  }
};

export default SplitText;
