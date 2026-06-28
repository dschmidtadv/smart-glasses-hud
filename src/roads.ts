import { config } from './config';
import type { TelemetryData } from './telemetry';
import { haversineDistance } from './utils';

export class RoadsEngine {
  private currentSpeedLimitMph: number | null = null;
  private onSpeedLimitChangeCallback: ((limit: number | null) => void) | null = null;
  
  // Caching & Throttling
  private lastQueryLat: number | null = null;
  private lastQueryLng: number | null = null;
  private readonly QUERY_THRESHOLD_METERS = 50;

  onSpeedLimitChange(callback: (limit: number | null) => void) {
    this.onSpeedLimitChangeCallback = callback;
  }

  updateWithTelemetry(data: TelemetryData) {
    if (this.lastQueryLat === null || this.lastQueryLng === null) {
      this.querySpeedLimit(data.latitude, data.longitude);
      return;
    }

    const distanceSinceLastQuery = haversineDistance(
      this.lastQueryLat, this.lastQueryLng,
      data.latitude, data.longitude
    );

    if (distanceSinceLastQuery >= this.QUERY_THRESHOLD_METERS) {
      this.querySpeedLimit(data.latitude, data.longitude);
    }
  }

  private async querySpeedLimit(lat: number, lng: number) {
    if (!config.googleMapsApiKey) return;

    this.lastQueryLat = lat;
    this.lastQueryLng = lng;

    const url = `${config.roadsApiUrl}?path=${lat},${lng}&key=${config.googleMapsApiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.speedLimits && data.speedLimits.length > 0) {
        // Speed limits are typically returned in km/h by the API
        const limitKmh = data.speedLimits[0].speedLimit;
        const limitMph = Math.round(limitKmh * 0.621371);
        
        if (this.currentSpeedLimitMph !== limitMph) {
          this.currentSpeedLimitMph = limitMph;
          this.notifyChange(this.currentSpeedLimitMph);
        }
      }
    } catch (err) {
      console.error('Roads API error:', err);
    }
  }

  private notifyChange(limit: number | null) {
    if (this.onSpeedLimitChangeCallback) {
      this.onSpeedLimitChangeCallback(limit);
    }
  }

}

export const roadsEngine = new RoadsEngine();
