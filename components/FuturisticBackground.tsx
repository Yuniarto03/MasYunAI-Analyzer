import React from 'react';
import { Theme } from '../types';
import { RAW_COLOR_VALUES } from '../constants';

interface FuturisticBackgroundProps {
  theme: Theme;
  reduceMotion: boolean;
}

const FuturisticBackground: React.FC<FuturisticBackgroundProps> = ({ theme, reduceMotion }) => {
  const bgAccent1 = RAW_COLOR_VALUES[theme.accent1] || '#00D4FF';
  const bgAccent2 = RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6';
  const bgAccent3 = RAW_COLOR_VALUES[theme.accent3] || '#00FF88';
  const bgAccent4 = RAW_COLOR_VALUES[theme.accent4] || '#FF6B35';
  const darkBgColor = RAW_COLOR_VALUES[theme.darkBg] || '#0A0F1E';

  // SVG for twinkling stars with glow filter
  const twinklingStarsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <filter id="starGlow">
        <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="10" cy="10" r="0.5" fill="%23fff" opacity="0.8" filter="url(%23starGlow)"/>
    <circle cx="30" cy="40" r="0.3" fill="%23eee" opacity="0.6" filter="url(%23starGlow)"/>
    <circle cx="70" cy="20" r="0.4" fill="%23fff" opacity="0.9" filter="url(%23starGlow)"/>
    <circle cx="50" cy="80" r="0.2" fill="%23ddd" opacity="0.5" filter="url(%23starGlow)"/>
    <circle cx="90" cy="60" r="0.3" fill="%23eee" opacity="0.7" filter="url(%23starGlow)"/>
    <circle cx="5" cy="60" r="0.4" fill="%23fff" opacity="0.85" filter="url(%23starGlow)"/>
    <circle cx="45" cy="15" r="0.2" fill="%23ddd" opacity="0.55" filter="url(%23starGlow)"/>
    <circle cx="80" cy="90" r="0.5" fill="%23fff" opacity="0.95" filter="url(%23starGlow)"/>
    <circle cx="25" cy="75" r="0.3" fill="%23eee" opacity="0.65" filter="url(%23starGlow)"/>
    <circle cx="65" cy="50" r="0.2" fill="%23ddd" opacity="0.45" filter="url(%23starGlow)"/>
    <circle cx="15" cy="85" r="0.4" fill="%23fff" opacity="0.75" filter="url(%23starGlow)"/>
    <circle cx="55" cy="5" r="0.3" fill="%23eee" opacity="0.5" filter="url(%23starGlow)"/>
    <circle cx="85" cy="35" r="0.2" fill="%23ddd" opacity="0.6" filter="url(%23starGlow)"/>
    <circle cx="35" cy="95" r="0.5" fill="%23fff" opacity="0.8" filter="url(%23starGlow)"/>
    <circle cx="75" cy="65" r="0.3" fill="%23eee" opacity="0.7" filter="url(%23starGlow)"/>
  </svg>`;

  return (
    <>
      <div 
        className="fixed inset-0 z-[-1] overflow-hidden"
        style={{ backgroundColor: darkBgColor }}
      >
        {!reduceMotion && (
          <>
            {/* Solar System Elements */}
            <div className="sun"></div>
            {/* Planets */}
            <div className="planet-orbit" style={{'--orbit-duration': '28s', '--planet-size': '8px', '--orbit-radius-x': '150px', '--orbit-radius-y': '75px', '--initial-angle': '20deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent1} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '42s', '--planet-size': '14px', '--orbit-radius-x': '280px', '--orbit-radius-y': '140px', '--initial-angle': '110deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent2} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '58s', '--planet-size': '11px', '--orbit-radius-x': '380px', '--orbit-radius-y': '190px', '--initial-angle': '200deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent3} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '75s', '--planet-size': '9px', '--orbit-radius-x': '450px', '--orbit-radius-y': '225px', '--initial-angle': '45deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent4} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '90s', '--planet-size': '20px', '--orbit-radius-x': '520px', '--orbit-radius-y': '260px', '--initial-angle': '150deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['pink-500'] || '#ec4899'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '110s', '--planet-size': '16px', '--orbit-radius-x': '600px', '--orbit-radius-y': '300px', '--initial-angle': '280deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['cyan-400'] || '#22d3ee'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '130s', '--planet-size': '18px', '--orbit-radius-x': '680px', '--orbit-radius-y': '340px', '--initial-angle': '70deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['amber-500'] || '#f59e0b'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '22s', '--planet-size': '5px', '--orbit-radius-x': '120px', '--orbit-radius-y': '60px', '--initial-angle': '250deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['lime-500'] || '#84cc16'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '18s', '--planet-size': '4px', '--orbit-radius-x': '90px', '--orbit-radius-y': '45px', '--initial-angle': '10deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['violet-500'] || '#8b5cf6'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '51s', '--planet-size': '10px', '--orbit-radius-x': '320px', '--orbit-radius-y': '160px', '--initial-angle': '310deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent1} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '66s', '--planet-size': '13px', '--orbit-radius-x': '410px', '--orbit-radius-y': '205px', '--initial-angle': '130deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent2} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '150s', '--planet-size': '3px', '--orbit-radius-x': '750px', '--orbit-radius-y': '375px', '--initial-angle': '220deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': '#ffffff'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '170s', '--planet-size': '6px', '--orbit-radius-x': '800px', '--orbit-radius-y': '400px', '--initial-angle': '340deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': bgAccent3} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '48s', '--planet-size': '7px', '--orbit-radius-x': '250px', '--orbit-radius-y': '125px', '--initial-angle': '80deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['cyan-400'] || '#22d3ee'} as React.CSSProperties}></div></div>
            <div className="planet-orbit" style={{'--orbit-duration': '82s', '--planet-size': '17px', '--orbit-radius-x': '480px', '--orbit-radius-y': '240px', '--initial-angle': '170deg', '--z-index': '1' } as React.CSSProperties}><div className="planet" style={{'--planet-color': RAW_COLOR_VALUES['pink-500'] || '#ec4899'} as React.CSSProperties}></div></div>

            <div className="stars-layer"></div>
            <div className="twinkling-stars-layer" style={{ backgroundImage: `url("data:image/svg+xml;utf8,${twinklingStarsSvg.replace(/#/g, '%23')}")` }}></div>

            <div className="aurora-layer">
                <div className="aurora-shape aurora-shape-1" style={{ '--aurora-color-1': `${bgAccent1}33`, '--aurora-color-2': `${bgAccent2}22` } as React.CSSProperties}></div>
                <div className="aurora-shape aurora-shape-2" style={{ '--aurora-color-1': `${bgAccent3}22`, '--aurora-color-2': `${bgAccent4}11` } as React.CSSProperties}></div>
                <div className="aurora-shape aurora-shape-3" style={{ '--aurora-color-1': `${bgAccent2}1A`, '--aurora-color-2': `${bgAccent3}0D` } as React.CSSProperties}></div>
            </div>
            <div className="grid-overlay"></div>
          </>
        )}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${darkBgColor}00 0%, ${darkBgColor}FF 70%)`
          }}
        />
      </div>
      <style>{`
        ${!reduceMotion ? `
        .sun {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120px; /* Sun size */
          height: 120px;
          background: radial-gradient(ellipse at center, #fff 0%, ${bgAccent4}FF 30%, ${bgAccent4}AA 60%, transparent 100%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 40px ${bgAccent4}, 0 0 80px ${bgAccent4};
          animation: pulseSun 4s infinite alternate ease-in-out;
          z-index: 0; /* Behind planets */
        }
        @keyframes pulseSun {
          0% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 40px ${bgAccent4}, 0 0 80px ${bgAccent4}AA; }
          100% { transform: translate(-50%, -50%) scale(1.2); box-shadow: 0 0 60px ${bgAccent4}FF, 0 0 120px ${bgAccent4}AA; }
        }
        .planet-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          width: calc(var(--orbit-radius-x) * 2); /* Diameter X */
          height: calc(var(--orbit-radius-y) * 2); /* Diameter Y */
          border-radius: 50%;
          animation: orbit var(--orbit-duration) linear infinite;
          transform-origin: center center; 
          transform: translate(-50%, -50%) rotate(var(--initial-angle)); 
          z-index: var(--z-index);
        }
        .planet {
          position: absolute;
          top: 0;
          left: 50%;
          width: var(--planet-size);
          height: var(--planet-size);
          background-color: var(--planet-color);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--planet-color), 0 0 5px var(--planet-color);
          animation: rotatePlanet var(--orbit-duration) linear infinite;
        }

        @keyframes rotatePlanet {
          from {
            transform: translate(-50%, -50%) rotate(calc(0deg - var(--initial-angle)));
          }
          to {
            transform: translate(-50%, -50%) rotate(calc(-360deg - var(--initial-angle)));
          }
        }
        
        @keyframes orbit { 
          0% { transform: translate(-50%, -50%) rotate(var(--initial-angle)); }
          100% { transform: translate(-50%, -50%) rotate(calc(var(--initial-angle) + 360deg)); }
        }

        .stars-layer {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;
          background-image: 
            radial-gradient(1.2px 1.2px at 20px 30px, #fff, rgba(0,0,0,0)),
            radial-gradient(1.2px 1.2px at 40px 70px, #fff, rgba(0,0,0,0)),
            radial-gradient(0.8px 0.8px at 50px 160px, #ddd, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 90px 40px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 160px 120px, #ddd, rgba(0,0,0,0)),
            radial-gradient(1.8px 1.8px at 100px 100px, #fff, rgba(0,0,0,0)),
            radial-gradient(1.2px 1.2px at 5px 80px, #eee, rgba(0,0,0,0)),
            radial-gradient(0.6px 0.6px at 180px 10px, #ddd, rgba(0,0,0,0)),
            radial-gradient(1.3px 1.3px at 10px 150px, #fff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 140px 170px, #eee, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 70px 190px, #ddd, rgba(0,0,0,0));
          background-repeat: repeat; background-size: 200px 200px;
          animation: zoomStars 20s infinite alternate ease-in-out; opacity: 0.9; z-index: -2;
        }
        @keyframes zoomStars { 0% { transform: scale(1); } 100% { transform: scale(1.2); } }
        
        .twinkling-stars-layer {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;
          background-repeat: repeat;
          background-size: 100px 100px; /* Controls density */
          animation: twinkle 5s infinite linear; opacity: 0.8; z-index: -2;
        }
        @keyframes twinkle { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        
        .aurora-layer {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;
          overflow: hidden; mix-blend-mode: screen; z-index: -1;
        }
        .aurora-shape { position: absolute; border-radius: 50%; filter: blur(50px); opacity: 0.4; }
        .aurora-shape-1 {
          width: 60%; height: 60%; top: -20%; left: -20%;
          background: radial-gradient(circle, var(--aurora-color-1) 0%, var(--aurora-color-2) 70%, transparent 100%);
          animation: moveAurora1 25s infinite alternate ease-in-out;
        }
        .aurora-shape-2 {
          width: 50%; height: 50%; top: 30%; right: -15%;
          background: radial-gradient(circle, var(--aurora-color-1) 0%, var(--aurora-color-2) 70%, transparent 100%);
          animation: moveAurora2 30s infinite alternate ease-in-out;
        }
        .aurora-shape-3 {
          width: 40%; height: 40%; bottom: -10%; left: 20%;
          background: radial-gradient(circle, var(--aurora-color-1) 0%, var(--aurora-color-2) 70%, transparent 100%);
          animation: moveAurora3 20s infinite alternate ease-in-out;
        }
        @keyframes moveAurora1 { 0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.3; } 100% { transform: translate(20px, 30px) rotate(20deg) scale(1.3); opacity: 0.5; } }
        @keyframes moveAurora2 { 0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.4; } 100% { transform: translate(-25px, -15px) rotate(-15deg) scale(1.2); opacity: 0.6; } }
        @keyframes moveAurora3 { 0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.2; } 100% { transform: translate(10px, -20px) rotate(10deg) scale(1.1); opacity: 0.4; } }
        
        .grid-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;
          background-image:
            linear-gradient(to right, ${bgAccent1}11 1px, transparent 1px),
            linear-gradient(to bottom, ${bgAccent1}11 1px, transparent 1px);
          background-size: 50px 50px; animation: panGrid 30s linear infinite; opacity: 0.3; z-index: -1;
        }
        @keyframes panGrid { 0% { background-position: 0 0; } 100% { background-position: 100px 100px; } }
        ` : `
        .sun, .planet-orbit, .planet, .stars-layer, .twinkling-stars-layer, .aurora-layer, .grid-overlay { animation: none !important; }
        .sun { 
          position: absolute; top: 50%; left: 50%; width: 80px; height: 80px;
          background: radial-gradient(ellipse at center, ${bgAccent4} 0%, ${bgAccent4}AA 40%, transparent 70%);
          border-radius: 50%; transform: translate(-50%, -50%);
          box-shadow: 0 0 20px ${bgAccent4}; z-index:0;
        }
        .planet-orbit { display: none; }
        .stars-layer { /* Static stars for reduced motion */
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;
          background-image: 
            radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
            radial-gradient(0.5px 0.5px at 70px 100px, #ddd, rgba(0,0,0,0));
          background-repeat: repeat; background-size: 150px 150px; opacity: 0.5; z-index: -2;
        }
        .twinkling-stars-layer { opacity: 0.5; z-index: -2; /* Keep it but no animation */ }
        .grid-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;
          background-image:
            linear-gradient(to right, ${bgAccent1}0A 1px, transparent 1px),
            linear-gradient(to bottom, ${bgAccent1}0A 1px, transparent 1px);
          background-size: 50px 50px; opacity: 0.2; z-index: -1;
        }
        `}
      `}</style>
    </>
  );
};

export default FuturisticBackground;
