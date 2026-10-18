import { onRequestPost as __api_enviar_alerta_js_onRequestPost } from "C:\\Users\\jplpm\\OneDrive\\Escritorio\\formulario\\functions\\api\\enviar-alerta.js"

export const routes = [
    {
      routePath: "/api/enviar-alerta",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_enviar_alerta_js_onRequestPost],
    },
  ]