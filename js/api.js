/* ══════════════════════════════════════════════════════════
   api.js  —  CalcuMental
   Wrapper de comunicación con Google Apps Script Web App.

   CONFIGURACIÓN:
   Reemplaza la URL de abajo con la URL de tu Web App
   desplegada en Google Apps Script.
═══════════════════════════════════════════════════════════ */

const API_URL = 'https://script.google.com/macros/s/AKfycbxVDYO1dLS6_EcSwbSJfeaFqrL9fuErBDD-k5hD6tTs6k8GTlQUtl0WIUqvXGnrk-LS/exec';

const API = {

  /* ── GET ────────────────────────────────────────────────
     Envía parámetros como query string.
     Retorna el objeto JSON parseado, o lanza error.
  ────────────────────────────────────────────────────────*/
  async get(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
  },

  /* ── POST ───────────────────────────────────────────────
     Envía body como JSON en texto plano (requerido por
     Apps Script para evitar errores de CORS preflight).
     Retorna el objeto JSON parseado, o lanza error.
  ────────────────────────────────────────────────────────*/
  async post(body) {
    const res = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
  }

};
