#!/usr/bin/env python3
"""Fetch all content from Doggi-Dog.com WP API and save as local JSON."""
import json, time, os
from urllib.request import Request, urlopen
from urllib.error import HTTPError

with open('/tmp/wp_token_dd.txt') as f:
    b64_token = f.read().strip()

API_BASE = "https://doggi-dog.com/wp-json/wp/v2"
DATA_DIR = "/opt/data/doggi-dog-static/src/data"
os.makedirs(DATA_DIR, exist_ok=True)

def save_json(data, filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved {filename}")

def api_get(path):
    url = f"{API_BASE}/{path}"
    req = Request(url)
    req.add_header("Authorization", f"Basic {b64_token}")
    req.add_header("User-Agent", "DoggiDog-Statisch/1.0")
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            total = resp.headers.get('X-WP-Total', '?')
            pages = resp.headers.get('X-WP-TotalPages', '?')
            return data, total, pages
    except HTTPError as e:
        print(f"  HTTP {e.code} for {url}")
        return None, 0, 0

def api_get_paginated(base, per_page=50):
    all_items = []
    page = 1
    total_pages = 1
    while page <= total_pages:
        print(f"  Page {page}...")
        data, total, pages = api_get(f"{base}?per_page={per_page}&page={page}&_fields=id,title,slug,content,excerpt,featured_media,categories,tags,date,modified,meta,type,status")
        if data is None:
            break
        if page == 1:
            total_pages = int(pages) if pages != '?' else 1
            print(f"  Total: {total} items, {total_pages} pages")
        all_items.extend(data)
        page += 1
        if page <= total_pages:
            time.sleep(1)
    return all_items

print("=== Fetching Categories ===")
cats, _, _ = api_get("categories?per_page=50&_fields=id,name,slug,parent,description")
if isinstance(cats, list):
    save_json(cats, "categories.json")
    print(f"  {len(cats)} categories saved")

time.sleep(1)

print("\n=== Fetching Posts ===")
posts = api_get_paginated("posts")
save_json(posts, "posts.json")
print(f"  {len(posts)} posts saved")

time.sleep(1)

print("\n=== Fetching Pages ===")
pages = api_get_paginated("pages")
save_json(pages, "pages.json")
print(f"  {len(pages)} pages saved")

time.sleep(1)

print("\n=== Fetching Tags ===")
tags, _, _ = api_get("tags?per_page=50&_fields=id,name,slug")
if isinstance(tags, list):
    save_json(tags, "tags.json")
    print(f"  {len(tags)} tags saved")

time.sleep(1)

print("\n=== Fetching Media References ===")
media_ids = set()
for p in posts:
    if p.get('featured_media') and p['featured_media'] > 0:
        media_ids.add(p['featured_media'])
for p in pages:
    if p.get('featured_media') and p['featured_media'] > 0:
        media_ids.add(p['featured_media'])

print(f"  Fetching {len(media_ids)} media items...")
media_items = []
for mid in sorted(media_ids):
    data, _, _ = api_get(f"media/{mid}?_fields=id,source_url,alt_text,caption,title,media_details")
    if data and isinstance(data, dict) and 'id' in data:
        media_items.append(data)
    time.sleep(0.5)

save_json(media_items, "media.json")
print(f"  {len(media_items)} media items saved")

print("\nDone!")
print(f"   - {len(posts)} posts")
print(f"   - {len(pages)} pages")
print(f"   - {len(cats) if isinstance(cats, list) else 0} categories")
print(f"   - {len(media_items)} media items")
