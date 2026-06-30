// @ts-nocheck
export interface NavigationData {
  direction?: string;
  distance?: string;
  street?: string;
  speed?: string;
  action?: string;
}

export type MQTTDataCallback = (data: NavigationData) => void;
export type MQTTStateCallback = (connected: boolean) => void;

class MQTTClient {
  private pollIntervalId: any = null;
  private lastId: string = '';
  private topic: string = '';

  private dataCallbacks: Set<MQTTDataCallback> = new Set();
  private stateCallbacks: Set<MQTTStateCallback> = new Set();

  public connect() {
    if (this.pollIntervalId) return;

    let topic = 'smart-glasses-hud-dietrich-v2';
    const hashMatches = window.location.hash.match(/topic=([^&]+)/);
    if (hashMatches && hashMatches[1]) {
      topic = hashMatches[1];
    }
    this.topic = topic;

    console.log(`Starting Ntfy HTTP Poller for topic: ${this.topic}...`);
    this.notifyState(true);

    this.pollIntervalId = setInterval(async () => {
      try {
        // First poll gets recent 2 minutes, subsequent polls use last message ID
        const sinceParam = this.lastId ? `since=${this.lastId}` : `since=2m`;
        const url = `https://ntfy.sh/${this.topic}/json?poll=1&${sinceParam}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const text = await response.text();
        if (!text.trim()) return; // No new messages

        const lines = text.trim().split('\n');
        
        for (const line of lines) {
          if (!line) continue;
          const data = JSON.parse(line);
          
          if (data.id) {
             this.lastId = data.id;
          }

          if (data.event === 'message') {
            console.log(`[Ntfy HTTP] Received:`, data.message);
            const navData: NavigationData = JSON.parse(data.message);
            this.notifyData(navData);
          }
        }
      } catch (e) {
        console.error('Ntfy Polling Error:', e);
      }
    }, 2000); // Poll every 2 seconds
  }

  public disconnect() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
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
