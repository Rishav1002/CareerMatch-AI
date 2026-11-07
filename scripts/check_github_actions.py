import urllib.request, json

url = 'https://api.github.com/repos/Rishav1002/CareerMatch-AI/actions/runs?per_page=10'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"Total workflow runs: {data.get('total_count', 0)}")
    for run in data.get('workflow_runs', []):
        r_id = run['id']
        name = run['name']
        status = run['status']
        conclusion = run['conclusion']
        sha = run['head_sha'][:7]
        msg = run['head_commit']['message'].splitlines()[0]
        created = run['created_at']
        print(f"Run {r_id} | {name} | {status}/{conclusion} | SHA: {sha} | {created} | {msg}")
except Exception as e:
    print("Error:", e)
