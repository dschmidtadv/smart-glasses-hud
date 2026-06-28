import { config } from './config';
import type { TelemetryData } from './telemetry';
import { haversineDistance } from './utils';

export interface Maneuver {
  type: string;
  modifier: string;
  instructions: string;
  distanceMeters: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export class DirectionsEngine {
  private steps: Maneuver[] = [];
  private currentStepIndex: number = 0;
  private onStepChangeCallback: ((step: Maneuver | null, distanceToNext: number) => void) | null = null;
  private readonly STEP_COMPLETION_RADIUS_METERS = 15;

  onStepChange(callback: (step: Maneuver | null, distanceToNext: number) => void) {
    this.onStepChangeCallback = callback;
  }

  loadMockDirections() {
    this.steps = [
      {
        type: 'straight',
        modifier: '',
        instructions: 'Head northwest on Central Park S toward 5th Ave',
        distanceMeters: 150,
        startLocation: { lat: 40.7644, lng: -73.9730 },
        endLocation: { lat: 40.7653, lng: -73.9737 }
      },
      {
        type: 'turn-right',
        modifier: '',
        instructions: 'Turn right onto 5th Ave',
        distanceMeters: 200,
        startLocation: { lat: 40.7653, lng: -73.9737 },
        endLocation: { lat: 40.7668, lng: -73.9746 }
      },
      {
        type: 'turn-left',
        modifier: '',
        instructions: 'Turn left onto Central Park West',
        distanceMeters: 80,
        startLocation: { lat: 40.7668, lng: -73.9746 },
        endLocation: { lat: 40.7673, lng: -73.9750 }
      }
    ];
    this.currentStepIndex = 0;
    this.notifyStepUpdate(150);
  }

  async fetchDirections(origin: string, destination: string) {
    if (!config.googleMapsApiKey) {
        console.error("Missing Google Maps API Key");
        return;
    }
    // Note: Calling Google Maps API directly from client side might face CORS issues.
    // In a real production app, this would be proxied through a backend.
    // For this demonstration, we'll assume it works or use a proxy if needed.
    const url = `${config.directionsApiUrl}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${config.googleMapsApiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        this.parseSteps(data.routes[0].legs[0].steps);
      } else {
        console.error('Directions API error:', data.status);
      }
    } catch (err) {
      console.error('Failed to fetch directions:', err);
    }
  }

  private parseSteps(apiSteps: any[]) {
    this.steps = apiSteps.map(step => ({
      type: step.maneuver || 'straight', // maneuver might not exist on straight steps
      modifier: '', // Sometimes parsed from maneuver type
      instructions: step.html_instructions,
      distanceMeters: step.distance.value,
      startLocation: step.start_location,
      endLocation: step.end_location
    }));
    this.currentStepIndex = 0;
    this.notifyStepUpdate(0);
  }

  updateWithTelemetry(data: TelemetryData) {
    if (this.steps.length === 0 || this.currentStepIndex >= this.steps.length) {
      return;
    }

    const currentStep = this.steps[this.currentStepIndex];
    // Calculate distance from current position to the END of the current maneuver
    const distanceToTarget = haversineDistance(
      data.latitude, data.longitude,
      currentStep.endLocation.lat, currentStep.endLocation.lng
    );

    if (distanceToTarget <= this.STEP_COMPLETION_RADIUS_METERS) {
      // Advance step
      this.currentStepIndex++;
      this.notifyStepUpdate(0); // Temporarily passing 0, next update will correct it
    } else {
      this.notifyStepUpdate(distanceToTarget);
    }
  }

  private notifyStepUpdate(distanceToNext: number) {
    if (this.onStepChangeCallback) {
      const step = this.currentStepIndex < this.steps.length ? this.steps[this.currentStepIndex] : null;
      this.onStepChangeCallback(step, distanceToNext);
    }
  }

}

export const directionsEngine = new DirectionsEngine();
