'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
      />
    </div>
  );
}
