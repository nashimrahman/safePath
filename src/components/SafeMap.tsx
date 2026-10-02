// =============================================
// SafePath – SafeMap Component (Leaflet)
// =============================================
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng, Place, Hazard, CautionZone, Route } from '../types';

// Fix leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createIcon(emoji: string, color: string, size = 32): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.3);
    "><span style="transform:rotate(45deg);font-size:${size * 0.45}px;">${emoji}</span></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS = {
  user: createIcon('📍', '#6366f1', 36),
  destination: createIcon('🏠', '#10b981', 36),
  origin: createIcon('🎓', '#6366f1', 36),
  open: createIcon('🟢', '#065f46', 28),
  closed: createIcon('⭕', '#374151', 24),
  police: createIcon('🚔', '#1e40af', 30),
  hospital: createIcon('🏥', '#065f46', 30),
  campus: createIcon('🔵', '#1e40af', 28),
  hazard: createIcon('⚠️', '#92400e', 30),
  emergency: createIcon('🚨', '#be123c', 38),
};

interface SafeMapProps {
  center?: LatLng;
  zoom?: number;
  className?: string;
  userPosition?: LatLng;
  /** When true, the map will call navigator.geolocation and auto-pan to the
   *  user's real GPS position. Falls back to world view if denied. */
  autoCenter?: boolean;
  origin?: LatLng & { label?: string };
  destination?: LatLng & { label?: string };
  routes?: Route[];
  selectedRouteId?: string;
  places?: Place[];
  hazards?: Hazard[];
  cautionZones?: CautionZone[];
  emergencyPosition?: LatLng;
  showHelpPoints?: boolean;
  onMapClick?: (latlng: LatLng) => void;
  onMarkerClick?: (type: string, id: string) => void;
  /** Called with detected GPS position */
  onGpsPosition?: (pos: LatLng) => void;
}

export function SafeMap({
  center,
  zoom = 15,
  className = 'w-full h-full',
  userPosition,
  autoCenter = false,
  origin,
  destination,
  routes = [],
  selectedRouteId,
  places = [],
  hazards = [],
  cautionZones = [],
  emergencyPosition,
  showHelpPoints = true,
  onMapClick,
  onGpsPosition,
}: SafeMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());

  // Initialize map — start at world view if no center supplied
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = center
      ? [center.lat, center.lng]
      : [20, 0]; // world overview
    const initialZoom = center ? zoom : 2;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersRef.current.addTo(map);
    mapRef.current = map;

    if (onMapClick) {
      map.on('click', (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }));
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GPS auto-center: detect user position and fly to it
  useEffect(() => {
    if (!autoCenter) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (mapRef.current) {
          mapRef.current.flyTo([pos.lat, pos.lng], 16, { duration: 1.2 });
        }
        onGpsPosition?.(pos);
      },
      () => {
        // Permission denied or unavailable — stay at world view, let page handle it
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCenter]);

  // Update markers & overlays when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.clearLayers();

    // Caution zones
    cautionZones.forEach((zone) => {
      L.circle([zone.latitude, zone.longitude], {
        radius: zone.radiusMeters,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6,4',
      })
        .bindTooltip(`⚠️ ${zone.name}`, { permanent: false })
        .addTo(layersRef.current);
    });

    // Routes
    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const isRecommended = route.isRecommended;
      const coords = route.coordinates.map((c): [number, number] => [c.lat, c.lng]);

      const color = isSelected
        ? '#6366f1'
        : isRecommended
        ? '#10b981'
        : '#6b7280';
      const weight = isSelected ? 6 : isRecommended ? 5 : 3;
      const opacity = isSelected || isRecommended ? 0.9 : 0.5;

      L.polyline(coords, { color, weight, opacity })
        .bindTooltip(route.name, { sticky: true })
        .addTo(layersRef.current);
    });

    // Hazards
    hazards
      .filter((h) => h.status !== 'resolved')
      .forEach((hazard) => {
        L.marker([hazard.latitude, hazard.longitude], { icon: ICONS.hazard })
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:160px">
              <div style="font-weight:700;color:#fb923c;margin-bottom:4px">⚠️ Reported Condition</div>
              <div style="font-size:13px;color:#e5e7eb;margin-bottom:4px">${hazard.description}</div>
              <div style="font-size:11px;color:#9ca3af">${hazard.category.replace(/_/g, ' ')}</div>
            </div>
          `)
          .addTo(layersRef.current);
      });

    // Places
    const helpCategories = ['police', 'hospital', 'clinic', 'campus_security', 'help_center'];
    places.forEach((place) => {
      const isHelp = helpCategories.includes(place.category);
      if (!showHelpPoints && isHelp) return;

      let icon = ICONS.open;
      if (isHelp) {
        if (place.category === 'police') icon = ICONS.police;
        else if (place.category === 'hospital') icon = ICONS.hospital;
        else icon = ICONS.campus;
      } else if (place.openingStatus === 'closed') {
        icon = ICONS.closed;
      }

      L.marker([place.latitude, place.longitude], { icon })
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:160px">
            <div style="font-weight:700;color:#e5e7eb;margin-bottom:4px">${place.name}</div>
            <div style="font-size:12px;color:${
              place.openingStatus === 'open' ? '#34d399' :
              place.openingStatus === 'closed' ? '#9ca3af' : '#fbbf24'
            };margin-bottom:2px;text-transform:uppercase;font-weight:600">
              ${place.openingStatus}
            </div>
            ${place.openingHours ? `<div style="font-size:11px;color:#6b7280">${place.openingHours}</div>` : ''}
          </div>
        `)
        .addTo(layersRef.current);
    });

    // Origin
    if (origin) {
      L.marker([origin.lat, origin.lng], { icon: ICONS.origin })
        .bindPopup(`<b>${origin.label || 'Start'}</b>`)
        .addTo(layersRef.current);
    }

    // Destination
    if (destination) {
      L.marker([destination.lat, destination.lng], { icon: ICONS.destination })
        .bindPopup(`<b>${destination.label || 'Destination'}</b>`)
        .addTo(layersRef.current);
    }

    // User position
    if (userPosition) {
      L.marker([userPosition.lat, userPosition.lng], { icon: ICONS.user })
        .bindPopup('<b>Your location</b>')
        .addTo(layersRef.current);

      // Accuracy circle
      L.circle([userPosition.lat, userPosition.lng], {
        radius: 30,
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(layersRef.current);
    }

    // Emergency marker
    if (emergencyPosition) {
      L.marker([emergencyPosition.lat, emergencyPosition.lng], { icon: ICONS.emergency })
        .bindPopup('<b style="color:#f43f5e">🚨 Emergency Location</b>')
        .addTo(layersRef.current);

      L.circle([emergencyPosition.lat, emergencyPosition.lng], {
        radius: 100,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '4,4',
      }).addTo(layersRef.current);
    }
  }, [userPosition, origin, destination, routes, selectedRouteId, places, hazards, cautionZones, emergencyPosition, showHelpPoints]);

  // Camera control: fit bounds once when origin/destination are given, then track center
  const prevRouteKeyRef = useRef<string>('');
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const routeKey = `${origin?.lat},${origin?.lng}->${destination?.lat},${destination?.lng}`;
    if (origin && destination && prevRouteKeyRef.current !== routeKey) {
      prevRouteKeyRef.current = routeKey;
      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
      routes.forEach((route) => {
        route.coordinates.forEach((c) => bounds.extend([c.lat, c.lng]));
      });
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (err) {
        console.warn('fitBounds error:', err);
      }
      return;
    }

    if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, center?.lat, center?.lng, zoom, routes]);

  return <div ref={containerRef} className={className} />;
}
