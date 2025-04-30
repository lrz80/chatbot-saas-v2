export default function Head() {
    return (
      <>
        <title>Aamy AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Automatiza tu negocio con Aamy AI, tu asistente inteligente 24/7 para WhatsApp, Instagram, Facebook y llamadas." />
        <meta name="theme-color" content="#0f0a1e" />
  
        {/* Íconos PWA */}
        <link rel="icon" href="/favicon-new.ico" />
        <link rel="manifest" href="/manifest.json" />
  
        {/* Open Graph para compartir en redes */}
        <meta property="og:title" content="Aamy AI – Automatiza tu negocio con Inteligencia Artificial" />
        <meta property="og:description" content="Asistente inteligente 24/7 para WhatsApp, Instagram, Facebook y voz. Automatiza tus mensajes y campañas." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://www.aamy.ai" />
        <meta property="og:type" content="website" />
  
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aamy AI – Automatiza tu negocio con Inteligencia Artificial" />
        <meta name="twitter:description" content="Asistente inteligente para automatizar WhatsApp, Instagram, Facebook y llamadas con IA." />
        <meta name="twitter:image" content="/og-image.png" />
      </>
    );
  }
  