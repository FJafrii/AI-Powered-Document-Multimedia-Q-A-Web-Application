import os
import httpx
from dotenv import load_dotenv

# Load your .env file to get the API key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("ERROR: No API key found. Check your .env file!")
else:
    # Query Google to see what models this specific key can access
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    try:
        response = httpx.get(url)
        data = response.json()

        print("\n--- AVAILABLE MODELS FOR YOUR KEY ---")
        if "models" in data:
            for m in data["models"]:
                # Print the model name (e.g., models/gemini-1.5-flash)
                print(m["name"])
        else:
            print("No models found. Response from Google:")
            print(data)

    except Exception as e:
        print(f"Connection Error: {e}")
