const Logo = ({ className = "h-8 w-8" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect x="10" y="15" width="50" height="70" rx="5" fill="url(#logoGrad)" opacity="0.9"/>
      <rect x="40" y="20" width="50" height="70" rx="5" fill="url(#logoGrad)" opacity="0.7"/>
      <circle cx="65" cy="55" r="20" fill="none" stroke="#10b981" strokeWidth="4"/>
      <path d="M58 55 L63 60 L73 50" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="18" y="35" width="25" height="3" rx="1" fill="white"/>
      <rect x="18" y="42" width="20" height="3" rx="1" fill="white"/>
      <rect x="18" y="49" width="22" height="3" rx="1" fill="white"/>
    </svg>
  );
};

export default Logo;
