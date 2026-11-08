import re

lines = open('frontend/index.html', encoding='utf-8').readlines()
total = 0
for idx, line in enumerate(lines, 1):
    matches = re.findall(r'style="[^"]*"', line)
    if matches:
        total += len(matches)
        print(f"L{idx:4d} | {matches}")
print(f"Total: {total}")
