import json
import urllib.request
from urllib.error import URLError, HTTPError

base = "http://127.0.0.1:8000/api"

def get_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

def post_json(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

print("1. BEFORE BOOKING")
guides = get_json(f"{base}/guides/available?state=Maharashtra")
guide = [g for g in guides if g['full_name'] == 'Amit Tester'][0]
print("Amit's availability:", guide['availability'])

print("\n2. BOOKING GUIDE", guide['id'])
tour_data = post_json(f"{base}/guides/tours", {
    "guide_id": guide['id'],
    "heritage_site_id": 1,
    "site_name": "Ajanta Caves",
    "tourist_name": "John Doe",
})
tour_id = tour_data['tour']['id']
tour_token = tour_data['tour']['tour_token']
print("Booked Tour ID:", tour_id)

print("\n3. AFTER BOOKING")
guides = get_json(f"{base}/guides/available?state=Maharashtra")
guide = [g for g in guides if g['full_name'] == 'Amit Tester'][0]
print("Amit's availability:", guide['availability'])

print("\n4. CANCEL TOUR")
resp = post_json(f"{base}/guides/tours/{tour_id}/cancel", {
    "tour_token": tour_token
})
print("Cancel Response:", resp.get('message'))

print("\n5. AFTER CANCEL")
guides = get_json(f"{base}/guides/available?state=Maharashtra")
guide = [g for g in guides if g['full_name'] == 'Amit Tester'][0]
print("Amit's availability:", guide['availability'])
