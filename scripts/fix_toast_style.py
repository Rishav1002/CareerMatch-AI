with open('frontend/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'style="padding: 4px 12px; font-size: 0.8rem;"',
    ''
)

with open('frontend/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)

print("Replaced.")
