import webpush from 'web-push';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { titulo, mensaje, url } = body;

    // Llaves sincronizadas
    webpush.setVapidDetails(
      'mailto:jpluna@protechsecurityec.com',
      'BAbD5LO8CaG3-PFYux8m0YGJxkeYoQIXOuEP0q0vqBEhiYL_ZkigNTUxhpqFEJd4pK9EXbwsUf2ZZVL0bEg2qRY',
      'Yq5dNN1zGGAkEYY1fit-ZnJdIl-1WTjZZWzXTDdeImc'
    );

    const SUPABASE_URL = "https://mmnwyeuhtsyfhazlireo.supabase.co";
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const headersSupabase = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    };
    if (!SUPABASE_KEY.startsWith('sb_')) {
      headersSupabase['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
      headers: headersSupabase
    });

    const data = await response.json();
    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No hay dispositivos suscritos en Supabase.' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const payload = JSON.stringify({
      title: titulo || 'Alerta ProTech',
      body: mensaje || 'Nuevo evento de seguridad registrado.',
      url: url || 'https://app.protechsecurityec.com'
    });

    const promesas = data.map(async (sub) => {
      const subData = typeof sub.subscription_data === 'string' 
        ? JSON.parse(sub.subscription_data) 
        : sub.subscription_data;

      // CORRECCIÓN CRÍTICA PARA CLOUDFLARE: Forzar TTL y headers de cifrado
      const detallesPeticion = webpush.generateRequestDetails(subData, payload, {
        TTL: 86400,
        headers: {}
      });

      const pushResponse = await fetch(detallesPeticion.endpoint, {
        method: detallesPeticion.method,
        headers: detallesPeticion.headers,
        body: detallesPeticion.body
      });

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        const err = new Error(errorText || `Error HTTP ${pushResponse.status}`);
        err.statusCode = pushResponse.status;
        throw err;
      }

      return pushResponse.status;
    });

    const resultadosCrudos = await Promise.allSettled(promesas);

    const resultados = resultadosCrudos.map((r, index) => ({
      dispositivo: index + 1,
      status: r.status,
      statusCode: r.status === 'fulfilled' ? r.value : (r.reason?.statusCode || 500),
      detalle: r.status === 'fulfilled' ? 'Notificación entregada con éxito' : (r.reason?.message || String(r.reason))
    }));

    return new Response(JSON.stringify({ success: true, total: data.length, resultados }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}