export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>CVForge API</h1>
      <p>Backend API for CVForge - AI-powered resume builder</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Status</h2>
        <p>API is running. Check <a href="/api/health">/api/health</a> for health status.</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Available Endpoints</h2>
        <h3>Authentication</h3>
        <ul>
          <li>POST /api/auth/register - Register new user</li>
          <li>POST /api/auth/login - Login user</li>
        </ul>

        <h3>CV Management</h3>
        <ul>
          <li>GET /api/cvs - Get all user CVs</li>
          <li>POST /api/cvs - Create new CV</li>
          <li>GET /api/cvs/[id] - Get specific CV</li>
          <li>PUT /api/cvs/[id] - Update CV</li>
          <li>DELETE /api/cvs/[id] - Delete CV</li>
        </ul>

        <h3>AI Features</h3>
        <ul>
          <li>POST /api/ai/optimize - Optimize CV for job description</li>
          <li>GET /api/ai/usage - Get AI usage statistics</li>
        </ul>

        <h3>Import Features</h3>
        <ul>
          <li>POST /api/import/parse-text - Parse pasted resume text</li>
          <li>POST /api/import/parse-document - Parse PDF/DOCX resume</li>
        </ul>

        <h3>Health Check</h3>
        <ul>
          <li>GET /api/health - API health status</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h3>Documentation</h3>
        <p>For complete API documentation, see <code>README.md</code> in the project root.</p>
      </div>
    </main>
  );
}
