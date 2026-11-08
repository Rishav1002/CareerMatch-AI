import re
from bs4 import BeautifulSoup

def transform_html():
    with open('frontend/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update Google Fonts for Devanagari if not already done
    if 'Noto+Sans+Devanagari' not in html:
        old_font = 'family=JetBrains+Mono:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700'
        new_font = 'family=JetBrains+Mono:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700'
        html = html.replace(old_font, new_font)

    # 2. Parse HTML with BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')

    # Find all elements with style attribute
    elements_with_style = soup.find_all(lambda tag: tag.has_attr('style'))
    print(f"Found {len(elements_with_style)} elements with style attribute")

    # Map each style rule to CSS utility classes
    def style_to_classes(style_str):
        classes = []
        style_norm = style_str.strip().rstrip(';')
        rules = [r.strip() for r in style_norm.split(';') if r.strip()]

        for r in rules:
            r_clean = re.sub(r'\s+', ' ', r).strip()
            
            # Display
            if r_clean == 'display: none':
                classes.append('hidden')
            elif r_clean == 'display: flex':
                classes.append('d-flex')
            elif r_clean == 'display: grid':
                classes.append('d-grid')
            elif r_clean == 'display: block':
                classes.append('d-block')
            elif r_clean == 'display: inline-block':
                classes.append('d-inline')
            elif r_clean == 'flex: 1':
                classes.append('flex-1')
            elif r_clean == 'flex-wrap: wrap':
                classes.append('flex-wrap')
            elif r_clean == 'flex-direction: column':
                classes.append('flex-col')
            elif r_clean == 'flex-direction: row':
                classes.append('flex-row')
            elif r_clean == 'justify-content: space-between':
                classes.append('justify-between')
            elif r_clean == 'justify-content: center':
                classes.append('justify-center')
            elif r_clean == 'justify-content: flex-end':
                classes.append('justify-end')
            elif r_clean == 'align-items: center':
                classes.append('items-center')
            elif r_clean == 'align-items: baseline':
                classes.append('items-baseline')
            elif r_clean == 'align-items: flex-start':
                classes.append('items-start')
            elif r_clean == 'align-self: flex-start':
                classes.append('items-start')
            elif r_clean in ['gap: var(--space-1)', 'gap: 8px', 'gap: 6px', 'gap: 10px']:
                classes.append('gap-sm')
            elif r_clean in ['gap: var(--space-2)', 'gap: 12px', 'gap: 14px']:
                classes.append('gap-md')
            elif r_clean in ['gap: var(--space-3)', 'gap: 18px', 'gap: 20px']:
                classes.append('gap-lg')
            elif r_clean in ['gap: var(--space-4)', 'gap: 32px']:
                classes.append('gap-xl')
            elif r_clean in ['gap: 4px', 'gap: var(--space-05)']:
                classes.append('gap-xs')
                
            # Sizing
            elif r_clean in ['width: 100%', 'width: 100% !important']:
                classes.append('w-full')
            elif r_clean == 'width: auto':
                classes.append('w-auto')
            elif r_clean == 'width: 180px':
                classes.append('w-180')
            elif r_clean == 'min-width: 200px':
                classes.append('min-w-200')
            elif r_clean == 'max-width: 1200px':
                classes.append('max-w-wide')
            elif r_clean in ['max-width: 760px', 'max-width: 780px', 'max-width: 900px']:
                classes.append('max-w-narrow')
            elif r_clean in ['max-width: 600px', 'max-width: 480px', 'max-width: 420px']:
                classes.append('max-w-form')
            elif r_clean == 'max-height: 480px':
                classes.append('max-h-480')
            elif r_clean == 'overflow-y: auto':
                classes.append('overflow-y-auto')
            elif r_clean == 'overflow: hidden':
                classes.append('overflow-hidden')
                
            # Margins
            elif r_clean in ['margin: 0', 'margin: 0 !important', 'margin: 0 0', 'margin: 0 auto']:
                if 'auto' in r_clean: classes.append('mx-auto')
                else: classes.append('m-0')
            elif r_clean in ['margin-bottom: var(--space-1)', 'margin-bottom: 8px']:
                classes.append('mb-1')
            elif r_clean in ['margin-bottom: var(--space-15)', 'margin-bottom: 12px', 'margin-bottom: 14px']:
                classes.append('mb-15')
            elif r_clean in ['margin-bottom: var(--space-2)', 'margin-bottom: 16px', 'margin-bottom: 20px']:
                classes.append('mb-2')
            elif r_clean in ['margin-bottom: var(--space-3)', 'margin-bottom: 24px']:
                classes.append('mb-3')
            elif r_clean in ['margin-bottom: var(--space-4)', 'margin-bottom: 36px', 'margin-bottom: 40px']:
                classes.append('mb-4')
            elif r_clean in ['margin-bottom: 4px', 'margin-bottom: 6px']:
                classes.append('mb-05')
            elif r_clean == 'margin-bottom: 0':
                classes.append('mb-0')
            elif r_clean in ['margin-top: var(--space-1)', 'margin-top: 8px']:
                classes.append('mt-1')
            elif r_clean in ['margin-top: var(--space-15)', 'margin-top: 12px', 'margin-top: 14px']:
                classes.append('mt-15')
            elif r_clean in ['margin-top: var(--space-2)', 'margin-top: 16px', 'margin-top: 18px', 'margin-top: 20px']:
                classes.append('mt-2')
            elif r_clean in ['margin-top: var(--space-3)', 'margin-top: 24px']:
                classes.append('mt-3')
            elif r_clean in ['margin-top: var(--space-4)', 'margin-top: 40px']:
                classes.append('mt-4')
            elif r_clean in ['margin-top: 4px', 'margin-top: 6px', 'margin-top: 2px', 'margin-top: 3px']:
                classes.append('mt-05')
            elif r_clean == 'margin-left: 8px':
                classes.append('ml-1')
                
            # Paddings
            elif r_clean in ['padding: 0', 'padding: 0 !important', 'padding: 0 0 var(--space-3) 0']:
                classes.append('p-0')
            elif r_clean in ['padding: var(--space-1)', 'padding: 8px', 'padding: 10px']:
                classes.append('p-1')
            elif r_clean in ['padding: var(--space-2)', 'padding: 12px', 'padding: 14px', 'padding: 16px']:
                classes.append('p-2')
            elif r_clean in ['padding: var(--space-3)', 'padding: 20px', 'padding: 24px', 'padding: 20px 24px']:
                classes.append('p-3')
            elif r_clean in ['padding: var(--space-4)', 'padding: 32px']:
                classes.append('p-4')
            elif 'clamp' in r_clean and 'padding' in r_clean:
                classes.append('p-clamp-hero')
            elif r_clean in ['padding: 2px 8px', 'padding: 4px 12px', 'padding: 2px 6px', 'padding: 4px']:
                classes.append('badge-tag')
                
            # Typography
            elif r_clean in ['font-size: 0.75rem', 'font-size: 0.72rem', 'font-size: 0.76rem', 'font-size: 0.78rem', 'font-size: 0.8rem']:
                classes.append('text-xs')
            elif r_clean in ['font-size: 0.8125rem', 'font-size: 0.84rem', 'font-size: 0.85rem', 'font-size: 0.86rem', 'font-size: 0.875rem', 'font-size: 0.88rem', 'font-size: 0.9rem']:
                classes.append('text-sm')
            elif r_clean in ['font-size: 0.92rem', 'font-size: 0.95rem', 'font-size: 1rem']:
                classes.append('text-base')
            elif r_clean in ['font-size: 1.05rem', 'font-size: 1.1rem']:
                classes.append('text-md')
            elif r_clean in ['font-size: 1.15rem', 'font-size: 1.25rem']:
                classes.append('text-lg')
            elif r_clean in ['font-size: 1.35rem', 'font-size: 1.45rem', 'font-size: 1.5rem']:
                classes.append('text-xl')
            elif r_clean in ['font-size: 1.8rem', 'font-size: 2rem']:
                classes.append('text-2xl')
            elif r_clean in ['font-size: 2.75rem', 'font-size: 3.5rem', 'font-size: 4rem'] or 'clamp' in r_clean and 'font-size' in r_clean:
                classes.append('text-score-huge')
            elif r_clean == 'font-family: var(--font-display)':
                classes.append('font-serif')
            elif r_clean == 'font-family: var(--font-mono)':
                classes.append('font-mono')
            elif r_clean in ['font-weight: 700', 'font-weight: bold']:
                classes.append('font-bold')
            elif r_clean == 'font-weight: 600':
                classes.append('font-semibold')
            elif r_clean == 'font-weight: 500':
                classes.append('font-medium')
            elif r_clean == 'text-transform: uppercase':
                classes.append('uppercase')
            elif r_clean == 'letter-spacing: 0.05em':
                classes.append('tracking-wide')
            elif r_clean == 'text-align: center':
                classes.append('text-center')
            elif r_clean == 'text-align: right':
                classes.append('text-right')
            elif r_clean == 'line-height: 1':
                classes.append('lh-tight')
            elif r_clean in ['line-height: 1.6', 'line-height: 1.7']:
                classes.append('lh-relaxed')
            elif r_clean == 'text-decoration: none':
                classes.append('link-muted')
            elif r_clean == 'text-decoration: underline':
                classes.append('text-underline')
            elif r_clean == 'white-space: nowrap':
                classes.append('whitespace-nowrap')
            elif r_clean in ['list-style: none', 'list-style: none !important']:
                classes.append('list-unstyled')
                
            # Colors
            elif r_clean in ['color: var(--text-primary)', 'color: var(--text-primary) !important']:
                classes.append('text-primary')
            elif r_clean in ['color: var(--text-secondary)', 'color: var(--text-secondary) !important']:
                classes.append('text-secondary')
            elif r_clean in ['color: var(--text-tertiary)', 'color: var(--text-tertiary) !important']:
                classes.append('text-tertiary')
            elif r_clean in ['color: var(--brand-accent)', 'color: var(--brand-accent) !important']:
                classes.append('text-accent')
            elif r_clean in ['color: var(--score-high)', 'color: var(--score-high) !important']:
                classes.append('text-high')
            elif r_clean in ['color: var(--score-mid)', 'color: var(--score-mid) !important']:
                classes.append('text-mid')
            elif r_clean in ['color: var(--score-low)', 'color: var(--score-low) !important']:
                classes.append('text-low')
                
            # Backgrounds & Borders
            elif 'background: var(--bg-sunken)' in r_clean:
                classes.append('bg-sunken')
            elif 'background: var(--bg-raised)' in r_clean:
                classes.append('bg-raised')
            elif 'background: var(--bg-card)' in r_clean:
                classes.append('bg-card')
            elif 'background: var(--score-high-bg)' in r_clean:
                classes.append('bg-high')
            elif 'background: var(--score-low-bg)' in r_clean:
                classes.append('bg-low')
            elif 'background: none' in r_clean or 'background: transparent' in r_clean:
                classes.append('bg-transparent')
            elif r_clean in ['border: none', 'border: none !important']:
                classes.append('border-none')
            elif r_clean in ['border: 1px solid var(--border-subtle)', 'border: 1px solid var(--border-subtle) !important']:
                classes.append('border-subtle')
            elif 'border-top: 1px solid var(--border-subtle)' in r_clean:
                classes.append('border-top')
            elif 'border-bottom: 1px solid var(--border-subtle)' in r_clean:
                classes.append('border-bottom')
            elif r_clean == 'border-radius: var(--radius-sm)':
                classes.append('rounded-sm')
            elif r_clean == 'border-radius: var(--radius-md)':
                classes.append('rounded-md')
            elif r_clean in ['border-radius: 999px', 'border-radius: 9999px']:
                classes.append('rounded-full')
                
            # Grids
            elif 'grid-template-columns: 1fr 1fr' in r_clean:
                classes.append('grid-2')
            elif 'grid-template-columns: 2fr 1fr' in r_clean:
                classes.append('grid-2-1')
            elif 'grid-template-columns: 1fr 2fr' in r_clean:
                classes.append('grid-1-2')
            elif 'grid-template-columns: repeat(3, 1fr)' in r_clean:
                classes.append('grid-3')
            elif 'grid-template-columns: repeat(2, 1fr)' in r_clean:
                classes.append('grid-2')
            elif 'grid-template-columns: repeat(auto-fit' in r_clean:
                classes.append('grid-auto-fit')
                
            # Utilities
            elif r_clean == 'cursor: pointer':
                classes.append('cursor-pointer')
            elif r_clean == 'position: relative':
                classes.append('pos-relative')
            elif r_clean == 'position: absolute':
                classes.append('pos-absolute')
            elif r_clean == 'opacity: 0':
                classes.append('opacity-0')
            elif r_clean == 'opacity: 1':
                classes.append('opacity-1')

        # Combine flex-between if items-center + justify-between
        if 'items-center' in classes and 'justify-between' in classes:
            classes.remove('items-center')
            classes.remove('justify-between')
            classes.append('flex-between')

        return list(dict.fromkeys(classes)) # deduplicate preserving order

    # Transform all elements
    for el in elements_with_style:
        style_val = el.get('style', '')
        new_classes = style_to_classes(style_val)
        existing_classes = el.get('class', [])
        if isinstance(existing_classes, str):
            existing_classes = existing_classes.split()
        
        # Merge classes
        merged = existing_classes + [c for c in new_classes if c not in existing_classes]
        if merged:
            el['class'] = merged
        del el['style']

    return str(soup)

transformed = transform_html()
with open('frontend/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(transformed)
print("Transformation complete.")
