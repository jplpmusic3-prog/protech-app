import { onRequestPost as __enviar_alerta_js_onRequestPost } from "C:\\Users\\jplpm\\OneDrive\\Escritorio\\formulario\\functions\\enviar-alerta.js"

export const routes = [
    {
      routePath: "/enviar-alerta",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__enviar_alerta_js_onRequestPost],
    },
  ]