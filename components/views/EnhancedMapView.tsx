import React, { useState, useEffect, useMemo, useContext, useCallback, useRef, MouseEvent as ReactMouseEvent, WheelEvent, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, LatLngTuple, AggregatorType, IconType, FileHeaders, GeoJsonFeature, GeoJsonFeatureCollection, MapFeatureStyle, GeoJsonGeometry } from '../../types';
import { geocodeAddressWithGemini, analyzeTextWithGemini } from '../../services/geminiService';
import { CONTINENTS, COUNTRIES_DATA } from '../../constants';

// Enhanced Icons
const LocationIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const LayersIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const HeatmapIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.974 5.974 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>;
const ClusterIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>;
const AnalyticsIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
const UploadIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const PlusIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const FitScreenIcon: IconType = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;

// Enhanced color palettes for data visualization
const VISUALIZATION_PALETTES = {
  rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080'],
  ocean: ['#001f3f', '#0074d9', '#39cccc', '#2ecc40', '#01ff70', '#ffdc00'],
  sunset: ['#ff4136', '#ff851b', '#ffdc00', '#ff6b6b', '#ff9ff3', '#f368e0'],
  forest: ['#2d5016', '#3d7c47', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'],
  cosmic: ['#1a0033', '#4a0e4e', '#81007f', '#c21807', '#fd8c00', '#ffdc00'],
  thermal: ['#000080', '#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff8000', '#ff0000']
};

// Enhanced map themes
type MapTheme = 'dark' | 'light' | 'satellite' | 'terrain' | 'blueprint';
type VisualizationMode = 'points' | 'heatmap' | 'clusters' | 'choropleth' | 'flow';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;

interface PlacedPin {
    id: string;
    name: string;
    latLng: LatLngTuple | null;
    status: 'loading' | 'success' | 'error';
    error?: string;
    data?: any;
}

interface DataVisualizationSettings {
    mode: VisualizationMode;
    colorPalette: keyof typeof VISUALIZATION_PALETTES;
    opacity: number;
    size: number;
    clustering: boolean;
    heatmapRadius: number;
    showLabels: boolean;
    animateTransitions: boolean;
}

// Helper function to convert GeoJSON coordinates to SVG path
const coordinatesToPath = (geometry: GeoJsonGeometry): string => {
    if (!geometry || !geometry.coordinates) return '';
    
    const project = (lat: number, lon: number): { x: number, y: number } => {
        const x = (lon + 180) * (MAP_WIDTH / 360);
        const y = (MAP_HEIGHT / 2) - (MAP_WIDTH * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 180) / 2))) / (2 * Math.PI);
        return { x, y };
    };

    const coordsToPath = (coords: any[]): string => {
        if (!coords || coords.length === 0) return '';
        
        let path = '';
        coords.forEach((coord, i) => {
            if (Array.isArray(coord[0])) {
                // Multi-dimensional array (polygon rings)
                coord.forEach((ring: any[], ringIndex: number) => {
                    ring.forEach((point: number[], pointIndex: number) => {
                        const { x, y } = project(point[1], point[0]);
                        if (ringIndex === 0 && pointIndex === 0) {
                            path += `M ${x} ${y}`;
                        } else {
                            path += ` L ${x} ${y}`;
                        }
                    });
                    path += ' Z';
                });
            } else {
                // Simple coordinate array
                const { x, y } = project(coord[1], coord[0]);
                if (i === 0) {
                    path += `M ${x} ${y}`;
                } else {
                    path += ` L ${x} ${y}`;
                }
            }
        });
        
        return path;
    };

    switch (geometry.type) {
        case 'Polygon':
            return coordsToPath(geometry.coordinates);
        case 'MultiPolygon':
            return geometry.coordinates.map(polygon => coordsToPath(polygon)).join(' ');
        case 'LineString':
            return coordsToPath(geometry.coordinates);
        case 'MultiLineString':
            return geometry.coordinates.map(line => coordsToPath(line)).join(' ');
        default:
            return '';
    }
};

const EnhancedMapView: React.FC = () => {
    const { tableData, fileHeaders } = useContext(DataContext);
    
    // Enhanced state management
    const [geoJson, setGeoJson] = useState<GeoJsonFeatureCollection | null>(null);
    const [featureStyles, setFeatureStyles] = useState<Record<string, MapFeatureStyle>>({});
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
    const [locationField, setLocationField] = useState<string | null>(null);
    const [valueField, setValueField] = useState<string | null>(null);
    const [categoryField, setCategoryField] = useState<string | null>(null);
    
    // Enhanced visualization settings
    const [visualizationSettings, setVisualizationSettings] = useState<DataVisualizationSettings>({
        mode: 'points',
        colorPalette: 'rainbow',
        opacity: 0.8,
        size: 8,
        clustering: false,
        heatmapRadius: 20,
        showLabels: true,
        animateTransitions: true
    });
    
    // Map state
    const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
    const [isPanning, setIsPanning] = useState(false);
    const [tooltip, setTooltip] = useState<{ data: TableRow; x: number, y: number } | null>(null);
    const [locationCache, setLocationCache] = useState<Record<string, LatLngTuple | 'loading' | 'error'>>({});
    
    // Enhanced pin management
    const [placedPins, setPlacedPins] = useState<PlacedPin[]>([]);
    const [pinInput, setPinInput] = useState('');
    const [isAddingPin, setIsAddingPin] = useState(false);
    
    // AI Analytics
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const svgRef = useRef<SVGSVGElement>(null);
    const panStartPos = useRef({ x: 0, y: 0 });

    // Enhanced data processing
    const processedData = useMemo(() => {
        if (!tableData || !locationField) return [];
        
        return tableData.map((row, index) => {
            const locationValue = row[locationField];
            if (!locationValue) return null;
            
            const locationString = String(locationValue).trim();
            const coords = locationCache[locationString];
            
            if (!coords || typeof coords === 'string') return null;
            
            return {
                id: `point-${index}`,
                coordinates: coords,
                data: row,
                value: valueField ? Number(row[valueField]) || 0 : 1,
                category: categoryField ? String(row[categoryField]) : 'default'
            };
        }).filter(Boolean);
    }, [tableData, locationField, valueField, categoryField, locationCache]);

    // Enhanced color mapping
    const getPointColor = useCallback((point: any) => {
        const palette = VISUALIZATION_PALETTES[visualizationSettings.colorPalette];
        
        if (visualizationSettings.mode === 'choropleth' && valueField) {
            const values = processedData.map(p => p?.value || 0);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const ratio = max > min ? (point.value - min) / (max - min) : 0;
            const colorIndex = Math.floor(ratio * (palette.length - 1));
            return palette[colorIndex] || palette[0];
        }
        
        if (categoryField) {
            const categories = [...new Set(processedData.map(p => p?.category))];
            const categoryIndex = categories.indexOf(point.category) % palette.length;
            return palette[categoryIndex];
        }
        
        return palette[0];
    }, [visualizationSettings, processedData, valueField, categoryField]);

    // Enhanced projection function
    const project = useCallback((lat: number, lon: number): { x: number, y: number } => {
        const x = (lon + 180) * (MAP_WIDTH / 360);
        const y = (MAP_HEIGHT / 2) - (MAP_WIDTH * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 180) / 2))) / (2 * Math.PI);
        return { x, y };
    }, []);

    // Enhanced geocoding with batch processing
    useEffect(() => {
        if (!locationField || !tableData.length) return;

        const processGeocoding = async () => {
            const uniqueLocations = [...new Set(
                tableData
                    .map(row => row[locationField])
                    .filter(loc => loc !== null && loc !== undefined && String(loc).trim() !== '')
                    .map(loc => String(loc).trim())
            )];

            for (const location of uniqueLocations) {
                if (locationCache[location]) continue;

                setLocationCache(prev => ({ ...prev, [location]: 'loading' }));
                
                try {
                    const result = await geocodeAddressWithGemini(location);
                    setLocationCache(prev => ({
                        ...prev,
                        [location]: !('error' in result) ? result : 'error'
                    }));
                } catch (error) {
                    setLocationCache(prev => ({ ...prev, [location]: 'error' }));
                }
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        };

        processGeocoding();
    }, [locationField, tableData]);

    // Enhanced AI analysis
    const performAIAnalysis = useCallback(async () => {
        if (!processedData.length) return;
        
        setIsAnalyzing(true);
        try {
            const analysisData = {
                totalPoints: processedData.length,
                fields: { location: locationField, value: valueField, category: categoryField },
                valueStats: valueField ? {
                    min: Math.min(...processedData.map(p => p.value)),
                    max: Math.max(...processedData.map(p => p.value)),
                    avg: processedData.reduce((sum, p) => sum + p.value, 0) / processedData.length
                } : null,
                categories: categoryField ? [...new Set(processedData.map(p => p.category))] : null
            };
            
            const prompt = `Analyze this geographic data visualization:
            - Total data points: ${analysisData.totalPoints}
            - Location field: ${analysisData.fields.location}
            - Value field: ${analysisData.fields.value || 'None'}
            - Category field: ${analysisData.fields.category || 'None'}
            ${analysisData.valueStats ? `- Value range: ${analysisData.valueStats.min} to ${analysisData.valueStats.max}` : ''}
            ${analysisData.categories ? `- Categories: ${analysisData.categories.join(', ')}` : ''}
            
            Provide insights about geographic patterns, data distribution, and recommendations for visualization.`;
            
            const response = await analyzeTextWithGemini(prompt);
            setAiAnalysis(response.content as string);
        } catch (error) {
            setAiAnalysis('Failed to generate AI analysis. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [processedData, locationField, valueField, categoryField]);

    // Enhanced pin management
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
            setPlacedPins(prev => prev.map(p => 
                p.id === newPin.id ? { ...p, latLng: result, status: 'success' } : p
            ));
        } catch (error: any) {
            setPlacedPins(prev => prev.map(p => 
                p.id === newPin.id ? { ...p, status: 'error', error: error.message } : p
            ));
        } finally {
            setIsAddingPin(false);
        }
    }, [pinInput, isAddingPin]);

    // Enhanced dropzone for multiple file types
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
                } else {
                    alert('Invalid GeoJSON: Must be a FeatureCollection.');
                }
            } catch (err) {
                alert('Error parsing GeoJSON file.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/json': ['.json', '.geojson'] },
        multiple: false,
    });

    // Enhanced rendering functions
    const renderDataPoints = () => {
        if (!processedData.length) return null;

        switch (visualizationSettings.mode) {
            case 'heatmap':
                return processedData.map((point, index) => {
                    const { x, y } = project(point.coordinates[0], point.coordinates[1]);
                    const color = getPointColor(point);
                    return (
                        <g key={`heatmap-${index}`} transform={`translate(${x}, ${y})`}>
                            <circle
                                r={visualizationSettings.heatmapRadius}
                                fill={color}
                                opacity={visualizationSettings.opacity * 0.3}
                                className="heatmap-dot"
                            />
                            <circle
                                r={visualizationSettings.size}
                                fill={color}
                                opacity={visualizationSettings.opacity}
                                onMouseEnter={() => setTooltip({ data: point.data, x, y })}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        </g>
                    );
                });

            case 'clusters':
                // Simple clustering visualization
                return processedData.map((point, index) => {
                    const { x, y } = project(point.coordinates[0], point.coordinates[1]);
                    const color = getPointColor(point);
                    return (
                        <g key={`cluster-${index}`} transform={`translate(${x}, ${y})`}>
                            <circle
                                r={visualizationSettings.size * 1.5}
                                fill={color}
                                opacity={0.3}
                                stroke={color}
                                strokeWidth="2"
                            />
                            <circle
                                r={visualizationSettings.size}
                                fill={color}
                                opacity={visualizationSettings.opacity}
                                onMouseEnter={() => setTooltip({ data: point.data, x, y })}
                                onMouseLeave={() => setTooltip(null)}
                            />
                            {visualizationSettings.showLabels && (
                                <text
                                    y={visualizationSettings.size + 15}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="white"
                                    className="pointer-events-none"
                                >
                                    {point.category}
                                </text>
                            )}
                        </g>
                    );
                });

            default: // points
                return processedData.map((point, index) => {
                    const { x, y } = project(point.coordinates[0], point.coordinates[1]);
                    const color = getPointColor(point);
                    return (
                        <circle
                            key={`point-${index}`}
                            cx={x}
                            cy={y}
                            r={visualizationSettings.size}
                            fill={color}
                            opacity={visualizationSettings.opacity}
                            stroke="white"
                            strokeWidth="1"
                            className={visualizationSettings.animateTransitions ? "transition-all duration-300" : ""}
                            onMouseEnter={() => setTooltip({ data: point.data, x, y })}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    );
                });
        }
    };

    return (
        <div className="flex h-full gap-6">
            {/* Enhanced Control Panel */}
            <Panel className="w-80 flex-shrink-0 flex flex-col h-full">
                <div className="flex-grow overflow-y-auto pr-2 hide-scrollbar space-y-6">
                    {/* Data Mapping Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                            <LocationIcon className="w-5 h-5" />
                            Data Mapping
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-300">Location Field</label>
                                <select 
                                    value={locationField || ''} 
                                    onChange={(e) => setLocationField(e.target.value)}
                                    className="w-full p-2 bg-gray-700 rounded text-sm mt-1"
                                >
                                    <option value="">Select location field...</option>
                                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300">Value Field (Optional)</label>
                                <select 
                                    value={valueField || ''} 
                                    onChange={(e) => setValueField(e.target.value)}
                                    className="w-full p-2 bg-gray-700 rounded text-sm mt-1"
                                >
                                    <option value="">Select value field...</option>
                                    {fileHeaders.filter(h => 
                                        tableData.every(row => !isNaN(Number(row[h])))
                                    ).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300">Category Field (Optional)</label>
                                <select 
                                    value={categoryField || ''} 
                                    onChange={(e) => setCategoryField(e.target.value)}
                                    className="w-full p-2 bg-gray-700 rounded text-sm mt-1"
                                >
                                    <option value="">Select category field...</option>
                                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Visualization Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                            <LayersIcon className="w-5 h-5" />
                            Visualization
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-300">Mode</label>
                                <select 
                                    value={visualizationSettings.mode} 
                                    onChange={(e) => setVisualizationSettings(prev => ({
                                        ...prev, 
                                        mode: e.target.value as VisualizationMode
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded text-sm mt-1"
                                >
                                    <option value="points">Points</option>
                                    <option value="heatmap">Heatmap</option>
                                    <option value="clusters">Clusters</option>
                                    <option value="choropleth">Choropleth</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-300">Color Palette</label>
                                <select 
                                    value={visualizationSettings.colorPalette} 
                                    onChange={(e) => setVisualizationSettings(prev => ({
                                        ...prev, 
                                        colorPalette: e.target.value as keyof typeof VISUALIZATION_PALETTES
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded text-sm mt-1"
                                >
                                    {Object.keys(VISUALIZATION_PALETTES).map(palette => (
                                        <option key={palette} value={palette}>
                                            {palette.charAt(0).toUpperCase() + palette.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-1 mt-2">
                                    {VISUALIZATION_PALETTES[visualizationSettings.colorPalette].map((color, i) => (
                                        <div 
                                            key={i} 
                                            className="w-4 h-4 rounded border border-gray-600" 
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-300">
                                    Opacity: {Math.round(visualizationSettings.opacity * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={visualizationSettings.opacity}
                                    onChange={(e) => setVisualizationSettings(prev => ({
                                        ...prev,
                                        opacity: parseFloat(e.target.value)
                                    }))}
                                    className="w-full mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-300">
                                    Size: {visualizationSettings.size}px
                                </label>
                                <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    step="1"
                                    value={visualizationSettings.size}
                                    onChange={(e) => setVisualizationSettings(prev => ({
                                        ...prev,
                                        size: parseInt(e.target.value)
                                    }))}
                                    className="w-full mt-1"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showLabels"
                                    checked={visualizationSettings.showLabels}
                                    onChange={(e) => setVisualizationSettings(prev => ({
                                        ...prev,
                                        showLabels: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <label htmlFor="showLabels" className="text-sm text-gray-300">Show Labels</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="animateTransitions"
                                    checked={visualizationSettings.animateTransitions}
                                    onChange={(e) => setVisualizationSettings(prev => ({
                                        ...prev,
                                        animateTransitions: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <label htmlFor="animateTransitions" className="text-sm text-gray-300">Animate Transitions</label>
                            </div>
                        </div>
                    </div>

                    {/* AI Analytics Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                            <AnalyticsIcon className="w-5 h-5" />
                            AI Analytics
                        </h3>
                        <button
                            onClick={performAIAnalysis}
                            disabled={!processedData.length || isAnalyzing}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Geographic Patterns'}
                        </button>
                        
                        {aiAnalysis && (
                            <div className="mt-3 p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300 max-h-40 overflow-y-auto">
                                {aiAnalysis}
                            </div>
                        )}
                    </div>

                    {/* Pin Management */}
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-300 mb-3">Custom Pins</h3>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                placeholder="Add location..."
                                className="flex-1 p-2 bg-gray-700 rounded text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPin()}
                            />
                            <button
                                onClick={handleAddPin}
                                disabled={!pinInput.trim() || isAddingPin}
                                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded text-sm"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {placedPins.map(pin => (
                                <div key={pin.id} className="flex items-center justify-between text-xs p-2 bg-gray-700/50 rounded">
                                    <span className="truncate">{pin.name}</span>
                                    <div className="flex items-center gap-2">
                                        {pin.status === 'loading' && <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />}
                                        {pin.status === 'error' && <span className="text-red-400">✗</span>}
                                        {pin.status === 'success' && <span className="text-green-400">✓</span>}
                                        <button
                                            onClick={() => setPlacedPins(prev => prev.filter(p => p.id !== pin.id))}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <CloseIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Theme */}
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3">Map Theme</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(['dark', 'light', 'satellite', 'blueprint'] as MapTheme[]).map(theme => (
                                <button
                                    key={theme}
                                    onClick={() => setMapTheme(theme)}
                                    className={`p-2 text-xs rounded transition-colors ${
                                        mapTheme === theme 
                                            ? 'bg-cyan-600 text-white' 
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Panel>

            {/* Enhanced Map Display */}
            <div className="flex-grow relative">
                {geoJson ? (
                    <Panel className={`w-full h-full relative map-container theme-${mapTheme}`}>
                        <svg 
                            ref={svgRef} 
                            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} 
                            className="w-full h-full"
                        >
                            {/* Background */}
                            <rect 
                                x={viewBox.x} 
                                y={viewBox.y} 
                                width={viewBox.width} 
                                height={viewBox.height} 
                                fill={mapTheme === 'light' ? '#f0f9ff' : '#0a0f1e'} 
                            />
                            
                            {/* GeoJSON Features */}
                            <g>
                                {geoJson.features.map((feature, i) => {
                                    const id = (feature.id || i).toString();
                                    const style = featureStyles[id] || {};
                                    return (
                                        <path
                                            key={id}
                                            d={coordinatesToPath(feature.geometry!)}
                                            className={`map-path ${selectedFeatureId === id ? 'selected' : ''}`}
                                            fill={style.fill || "rgba(139, 92, 246, 0.2)"}
                                            stroke={style.stroke || "#8b5cf6"}
                                            strokeWidth={style.strokeWidth || 1}
                                            onClick={() => setSelectedFeatureId(id)}
                                        />
                                    );
                                })}
                            </g>
                            
                            {/* Enhanced Data Visualization */}
                            <g className="data-layer">
                                {renderDataPoints()}
                            </g>
                            
                            {/* Placed Pins */}
                            <g className="pins-layer">
                                {placedPins.filter(pin => pin.status === 'success' && pin.latLng).map(pin => {
                                    const { x, y } = project(pin.latLng![0], pin.latLng![1]);
                                    return (
                                        <g key={pin.id} transform={`translate(${x}, ${y})`}>
                                            <circle r="8" fill="#fbbf24" stroke="white" strokeWidth="2" />
                                            <text y="20" textAnchor="middle" fontSize="10" fill="white">
                                                {pin.name}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>
                        
                        {/* Enhanced Tooltip */}
                        {tooltip && (
                            <div 
                                className="absolute pointer-events-none z-50 bg-gray-900/90 backdrop-blur-sm border border-purple-500 rounded-lg p-3 text-white text-sm shadow-lg"
                                style={{ 
                                    left: tooltip.x + 15, 
                                    top: tooltip.y - 10,
                                    transform: 'translate(0, -100%)'
                                }}
                            >
                                {Object.entries(tooltip.data).slice(0, 5).map(([key, value]) => (
                                    <div key={key} className="flex justify-between gap-3">
                                        <span className="text-gray-400">{key}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Enhanced Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <button className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg backdrop-blur-sm">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg backdrop-blur-sm">
                                <MinusIcon className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg backdrop-blur-sm">
                                <FitScreenIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Data Statistics */}
                        {processedData.length > 0 && (
                            <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                                <div className="font-semibold mb-1">Data Overview</div>
                                <div>Points: {processedData.length}</div>
                                {valueField && (
                                    <div>
                                        Value Range: {Math.min(...processedData.map(p => p.value))} - {Math.max(...processedData.map(p => p.value))}
                                    </div>
                                )}
                                {categoryField && (
                                    <div>
                                        Categories: {[...new Set(processedData.map(p => p.category))].length}
                                    </div>
                                )}
                            </div>
                        )}
                    </Panel>
                ) : (
                    <div {...getRootProps()} className={`map-view-dropzone dropzone-holographic ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        <div className="text-center">
                            <UploadIcon className="w-16 h-16 mx-auto text-purple-400 mb-4"/>
                            <p className="text-xl font-semibold text-gray-200">Enhanced Map Visualization</p>
                            <p className="text-gray-400 mb-4">Drop GeoJSON file or use data mapping</p>
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                    <HeatmapIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                    <div>Heatmaps</div>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                    <ClusterIcon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                                    <div>Clustering</div>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                    <AnalyticsIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                    <div>AI Analytics</div>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                    <LayersIcon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                                    <div>Multi-layer</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedMapView;