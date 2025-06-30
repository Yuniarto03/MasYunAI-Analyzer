import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { AppContext } from '../../contexts/AppContext';
import { AppContextType, RouteResult, CountryInfo, RouteCalculation, BulkRouteResultItem, LatLngTuple, TravelMode } from '../../types';
import { RAW_COLOR_VALUES, COUNTRIES_DATA, AVERAGE_TRAVEL_SPEED_KMH, TRAVEL_MODES, HEURISTIC_TRAVEL_FACTORS } from '../../constants';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Calculator, Route, Info, Download, UploadCloud, Trash2, Clock, PlusCircle, Brain, Play, ChevronDown, ChevronUp, Bike, Car, PersonStanding, MapPinIcon, Globe, Zap, Target, Search } from 'lucide-react';
import FuturisticBackground from '../FuturisticBackground';
import { geocodeAddressWithGemini, getRouteAnalysisForDisplay, analyzeTextWithGemini, reverseGeocodeWithGemini, findNearestValidCoordinates, enhancedBulkGeocoding } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportRouteResultsToXLSX } from '../../services/DataProcessingService';

const MAX_ROUTES = 8;
const ROUTE_COLORS_KEYS = ['accent1', 'accent2', 'accent3', 'accent4', 'pink-500', 'cyan-400', 'amber-500', 'lime-500'];

export const RoutePlannerView: React.FC = () => {
  const { theme, reduceMotion } = useContext(AppContext) as AppContextType;
  
  const [routeCalculations, setRouteCalculations] = useState<RouteCalculation[]>(() => [
    { 
      id: `route-${Date.now()}`, 
      locationAInput: '', 
      locationBInput: '', 
      travelMode: 'DRIVING',
      result: null, 
      color: RAW_COLOR_VALUES[ROUTE_COLORS_KEYS[0]] || '#00D4FF',
      aiRouteAnalysis: null,
      isAiRouteAnalysisLoading: false,
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ID"); 
  const [uploadedFile, setUploadedFile] = useState<FileWithPath | null>(null);
  const [bulkRouteResults, setBulkRouteResults] = useState<BulkRouteResultItem[]>([]);
  const [bulkFileProcessingError, setBulkFileProcessingError] = useState<string | null>(null);
  const [bulkProcessingProgress, setBulkProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  
  const [aiAnalysisInstruction, setAiAnalysisInstruction] = useState<string>('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState<boolean>(false);

  // Advanced settings
  const [customSpeedKmh, setCustomSpeedKmh] = useState<number>(AVERAGE_TRAVEL_SPEED_KMH);
  const [includeTrafficFactor, setIncludeTrafficFactor] = useState<boolean>(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [enableSmartGeocoding, setEnableSmartGeocoding] = useState<boolean>(true);

  // State for minimizing sections
  const [isManualInputMinimized, setIsManualInputMinimized] = useState<boolean>(false);
  const [isBulkProcessingMinimized, setIsBulkProcessingMinimized] = useState<boolean>(true);
  const [isGlobalAiAnalysisMinimized, setIsGlobalAiAnalysisMinimized] = useState<boolean>(true);
  const [isAdvancedSettingsMinimized, setIsAdvancedSettingsMinimized] = useState<boolean>(true);

  const parseCoordinates = (input: string): LatLngTuple | null => {
    const parts = input.split(',').map(part => part.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return [lat, lon];
      }
    }
    return null;
  };

  const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const formatDuration = (hours: number): string => {
    if (hours < 0) return "N/A";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    let parts = [];
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    if (parts.length === 0 && hours > 0) return "< 1 menit";
    if (parts.length === 0) return "0 menit";
    return parts.join(' ');
  };
  
  const processSingleRoute = useCallback(async (
    routeToProcess: RouteCalculation
  ): Promise<RouteResult> => { 
    
    const { locationAInput, locationBInput, travelMode } = routeToProcess;
    const originalA = locationAInput;
    const originalB = locationBInput;
    
    let finalCoordsA: LatLngTuple | null = parseCoordinates(locationAInput);
    let finalCoordsB: LatLngTuple | null = parseCoordinates(locationBInput);
    let geocodingPerformedA = false;
    let geocodingPerformedB = false;
    let errorMsgA: string | null = null;
    let errorMsgB: string | null = null;
    let status: RouteResult['status'] = 'pending';
    let resolvedLocationA = originalA;
    let resolvedLocationB = originalB;

    // Enhanced coordinate processing for Location A
    if (enableSmartGeocoding) {
      if (finalCoordsA) {
        // If input is coordinates, try to get address
        try {
          const reverseResult = await reverseGeocodeWithGemini(finalCoordsA[0], finalCoordsA[1]);
          if (reverseResult && !('error' in reverseResult)) {
            resolvedLocationA = `${reverseResult.address} (${reverseResult.fullLocation})`;
          } else {
            // Try to find nearest valid coordinates
            const nearestResult = await findNearestValidCoordinates(finalCoordsA[0], finalCoordsA[1]);
            if (nearestResult && !('error' in nearestResult)) {
              finalCoordsA = nearestResult.coordinates;
              resolvedLocationA = `${nearestResult.address} (${nearestResult.fullLocation}) - ${nearestResult.distance}`;
            } else {
              resolvedLocationA = `${finalCoordsA[0]}, ${finalCoordsA[1]} (Coordinates)`;
            }
          }
        } catch (error) {
          resolvedLocationA = `${finalCoordsA[0]}, ${finalCoordsA[1]} (Coordinates)`;
        }
      } else if (locationAInput.trim()) {
        // If input is address, geocode it
        const geocodeResultA = await geocodeAddressWithGemini(locationAInput);
        if (geocodeResultA && !('error' in geocodeResultA)) {
          finalCoordsA = geocodeResultA;
          geocodingPerformedA = true;
          resolvedLocationA = locationAInput;
        } else if (geocodeResultA && 'error' in geocodeResultA) {
          errorMsgA = geocodeResultA.error;
        } else {
          errorMsgA = `Gagal mengubah "${locationAInput}" menjadi koordinat.`;
        }
      }

      // Enhanced coordinate processing for Location B
      if (finalCoordsB) {
        // If input is coordinates, try to get address
        try {
          const reverseResult = await reverseGeocodeWithGemini(finalCoordsB[0], finalCoordsB[1]);
          if (reverseResult && !('error' in reverseResult)) {
            resolvedLocationB = `${reverseResult.address} (${reverseResult.fullLocation})`;
          } else {
            // Try to find nearest valid coordinates
            const nearestResult = await findNearestValidCoordinates(finalCoordsB[0], finalCoordsB[1]);
            if (nearestResult && !('error' in nearestResult)) {
              finalCoordsB = nearestResult.coordinates;
              resolvedLocationB = `${nearestResult.address} (${nearestResult.fullLocation}) - ${nearestResult.distance}`;
            } else {
              resolvedLocationB = `${finalCoordsB[0]}, ${finalCoordsB[1]} (Coordinates)`;
            }
          }
        } catch (error) {
          resolvedLocationB = `${finalCoordsB[0]}, ${finalCoordsB[1]} (Coordinates)`;
        }
      } else if (locationBInput.trim()) {
        // If input is address, geocode it
        const geocodeResultB = await geocodeAddressWithGemini(locationBInput);
        if (geocodeResultB && !('error' in geocodeResultB)) {
          finalCoordsB = geocodeResultB;
          geocodingPerformedB = true;
          resolvedLocationB = locationBInput;
        } else if (geocodeResultB && 'error' in geocodeResultB) {
          errorMsgB = geocodeResultB.error;
        } else {
          errorMsgB = `Gagal mengubah "${locationBInput}" menjadi koordinat.`;
        }
      }
    } else {
      // Basic processing without smart geocoding
      if (!finalCoordsA && locationAInput.trim()) {
        const geocodeResultA = await geocodeAddressWithGemini(locationAInput);
        if (geocodeResultA && !('error' in geocodeResultA)) {
          finalCoordsA = geocodeResultA;
          geocodingPerformedA = true;
        } else if (geocodeResultA && 'error' in geocodeResultA) {
          errorMsgA = geocodeResultA.error;
        }
      }

      if (!finalCoordsB && locationBInput.trim()) {
        const geocodeResultB = await geocodeAddressWithGemini(locationBInput);
        if (geocodeResultB && !('error' in geocodeResultB)) {
          finalCoordsB = geocodeResultB;
          geocodingPerformedB = true;
        } else if (geocodeResultB && 'error' in geocodeResultB) {
          errorMsgB = geocodeResultB.error;
        }
      }
    }
    
    if (errorMsgA && errorMsgB) status = 'error_both_geocoding';
    else if (errorMsgA) status = 'error_geocoding_A';
    else if (errorMsgB) status = 'error_geocoding_B';
    
    const calculatedAt = new Date().toLocaleString();

    const baseErrorResult = {
        straightLineDistanceKm: null, 
        straightLineDurationHours: null, 
        estimatedTravelDurationHours: null,
        travelMode,
        error: [errorMsgA, errorMsgB].filter(Boolean).join(' ') || "Geocoding error", 
        calculationType: null, 
        status, 
        fromLocation: originalA, 
        toLocation: originalB, 
        calculatedAt, 
        originalInputA: originalA, 
        originalInputB: originalB,
    };

    if (status.startsWith('error_geocoding')) {
        return baseErrorResult;
    }

    if (finalCoordsA && finalCoordsB) {
      const distanceKm = calculateHaversineDistance(finalCoordsA[0], finalCoordsA[1], finalCoordsB[0], finalCoordsB[1]);
      const straightLineHours = distanceKm / customSpeedKmh;
      const heuristicFactor = HEURISTIC_TRAVEL_FACTORS[travelMode] || 1;
      const trafficFactor = includeTrafficFactor ? 1.2 : 1; // 20% traffic adjustment
      const estimatedTravelHours = straightLineHours * heuristicFactor * trafficFactor;
      
      status = 'success';
      return {
        straightLineDistanceKm: `${distanceKm.toFixed(2)} km`,
        straightLineDurationHours: formatDuration(straightLineHours),
        estimatedTravelDurationHours: formatDuration(estimatedTravelHours),
        travelMode,
        error: null,
        calculationType: enableSmartGeocoding ? 'smart_enhanced_haversine' : (geocodingPerformedA || geocodingPerformedB) ? 'enhanced_geocoded_haversine' : 'enhanced_haversine',
        message: `Estimasi durasi garis lurus @${customSpeedKmh}km/jam. Durasi perjalanan difaktorkan untuk ${travelMode.toLowerCase()}${includeTrafficFactor ? ' dengan faktor lalu lintas (+20%)' : ''}${enableSmartGeocoding ? ' menggunakan Smart Geocoding' : ''}.`,
        status,
        fromLocation: finalCoordsA.join(','),
        toLocation: finalCoordsB.join(','),
        calculatedAt,
        originalInputA: resolvedLocationA,
        originalInputB: resolvedLocationB,
      };
    }
    
    status = 'error_calculation';
    let combinedError = "Lokasi A dan/atau B tidak valid.";
    if (!locationAInput.trim() && !locationBInput.trim()) combinedError = "Harap masukkan Lokasi A dan Lokasi B.";
    else if (!locationAInput.trim()) combinedError = "Lokasi A diperlukan.";
    else if (!locationBInput.trim()) combinedError = "Lokasi B diperlukan.";

    return { ...baseErrorResult, error: combinedError, status };
  }, [customSpeedKmh, includeTrafficFactor, enableSmartGeocoding]); 

  const handleCalculateAllRoutes = async () => {
    setIsLoading(true);
    const newRouteCalculations = await Promise.all(
      routeCalculations.map(async (rc) => {
        if (!rc.locationAInput.trim() && !rc.locationBInput.trim()) {
          return { ...rc, result: { straightLineDistanceKm: null, straightLineDurationHours: null, estimatedTravelDurationHours: null, travelMode: rc.travelMode, error: "Input kosong.", calculationType: null, status: 'pending' as RouteResult['status'], originalInputA: rc.locationAInput, originalInputB: rc.locationBInput } };
        }
        const singleResult = await processSingleRoute(rc);
        
        let aiAnalysisForThisRoute: string | null = null;
        let isAiLoadingForThisRoute = false;
        if (singleResult.status === 'success' && singleResult.fromLocation && singleResult.toLocation) {
            isAiLoadingForThisRoute = true;
            setRouteCalculations(prev => prev.map(prevRc => prevRc.id === rc.id ? {...prevRc, isAiRouteAnalysisLoading: true} : prevRc));
            try {
                aiAnalysisForThisRoute = await getRouteAnalysisForDisplay(
                    singleResult.originalInputA || rc.locationAInput, 
                    singleResult.originalInputB || rc.locationBInput, 
                    singleResult.straightLineDistanceKm, 
                    singleResult.estimatedTravelDurationHours,
                    singleResult.travelMode || rc.travelMode,
                    COUNTRIES_DATA.find(c => c.code === selectedCountryCode)?.name || "Global"
                );
            } catch (aiError) {
                console.error("Error fetching AI analysis for route:", aiError);
                aiAnalysisForThisRoute = "Gagal memuat analisis AI untuk rute ini.";
            }
            isAiLoadingForThisRoute = false;
        }
        return { ...rc, result: singleResult, aiRouteAnalysis: aiAnalysisForThisRoute, isAiRouteAnalysisLoading: isAiLoadingForThisRoute };
      })
    );
    setRouteCalculations(newRouteCalculations);
    setIsLoading(false);
  };

  const handleAddRoute = () => {
    if (routeCalculations.length < MAX_ROUTES) {
      const nextColorIndex = routeCalculations.length % ROUTE_COLORS_KEYS.length;
      const newRouteId = `route-${Date.now()}`;
      setRouteCalculations(prev => [
        ...prev,
        { 
          id: newRouteId, 
          locationAInput: '', 
          locationBInput: '', 
          travelMode: 'DRIVING',
          result: null, 
          color: RAW_COLOR_VALUES[ROUTE_COLORS_KEYS[nextColorIndex]] || '#007BFF',
          aiRouteAnalysis: null,
          isAiRouteAnalysisLoading: false,
        }
      ]);
    }
  };

  const handleRemoveRoute = (idToRemove: string) => {
    setRouteCalculations(prev => {
        const newRoutes = prev.filter(rc => rc.id !== idToRemove);
        if (newRoutes.length === 0) { 
            const nextColorIndex = 0;
            return [{ id: `route-${Date.now()}`, locationAInput: '', locationBInput: '', travelMode: 'DRIVING', result: null, color: RAW_COLOR_VALUES[ROUTE_COLORS_KEYS[nextColorIndex]] || '#007BFF', aiRouteAnalysis: null, isAiRouteAnalysisLoading: false }];
        }
        return newRoutes;
    });
  };

  const handleInputChange = (id: string, point: 'A' | 'B' | 'TravelMode', value: string) => {
    setRouteCalculations(prev => prev.map(rc => {
      if (rc.id === id) {
        if (point === 'A') return { ...rc, locationAInput: value, result: null, aiRouteAnalysis: null, isAiRouteAnalysisLoading: false };
        if (point === 'B') return { ...rc, locationBInput: value, result: null, aiRouteAnalysis: null, isAiRouteAnalysisLoading: false };
        if (point === 'TravelMode') return { ...rc, travelMode: value as TravelMode, result: null, aiRouteAnalysis: null, isAiRouteAnalysisLoading: false };
      }
      return rc;
    }));
  };
  
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["From_Location", "To_Location", "Travel_Mode (DRIVING, WALKING, CYCLING)"], 
      ["Jakarta, Indonesia", "Surabaya, Indonesia", "DRIVING"], 
      ["-6.2088,106.8456", "-7.2575,112.7521", "WALKING"],
      ["Eiffel Tower, Paris", "Big Ben, London", "CYCLING"],
      ["40.7128,-74.0060", "34.0522,-118.2437", "DRIVING"],
      ["0,0", "Invalid coordinates test", "DRIVING"],
      ["Nonexistent Place XYZ", "Another Invalid Location", "WALKING"]
    ]);
    XLSX.utils.sheet_add_aoa(ws, [
      [""],
      ["ENHANCED FEATURES:"],
      ["✓ Smart coordinate detection and validation"],
      ["✓ Automatic address resolution from coordinates"],
      ["✓ Nearest valid location finder for invalid coordinates"],
      ["✓ Mixed input support (addresses + coordinates)"],
      ["✓ Comprehensive error handling and recovery"],
      [""],
      ["NOTES:"],
      ["- You can use addresses, coordinates (lat,lng), or mix both"],
      ["- Travel modes: DRIVING, WALKING, CYCLING"],
      ["- Invalid coordinates will find nearest valid location"],
      ["- System automatically converts coordinates to addresses"]
    ], {origin: "A8"});
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RoutesTemplate");
    XLSX.writeFile(wb, "RoutePlanner_Smart_Template.xlsx");
  };

  const onBulkDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
      setBulkFileProcessingError("Tidak ada file yang dipilih atau tipe file tidak didukung.");
      return;
    }
    const file = acceptedFiles[0];
    setUploadedFile(file);
    setIsBulkLoading(true);
    setBulkRouteResults([]);
    setBulkFileProcessingError(null);
    setBulkProcessingProgress(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const binaryStr = event.target?.result;
        if (!binaryStr) throw new Error("Konten file kosong.");
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<{ From_Location?: string, To_Location?: string, Travel_Mode?: string }>(worksheet, { defval: null });

        if (jsonData.length === 0) {
          setBulkFileProcessingError("Sheet yang dipilih kosong atau tidak dapat diparsing.");
          setIsBulkLoading(false);
          return;
        }

        setBulkProcessingProgress({ current: 0, total: jsonData.length });
        const results: BulkRouteResultItem[] = [];
        
        for (let i = 0; i < jsonData.length; i++) {
          setBulkProcessingProgress({ current: i + 1, total: jsonData.length });
          
          const row = jsonData[i];
          const from = row.From_Location || '';
          const to = row.To_Location || '';
          const modeInput = (row.Travel_Mode || 'DRIVING').toUpperCase();
          const travelMode = (TRAVEL_MODES.some(tm => tm.value === modeInput) ? modeInput : 'DRIVING') as TravelMode;
          const bulkId = `bulk-${Date.now()}-${i}`;
          
          // Initialize result
          let result: BulkRouteResultItem = {
            id: bulkId, 
            originalInputA: from, 
            originalInputB: to, 
            travelMode, 
            straightLineDistanceKm: null, 
            straightLineDurationHours: null, 
            estimatedTravelDurationHours: null, 
            error: null, 
            calculationType: null, 
            status: 'pending',
            fromLocation: from,
            toLocation: to
          };

          if (from.trim() && to.trim()) {
            try {
              // Enhanced bulk processing with smart geocoding
              if (enableSmartGeocoding) {
                const isFromCoordinate = parseCoordinates(from) !== null;
                const isToCoordinate = parseCoordinates(to) !== null;
                
                // Process From location
                const fromResult = await enhancedBulkGeocoding(from, isFromCoordinate);
                // Process To location  
                const toResult = await enhancedBulkGeocoding(to, isToCoordinate);
                
                if (fromResult.resolvedCoordinates && toResult.resolvedCoordinates) {
                  // Calculate distance and duration
                  const distanceKm = calculateHaversineDistance(
                    fromResult.resolvedCoordinates[0], fromResult.resolvedCoordinates[1],
                    toResult.resolvedCoordinates[0], toResult.resolvedCoordinates[1]
                  );
                  const straightLineHours = distanceKm / customSpeedKmh;
                  const heuristicFactor = HEURISTIC_TRAVEL_FACTORS[travelMode] || 1;
                  const trafficFactor = includeTrafficFactor ? 1.2 : 1;
                  const estimatedTravelHours = straightLineHours * heuristicFactor * trafficFactor;
                  
                  result = {
                    ...result,
                    straightLineDistanceKm: `${distanceKm.toFixed(2)} km`,
                    straightLineDurationHours: formatDuration(straightLineHours),
                    estimatedTravelDurationHours: formatDuration(estimatedTravelHours),
                    status: 'success',
                    fromLocation: fromResult.resolvedCoordinates.join(','),
                    toLocation: toResult.resolvedCoordinates.join(','),
                    originalInputA: `${fromResult.resolvedFullLocation} (${fromResult.processingType})`,
                    originalInputB: `${toResult.resolvedFullLocation} (${toResult.processingType})`,
                    calculationType: 'smart_bulk_enhanced',
                    calculatedAt: new Date().toLocaleString(),
                    message: `Smart processing: From=${fromResult.processingType}, To=${toResult.processingType}`
                  };
                } else {
                  result = {
                    ...result,
                    error: `Geocoding failed: From=${fromResult.error || 'OK'}, To=${toResult.error || 'OK'}`,
                    status: 'error_calculation',
                    originalInputA: fromResult.resolvedFullLocation || from,
                    originalInputB: toResult.resolvedFullLocation || to
                  };
                }
              } else {
                // Basic processing
                const routeCalcItem: RouteCalculation = { id: bulkId, locationAInput: from, locationBInput: to, travelMode, result: null, color: theme.accent1 };
                const basicResult = await processSingleRoute(routeCalcItem);
                result = { ...result, ...basicResult, originalInputA: from, originalInputB: to, fromLocation: basicResult.fromLocation || from, toLocation: basicResult.toLocation || to };
              }
            } catch (error: any) {
              result = {
                ...result,
                error: `Processing error: ${error.message}`,
                status: 'error_calculation'
              };
            }
          } else {
            result = { ...result, error: "Lokasi 'From' atau 'To' kosong.", status: 'error_calculation' };
          }
          
          results.push(result);
          setBulkRouteResults([...results]); 
        }
        
        setBulkProcessingProgress(null);
      } catch (e: any) {
        setBulkFileProcessingError(`Error memproses file massal: ${e.message}`);
        setBulkProcessingProgress(null);
      } finally {
        setIsBulkLoading(false);
      }
    };
    reader.onerror = () => { 
      setBulkFileProcessingError("Error membaca file."); 
      setIsBulkLoading(false); 
      setBulkProcessingProgress(null);
    };
    reader.readAsBinaryString(file);
  }, [processSingleRoute, theme.accent1, enableSmartGeocoding, customSpeedKmh, includeTrafficFactor]);
  
  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({ onDrop: onBulkDrop, accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }, maxFiles: 1, disabled: isBulkLoading });
  
  const handleGenerateGlobalAiAnalysis = async () => {
    const successfulRoutes = routeCalculations.filter(rc => rc.result?.status === 'success');
    if (!aiAnalysisInstruction.trim()) {
      alert("Silakan masukkan perintah untuk analisis AI.");
      return;
    }
    if (successfulRoutes.length === 0) {
      alert("Tidak ada rute yang berhasil dihitung untuk dianalisis. Hitung rute terlebih dahulu.");
      return;
    }
    setIsAiAnalysisLoading(true);
    setAiAnalysisResult(null);
    try {
      const currentCountry = COUNTRIES_DATA.find(c => c.code === selectedCountryCode)?.name || "Global";
      
      let prompt = `Analyze the following route data for the ${currentCountry} region based on the user's instruction.\n`;
      prompt += `User Instruction: "${aiAnalysisInstruction.trim()}"\n\n`;
      prompt += `Route Data:\n`;
      successfulRoutes.forEach((route, idx) => {
          prompt += `Route ${idx + 1}:\n`;
          prompt += `  From: ${route.result?.originalInputA || route.locationAInput} (Resolved: ${route.result?.fromLocation || 'N/A'})\n`;
          prompt += `  To: ${route.result?.originalInputB || route.locationBInput} (Resolved: ${route.result?.toLocation || 'N/A'})\n`;
          prompt += `  Travel Mode: ${route.travelMode}\n`;
          prompt += `  Straight-Line Distance: ${route.result?.straightLineDistanceKm || 'N/A'}\n`;
          prompt += `  Estimated Travel Duration: ${route.result?.estimatedTravelDurationHours || 'N/A'}\n`;
          if (route.result?.message) prompt += `  Note: ${route.result.message}\n`;
          prompt += '\n';
      });
      prompt += "Provide a concise analysis in well-structured Markdown, considering the travel modes and typical conditions for such travel."

      const response = await analyzeTextWithGemini(prompt, undefined, 'text');
      if (response.type === 'text' && typeof response.content === 'string') {
        setAiAnalysisResult(response.content);
      } else {
        setAiAnalysisResult(`Gagal menghasilkan analisis AI. ${response.type === 'error' ? response.content : 'Respon tidak valid.'}`);
      }
    } catch (error: any) {
      setAiAnalysisResult(`Error menganalisis rute: ${error.message}`);
    }
    setIsAiAnalysisLoading(false);
  };

  const handleExportManualRoutes = () => {
    const successfulManualRoutes = routeCalculations.filter(rc => rc.result?.status === 'success');
    if (successfulManualRoutes.length === 0) {
      alert("Tidak ada rute manual yang berhasil dihitung untuk diekspor.");
      return;
    }
    exportRouteResultsToXLSX(successfulManualRoutes, 'ManualRouteResults', 'manual');
  };

  const handleExportBulkRoutes = () => {
    if (bulkRouteResults.length === 0) {
      alert("Tidak ada hasil rute massal untuk diekspor.");
      return;
    }
    exportRouteResultsToXLSX(bulkRouteResults, 'BulkRouteResults', 'bulk');
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        handleCalculateAllRoutes();
      }, autoRefreshInterval * 60000); // Convert minutes to milliseconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, handleCalculateAllRoutes]);

  const cardHoverClass = reduceMotion ? '' : `hover:shadow-neon-glow-${theme.accent1}/50 transition-shadow duration-300`;
  const animationClass = reduceMotion ? '' : 'animate-fade-in';
  const contentAnimationClasses = `${reduceMotion ? '' : 'transition-all duration-500 ease-in-out'} overflow-hidden`;

  const travelModeIcon = (mode: TravelMode) => {
    if (mode === 'DRIVING') return <Car size={12} className="inline mr-1"/>;
    if (mode === 'WALKING') return <PersonStanding size={12} className="inline mr-1"/>;
    if (mode === 'CYCLING') return <Bike size={12} className="inline mr-1"/>;
    return null;
  };

  const getSelectBaseStyles = () => ({
    baseClassName: `p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-${theme.accent1} border border-gray-600`,
    style: { backgroundColor: RAW_COLOR_VALUES[theme.darkBg] || '#0A0F1E', color: '#E5E7EB' },
    optionStyle: { backgroundColor: RAW_COLOR_VALUES[theme.darkBg] || '#0A0F1E', color: '#E5E7EB' }
  });

  const selectStyles = getSelectBaseStyles();

  // Statistics calculation
  const totalRoutes = routeCalculations.length;
  const successfulRoutes = routeCalculations.filter(rc => rc.result?.status === 'success').length;
  const totalBulkRoutes = bulkRouteResults.length;
  const successfulBulkRoutes = bulkRouteResults.filter(br => br.status === 'success').length;

  return (
    <div className={`p-4 md:p-8 text-gray-100 overflow-auto h-full relative`}>
      <FuturisticBackground theme={theme} reduceMotion={reduceMotion} />
      <div className={`relative z-10 ${animationClass}`}>
        <h1 className={`text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-${theme.accent1} to-${theme.accent2}`}>
            🗺️ Perencana & Analis Rute Canggih
        </h1>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="panel-holographic p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{totalRoutes}</div>
            <div className="text-xs text-gray-400">Total Rute Manual</div>
          </div>
          <div className="panel-holographic p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{successfulRoutes}</div>
            <div className="text-xs text-gray-400">Rute Berhasil</div>
          </div>
          <div className="panel-holographic p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">{totalBulkRoutes}</div>
            <div className="text-xs text-gray-400">Rute Massal</div>
          </div>
          <div className="panel-holographic p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-cyan-400">{successfulBulkRoutes}</div>
            <div className="text-xs text-gray-400">Massal Berhasil</div>
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div className={`panel-holographic p-4 rounded-xl shadow-xl border border-gray-700 mb-6`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsAdvancedSettingsMinimized(!isAdvancedSettingsMinimized)}>
            <h2 className={`text-lg font-semibold text-${theme.accent3}`}>⚙️ Pengaturan Lanjutan</h2>
            <button className="p-1 text-gray-400 hover:text-white" aria-label={isAdvancedSettingsMinimized ? "Expand Advanced Settings" : "Collapse Advanced Settings"}>
              {isAdvancedSettingsMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
          <div className={`${contentAnimationClasses} ${isAdvancedSettingsMinimized ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="customSpeed" className="block text-sm font-medium mb-1">Kecepatan Rata-rata (km/jam):</label>
                <input
                  type="number"
                  id="customSpeed"
                  value={customSpeedKmh}
                  onChange={(e) => setCustomSpeedKmh(Math.max(1, parseInt(e.target.value) || AVERAGE_TRAVEL_SPEED_KMH))}
                  className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="300"
                />
              </div>
              <div>
                <label htmlFor="trafficFactor" className="block text-sm font-medium mb-1">Faktor Lalu Lintas:</label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="trafficFactor"
                    checked={includeTrafficFactor}
                    onChange={(e) => setIncludeTrafficFactor(e.target.checked)}
                    className="h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400"
                  />
                  <span className="text-sm">Tambah 20% untuk lalu lintas</span>
                </label>
              </div>
              <div>
                <label htmlFor="smartGeocoding" className="block text-sm font-medium mb-1">Smart Geocoding:</label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="smartGeocoding"
                    checked={enableSmartGeocoding}
                    onChange={(e) => setEnableSmartGeocoding(e.target.checked)}
                    className="h-4 w-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-400"
                  />
                  <span className="text-sm flex items-center">
                    <Zap size={14} className="mr-1 text-green-400" />
                    Aktifkan AI Enhanced
                  </span>
                </label>
              </div>
              <div>
                <label htmlFor="autoRefresh" className="block text-sm font-medium mb-1">Auto-refresh (menit, 0=off):</label>
                <input
                  type="number"
                  id="autoRefresh"
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="60"
                />
              </div>
            </div>
            {enableSmartGeocoding && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center">
                  <Zap size={16} className="mr-2" />
                  Smart Geocoding Aktif
                </h4>
                <ul className="text-xs text-green-200 space-y-1">
                  <li>• 🎯 Auto-detect koordinat dan konversi ke alamat</li>
                  <li>• 🔍 Pencarian lokasi terdekat untuk koordinat tidak valid</li>
                  <li>• 🏙️ Resolusi alamat lengkap dengan nama kota dan negara</li>
                  <li>• 🛡️ Error recovery dan fallback otomatis</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Manual Route Input Section */}
        <div className={`panel-holographic p-4 rounded-xl shadow-xl border border-gray-700 mb-6`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsManualInputMinimized(!isManualInputMinimized)}>
            <h2 className={`text-lg font-semibold text-${theme.accent1}`}>📍 Konfigurasi & Input Rute Manual</h2>
            <button className="p-1 text-gray-400 hover:text-white" aria-label={isManualInputMinimized ? "Expand Manual Input" : "Collapse Manual Input"}>
              {isManualInputMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
          <div className={`${contentAnimationClasses} ${isManualInputMinimized ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
            <div className="mb-4">
                <label htmlFor="countryContext" className="block text-sm font-medium mb-1 flex items-center">
                  <Globe size={16} className="mr-2" />
                  Konteks Negara (untuk Analisis AI):
                </label>
                <select id="countryContext" value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className={`${selectStyles.baseClassName} w-full md:w-1/2`} style={selectStyles.style}>
                    <option value="" style={selectStyles.optionStyle}>-- Pilih Negara (opsional) --</option>
                    {COUNTRIES_DATA.map(country => (<option key={country.code} value={country.code} style={selectStyles.optionStyle}>{country.name}</option>))}
                </select>
            </div>

            <div className="space-y-4 mb-6">
              {routeCalculations.map((rc, index) => (
                <div key={rc.id} className={`panel-holographic p-4 rounded-xl shadow-inner border border-gray-700 border-opacity-50 ${cardHoverClass} flex flex-col`}>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className={`text-lg font-semibold`} style={{color: rc.color}}>🛣️ Rute {index + 1}</h2>
                    <button 
                      onClick={() => handleRemoveRoute(rc.id)} 
                      title="Hapus Rute Ini" 
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors" 
                      disabled={routeCalculations.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label htmlFor={`route${rc.id}LocationA`} className="block text-xs font-medium mb-0.5 flex items-center">
                        <MapPin size={14} className={`inline mr-1.5`} />
                        Lokasi A (Asal):
                      </label>
                      <input
                        type="text"
                        id={`route${rc.id}LocationA`}
                        value={rc.locationAInput}
                        onChange={(e) => handleInputChange(rc.id, 'A', e.target.value)}
                        placeholder="Alamat atau Lat,Lng"
                        className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`route${rc.id}LocationB`} className="block text-xs font-medium mb-0.5 flex items-center">
                        <Target size={14} className={`inline mr-1.5`} />
                        Lokasi B (Tujuan):
                      </label>
                      <input
                        type="text"
                        id={`route${rc.id}LocationB`}
                        value={rc.locationBInput}
                        onChange={(e) => handleInputChange(rc.id, 'B', e.target.value)}
                        placeholder="Alamat atau Lat,Lng"
                        className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`route${rc.id}TravelMode`} className="block text-xs font-medium mb-0.5 flex items-center">
                        <Route size={14} className="inline mr-1.5"/>
                        Mode Perjalanan:
                      </label>
                      <select 
                        id={`route${rc.id}TravelMode`} 
                        value={rc.travelMode} 
                        onChange={(e) => handleInputChange(rc.id, 'TravelMode', e.target.value)} 
                        className={`${selectStyles.baseClassName} w-full text-xs`} 
                        style={selectStyles.style}
                      >
                        {TRAVEL_MODES.map(mode => (<option key={mode.value} value={mode.value} style={selectStyles.optionStyle}>{mode.label}</option>))}
                      </select>
                    </div>
                  </div>
                  
                  {rc.result && (
                    <div className={`panel-holographic p-3 rounded-lg shadow-inner border border-gray-700 border-opacity-50`} style={{backgroundColor: `${RAW_COLOR_VALUES[rc.color.replace('text-', '')] || rc.color}1A`}}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r`} style={{background: `linear-gradient(to right, ${rc.color}, ${RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6'})`}} title={rc.result.originalInputA || rc.locationAInput}>
                                  {(rc.result.originalInputA || rc.locationAInput).substring(0,20) || 'Asal'}...
                                </span>
                                <Navigation size={14} className="text-white opacity-70" />
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r`} style={{background: `linear-gradient(to right, ${RAW_COLOR_VALUES[theme.accent2] || '#8B5CF6'}, ${rc.color})`}} title={rc.result.originalInputB || rc.locationBInput}>
                                  {(rc.result.originalInputB || rc.locationBInput).substring(0,20) || 'Tujuan'}...
                                </span>
                            </div>
                            {rc.result.estimatedTravelDurationHours && (
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-orange-300 bg-orange-600/50 border border-orange-500/50`}>
                                    <Clock size={10} /> {rc.result.estimatedTravelDurationHours} ({travelModeIcon(rc.travelMode)}{rc.travelMode.toLowerCase()})
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div><strong className="opacity-70">Dari (Koordinat):</strong> <span className="font-mono">{rc.result.fromLocation || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Ke (Koordinat):</strong> <span className="font-mono">{rc.result.toLocation || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Jarak Lurus:</strong> <span className="font-bold" style={{color: RAW_COLOR_VALUES[theme.accent3] || '#00FF88'}}>{rc.result.straightLineDistanceKm || 'N/A'}</span></div>
                            <div><strong className="opacity-70">Durasi Lurus:</strong> <span className="font-bold">{rc.result.straightLineDurationHours || 'N/A'}</span></div>
                        </div>
                        <hr className="my-2 border-white/10" />
                        <div className="flex justify-between items-center">
                             <p className={`text-xs ${rc.result.error ? 'text-red-400' : `text-green-400`}`}>
                                {rc.result.error ? `❌ Error: ${rc.result.error}` : (rc.result.status === 'success' ? "✅ Sukses Dihitung" : "⏳ Status Tidak Diketahui")}
                            </p>
                            <div className="text-right text-[10px] opacity-60">
                                <p>📅 {rc.result.calculatedAt ? new Date(rc.result.calculatedAt).toLocaleTimeString() : '-'}</p>
                                {rc.result.calculationType && <p>🔧 {rc.result.calculationType.replace(/_/g, ' ')}</p>}
                            </div>
                        </div>
                        {rc.result.message && <p className="text-[10px] opacity-70 mt-1 italic">💡 {rc.result.message}</p>}
                    </div>
                  )}
                  {rc.result?.status === 'success' && (
                    <div className="mt-3">
                      {rc.isAiRouteAnalysisLoading ? 
                        <div className="flex items-center text-xs opacity-70">
                          <div className="w-4 h-4 border-2 border-t-transparent border-purple-400 rounded-full animate-spin mr-2"></div>
                          <span>🤖 Memuat analisis AI...</span>
                        </div> :
                        rc.aiRouteAnalysis ? 
                        (<div className={`p-2 border rounded-md bg-gray-800/30 border-gray-600 max-h-40 overflow-y-auto text-xs`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{rc.aiRouteAnalysis}</ReactMarkdown>
                        </div>) : 
                        <p className="text-xs italic opacity-60">🤖 Analisis AI belum tersedia untuk rute ini.</p>
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {routeCalculations.length < MAX_ROUTES && (
                  <button
                    onClick={handleAddRoute}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={16}/>
                    Tambah Rute Lain
                  </button>
              )}
              <button 
                onClick={handleExportManualRoutes} 
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                disabled={!routeCalculations.some(rc => rc.result?.status === 'success')}
              >
                <Download size={16}/>
                📊 Unduh Rute Manual (XLSX)
              </button>
            </div>
            <button 
              onClick={handleCalculateAllRoutes} 
              className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Menghitung...
                </>
              ) : (
                <>
                  <Calculator size={18} />
                  🚀 Hitung Semua Rute Manual & Analisis AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Bulk Route Processing Section */}
        <div className={`panel-holographic p-4 rounded-xl shadow-xl border border-gray-700 mb-6`}>
          <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsBulkProcessingMinimized(!isBulkProcessingMinimized)}>
            <h2 className={`text-lg font-semibold text-${theme.accent4} flex items-center`}>
              <Zap size={20} className="mr-2" />
              📦 Pemrosesan Rute Massal Canggih
            </h2>
             <button className="p-1 text-gray-400 hover:text-white" aria-label={isBulkProcessingMinimized ? "Expand Bulk Processing" : "Collapse Bulk Processing"}>
              {isBulkProcessingMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
           <div className={`${contentAnimationClasses} ${isBulkProcessingMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center">
                <Zap size={16} className="mr-2" />
                🔥 Fitur Canggih Pemrosesan Massal:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="text-xs text-blue-200 space-y-1">
                  <li className="flex items-center">
                    <Search size={12} className="mr-2 text-green-400" />
                    <strong>Auto-detect koordinat:</strong> Jika input adalah koordinat, otomatis mencari alamat dan nama kota
                  </li>
                  <li className="flex items-center">
                    <Target size={12} className="mr-2 text-yellow-400" />
                    <strong>Smart coordinate validation:</strong> Koordinat tidak valid akan dicari titik terdekat yang valid
                  </li>
                  <li className="flex items-center">
                    <MapPin size={12} className="mr-2 text-cyan-400" />
                    <strong>Reverse geocoding:</strong> Koordinat diubah menjadi alamat lengkap dengan nama kota
                  </li>
                </ul>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li className="flex items-center">
                    <Route size={12} className="mr-2 text-purple-400" />
                    <strong>Mixed input support:</strong> Bisa campuran alamat dan koordinat dalam satu file
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={12} className="mr-2 text-green-400" />
                    <strong>Error recovery:</strong> Sistem otomatis mencoba alternatif jika geocoding gagal
                  </li>
                  <li className="flex items-center">
                    <Info size={12} className="mr-2 text-orange-400" />
                    <strong>Progress tracking:</strong> Monitor real-time pemrosesan setiap rute
                  </li>
                </ul>
              </div>
            </div>

            {/* Progress indicator */}
            {bulkProcessingProgress && (
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-300">
                    Memproses Rute: {bulkProcessingProgress.current} / {bulkProcessingProgress.total}
                  </span>
                  <span className="text-xs text-purple-400">
                    {Math.round((bulkProcessingProgress.current / bulkProcessingProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProcessingProgress.current / bulkProcessingProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end items-center mb-2">
              <button 
                onClick={handleExportBulkRoutes} 
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                disabled={bulkRouteResults.length === 0}
              >
                <Download size={16}/>
                📊 Unduh Hasil Massal (XLSX)
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div {...getBulkRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center border-gray-600 hover:border-blue-400 ${isBulkDragActive ? `border-blue-400 bg-blue-400/10` : ''} transition-all`}>
                    <input {...getBulkInputProps()} disabled={isBulkLoading} />
                    <UploadCloud size={32} className={`mx-auto mb-2 ${isBulkDragActive ? `text-blue-400` : `text-gray-400`}`} />
                    <p className="text-sm">{isBulkDragActive ? "📁 Letakkan file di sini..." : "📁 Seret & lepas file Excel, atau klik"}</p>
                    <p className="text-xs opacity-60">(.xlsx, .xls) - Mendukung alamat dan koordinat</p>
                    {enableSmartGeocoding && (
                      <div className="mt-2 px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded-full inline-flex items-center">
                        <Zap size={10} className="mr-1" />
                        Smart Processing Aktif
                      </div>
                    )}
                </div>
                <button 
                  onClick={handleDownloadTemplate} 
                  className="w-full md:w-auto self-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16}/>
                  📋 Unduh Template Excel Canggih
                </button>
            </div>
            {uploadedFile && <p className="text-xs mt-2">📁 File Terunggah: <span className={`font-semibold text-purple-400`}>{uploadedFile.name}</span></p>}
            {isBulkLoading && (
              <div className="mt-3 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-t-transparent border-purple-400 rounded-full animate-spin mr-3"></div>
                <span className="text-purple-300">🔄 Memproses rute massal dengan teknologi canggih...</span>
              </div>
            )}
            {bulkFileProcessingError && (
              <div className={`my-2 p-2 rounded-md bg-red-900/20 border border-red-700 text-red-300 text-xs flex items-center gap-1`}>
                <AlertTriangle size={14}/>
                ❌ {bulkFileProcessingError}
              </div>
            )}
            {bulkRouteResults.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto border border-gray-700 rounded-md">
                    <table className="min-w-full text-xs">
                        <thead className={`bg-gray-800 sticky top-0 z-10`}>
                          <tr className="text-left">
                            <th className="p-1.5">📍 Dari (Input)</th>
                            <th className="p-1.5">🎯 Ke (Input)</th>
                            <th className="p-1.5">🚗 Mode</th>
                            <th className="p-1.5">📏 Jarak</th>
                            <th className="p-1.5">⏱️ Estimasi Waktu</th>
                            <th className="p-1.5">📊 Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRouteResults.map(res => (
                            <tr key={res.id} className={`border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30`}>
                                <td className="p-1.5 truncate max-w-[120px]" title={res.originalInputA}>{res.originalInputA}</td>
                                <td className="p-1.5 truncate max-w-[120px]" title={res.originalInputB}>{res.originalInputB}</td>
                                <td className="p-1.5">{travelModeIcon(res.travelMode || 'DRIVING')}{res.travelMode || 'N/A'}</td>
                                <td className="p-1.5">{res.straightLineDistanceKm || '-'}</td>
                                <td className="p-1.5">{res.estimatedTravelDurationHours || '-'}</td>
                                <td className="p-1.5">
                                    {res.status === 'pending' && <Clock size={12} className="text-yellow-400 inline mr-1"/>}
                                    {res.status === 'success' && <CheckCircle size={12} className="text-green-400 inline mr-1"/>}
                                    {res.status?.startsWith('error') && <AlertTriangle size={12} className="text-red-400 inline mr-1"/>}
                                    <span className="text-[10px] opacity-80">{res.error ? res.error.substring(0,30)+'...' : res.status || 'Selesai'}</span>
                                </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
        
        {/* Global AI Analysis Section */}
        <div className={`panel-holographic p-4 rounded-xl shadow-xl border border-gray-700 mt-8`}>
            <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setIsGlobalAiAnalysisMinimized(!isGlobalAiAnalysisMinimized)}>
              <div className="flex items-center">
                <Brain size={20} className={`mr-2 text-${theme.accent3}`} />
                <h2 className={`text-lg font-semibold text-${theme.accent3}`}>🧠 Analisis Global AI (Semua Rute Manual)</h2>
              </div>
              <button className="p-1 text-gray-400 hover:text-white" aria-label={isGlobalAiAnalysisMinimized ? "Expand Global AI Analysis" : "Collapse Global AI Analysis"}>
                {isGlobalAiAnalysisMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>
            <div className={`${contentAnimationClasses} ${isGlobalAiAnalysisMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <textarea 
                value={aiAnalysisInstruction} 
                onChange={(e) => setAiAnalysisInstruction(e.target.value)} 
                placeholder="🤖 Masukkan perintah/pertanyaan Anda untuk AI tentang semua rute yang dihitung (misalnya, 'Bandingkan semua rute', 'Rute mana yang paling efisien?', 'Buat ringkasan potensi tantangan untuk semua rute')." 
                rows={3} 
                className={`w-full p-2 border rounded-md text-xs bg-gray-800/50 border-gray-600 focus:ring-1 focus:ring-${theme.accent1} focus:border-${theme.accent1} text-gray-200`}
              />
              <button 
                onClick={handleGenerateGlobalAiAnalysis} 
                disabled={isAiAnalysisLoading || !aiAnalysisInstruction.trim() || routeCalculations.every(rc => rc.result?.status !== 'success')} 
                className="mt-2 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAiAnalysisLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    🤖 AI Menganalisis...
                  </>
                ) : (
                  <>
                    <Play size={14}/>
                    🚀 Generate Analisis Global
                  </>
                )}
              </button>
              {isAiAnalysisLoading && (
                <div className="mt-3 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-t-transparent border-green-400 rounded-full animate-spin mr-3"></div>
                  <span className="text-green-300">🧠 AI sedang menganalisis rute dengan teknologi canggih...</span>
                </div>
              )}
              {aiAnalysisResult && !isAiAnalysisLoading && (
                <div className={`mt-3 p-3 border rounded-md bg-gray-800/30 border-gray-600 max-h-60 overflow-y-auto text-xs`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysisResult}</ReactMarkdown>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};