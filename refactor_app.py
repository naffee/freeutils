import re
import sys

path = r"c:\Users\Hp\Desktop\VideoFrame\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Find the Dashboard function
dashboard_start = text.find("function Dashboard() {")
if dashboard_start == -1:
    print("Dashboard start not found")
    sys.exit(1)

# Find the RouteHandler function which marks the end of Dashboard
route_handler_start = text.find("// Intercept routing logic")
if route_handler_start == -1:
    route_handler_start = text.find("function RouteHandler() {")

if route_handler_start == -1:
    print("RouteHandler start not found")
    sys.exit(1)

dashboard_code = text[dashboard_start:route_handler_start]

# Extract sub-tools-nav
sub_tools_match = re.search(r'(<div className="sub-tools-nav">.*?)<main style=\{\{\s*marginTop:\s*\'2rem\'\s*\}\}>', dashboard_code, re.DOTALL)
if not sub_tools_match:
    print("sub-tools-nav not found")
    sys.exit(1)
sub_tools_html = sub_tools_match.group(1)

# Extract main tag
main_match = re.search(r'(<main style=\{\{\s*marginTop:\s*\'2rem\'\s*\}\}>.*?</main>)', dashboard_code, re.DOTALL)
if not main_match:
    print("main tag not found")
    sys.exit(1)
main_html = main_match.group(1)

# Convert sub_tools_html classes
catalog_html = sub_tools_html.replace('className="tabs sub-tabs"', 'className="catalog-grid"')
catalog_html = catalog_html.replace('className={`tab-btn', 'className={`catalog-card')

tool_catalog_raw = f"""
function ToolCatalog() {{
  const {{ domain }} = useParams<{{ domain: string }}>();
  const navigate = useNavigate();

  const activeDomain = domain as Domain || 'videos';
  const activeTool = '';

  return (
    <div className="app-container tool-catalog-page">
      <header className="header">
        <div className="header-title">
          <Film size={{32}} color="#8b5cf6" />
          <h1>FrameXtract</h1>
        </div>

        {{/* Domain Navigation */}}
        <div className="tabs">
          <button
            className={{`tab-btn ${{activeDomain === 'videos' ? 'active' : ''}}`}}
            onClick={{() => navigate('/app/videos')}}
          >
            <Film size={{18}} /> Videos
          </button>
          <button
            className={{`tab-btn ${{activeDomain === 'audio' ? 'active' : ''}}`}}
            onClick={{() => navigate('/app/audio')}}
          >
            <MusicIcon size={{18}} /> Audio
          </button>
          <button
            className={{`tab-btn ${{activeDomain === 'code' ? 'active' : ''}}`}}
            onClick={{() => navigate('/app/code')}}
          >
            <CodeIcon size={{18}} /> Code
          </button>
          <button
            className={{`tab-btn ${{activeDomain === 'text' ? 'active' : ''}}`}}
            onClick={{() => navigate('/app/text')}}
          >
            <TypeIcon size={{18}} /> Text
          </button>
          <button
            className={{`tab-btn ${{activeDomain === 'images' ? 'active' : ''}}`}}
            onClick={{() => navigate('/app/images')}}
          >
            <ImageIcon size={{18}} /> Images
          </button>
        </div>
        <p>Select a utility from the {{activeDomain}} category</p>
      </header>

      {catalog_html}
    </div>
  );
}}
"""

# Now write DedicatedToolPage
dedicated_page_raw = f"""
function DedicatedToolPage() {{
  const {{ domain, tool }} = useParams<{{ domain: string, tool: string }}>();
  const navigate = useNavigate();

  const activeDomain = domain as Domain || 'videos';
  const activeTool = tool || 'frames';

  // Make a nice readable title from the tool slug
  const titleStr = activeTool
    .replace(/([A-Z])/g, ' $1')
    .trim();
    
  const toolTitle = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);

  return (
    <div className="app-container dedicated-tool-page">
      <header className="dedicated-header" style={{{{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}}}>
        <div style={{{{display: 'flex', alignItems: 'center', gap: '2rem'}}}} className="dedicated-header-left">
          <button 
            className="tab-btn" 
            style={{{{padding: '0.5rem 1rem'}}}}
            onClick={{() => navigate(`/app/${{activeDomain}}`)}}
          >
            ← Back to Catalog
          </button>
          <div className="header-title" style={{{{margin: 0}}}}>
            <Film size={{24}} color="#8b5cf6" />
            <h2 style={{{{fontSize: '1.25rem', margin: 0, marginLeft: '0.5rem'}}}}>FrameXtract - {{toolTitle}}</h2>
          </div>
        </div>
        
        <div className="tabs" style={{{{margin: 0}}}} className="dedicated-header-right">
          <button
            className={{`tab-btn ${{activeDomain === 'videos' ? 'active' : ''}}`}}
            onClick={{() => navigate('/app/videos')}}
          >
             <Film size={{16}} />
          </button>
          <button className={{`tab-btn ${{activeDomain === 'audio' ? 'active' : ''}}`}} onClick={{() => navigate('/app/audio')}}><MusicIcon size={{16}} /></button>
          <button className={{`tab-btn ${{activeDomain === 'code' ? 'active' : ''}}`}} onClick={{() => navigate('/app/code')}}><CodeIcon size={{16}} /></button>
          <button className={{`tab-btn ${{activeDomain === 'text' ? 'active' : ''}}`}} onClick={{() => navigate('/app/text')}}><TypeIcon size={{16}} /></button>
          <button className={{`tab-btn ${{activeDomain === 'images' ? 'active' : ''}}`}} onClick={{() => navigate('/app/images')}}><ImageIcon size={{16}} /></button>
        </div>
      </header>
      
      {main_html}
    </div>
  );
}}
"""

text = text[:dashboard_start] + tool_catalog_raw + "\n" + dedicated_page_raw + "\n" + text[route_handler_start:]

route_handler_code = """
// Intercept routing logic
function RouteHandler() {
  const { domain, tool } = useParams();

  if (!domain) {
    return <Navigate to="/app/videos" replace />;
  }

  // If there's no tool, show the catalog for the domain
  if (!tool) {
    return <ToolCatalog />;
  }

  return <DedicatedToolPage />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<RouteHandler />} />
        <Route path="/app/:domain" element={<RouteHandler />} />
        <Route path="/app/:domain/:tool" element={<RouteHandler />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
"""

text = re.sub(r'// Intercept routing logic.*', route_handler_code, text, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("App.tsx refactored successfully")
