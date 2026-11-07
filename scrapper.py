import requests
import json
import time

BASE = "https://tenders.go.ke/api/ocds"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
}

session = requests.Session()
session.headers.update(HEADERS)


def fetch_index(page: int):
    """Fetch one page of the OCDS financial-year index."""
    r = session.get(
        f"{BASE}/index",
        params={
            "search": "",
            "perpage": 10,
            "sortby": "",
            "order": "asc",
            "page": page,
        },
        timeout=30,
    )

    # Raise early with a clear message instead of a JSONDecodeError
    if r.status_code != 200:
        raise RuntimeError(
            f"Index page {page} returned HTTP {r.status_code}. "
            f"Content-Type: {r.headers.get('content-type')}. "
            f"Body starts: {r.text[:300]!r}"
        )

    try:
        return r.json()
    except requests.exceptions.JSONDecodeError:
        raise RuntimeError(
            f"Index page {page} did not return JSON. "
            f"Content-Type: {r.headers.get('content-type')}. "
            f"Body starts: {r.text[:500]!r}"
        )


def download_year_file(ocds_id: int, src: str):
    """Download one financial-year OCDS JSON file."""
    r = session.get(
        f"{BASE}/tenders",
        params={"download": "true", "ocds_id": ocds_id},
        timeout=60,
    )

    if r.status_code != 200:
        raise RuntimeError(
            f"Download for ocds_id={ocds_id} ({src}) failed: "
            f"HTTP {r.status_code}, body starts: {r.text[:300]!r}"
        )

    try:
        return r.json()
    except requests.exceptions.JSONDecodeError:
        raise RuntimeError(
            f"Download for ocds_id={ocds_id} ({src}) did not return JSON. "
            f"Content-Type: {r.headers.get('content-type')}. "
            f"Body starts: {r.text[:500]!r}"
        )


def main():
    page = 1
    all_year_files = []

    while True:
        print(f"Fetching index page {page}...")
        data = fetch_index(page)

        for item in data["data"]:
            all_year_files.append({"id": item["id"], "src": item["src"]})
            print(f"  → {item['src']} (id={item['id']})")

        next_url = data.get("next_page_url")
        if not next_url:
            break

        page += 1
        time.sleep(1)  # be polite

    print(f"\nFound {len(all_year_files)} financial-year files.\n")

    for item in all_year_files:
        print(f"Downloading {item['src']} ...")
        try:
            package = download_year_file(item["id"], item["src"])
        except RuntimeError as e:
            print(f"  ✗ {e}")
            continue

        # OCDS release package: releases are under ["releases"]
        releases = package.get("releases", [])
        print(f"  ✓ {len(releases)} releases in {item['src']}")

        # Save each year file for later inspection
        filename = item["src"].split("/")[-1]  # e.g. "2026-2027.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(package, f, ensure_ascii=False, indent=2)
        print(f"  saved → {filename}")

    print("\nDone.")


if __name__ == "__main__":
    main()
