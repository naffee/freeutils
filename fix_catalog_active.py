import re

path = r"c:\Users\Hp\Desktop\VideoFrame\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace: className={`catalog-card ${activeTool === 'something' ? 'active' : ''}`}
# With:    className="catalog-card"
new_content = re.sub(
    r'className=\{\`catalog-card \$\{activeTool === \'[^\']+\' \? \'active\' : \'\'\}\`\}',
    'className="catalog-card"',
    content
)

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Removed activeTool checks from ToolCatalog")
