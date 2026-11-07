import base64, requests, json, os
from dotenv import load_dotenv

load_dotenv()

msisdn   = = os.getenv("THRIVEVAS_MSISDN")
password = os.getenv("THRIVEVAS_PASSWORD")

generated_auth = base64.urlsafe_b64encode(f"{msisdn}:{password}".encode()).decode()

headers = {
    "Content-Type":  "application/json",
    "Authorization": f"Basic {generated_auth}",
}

resp = requests.post(
    "https://identity.thrivevas.com/v1/auth/api-key/generate",
    json={"name": "my-integration", "lifetime_seconds": 86400},
    headers=headers,
)

print("Status:", resp.status_code)
print("Resp headers:", dict(resp.headers))
print("Raw body:", resp.text)

try:
    data = resp.json()
except ValueError:
    data = None

# search recursively for any token-like field
def find_token(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and ("token" in k.lower() or "key" in k.lower()):
                return k, v
            found = find_token(v)
            if found:
                return found
    elif isinstance(obj, list):
        for item in obj:
            found = find_token(item)
            if found:
                return found
    return None

if data is not None:
    hit = find_token(data)
    if hit:
        print(f"Found token under '{hit[0]}': {hit[1]}")
    else:
        print("No token-like key in JSON. Full data:", json.dumps(data, indent=2))
