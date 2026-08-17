import { Injectable, signal } from '@angular/core';
import { GeolocationService } from './geolocation.service';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class MapsService {
  isLoaded = signal(false);
  
  constructor(private geolocation: GeolocationService) {
    this.loadMapsScript();
  }

  private mapsReadyPromise: Promise<void> | null = null;

  // Mumbai Center (approx Dharavi area)
  readonly defaultCenter: google.maps.LatLngLiteral = { lat: 19.0444, lng: 72.8501 };

  private loadMapsScript() {
    // If already loaded, mark and return
    if (this.hasMapConstructor()) {
      this.isLoaded.set(true);
      return;
    }

    // If the script tag already exists in the DOM, just wait for it
    if (document.querySelector('script[data-maps-loader]')) {
      this.waitForGoogle();
      return;
    }

    const key = environment.mapsApiKey;
    if (!key) {
      console.warn('[MapsService] No mapsApiKey set in environment — map will not load.');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=visualization&loading=async`;
    script.defer = true;
    script.setAttribute('data-maps-loader', 'true');
    script.onload = () => {
      this.waitForGoogle();
    };
    document.head.appendChild(script);
  }

  private waitForGoogle() {
    void this.ensureMapsReady()
      .then(() => {
        this.isLoaded.set(true);
      })
      .catch((error: unknown) => {
        console.error('[MapsService] Google Maps failed to initialize:', error);
      });
  }

  private hasMapConstructor(): boolean {
    return typeof google !== 'undefined' && !!google.maps && typeof google.maps.Map === 'function';
  }

  private ensureMapsReady(): Promise<void> {
    if (this.mapsReadyPromise) {
      return this.mapsReadyPromise;
    }

    this.mapsReadyPromise = (async () => {
      if (typeof google !== 'undefined' && google.maps && typeof google.maps.importLibrary === 'function') {
        await google.maps.importLibrary('maps');
        await google.maps.importLibrary('marker');
      }

      if (this.hasMapConstructor()) {
        return;
      }

      for (let attempt = 0; attempt < 100; attempt++) {
        if (this.hasMapConstructor()) {
          return;
        }
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 100);
        });
      }

      throw new Error('google.maps.Map constructor not available after script load');
    })().catch((error: unknown) => {
      this.mapsReadyPromise = null;
      throw error;
    });

    return this.mapsReadyPromise;
  }

  async createMap(element: HTMLElement, options?: google.maps.MapOptions): Promise<google.maps.Map> {
    await this.ensureMapsReady();

    const mapOptions: google.maps.MapOptions = {
      center: this.defaultCenter,
      zoom: 13,
      disableDefaultUI: true,
      styles: this.getMapStyles(), // Custom premium styles
      ...options
    };

    // mapId-managed maps and satellite/hybrid maps must not receive local roadmap styles.
    if (mapOptions.mapId || mapOptions.mapTypeId === 'satellite' || mapOptions.mapTypeId === 'hybrid') {
      delete mapOptions.styles;
    }

    return new google.maps.Map(element, mapOptions);
  }

  private getMapStyles(): google.maps.MapTypeStyle[] {
    // Premium "Silver/Subtle" style for the coordination map
    return [
      {
        "elementType": "geometry",
        "stylers": [{ "color": "#f5f5f5" }]
      },
      {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#f5f5f5" }]
      },
      {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#bdbdbd" }]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#e5e5e5" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }]
      },
      {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#dadada" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
      },
      {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [{ "color": "#e5e5e5" }]
      },
      {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#c9c9c9" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
      }
    ];
  }

  createHeatmap(map: google.maps.Map, data: google.maps.LatLngLiteral[]): google.maps.visualization.HeatmapLayer {
    return new google.maps.visualization.HeatmapLayer({
      data: data.map(point => new google.maps.LatLng(point.lat, point.lng)),
      map: map,
      radius: 30,
      opacity: 0.7
    });
  }

  /**
   * Creates proximity rings (circles) around a location
   */
  createProximityRings(map: google.maps.Map, center: google.maps.LatLngLiteral, radii: number[] = [1000, 3000, 5000]): google.maps.Circle[] {
    return radii.map((radius, index) => {
      return new google.maps.Circle({
        strokeColor: '#0a6b5e',
        strokeOpacity: 0.8 / (index + 1),
        strokeWeight: 2,
        fillColor: '#0a6b5e',
        fillOpacity: 0.1 / (index + 1),
        map: map,
        center: center,
        radius: radius,
        clickable: false
      });
    });
  }
}
