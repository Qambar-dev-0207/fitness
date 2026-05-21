import os
import requests

api_key = os.getenv("GROQ_API_KEY")
res = requests.get(
    "https://api.groq.com/openai/v1/models",
    headers={"Authorization": f"Bearer {api_key}"}
)
data = res.json()
for m in data["data"]:
    print(m["id"])
