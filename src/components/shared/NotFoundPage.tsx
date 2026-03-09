import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>Page not found</h1>
        <p>
          The page you requested does not exist or the tool route is invalid. Use the links below to get back to a
          valid section of the site.
        </p>
        <div className="not-found-links">
          <Link to="/" className="btn-secondary">Home</Link>
          <Link to="/app/videos" className="btn-primary">Browse Video Tools</Link>
        </div>
      </div>
    </main>
  );
}
