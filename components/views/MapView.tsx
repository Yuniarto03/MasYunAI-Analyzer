
import React, { useState, useEffect, useMemo, useContext, useCallback, useRef, MouseEvent as ReactMouseEvent, WheelEvent, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, LatLngTuple, AggregatorType, IconType, FileHeaders, GeoJsonFeature, GeoJsonFeatureCollection, MapFeatureStyle, GeoJsonGeometry } from '../../types';
import { geocodeAddressWithGemini, analyzeTextWithGemini } from '../../services/geminiService';
import { CONTINENTS, COUNTRIES_DATA } from '../../constants';


// --- ICONS ---
const LocationIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const ValueIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
const CategoryIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 01-3.388 1.62m-5.043-.025a15.998 15.998 0 01-1.622-3.385m-3.388 1.62A15.998 15.998 0 015.47 8.032m5.043-.025a15.998 15.998 0 00-1.622-3.385m-3.388 1.62a15.998 15.998 0 013.388-1.62" /></svg>;
const FitScreenIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;
const LinkIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const UploadIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const SpinnerIcon: IconType = ({ className }) => <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const PlusIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const ErrorIcon: React.FC<{ className?: string, title?: string }> = ({ className, title }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        {title && <title>{title}</title>}
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);


interface PlacedPin {
    id: string;
    name: string;
    latLng: LatLngTuple | null;
    status: 'loading' | 'success' | 'error';
    error?: string;
}

const COLOR_PALETTE = ['#2dd4bf', '#a78bfa', '#f87171', '#fbbf24', '#34d399', '#818cf8', '#fb7185', '#fde047'];
type MapTheme = 'dark' | 'light' | 'blueprint';
type DisplayMode = 'dots' | 'heatmap';
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;

type AggregatedLocationData = { location: string; value: number; category: string; count: number; latLng: LatLngTuple; rowData: TableRow };
type ConnectionData = { from: LatLngTuple; to: LatLngTuple; value: number; };

// --- NEW CHOROPLETH CONSTANTS ---
const AGGREGATOR_OPTIONS: AggregatorType[] = ['sum', 'average', 'count', 'min', 'max', 'countNonEmpty'];
const CHOROPLETH_PALETTES: Record<string, [string, string]> = {
    viridis: ['#440154', '#fde725'],
    plasma: ['#0d0887', '#f0f921'],
    inferno: ['#000004', '#fcffa4'],
    magma: ['#000004', '#fcfdbf'],
    blue_purple: ['#f7fbff', '#08306b'],
    red_yellow: ['#ffffcc', '#800026'],
};

// --- HELPER COMPONENTS ---
const MapControlPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Panel className="w-80 flex-shrink-0 flex flex-col h-full">
        <div className="flex-grow overflow-y-auto pr-2 hide-scrollbar">{children}</div>
    </Panel>
);

const MapInspectorPanel: React.FC<{
    feature: GeoJsonFeature;
    style: MapFeatureStyle;
    onStyleChange: (style: MapFeatureStyle) => void;
    onClose: () => void;
}> = ({ feature, style, onStyleChange, onClose }) => {
    return (
        <div className="map-inspector">
            <Panel className="w-full h-full">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-blue-300">Feature Inspector</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"><CloseIcon className="w-5 h-5" /></button>
                 </div>
                 <div className="map-inspector-content hide-scrollbar space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-400">Fill Color</label>
                        <input type="color" value={style.fill || '#ffffff'} onChange={e => onStyleChange({ ...style, fill: e.target.value })} className="w-full h-8 mt-1 p-0 bg-gray-700 rounded cursor-pointer" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-400">Border Color</label>
                        <input type="color" value={style.stroke || '#ffffff'} onChange={e => onStyleChange({ ...style, stroke: e.target.value })} className="w-full h-8 mt-1 p-0 bg-gray-700 rounded cursor-pointer" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-400">Border Width: {style.strokeWidth}</label>
                        <input type="range" min="0" max="10" step="0.5" value={style.strokeWidth || 1} onChange={e => onStyleChange({...style, strokeWidth: parseFloat(e.target.value)})} className="w-full mt-1"/>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 mt-4 mb-2 border-b border-gray-600 pb-1">Properties</h4>
                        <div className="text-xs space-y-1 text-gray-300 bg-gray-800/50 p-2 rounded max-h-48 overflow-y-auto">
                            {feature.properties && Object.entries(feature.properties).map(([key, value]) => (
                                <p key={key}><strong className="text-gray-400">{key}:</strong> {JSON.stringify(value)}</p>
                            ))}
                        </div>
                    </div>
                 </div>
            </Panel>
        </div>
    );
};

const MapPinMarker: React.FC = () => (
    <g transform="translate(0, -16)" style={{ pointerEvents: 'none' }}>
      <path
        d="M0 -16 C -5 -16, -9 -12.5, -9 -7.5 C -9 -2.5, 0 16, 0 16 C 0 16, 9 -2.5, 9 -7.5 C 9 -12.5, 5 -16, 0 -16 Z"
        fill="#ef4444" // red-500
        stroke="#ffffff"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
      />
      <circle cx="0" cy="-7.5" r="3" fill="white" />
    </g>
);

const PlacedMapPinMarker: React.FC = () => (
    <g transform="translate(0, -16)" style={{ pointerEvents: 'none' }}>
      <path
        d="M0 -16 C -5 -16, -9 -12.5, -9 -7.5 C -9 -2.5, 0 16, 0 16 C 0 16, 9 -2.5, 9 -7.5 C 9 -12.5, 5 -16, 0 -16 Z"
        fill="#3b82f6" // blue-500
        stroke="#ffffff"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
      />
      <circle cx="0" cy="-7.5" r="3" fill="white" />
    </g>
);


const MapLegend: React.FC<{ min: number; max: number; palette: [string, string] }> = ({ min, max, palette }) => {
    const gradientId = `legend-gradient-${palette.join('-').replace(/#/g, '')}`;
    return (
        <div className="absolute bottom-4 left-4 bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg border border-gray-600 shadow-lg text-white text-xs">
            <svg width="100" height="15" className="mb-1">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={palette[0]} />
                        <stop offset="100%" stopColor={palette[1]} />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="15" fill={`url(#${gradientId})`} />
            </svg>
            <div className="flex justify-between">
                <span>{min.toLocaleString()}</span>
                <span>{max.toLocaleString()}</span>
            </div>
        </div>
    );
};

// --- MAIN MAP VIEW ---
const MapView: React.FC = () => {
    const { tableData, fileHeaders } = useContext(DataContext);
    
    const [geoJson, setGeoJson] = useState<GeoJsonFeatureCollection | null>(null);
    
    const [featureStyles, setFeatureStyles] = useState<Record<string, MapFeatureStyle>>({});
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

    const [locationField, setLocationField] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ data: TableRow; x: number, y: number } | null>(null);
    const [locationCache, setLocationCache] = useState<Record<string, LatLngTuple | 'loading' | 'error'>>({});
    
    const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
    const [isPanning, setIsPanning] = useState(false);
    const panStartPos = useRef({ x: 0, y: 0 });
    
    const svgRef = useRef<SVGSVGElement>(null);
    
    const [geoFocus, setGeoFocus] = useState({ continent: '', country: '', province: '', city: '' });
    const [provinceList, setProvinceList] = useState<string[]>([]);
    const [cityList, setCityList] = useState<string[]>([]);
    const [isFetchingProvinces, setIsFetchingProvinces] = useState(false);
    const [isFetchingCities, setIsFetchingCities] = useState(false);
    const [isFocusing, setIsFocusing] = useState(false);

    // --- NEW Choropleth State ---
    const [joinField, setJoinField] = useState<string | null>(null);
    const [valueField, setValueField] = useState<string | null>(null);
    const [aggregator, setAggregator] = useState<AggregatorType>('sum');
    const [choroplethPalette, setChoroplethPalette] = useState<keyof typeof CHOROPLETH_PALETTES>('viridis');

    // --- NEW Placed Pin State ---
    const [placedPins, setPlacedPins] = useState<PlacedPin[]>([]);
    const [pinInput, setPinInput] = useState('');
    const [isAddingPin, setIsAddingPin] = useState(false);
    const [placedPinTooltip, setPlacedPinTooltip] = useState<{ name: string; x: number, y: number } | null>(null);

    const fitToBounds = useCallback((features?: GeoJsonFeature[]) => {
        const targetFeatures = features || geoJson?.features;
        if (!targetFeatures || targetFeatures.length === 0) {
            focusOnBbox(-180, -90, 180, 90); // World view
            return;
        };
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        const getBounds = (coords: any[]) => {
            for (const p of coords) {
                if(Array.isArray(p[0])) getBounds(p);
                else { minLng = Math.min(minLng, p[0]); maxLng = Math.max(maxLng, p[0]); minLat = Math.min(minLat, p[1]); maxLat = Math.max(maxLat, p[1]); }
            }
        };
        targetFeatures.forEach(f => { if(f.geometry) getBounds(f.geometry.coordinates); });
        focusOnBbox(minLng, minLat, maxLng, maxLat);
    }, [geoJson]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.type === 'FeatureCollection') {
                    setGeoJson(data);
                    setFeatureStyles({});
                    setSelectedFeatureId(null);
                    setJoinField(null);
                    setValueField(null);
                    setTimeout(() => fitToBounds(data.features), 100);
                } else {
                    alert('Invalid GeoJSON: Must be a FeatureCollection.');
                }
            } catch (err) {
                alert('Error parsing GeoJSON file.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }, [fitToBounds]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/json': ['.json', '.geojson'] },
        multiple: false,
    });


    const handleAddPin = useCallback(async () => {
        if (!pinInput.trim() || isAddingPin) return;
        
        setIsAddingPin(true);
        const newPin: PlacedPin = {
            id: `pin-${Date.now()}`,
            name: pinInput,
            latLng: null,
            status: 'loading',
        };
        setPlacedPins(prev => [...prev, newPin]);
        setPinInput('');

        try {
            const result = await geocodeAddressWithGemini(newPin.name);
            if ('error' in result) {
                throw new Error(result.error);
            }
            setPlacedPins(prev => prev.map(p => p.id === newPin.id ? { ...p, latLng: result, status: 'success' } : p));
        } catch (error: any) {
            setPlacedPins(prev => prev.map(p => p.id === newPin.id ? { ...p, status: 'error', error: error.message || "Unknown geocoding error" } : p));
        } finally {
            setIsAddingPin(false);
        }

    }, [pinInput, isAddingPin]);

    const handleRemovePin = (id: string) => {
        setPlacedPins(prev => prev.filter(p => p.id !== id));
    };


    const categoricalHeaders = useMemo(() => {
        if (!tableData || tableData.length === 0) return fileHeaders;
        return fileHeaders.filter(h => tableData.some(row => typeof row[h] === 'string'));
    }, [tableData, fileHeaders]);

    const numericalHeaders = useMemo(() => {
        if (!tableData || tableData.length === 0) return [];
        return fileHeaders.filter(h => tableData.every(row => {
            const val = row[h];
            return val === null || val === undefined || typeof val === 'number';
        }));
    }, [tableData, fileHeaders]);
    
    const commonJoinFields = useMemo(() => {
        if (!geoJson || !fileHeaders || fileHeaders.length === 0) return [];
        const geoProps = new Set(Object.keys(geoJson.features[0]?.properties || {}));
        return fileHeaders.filter(h => geoProps.has(h));
    }, [geoJson, fileHeaders]);

    const { choroplethStyles, legendData } = useMemo(() => {
        if (!joinField || !valueField || !geoJson || !tableData.length) return { choroplethStyles: {}, legendData: null };

        const aggregatedData = new Map<string, number>();
        const tempData = new Map<string, number[]>();

        tableData.forEach(row => {
            const joinValueRaw = row[joinField];
            const numericValue = row[valueField];
            if (joinValueRaw != null && typeof numericValue === 'number') {
                const joinValue = String(joinValueRaw);
                if (!tempData.has(joinValue)) {
                    tempData.set(joinValue, []);
                }
                tempData.get(joinValue)?.push(numericValue);
            }
        });

        tempData.forEach((values, key) => {
            let result;
            switch (aggregator) {
                case 'sum': result = values.reduce((s, a) => s + a, 0); break;
                case 'average': result = values.reduce((s, a) => s + a, 0) / values.length; break;
                case 'count': result = values.length; break;
                case 'min': result = Math.min(...values); break;
                case 'max': result = Math.max(...values); break;
                default: result = values.reduce((s, a) => s + a, 0);
            }
            aggregatedData.set(key, result);
        });

        if (aggregatedData.size === 0) return { choroplethStyles: {}, legendData: null };

        const values = Array.from(aggregatedData.values());
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        
        const styles: Record<string, MapFeatureStyle> = {};
        const palette = CHOROPLETH_PALETTES[choroplethPalette];

        const lerpColor = (c1: string, c2: string, t: number) => {
            const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
            const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
            const r = Math.round(r1 + (r2 - r1) * t).toString(16).padStart(2, '0');
            const g = Math.round(g1 + (g2 - g1) * t).toString(16).padStart(2, '0');
            const b = Math.round(b1 + (b2 - b1) * t).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        };

        geoJson.features.forEach((feature, i) => {
            const id = (feature.id || i).toString();
            const joinValueRaw = feature.properties?.[joinField];
            const joinValue = joinValueRaw != null ? String(joinValueRaw) : null;
            if (joinValue != null && aggregatedData.has(joinValue)) {
                const value = aggregatedData.get(joinValue)!;
                const ratio = range > 0 ? (value - min) / range : 0.5;
                styles[id] = { fill: lerpColor(palette[0], palette[1], ratio) };
            } else {
                styles[id] = { fill: 'rgba(139, 92, 246, 0.1)' }; // Default for no data
            }
        });

        return { choroplethStyles: styles, legendData: { min, max } };
    }, [joinField, valueField, aggregator, choroplethPalette, geoJson, tableData]);

    const project = useCallback((lat: number, lon: number): { x: number, y: number } => {
        const x = (lon + 180) * (MAP_WIDTH / 360);
        const y = (MAP_HEIGHT / 2) - (MAP_WIDTH * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 180) / 2))) / (2 * Math.PI);
        return { x, y };
    }, []);

    const coordinatesToPath = useCallback((geometry: GeoJsonGeometry) => {
        if (!geometry) return '';
        
        const processRing = (ring: number[][]) => ring.map(p => project(p[1], p[0])).map(p => `${p.x},${p.y}`).join(' L ');
    
        switch (geometry.type) {
            case 'Polygon':
                return geometry.coordinates.map(ring => `M ${processRing(ring)} Z`).join(' ');
            case 'MultiPolygon':
                return geometry.coordinates.map(polygon => polygon.map(ring => `M ${processRing(ring)} Z`).join(' ')).join(' ');
            default:
                return '';
        }
    }, [project]);
    
    const focusOnBbox = useCallback((min_lon: number, min_lat: number, max_lon: number, max_lat: number) => {
        const { x: minProjX, y: maxProjY } = project(min_lat, min_lon);
        const { x: maxProjX, y: minProjY } = project(max_lat, max_lon);

        const projWidth = maxProjX - minProjX;
        const projHeight = maxProjY - minProjY;
        if (projWidth <= 0 || projHeight <= 0) return;
        
        const zoomFactor = Math.min(MAP_WIDTH / projWidth, MAP_HEIGHT / projHeight) * 0.9;
        const newWidth = MAP_WIDTH / zoomFactor;
        const newHeight = MAP_HEIGHT / zoomFactor;
        
        const centerX = minProjX + projWidth / 2;
        const centerY = minProjY + projHeight / 2;
        setViewBox({ x: centerX - newWidth / 2, y: centerY - newHeight/2, width: newWidth, height: newHeight });
    }, [project]);
    
    

    const isGeocoding = useMemo(() => Object.values(locationCache).some(v => v === 'loading'), [locationCache]);
    
    useEffect(() => {
        if (!locationField || !tableData.length) return;
    
        const processData = async () => {
             const uniqueLocationsAsStrings = new Set(
                tableData
                    .map(row => row[locationField])
                    .filter(loc => loc !== null && loc !== undefined && String(loc).trim() !== '')
                    .map(loc => String(loc).trim())
            );
            
            const geocodePromises = Array.from(uniqueLocationsAsStrings).map(async (location) => {
                if (locationCache[location]) return;
    
                setLocationCache(prev => ({ ...prev, [location]: 'loading' }));
                const result = await geocodeAddressWithGemini(location);
                
                setLocationCache(prev => ({
                    ...prev,
                    [location]: !('error' in result) ? result : 'error'
                }));
            });
    
            await Promise.all(geocodePromises);
        };
    
        processData();
    }, [locationField, tableData]);

    const plottedData = useMemo(() => {
        if (!locationField) return [];
        return tableData.reduce((acc, row) => {
            const locationValue = row[locationField];
            if (locationValue === null || locationValue === undefined) return acc;

            const locationString = String(locationValue).trim();
            if (locationString && locationCache[locationString] && typeof locationCache[locationString] !== 'string') {
                acc.push({
                    latLng: locationCache[locationString] as LatLngTuple,
                    data: row
                });
            }
            return acc;
        }, [] as Array<{ latLng: LatLngTuple; data: TableRow }>);
    }, [tableData, locationField, locationCache]);

    const handleGeoFocusChange = useCallback(async (level: 'continent' | 'country' | 'province' | 'city', value: string) => {
        if (!value) return;

        let newFocus = { ...geoFocus };
        let locationToFocus = value;
        let contextForChild = value;
        
        switch (level) {
            case 'continent':
                newFocus = { continent: value, country: '', province: '', city: '' };
                setCityList([]); setProvinceList([]);
                break;
            case 'country':
                newFocus = { ...newFocus, country: value, province: '', city: '' };
                setCityList([]); setProvinceList([]); setIsFetchingProvinces(true);
                try {
                    const res = await analyzeTextWithGemini(`List all provinces or states of ${value} as a JSON array of strings.`, undefined, 'json');
                    if(res.type === 'json' && Array.isArray(res.content)) setProvinceList(res.content);
                } catch(e) { console.error("Failed to fetch provinces", e); }
                finally { setIsFetchingProvinces(false); }
                break;
            case 'province':
                newFocus = { ...newFocus, province: value, city: '' };
                contextForChild = `${value}, ${newFocus.country}`;
                locationToFocus = contextForChild;
                setCityList([]); setIsFetchingCities(true);
                 try {
                    const res = await analyzeTextWithGemini(`List major cities in ${contextForChild} as a JSON array of strings.`, undefined, 'json');
                    if(res.type === 'json' && Array.isArray(res.content)) setCityList(res.content);
                } catch(e) { console.error("Failed to fetch cities", e); }
                finally { setIsFetchingCities(false); }
                break;
            case 'city':
                newFocus = { ...newFocus, city: value };
                locationToFocus = `${value}, ${newFocus.province}, ${newFocus.country}`;
                break;
        }
        setGeoFocus(newFocus);
        
        setIsFocusing(true);
        try {
            const bboxRes = await analyzeTextWithGemini(`Provide the bounding box for "${locationToFocus}" as a JSON object with keys "min_lon", "min_lat", "max_lon", "max_lat".`, undefined, 'json');
            if(bboxRes.type === 'json' && bboxRes.content) {
                const { min_lon, min_lat, max_lon, max_lat } = bboxRes.content;
                if([min_lon, min_lat, max_lon, max_lat].every(c => typeof c === 'number')) {
                   focusOnBbox(min_lon, min_lat, max_lon, max_lat);
                }
            }
        } catch (e) {
            console.error(`Failed to focus on ${locationToFocus}`, e);
        } finally {
            setIsFocusing(false);
        }
    }, [geoFocus, focusOnBbox]);
    const handleMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (e.button !== 0 || e.target !== e.currentTarget) return;
        setIsPanning(true);
        panStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (!isPanning || !svgRef.current) return;
        const dx = e.clientX - panStartPos.current.x;
        const dy = e.clientY - panStartPos.current.y;
        setViewBox(prev => ({
            ...prev,
            x: prev.x - dx * (prev.width / (svgRef.current?.clientWidth || MAP_WIDTH)),
            y: prev.y - dy * (prev.height / (svgRef.current?.clientHeight || MAP_HEIGHT)),
        }));
        panStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!svgRef.current) return;
        const scaleFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
        const rect = svgRef.current.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const pointX = viewBox.x + mouseX * (viewBox.width / rect.width);
        const pointY = viewBox.y + mouseY * (viewBox.height / rect.height);
        const newWidth = viewBox.width * scaleFactor;
        const newHeight = viewBox.height * scaleFactor;
        const newX = pointX - mouseX * (newWidth / rect.width);
        const newY = pointY - mouseY * (newHeight / rect.height);
        setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    };

    const zoomWithFactor = useCallback((factor: number) => {
        if (!svgRef.current) return;
        const { width, height } = svgRef.current.getBoundingClientRect();

        const centerX = width / 2;
        const centerY = height / 2;

        const pointX = viewBox.x + centerX * (viewBox.width / width);
        const pointY = viewBox.y + centerY * (viewBox.height / height);

        const newWidth = viewBox.width * factor;
        const newHeight = viewBox.height * factor;

        const newX = pointX - centerX * (newWidth / width);
        const newY = pointY - centerY * (newHeight / height);

        setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    }, [viewBox]);
    
    const selectedFeature = useMemo(() => geoJson?.features.find((f, i) => (f.id || i).toString() === selectedFeatureId), [geoJson, selectedFeatureId]);
    
    const handleFeatureStyleChange = (style: MapFeatureStyle) => {
        if (!selectedFeatureId) return;
        setFeatureStyles(prev => ({ ...prev, [selectedFeatureId]: style }));
    };

    return (
      <div className="flex h-full gap-6">
        {geoJson && 
            <MapControlPanel>
                <div className="space-y-4">
                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">Geographic Focus</label>
                        <p className="text-xs text-gray-400 mb-2">Zoom to a specific area.</p>
                        <div className="space-y-2">
                            <select value={geoFocus.continent} onChange={e => handleGeoFocusChange('continent', e.target.value)} className="w-full p-2 bg-gray-700 rounded text-sm"><option value="">Select Continent...</option>{CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <select value={geoFocus.country} disabled={!geoFocus.continent} onChange={e => handleGeoFocusChange('country', e.target.value)} className="w-full p-2 bg-gray-700 rounded text-sm disabled:opacity-50"><option value="">Select Country...</option>{COUNTRIES_DATA.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}</select>
                            <div className="relative"><select value={geoFocus.province} disabled={!geoFocus.country || isFetchingProvinces} onChange={e => handleGeoFocusChange('province', e.target.value)} className="w-full p-2 bg-gray-700 rounded text-sm disabled:opacity-50"><option value="">Select Province/State...</option>{provinceList.map(p => <option key={p} value={p}>{p}</option>)}</select>{isFetchingProvinces && <SpinnerIcon className="w-4 h-4 text-sky-400 absolute right-3 top-1/2 -translate-y-1/2"/>}</div>
                            <div className="relative"><select value={geoFocus.city} disabled={!geoFocus.province || isFetchingCities} onChange={e => handleGeoFocusChange('city', e.target.value)} className="w-full p-2 bg-gray-700 rounded text-sm disabled:opacity-50"><option value="">Select City...</option>{cityList.map(c => <option key={c} value={c}>{c}</option>)}</select>{isFetchingCities && <SpinnerIcon className="w-4 h-4 text-sky-400 absolute right-3 top-1/2 -translate-y-1/2"/>}</div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">Manual Pin Placement</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="text" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="e.g., Eiffel Tower, Paris" onKeyDown={e => e.key === 'Enter' && handleAddPin()} className="w-full p-2 bg-gray-700 rounded text-sm" disabled={isAddingPin}/>
                            <button onClick={handleAddPin} disabled={!pinInput.trim() || isAddingPin} className="p-2 bg-teal-600 hover:bg-teal-500 rounded-md text-white transition-colors disabled:opacity-50 flex-shrink-0">
                                {isAddingPin ? <SpinnerIcon className="w-5 h-5"/> : <PlusIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {placedPins.map(pin => (
                                <div key={pin.id} className="flex items-center justify-between text-xs p-1.5 bg-gray-700/50 rounded">
                                    <span className="truncate" title={pin.name}>{pin.name}</span>
                                    <div className="flex items-center gap-2">
                                        {pin.status === 'loading' && <SpinnerIcon className="w-4 h-4 text-sky-400"/>}
                                        {pin.status === 'error' && <ErrorIcon className="w-4 h-4 text-red-400" title={pin.error}/>}
                                        <button onClick={() => handleRemovePin(pin.id)} className="text-gray-400 hover:text-white"><CloseIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">Choropleth Styling</label>
                        <div className="space-y-2 mt-2">
                            <div><label className="text-xs font-semibold text-gray-400 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-fuchsia-400" />Join Field</label><select value={joinField || ''} onChange={e => setJoinField(e.target.value)} disabled={!geoJson} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm disabled:opacity-50"><option value="" disabled>Select Field...</option>{commonJoinFields.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                            <div><label className="text-xs font-semibold text-gray-400 flex items-center gap-2"><ValueIcon className="w-4 h-4 text-teal-400" />Value Field</label><select value={valueField || ''} onChange={e => setValueField(e.target.value)} disabled={!geoJson} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm disabled:opacity-50"><option value="" disabled>Select Field...</option>{numericalHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                            <div><label className="text-xs font-semibold text-gray-400">Aggregation</label><select value={aggregator} onChange={e => setAggregator(e.target.value as AggregatorType)} disabled={!geoJson} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm disabled:opacity-50">{AGGREGATOR_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 block mb-1">Color Palette</label>
                                <div className="grid grid-cols-3 gap-2">{Object.entries(CHOROPLETH_PALETTES).map(([name, colors]) => (<button key={name} onClick={() => setChoroplethPalette(name as any)} className={`h-6 rounded-md border-2 ${choroplethPalette === name ? 'border-white' : 'border-transparent'}`} style={{background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`}} title={name}/>))}</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">Display Options</label>
                        <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-full backdrop-blur-sm mt-2">
                            <button onClick={() => setMapTheme('dark')} className={`flex-1 text-xs px-3 py-1 rounded-full transition-colors ${mapTheme==='dark' ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>Dark</button>
                            <button onClick={() => setMapTheme('light')} className={`flex-1 text-xs px-3 py-1 rounded-full transition-colors ${mapTheme==='light' ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>Light</button>
                            <button onClick={() => setMapTheme('blueprint')} className={`flex-1 text-xs px-3 py-1 rounded-full transition-colors ${mapTheme==='blueprint' ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>Blueprint</button>
                        </div>
                    </div>
                </div>
            </MapControlPanel>
        }

        <div className="flex-grow relative">
           
            {geoJson ? (
                 <Panel className={`w-full h-full relative map-container ${isPanning ? 'grabbing' : ''} theme-${mapTheme}`}>
                    {isFocusing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"><SpinnerIcon className="w-12 h-12 text-sky-400" /></div>}
                    <svg ref={svgRef} viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className="w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
                        <g>
                            {geoJson.features.map((feature, i) => {
                                const id = (feature.id || i).toString();
                                const choroplethStyle = choroplethStyles[id] || {};
                                const manualStyle = featureStyles[id] || {};
                                const finalStyle = { ...choroplethStyle, ...manualStyle };
                                const d = coordinatesToPath(feature.geometry!);
                                return (
                                    <path 
                                        key={id} 
                                        d={d}
                                        className={`map-path ${selectedFeatureId === id ? 'selected' : ''}`}
                                        fill={finalStyle.fill || "rgba(139, 92, 246, 0.2)"}
                                        stroke={finalStyle.stroke}
                                        strokeWidth={finalStyle.strokeWidth}
                                        onClick={() => setSelectedFeatureId(id)}
                                    />
                                );
                            })}
                        </g>
                        <g>
                            {plottedData.map((point, index) => {
                                const { x, y } = project(point.latLng[0], point.latLng[1]);
                                if (isNaN(x) || isNaN(y)) return null;
                                return (
                                    <g
                                        key={`marker-${index}`}
                                        transform={`translate(${x}, ${y})`}
                                        className="map-dot"
                                        onMouseEnter={() => setTooltip({ data: point.data, x, y })}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        <MapPinMarker />
                                    </g>
                                );
                            })}
                        </g>
                        <g>
                            {placedPins.map(pin => {
                                if (pin.status !== 'success' || !pin.latLng) return null;
                                const { x, y } = project(pin.latLng[0], pin.latLng[1]);
                                if (isNaN(x) || isNaN(y)) return null;
                                return (
                                    <g
                                        key={`placed-pin-${pin.id}`}
                                        transform={`translate(${x}, ${y})`}
                                        className="map-dot"
                                        onMouseEnter={() => setPlacedPinTooltip({ name: pin.name, x, y })}
                                        onMouseLeave={() => setPlacedPinTooltip(null)}
                                    >
                                        <PlacedMapPinMarker />
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                    {tooltip && (
                        <foreignObject x={tooltip.x} y={tooltip.y} width="220" height="150" style={{ pointerEvents: 'none', overflow: 'visible' }}>
                            <div className="map-tooltip" style={{ transform: 'translate(15px, 15px)' }}>
                                {Object.entries(tooltip.data).slice(0, 5).map(([key, value]) => (
                                    <p key={key} className="text-xs truncate"><strong className="text-gray-400">{key}:</strong> {String(value)}</p>
                                ))}
                            </div>
                        </foreignObject>
                    )}
                    {placedPinTooltip && (
                        <foreignObject x={placedPinTooltip.x} y={placedPinTooltip.y} width="220" height="50" style={{ pointerEvents: 'none', overflow: 'visible' }}>
                            <div className="map-tooltip" style={{ transform: 'translate(15px, 15px)' }}>
                            <p className="text-sm font-bold text-blue-300">{placedPinTooltip.name}</p>
                            </div>
                        </foreignObject>
                    )}
                    {legendData && <MapLegend min={legendData.min} max={legendData.max} palette={CHOROPLETH_PALETTES[choroplethPalette]} />}
                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-gray-800/50 p-1.5 rounded-full backdrop-blur-sm">
                        <button onClick={() => zoomWithFactor(1 / 1.2)} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-full" title="Zoom In"><PlusIcon className="w-5 h-5"/></button>
                        <button onClick={() => zoomWithFactor(1.2)} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-full" title="Zoom Out"><MinusIcon className="w-5 h-5"/></button>
                        <button onClick={() => fitToBounds()} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-full" title="Fit to Data"><FitScreenIcon className="w-5 h-5"/></button>
                    </div>
                </Panel>
            ) : (
                <div {...getRootProps()} className={`map-view-dropzone dropzone-holographic ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    <div className="text-center">
                        <UploadIcon className="w-16 h-16 mx-auto text-purple-400 mb-4"/>
                        <p className="text-xl font-semibold text-gray-200">Drop GeoJSON File Here</p>
                        <p className="text-gray-400">or click to browse</p>
                    </div>
                </div>
            )}
            {selectedFeature && <MapInspectorPanel feature={selectedFeature} style={featureStyles[selectedFeatureId!] || {}} onStyleChange={handleFeatureStyleChange} onClose={() => setSelectedFeatureId(null)} />}
        </div>
      </div>
    );
};

export default MapView;
