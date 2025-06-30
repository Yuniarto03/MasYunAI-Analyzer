import React from 'react';
import { Theme } from '../../types';
import { RAW_COLOR_VALUES } from '../../constants';

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
    </>
  );
};

export default FuturisticBackground;