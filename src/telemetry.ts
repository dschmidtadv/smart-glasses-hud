export interface TelemetryData {
  speedMps: number;
  speedKmh: number;
  speedMph: number;
  heading: number | null;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type TelemetryCallback = (data: TelemetryData) => void;
export type TelemetryErrorCallback = (error: string) => void;

class TelemetryEngine {
  private watchId: number | null = null;
  private callbacks: Set<TelemetryCallback> = new Set();
  private errorCallbacks: Set<TelemetryErrorCallback> = new Set();
  private lastSpeed: number = 0;
  private isStationary: boolean = false;
  private stationaryTimeout: ReturnType<typeof setTimeout> | null = null;

  // Smoothing configuration
  private readonly LOW_PASS_ALPHA = 0.2; // Adjust for more/less smoothing

  private mockInterval: ReturnType<typeof setInterval> | null = null;
  private mockIndex: number = 0;
  // Simulated path: Walking around Central Park / Fifth Ave, NYC
  private readonly mockPath = [
    { lat: 40.7644, lng: -73.9730, speed: 5 },
    { lat: 40.7648, lng: -73.9733, speed: 6 },
    { lat: 40.7653, lng: -73.9737, speed: 6 },
    { lat: 40.7658, lng: -73.9740, speed: 5 },
    { lat: 40.7663, lng: -73.9743, speed: 4 },
    { lat: 40.7668, lng: -73.9746, speed: 3 },
    { lat: 40.7673, lng: -73.9750, speed: 5 },
  ];

  startTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mock') === 'true') {
      console.log('Forcing simulation mode.');
      this.startSimulation();
      return;
    }

    if (!navigator.geolocation) {
      this.notifyErrors('Geolocation not supported. Starting simulation...');
      this.startSimulation();
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      this.notifyErrors('HTTPS required. Starting simulation...');
      this.startSimulation();
      return;
    }

    // Initial high-accuracy request
    this.requestWatch(true);
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.stationaryTimeout) {
      clearTimeout(this.stationaryTimeout);
    }
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  subscribe(callback: TelemetryCallback) {
    this.callbacks.add(callback);
  }

  unsubscribe(callback: TelemetryCallback) {
    this.callbacks.delete(callback);
  }

  subscribeError(callback: TelemetryErrorCallback) {
    this.errorCallbacks.add(callback);
  }

  unsubscribeError(callback: TelemetryErrorCallback) {
    this.errorCallbacks.delete(callback);
  }

  private startSimulation() {
    if (this.mockInterval) return;
    this.notifyErrors('Simulation Mode: Active');
    
    this.mockInterval = setInterval(() => {
      const coord = this.mockPath[this.mockIndex];
      const data: TelemetryData = {
        speedMps: coord.speed,
        speedKmh: coord.speed * 3.6,
        speedMph: coord.speed * 2.23694,
        heading: 320,
        latitude: coord.lat,
        longitude: coord.lng,
        accuracy: 5,
        timestamp: Date.now()
      };
      
      this.notifySubscribers(data);
      
      // Loop mock path
      this.mockIndex = (this.mockIndex + 1) % this.mockPath.length;
    }, 2000);
  }

  private requestWatch(highAccuracy: boolean) {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      this.handlePositionUpdate.bind(this),
      this.handleError.bind(this),
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: 1000,
        timeout: 5000,
      }
    );
  }

  private handlePositionUpdate(position: GeolocationPosition) {
    const { coords, timestamp } = position;
    
    // Raw speed in m/s (might be null if stationary or unsupported)
    let rawSpeed = coords.speed || 0;

    // Apply low-pass filter to smooth speed readings
    this.lastSpeed = this.lastSpeed + this.LOW_PASS_ALPHA * (rawSpeed - this.lastSpeed);

    // If speed is very low, snap to 0 to prevent jitter
    if (this.lastSpeed < 0.5) {
        this.lastSpeed = 0;
    }

    const data: TelemetryData = {
      speedMps: this.lastSpeed,
      speedKmh: this.lastSpeed * 3.6,
      speedMph: this.lastSpeed * 2.23694,
      heading: coords.heading,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp,
    };

    this.notifySubscribers(data);
    this.manageBatteryThrottling(rawSpeed);
  }

  private manageBatteryThrottling(rawSpeed: number) {
    if (rawSpeed < 0.5) {
      // User is likely stationary
      if (!this.isStationary) {
        if (!this.stationaryTimeout) {
          // Wait 30 seconds before throttling down
          this.stationaryTimeout = setTimeout(() => {
            this.isStationary = true;
            console.log('User stationary. Reducing GPS accuracy to save battery.');
            this.requestWatch(false); // Throttle down
          }, 30000);
        }
      }
    } else {
      // User is moving
      if (this.stationaryTimeout) {
        clearTimeout(this.stationaryTimeout);
        this.stationaryTimeout = null;
      }
      if (this.isStationary) {
        this.isStationary = false;
        console.log('User moving. Restoring high accuracy GPS.');
        this.requestWatch(true); // Restore accuracy
      }
    }
  }

  private handleError(error: GeolocationPositionError) {
    let msg = 'Unknown Geolocation Error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        msg = 'Location permission denied. Starting simulation...';
        this.startSimulation();
        break;
      case error.POSITION_UNAVAILABLE:
        msg = 'Location unavailable. Starting simulation...';
        this.startSimulation();
        break;
      case error.TIMEOUT:
        msg = 'GPS timeout. Starting simulation...';
        this.startSimulation();
        break;
    }
    console.error('Geolocation error:', msg);
    this.notifyErrors(msg);
  }

  private notifySubscribers(data: TelemetryData) {
    this.callbacks.forEach(callback => callback(data));
  }

  private notifyErrors(error: string) {
    this.errorCallbacks.forEach(callback => callback(error));
  }
}

export const telemetryEngine = new TelemetryEngine();
