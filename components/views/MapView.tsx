
import React, { useState, useEffect, useMemo, useContext, useCallback, useRef, MouseEvent as ReactMouseEvent, WheelEvent, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, AggregatorType, IconType, FileHeaders, GeoJsonFeature, GeoJsonFeatureCollection, MapFeatureStyle, GeoJsonGeometry } from '../../types';
import { getMapInsights } from '../../services/geminiService';
import { marked } from 'marked';
import { CONTINENT_DATA, COUNTRIES_DATA } from '../../constants';

// --- ICONS ---
const FitScreenIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;
const LinkIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const UploadIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const PlusIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const ValueIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
const BrainIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;


const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const AGGREGATOR_OPTIONS: AggregatorType[] = ['sum', 'average', 'count', 'min', 'max', 'countNonEmpty'];
const CHOROPLETH_PALETTES: Record<string, [string, string]> = {
    viridis: ['#440154', '#fde725'],
    plasma: ['#0d0887', '#f0f921'],
    inferno: ['#000004', '#fcffa4'],
    magma: ['#000004', '#fcfdbf'],
    blue_purple: ['#f7fbff', '#08306b'],
    red_yellow: ['#ffffcc', '#800026'],
};

type MapTheme = 'dark' | 'light' | 'blueprint';

const MapControlPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Panel className="w-80 flex-shrink-0 flex flex-col h-full !p-4">
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

const MapLegend: React.FC<{ min: number; max: number; palette: [string, string], valueField: string, aggregator: string }> = ({ min, max, palette, valueField, aggregator }) => {
    const gradientId = `legend-gradient-${palette.join('-').replace(/#/g, '')}`;
    return (
        <div className="absolute bottom-4 left-4 bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg border border-gray-600 shadow-lg text-white text-xs">
            <p className="font-bold mb-1 truncate max-w-[150px]">{aggregator} of {valueField}</p>
            <svg width="150" height="15" className="mb-1">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={palette[0]} />
                        <stop offset="100%" stopColor={palette[1]} />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="150" height="15" fill={`url(#${gradientId})`} />
            </svg>
            <div className="flex justify-between">
                <span>{min.toLocaleString()}</span>
                <span>{max.toLocaleString()}</span>
            </div>
        </div>
    );
};

export const MapView: React.FC = () => {
    const { tableData, fileHeaders } = useContext(DataContext);
    
    const [geoJson, setGeoJson] = useState<GeoJsonFeatureCollection | null>(null);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
    const [isPanning, setIsPanning] = useState(false);
    const panStartPos = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    const [mapTheme, setMapTheme] = useState<MapTheme>('blueprint');
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
    const [featureStyles, setFeatureStyles] = useState<Record<string, MapFeatureStyle>>({});
    const [joinField, setJoinField] = useState<string | null>(null);
    const [valueField, setValueField] = useState<string | null>(null);
    const [aggregator, setAggregator] = useState<AggregatorType>('sum');
    const [choroplethPalette, setChoroplethPalette] = useState<keyof typeof CHOROPLETH_PALETTES>('viridis');
    const [hoveredFeature, setHoveredFeature] = useState<{ id: string, name: string, x: number, y: number } | null>(null);
    const [popup, setPopup] = useState<{feature: GeoJsonFeature, data: TableRow[], x: number, y: number} | null>(null);

    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [selectedContinent, setSelectedContinent] = useState<string>('World');
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');

    const project = useCallback((lat: number, lon: number): { x: number, y: number } => {
        const x = (lon + 180) * (MAP_WIDTH / 360);
        const y = (MAP_HEIGHT / 2) - (MAP_WIDTH * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 180) / 2))) / (2 * Math.PI);
        return { x, y };
    }, []);

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
    
    const fitToBounds = useCallback((features?: GeoJsonFeature[]) => {
        const targetFeatures = features || geoJson?.features;
        if (!targetFeatures || targetFeatures.length === 0) {
            focusOnBbox(-180, -90, 180, 90);
            return;
        };
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        const getBounds = (coords: any[]) => {
            if (!coords || !Array.isArray(coords)) return;
            for (const p of coords) {
                if(Array.isArray(p) && Array.isArray(p[0])) getBounds(p);
                else if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') { 
                    minLng = Math.min(minLng, p[0]); maxLng = Math.max(maxLng, p[0]); minLat = Math.min(minLat, p[1]); maxLat = Math.max(maxLat, p[1]); 
                }
            }
        };
        targetFeatures.forEach(f => { if(f.geometry) getBounds(f.geometry.coordinates); });
        focusOnBbox(minLng, minLat, maxLng, maxLat);
    }, [geoJson, focusOnBbox]);
    
    const availableProvinces = useMemo(() => {
        if (!geoJson) return [];
        const provinceSet = new Set<string>();
        const provinceKeys = ['province', 'NAME_1', 'state', 'ADM1_NAME'];
        let keyFound: string | null = null;
        for (const feature of geoJson.features) {
            if (feature.properties) {
                if (!keyFound) {
                    for (const key of provinceKeys) {
                        if (key in feature.properties) {
                            keyFound = key;
                            break;
                        }
                    }
                }
                if (keyFound && feature.properties[keyFound] != null) {
                    provinceSet.add(String(feature.properties[keyFound]));
                }
            }
        }
        return Array.from(provinceSet).sort();
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
                    setSelectedProvince('');
                    setTimeout(() => fitToBounds(data.features), 0);
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

    const coordinatesToPath = useCallback((geometry: GeoJsonGeometry | null) => {
        if (!geometry) return '';
        const processRing = (ring: number[][]) => ring.map(p => project(p[1], p[0])).map(p => `${p.x},${p.y}`).join(' L ');
        switch (geometry.type) {
            case 'Polygon': return geometry.coordinates.map(ring => `M ${processRing(ring)} Z`).join(' ');
            case 'MultiPolygon': return geometry.coordinates.map(polygon => polygon.map(ring => `M ${processRing(ring)} Z`).join(' ')).join(' ');
            default: return '';
        }
    }, [project]);

    const handleMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (e.button !== 0 || e.target !== e.currentTarget) return;
        setIsPanning(true);
        panStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => setIsPanning(false);

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

    const handleFeatureStyleChange = (style: MapFeatureStyle) => {
        if (!selectedFeatureId) return;
        setFeatureStyles(prev => ({ ...prev, [selectedFeatureId]: style }));
    };

    const numericalHeaders = useMemo(() => {
        if (!tableData || tableData.length === 0) return [];
        return fileHeaders.filter(h => tableData.every(row => {
            const val = row[h];
            return val === null || val === undefined || typeof val === 'number';
        }));
    }, [tableData, fileHeaders]);
    
    const commonJoinFields = useMemo(() => {
        if (!geoJson || !fileHeaders || fileHeaders.length === 0 || geoJson.features.length === 0) return [];
        const geoProps = new Set(Object.keys(geoJson.features[0]?.properties || {}));
        return fileHeaders.filter(h => geoProps.has(h));
    }, [geoJson, fileHeaders]);

    const joinedData = useMemo(() => {
        if (!joinField || !geoJson) return new Map();
        const map = new Map<string, TableRow[]>();
        tableData.forEach(row => {
            const key = String(row[joinField]);
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(row);
        });
        return map;
    }, [joinField, geoJson, tableData]);

    const { choroplethStyles, legendData } = useMemo(() => {
        if (!joinField || !valueField || !geoJson || !tableData.length) return { choroplethStyles: {}, legendData: null };
        const aggregatedData = new Map<string, number>();
        const tempData = new Map<string, number[]>();
        tableData.forEach(row => {
            const joinValueRaw = row[joinField];
            const numericValue = row[valueField];
            if (joinValueRaw != null && typeof numericValue === 'number') {
                const joinValue = String(joinValueRaw);
                if (!tempData.has(joinValue)) tempData.set(joinValue, []);
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
            const id = String(feature.id || i);
            const joinValue = feature.properties?.[joinField] != null ? String(feature.properties[joinField]) : null;
            if (joinValue != null && aggregatedData.has(joinValue)) {
                const value = aggregatedData.get(joinValue)!;
                const ratio = range > 0 ? (value - min) / range : 0.5;
                styles[id] = { fill: lerpColor(palette[0], palette[1], ratio) };
            } else {
                styles[id] = { fill: 'rgba(139, 92, 246, 0.1)' };
            }
        });
        return { choroplethStyles: styles, legendData: { min, max } };
    }, [joinField, valueField, aggregator, choroplethPalette, geoJson, tableData]);

    const handleFeatureClick = (e: ReactMouseEvent, feature: GeoJsonFeature) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        e.stopPropagation();
        const id = String(feature.id || geoJson?.features.indexOf(feature));
        setSelectedFeatureId(id);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (joinField) {
            const joinValue = feature.properties?.[joinField];
            if (joinValue != null) {
                const relatedData = joinedData.get(String(joinValue)) || [];
                setPopup({feature, data: relatedData, x, y});
            } else {
                 setPopup({feature, data: [], x, y});
            }
        } else {
             setPopup({feature, data: [], x, y});
        }
    };
    
    const handleFeatureHover = (e: ReactMouseEvent, feature: GeoJsonFeature) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const id = String(feature.id || geoJson?.features.indexOf(feature));
        const name = String(feature.properties?.name || feature.properties?.NAME || feature.properties?.ADMIN || 'N/A');
        setHoveredFeature({ id, name, x: e.clientX, y: e.clientY });
    };

    const handleGenerateInsights = useCallback(async () => {
        if (!aiPrompt.trim()) return;
        setIsAiLoading(true);
        setAiResult('');
        try {
            let context = `The user is viewing a map with ${geoJson?.features.length || 0} features.`;
            if (joinField && valueField && legendData) {
                context += ` The map is colored as a choropleth, showing the ${aggregator} of "${valueField}" joined by the "${joinField}" field. The data ranges from ${legendData.min.toLocaleString()} to ${legendData.max.toLocaleString()}.`;
            } else {
                context += " No data is currently joined to the map.";
            }
            const result = await getMapInsights(context, aiPrompt);
            setAiResult(result);
        } catch (error: any) {
            setAiResult(`**Error:** ${error.message}`);
        }
        setIsAiLoading(false);
    }, [aiPrompt, geoJson, joinField, valueField, aggregator, legendData]);

    const selectedFeature = useMemo(() => geoJson?.features.find((f, i) => String(f.id || i) === selectedFeatureId), [geoJson, selectedFeatureId]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/json': ['.json', '.geojson'] }, multiple: false });

    const filteredCountries = useMemo(() => {
        if (!selectedContinent || selectedContinent === 'World') return COUNTRIES_DATA;
        return COUNTRIES_DATA.filter(c => c.continent === selectedContinent);
    }, [selectedContinent]);

    const handleContinentChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const continentName = e.target.value;
        setSelectedContinent(continentName);
        setSelectedCountry('');
        setSelectedProvince('');
        const continent = CONTINENT_DATA.find(c => c.name === continentName);
        if (continent?.bbox) {
            focusOnBbox(...continent.bbox);
        }
    };

    const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const countryCode = e.target.value;
        setSelectedCountry(countryCode);
        setSelectedProvince('');
        if (countryCode === "") {
            const continent = CONTINENT_DATA.find(c => c.name === selectedContinent);
            if (continent?.bbox) {
                focusOnBbox(...continent.bbox);
            }
            return;
        }
        const country = COUNTRIES_DATA.find(c => c.code === countryCode);
        if (country?.bbox) {
            focusOnBbox(...country.bbox);
        }
    };

    const handleProvinceChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const provinceName = e.target.value;
        setSelectedProvince(provinceName);

        if (!provinceName) {
            if (selectedCountry) {
                 const country = COUNTRIES_DATA.find(c => c.code === selectedCountry);
                 if (country?.bbox) {
                     focusOnBbox(...country.bbox);
                     return;
                 }
            }
             if (selectedContinent) {
                const continent = CONTINENT_DATA.find(c => c.name === selectedContinent);
                if (continent?.bbox) {
                    focusOnBbox(...continent.bbox);
                    return;
                }
            }
            fitToBounds();
            return;
        }
        
        const provinceKeys = ['province', 'NAME_1', 'state', 'ADM1_NAME'];
        let keyFound: string | null = null;
        if (geoJson) {
            for (const feature of geoJson.features) {
                if (feature.properties) {
                    for (const key of provinceKeys) {
                        if (key in feature.properties) {
                            keyFound = key;
                            break;
                        }
                    }
                    if (keyFound) break;
                }
            }
            if (keyFound) {
                const provinceFeatures = geoJson.features.filter(f => f.properties && f.properties[keyFound] === provinceName);
                if (provinceFeatures.length > 0) {
                    fitToBounds(provinceFeatures);
                }
            }
        }
    };

    return (
        <div className="flex h-full gap-6 p-4">
            <MapControlPanel>
                 <div className="space-y-4">
                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">Geographic Focus</label>
                        <div className="space-y-2 mt-2">
                            <div>
                                <label className="text-xs font-semibold text-gray-400">Continent</label>
                                <select value={selectedContinent} onChange={handleContinentChange} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm">
                                    {CONTINENT_DATA.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400">Country</label>
                                <select value={selectedCountry} onChange={handleCountryChange} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm" disabled={filteredCountries.length === 0}>
                                    <option value="">-- Select Country --</option>
                                    {filteredCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-xs font-semibold text-gray-400">Province / State</label>
                                <select value={selectedProvince} onChange={handleProvinceChange} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm" disabled={availableProvinces.length === 0}>
                                    <option value="">-- All Provinces --</option>
                                    {availableProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">Map Theme</label>
                        <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-full backdrop-blur-sm mt-2">
                            <button onClick={() => setMapTheme('dark')} className={`flex-1 text-xs px-3 py-1 rounded-full transition-colors ${mapTheme==='dark' ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>Dark</button>
                            <button onClick={() => setMapTheme('light')} className={`flex-1 text-xs px-3 py-1 rounded-full transition-colors ${mapTheme==='light' ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>Light</button>
                            <button onClick={() => setMapTheme('blueprint')} className={`flex-1 text-xs px-3 py-1 rounded-full transition-colors ${mapTheme==='blueprint' ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>Blueprint</button>
                        </div>
                    </div>
                    {geoJson && tableData.length > 0 && (
                        <div className="pt-4 border-t border-gray-700">
                             <label className="text-sm font-semibold text-gray-300">Choropleth Styling</label>
                            <div className="space-y-2 mt-2">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-fuchsia-400" />Join Field</label>
                                    <select value={joinField || ''} onChange={e => setJoinField(e.target.value)} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm"><option value="" disabled>Select Field...</option>{commonJoinFields.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 flex items-center gap-2"><ValueIcon className="w-4 h-4 text-teal-400" />Value Field</label>
                                    <select value={valueField || ''} onChange={e => setValueField(e.target.value)} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm"><option value="" disabled>Select Field...</option>{numericalHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400">Aggregation</label>
                                    <select value={aggregator} onChange={e => setAggregator(e.target.value as AggregatorType)} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm">{AGGREGATOR_OPTIONS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}</select>
                                </div>
                                 <div>
                                    <label className="text-xs font-semibold text-gray-400 block mb-1">Color Palette</label>
                                    <div className="grid grid-cols-3 gap-2">{Object.entries(CHOROPLETH_PALETTES).map(([name, colors]) => (<button key={name} onClick={() => setChoroplethPalette(name as any)} className={`h-6 rounded-md border-2 ${choroplethPalette === name ? 'border-white' : 'border-transparent'}`} style={{background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`}} title={name}/>))}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm font-semibold text-gray-300">AI Geospatial Analysis</label>
                         <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., Which regions have the highest sales and why?" rows={3} className="w-full mt-2 p-2 bg-gray-700 rounded text-sm resize-none"></textarea>
                         <button onClick={handleGenerateInsights} disabled={isAiLoading || !aiPrompt} className="w-full mt-2 p-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white disabled:opacity-50 flex items-center justify-center gap-2">
                             {isAiLoading ? 'Analyzing...' : <><BrainIcon className="w-4 h-4"/> Get Insights</>}
                         </button>
                         {aiResult && <div className="mt-2 p-2 bg-gray-800/50 rounded-lg max-h-48 overflow-y-auto text-xs prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: marked.parse(aiResult) }}></div>}
                    </div>
                 </div>
            </MapControlPanel>

            <div className="flex-grow relative">
                {geoJson ? (
                    <Panel className={`w-full h-full relative map-container ${isPanning ? 'grabbing' : ''} theme-${mapTheme}`}>
                        <svg ref={svgRef} viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className="w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
                            <g>
                                {geoJson.features.map((feature, i) => {
                                    const id = String(feature.id || i);
                                    const choroplethStyle = choroplethStyles[id] || {};
                                    const manualStyle = featureStyles[id] || {};
                                    const finalStyle = { ...choroplethStyle, ...manualStyle };
                                    const d = coordinatesToPath(feature.geometry);
                                    return (
                                        <path 
                                            key={id} 
                                            d={d}
                                            className={`map-path ${selectedFeatureId === id ? 'selected' : ''}`}
                                            style={{
                                                fill: finalStyle.fill || "rgba(139, 92, 246, 0.2)",
                                                stroke: finalStyle.stroke,
                                                strokeWidth: finalStyle.strokeWidth
                                            }}
                                            onClick={(e) => handleFeatureClick(e, feature)}
                                            onMouseEnter={(e) => handleFeatureHover(e, feature)}
                                            onMouseLeave={() => setHoveredFeature(null)}
                                        />
                                    );
                                })}
                            </g>
                        </svg>
                        {legendData && valueField && <MapLegend min={legendData.min} max={legendData.max} palette={CHOROPLETH_PALETTES[choroplethPalette]} valueField={valueField} aggregator={aggregator} />}
                         {hoveredFeature && <div className="map-tooltip" style={{ top: hoveredFeature.y, left: hoveredFeature.x, transform: 'translate(10px, -100%)' }}>{hoveredFeature.name}</div>}
                         {popup && (
                            <div className="map-popup" style={{ top: popup.y, left: popup.x }} onClick={e => e.stopPropagation()}>
                                <div className="map-popup-content-wrapper">
                                    <div className="map-popup-header">
                                        <h3 className="map-popup-title">{popup.feature.properties?.name || 'Feature Details'}</h3>
                                        <button onClick={() => setPopup(null)} className="map-popup-close-button"><CloseIcon className="w-5 h-5" /></button>
                                    </div>
                                    <div className="map-popup-content">
                                        {popup.data.length > 0 ? (
                                             popup.data.map((row, i) => (<div key={i} className="mb-2 pb-2 border-b border-gray-700 last:border-b-0 last:pb-0 last:mb-0">
                                                 {Object.entries(row).map(([key, value]) => (<div key={key} className="map-popup-property"><span className="map-popup-key">{key}:</span><span className="map-popup-value">{String(value)}</span></div>))}
                                             </div>))
                                        ) : (
                                            Object.entries(popup.feature.properties || {}).map(([key, value]) => (<div key={key} className="map-popup-property"><span className="map-popup-key">{key}:</span><span className="map-popup-value">{String(value)}</span></div>))
                                        )}
                                    </div>
                                </div>
                            </div>
                         )}
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
