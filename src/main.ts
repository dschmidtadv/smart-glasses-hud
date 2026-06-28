import './style.css';
import { mqttClient } from './mqtt-client';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="hud-container hardware-accelerated">
    <div class="top-bar">
      <div class="speed-container">
        <span class="speed-value" id="current-speed">0</span>
        <span class="speed-unit">MPH</span>
      </div>
      <div class="speed-limit-container">
        <div class="speed-limit-sign">
          <span class="speed-limit-text">SPEED<br>LIMIT</span>
          <span class="speed-limit-value" id="speed-limit">--</span>
        </div>
      </div>
    </div>
    <div class="navigation-container">
      <div class="arrow-container" id="maneuver-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </div>
      <div class="distance-container">
        <span id="distance-value">--</span>
      </div>
      <div class="instruction-container" id="instruction-text">
        Waiting for Cloud Data...
      </div>
    </div>
    <div id="cloud-status" style="position: absolute; bottom: 10px; right: 10px; font-size: 12px; color: #ffeb3b; z-index: 100;">Connecting to Cloud...</div>
  </div>
`;

// Simple arrow map
const maneuverIcons: Record<string, string> = {
  'turn-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10c3.3 0 6 2.7 6 6v4"/></svg>',
  'turn-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14l5-5-5-5"/><path d="M20 9H10c-3.3 0-6 2.7-6 6v4"/></svg>',
  'straight': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  'slight-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 10L5 5l5-5"/><path d="M5 5h10c3.3 0 6 2.7 6 6v8"/></svg>',
  'slight-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 10l5-5-5-5"/><path d="M19 5H9c-3.3 0-6 2.7-6 6v8"/></svg>',
  'u-turn': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10c3.3 0 6 2.7 6 6v4"/></svg>' // reusing left for now
};

const UI = {
  speed: document.getElementById('current-speed')!,
  distance: document.getElementById('distance-value')!,
  instruction: document.getElementById('instruction-text')!,
  icon: document.getElementById('maneuver-icon')!,
  cloudStatus: document.getElementById('cloud-status')!
};

// Bind MQTT Client Events
mqttClient.onStateChange((connected) => {
  UI.cloudStatus.textContent = connected ? 'Cloud Active' : 'Cloud Disconnected';
  UI.cloudStatus.style.color = connected ? '#0f0' : '#f00';
});

const hudContainer = document.querySelector('.hud-container') as HTMLElement;

mqttClient.onData((data) => {
  if (data.action === 'speed_update') {
    if (data.speed !== undefined) UI.speed.textContent = data.speed;
    return;
  }

  if (data.action === 'clear') {
    if (data.speed !== undefined) UI.speed.textContent = data.speed;
    hudContainer.style.opacity = '0';
    return;
  }

  // Restore opacity if it was hidden
  hudContainer.style.opacity = '1';

  if (data.speed !== undefined) {
    UI.speed.textContent = data.speed;
  }
  if (data.direction) {
    UI.icon.innerHTML = maneuverIcons[data.direction] || maneuverIcons['straight'];
  }
  if (data.distance) {
    UI.distance.textContent = data.distance;
  }
  if (data.street) {
    UI.instruction.textContent = data.street;
  }
});

// Auto-connect to MQTT on load
mqttClient.connect();
