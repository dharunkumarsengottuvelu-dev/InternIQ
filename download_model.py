import urllib.request
import sys
import os

url = "https://llama3-2-multimodal.llamameta.net/Llama3.2-11B-Vision-Instruct/consolidated.00.pth?Policy=eyJTdGF0ZW1lbnQiOlt7InVuaXF1ZV9oYXNoIjoiZTB5dmVqNnJtczhjZzRrOTlmbzVmbHV1IiwiUmVzb3VyY2UiOiJodHRwczpcL1wvbGxhbWEzLTItbXVsdGltb2RhbC5sbGFtYW1ldGEubmV0XC8qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzgwMTYyODA3fX19XX0_&Signature=fp5W3WtVUBZQ%7EsBkjv9fE6gE3qBYhaguZq11xUhsEbOnPHNh-Fwqg7PEtc2qbkmDMv0Yimez0WpFizI6XBrI02jWbkT1hy11qnzqQAurv94emFgxycxa6q6UKZ8FdBl05l4PIMB-pr5CKfux7iKBtSkpa5yXjPO-IRI8JNRIBHKS6nDfUjaKVBm6aOteOR6QbaJKUVSZi2vI79-NC8TRH4IYciL2xMOR8trEgvb7BwthvOX8K1PmMdy9CsBzV9auK6XaoJAvPrYePdv0eZDcrhTc3S9U96Xsgi6%7EwiyLnPVh8o0HXxhdU0nDURk7GaOfD4QLMKXJQJsAABVlmJUQ9Q__&Key-Pair-Id=K15QRJLYKIFSLZ&Download-Request-ID=941032288970337"

dest_dir = "server/models/Llama3.2-11B-Vision-Instruct"
os.makedirs(dest_dir, exist_ok=True)
dest_path = os.path.join(dest_dir, "consolidated.00.pth")

print(f"Downloading to {dest_path}...")

def report_progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        percent = downloaded * 100 / total_size
        sys.stdout.write(f"\rDownloaded {downloaded / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB ({percent:.2f}%)")
        sys.stdout.flush()

try:
    urllib.request.urlretrieve(url, dest_path, reporthook=report_progress)
    print("\nDownload complete!")
except Exception as e:
    print(f"\nError downloading: {e}")
