(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=new class{abortController=null;TOPIC_URL=``;dataCallbacks=new Set;stateCallbacks=new Set;async connect(){if(this.abortController)return;let e=`smart-glasses-hud-dietrich-v3`,t=window.location.hash.match(/topic=([^&]+)/);t&&t[1]&&(e=t[1]),this.TOPIC_URL=`https://ntfy.sh/${e}/json`,console.log(`Connecting to Ntfy HTTPS Stream: ${this.TOPIC_URL}...`),this.abortController=new AbortController;try{let e=await fetch(this.TOPIC_URL,{signal:this.abortController.signal});if(!e.ok)throw Error(`HTTP Error: ${e.status} ${e.statusText}`);console.log(`Ntfy Stream Connected successfully!`),this.notifyState(!0);let t=e.body?.getReader(),n=new TextDecoder,r=``;for(;t;){let{done:e,value:i}=await t.read();if(e)break;r+=n.decode(i,{stream:!0});let a;for(;(a=r.indexOf(`
`))>=0;){let e=r.slice(0,a).trim();if(r=r.slice(a+1),e)try{let t=JSON.parse(e);if(t.event===`message`){console.log(`[Ntfy Stream] Received:`,t.message);let e=JSON.parse(t.message);this.notifyData(e)}}catch(e){console.error(`Failed to parse Ntfy Stream message:`,e)}}}this.notifyState(!1,`Stream ended gracefully`)}catch(e){e.name===`AbortError`?(console.log(`Ntfy Stream closed intentionally.`),this.notifyState(!1,`Stream closed manually`)):(console.error(`Ntfy Stream Error:`,e),this.notifyState(!1,e.message||String(e)))}finally{console.log(`Ntfy Stream Closed. Reconnecting in 3s...`),this.abortController=null,setTimeout(()=>this.connect(),3e3)}}disconnect(){this.abortController&&=(this.abortController.abort(),null)}onData(e){this.dataCallbacks.add(e)}onStateChange(e){this.stateCallbacks.add(e)}notifyData(e){this.dataCallbacks.forEach(t=>t(e))}notifyState(e,t){this.stateCallbacks.forEach(n=>n(e,t))}};document.querySelector(`#app`).innerHTML=`
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
`;var t={"turn-left":`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10c3.3 0 6 2.7 6 6v4"/></svg>`,"turn-right":`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14l5-5-5-5"/><path d="M20 9H10c-3.3 0-6 2.7-6 6v4"/></svg>`,straight:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,"slight-left":`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 10L5 5l5-5"/><path d="M5 5h10c3.3 0 6 2.7 6 6v8"/></svg>`,"slight-right":`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 10l5-5-5-5"/><path d="M19 5H9c-3.3 0-6 2.7-6 6v8"/></svg>`,"u-turn":`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10c3.3 0 6 2.7 6 6v4"/></svg>`},n={speed:document.getElementById(`current-speed`),distance:document.getElementById(`distance-value`),instruction:document.getElementById(`instruction-text`),icon:document.getElementById(`maneuver-icon`),cloudStatus:document.getElementById(`cloud-status`)};e.onStateChange((e,t)=>{e?(n.cloudStatus.textContent=`Cloud Active`,n.cloudStatus.style.color=`#00FF00`):(n.cloudStatus.textContent=t?`Error: ${t.substring(0,50)}`:`Waiting for cloud data...`,n.cloudStatus.style.color=`#FFA500`,n.instruction.textContent=``,n.distance.textContent=``,n.speed.textContent=`--`)});var r=document.querySelector(`.hud-container`);e.onData(e=>{if(e.action===`speed_update`){e.speed!==void 0&&(n.speed.textContent=e.speed);return}if(e.action===`clear`){e.speed!==void 0&&(n.speed.textContent=e.speed),r.style.opacity=`0`;return}r.style.opacity=`1`,e.speed!==void 0&&(n.speed.textContent=e.speed),e.direction&&(n.icon.innerHTML=t[e.direction]||t.straight),e.distance&&(n.distance.textContent=e.distance),e.street&&(n.instruction.textContent=e.street)}),e.connect();