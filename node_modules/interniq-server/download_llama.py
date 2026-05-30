import os
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "https://llama3-2-multimodal.llamameta.net"
URL_SUFFIX = "?Policy=eyJTdGF0ZW1lbnQiOlt7InVuaXF1ZV9oYXNoIjoiZTB5dmVqNnJtczhjZzRrOTlmbzVmbHV1IiwiUmVzb3VyY2UiOiJodHRwczpcL1wvbGxhbWEzLTItbXVsdGltb2RhbC5sbGFtYW1ldGEubmV0XC8qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzgwMTYyODA3fX19XX0_&Signature=fp5W3WtVUBZQ%7EsBkjv9fE6gE3qBYhaguZq11xUhsEbOnPHNh-Fwqg7PEtc2qbkmDMv0Yimez0WpFizI6XBrI02jWbkT1hy11qnzqQAurv94emFgxycxa6q6UKZ8FdBl05l4PIMB-pr5CKfux7iKBtSkpa5yXjPO-IRI8JNRIBHKS6nDfUjaKVBm6aOteOR6QbaJKUVSZi2vI79-NC8TRH4IYciL2xMOR8trEgvb7BwthvOX8K1PmMdy9CsBzV9auK6XaoJAvPrYePdv0eZDcrhTc3S9U96Xsgi6%7EwiyLnPVh8o0HXxhdU0nDURk7GaOfD4QLMKXJQJsAABVlmJUQ9Q__&Key-Pair-Id=K15QRJLYKIFSLZ&Download-Request-ID=941032288970337"

TARGET_DIR = os.path.join("models", "Llama3.2-11B-Vision-Instruct")

FILES_TO_DOWNLOAD = [
    "consolidated.00.pth",
    "params.json",
]

def download_file(filename):
    url = f"{BASE_URL}/Llama3.2-11B-Vision-Instruct/{filename}{URL_SUFFIX}"
    dest = os.path.join(TARGET_DIR, filename)
    print(f"Downloading {filename} from {url}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"✅ Successfully downloaded {filename}")
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")

if __name__ == "__main__":
    os.makedirs(TARGET_DIR, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as executor:
        executor.map(download_file, FILES_TO_DOWNLOAD)
    print("Download complete.")
