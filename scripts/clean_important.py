import re

def clean_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove !important everywhere except in .hidden { display: none !important; }
    cleaned = re.sub(r'\s*!important', '', content)
    
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cleaned)
    print(f"Cleaned {path}")

clean_file('frontend/css/layout.css')
clean_file('frontend/css/base.css')
