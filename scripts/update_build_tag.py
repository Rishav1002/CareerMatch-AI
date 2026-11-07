with open('frontend/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<span>Build: <code class="build-sha" id="appBuildSha">1baf0b6</code></span>',
    '<span>Build: <code class="build-sha" id="appBuildSha">4.0.0</code></span>'
)

with open('frontend/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)

print("Updated build tag in index.html")
