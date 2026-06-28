// @ts-nocheck
export interface NavigationData {
  direction?: string;
  distance?: string;
  street?: string;
  speed?: string;
}

export type MQTTDataCallback = (data: NavigationData) => void;
export type MQTTStateCallback = (connected: boolean) => void;

class MQTTClient {
  private eventSource: EventSource | null = null;
  private TOPIC_URL = '';

  private dataCallbacks: Set<MQTTDataCallback> = new Set();
  private stateCallbacks: Set<MQTTStateCallback> = new Set();

  public connect() {
    if (this.eventSource) return;

    // Extract secure topic from URL hash (e.g., #topic=a4b9c8...)
    let topic = 'smart-glasses-hud-dietrich-v2'; // fallback legacy topic
    const hashMatches = window.location.hash.match(/topic=([^&]+)/);
    if (hashMatches && hashMatches[1]) {
      topic = hashMatches[1];
    }
    
    this.TOPIC_URL = `https://ntfy.sh/${topic}/sse?since=10m`;

    console.log(`Connecting to Ntfy Server: ${this.TOPIC_URL}...`);
    this.eventSource = new EventSource(this.TOPIC_URL);

    this.eventSource.onopen = () => {
      console.log('Ntfy Connected successfully!');
      this.notifyState(true);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'message') {
          console.log(`[Ntfy] Received:`, data.message);
          const navData: NavigationData = JSON.parse(data.message);
          this.notifyData(navData);
        }
      } catch (e) {
        console.error('Failed to parse Ntfy message:', e);
      }
    };

    this.eventSource.onerror = (err) => {
      console.error('Ntfy Error:', err);
      // EventSource automatically reconnects on error
    };
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.notifyState(false);
    }
  }

  public onData(callback: MQTTDataCallback) {
    this.dataCallbacks.add(callback);
  }

  public onStateChange(callback: MQTTStateCallback) {
    this.stateCallbacks.add(callback);
  }

  private notifyData(data: NavigationData) {
    this.dataCallbacks.forEach(cb => cb(data));
  }

  private notifyState(connected: boolean) {
    this.stateCallbacks.forEach(cb => cb(connected));
  }
}

export const mqttClient = new MQTTClient();
