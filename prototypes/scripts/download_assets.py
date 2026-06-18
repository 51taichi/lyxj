#!/usr/bin/env python3
"""Download Figma assets for prototype pages."""
import urllib.request
from pathlib import Path

BASE = "https://www.figma.com/api/mcp/asset"
OUT = Path(__file__).resolve().parent.parent / "assets"

ASSETS = {
    # goals page
    "goals/page-bg.png": "c75f9964-707c-4a95-ad4b-8cb7e65b5f38",
    "goals/summary-card-bg.png": "3e333a6f-b089-4a04-bc0b-eb23613b376d",
    "goals/circle-progress.png": "74b0d708-0d17-440c-99bd-8055b0f00fb3",
    "goals/hero-monster.png": "8a28f6d0-41da-4e66-b272-59675db241f2",
    "goals/icon-rocket.png": "19c79e92-5895-4d91-b2d9-1c671f53b36b",
    "goals/icon-book.png": "ee52ef4f-e27d-40b2-af45-65ac91998aa1",
    "goals/icon-sport.png": "486ae005-5b6a-4657-b3fd-00e311ad04c2",
    "goals/icon-leaf.png": "2fa7fd4d-fab2-4deb-8dde-14cb6291c328",
    "goals/icon-plus.png": "b68a9790-c9be-4435-8976-b2d6e54fa9a7",
    "goals/progress-track.png": "d2c9e1f2-a356-4b16-a0bb-642b7d9017b1",
    "goals/progress-fill-70.png": "0a508d64-b599-4350-8303-ce93d2d79aa0",
    "goals/progress-fill-42.png": "51ceecd1-64d8-42f4-aeeb-fc09f391c39d",
    "goals/progress-fill-33.png": "39c954fb-a08f-46da-a337-54b8e1e0d026",
    "goals/progress-fill-30.png": "42453cdb-3232-45b2-8373-53556a1e69fb",
    "shared/nav-home.png": "ce59d282-01f7-4c2e-950d-4c98cff70ef1",
    "shared/nav-goals.png": "1f834706-1ac4-4869-8c99-d55bce92fde2",
    "shared/nav-goals-active.png": "1f834706-1ac4-4869-8c99-d55bce92fde2",
    "shared/nav-focus.png": "198ec975-f629-4755-bac9-ca6f8799e1b6",
    "shared/nav-focus-active.png": "43a013a3-a361-4baa-9990-10c24f159d87",
    "shared/nav-stats.png": "269ae711-a7cf-45e8-802b-2ed555373b97",
    "shared/nav-profile.png": "615e64de-4633-4cee-a1c0-efafc285ef14",
    # focus page
    "focus/page-bg.png": "21ee8b3b-99a2-45fd-9fec-d0dfdc7b8c55",
    "focus/icon-rocket-lg.png": "da32e370-7d6d-4642-9491-98e64960b850",
    "focus/timer-ring.png": "fe9fa64c-299c-416c-83f9-a9b495f1e066",
    "focus/timer-pause.png": "c4e1f6d9-f6d4-4adf-9727-2ab32d673b37",
    "focus/icon-clock.png": "fdaf535e-c2bb-4c7a-ad33-8647969049a8",
    "focus/icon-records.png": "dd35a3d9-14c2-4d1f-8116-59619dfeb3a9",
    "focus/icon-chevron.png": "7e4d8318-6203-4720-b860-b6c007cd11e8",
    "focus/icon-music.png": "7e4d8318-6203-4720-b860-b6c007cd11e8",
    "focus/icon-more.png": "59fd6a09-828b-43bb-b4db-83c9cb46172b",
    "focus/icon-dropdown.png": "f96b284b-fc40-4fd3-aacc-8c6490ea9568",
    "focus/btn-end-bg.png": "7cc997dc-cca7-4cf0-97e6-7d17c0797c88",
    "shared/nav-home-2.png": "ebbc05a8-d742-42d2-a35a-b9ce35989cd9",
    "shared/nav-goals-2.png": "90a22a23-18b7-46e5-befe-9aceab822df5",
    "shared/nav-focus-2.png": "43a013a3-a361-4baa-9990-10c24f159d87",
    "shared/nav-stats-2.png": "ed8e32a4-d92d-4dcb-807f-8ea36e95f8e0",
    "shared/nav-profile-2.png": "9066d78e-5b92-4f7f-90ac-f96ef292b774",
    # detail page
    "detail/page-bg.png": "2841767a-ff5e-49e3-8223-d6e7410a5888",
    "detail/icon-rocket-xl.png": "221b66bf-e081-4ac2-bb48-34f7a10267c6",
    "detail/chart-bars.png": "254efb23-a79e-4d94-a4ab-1e4a75695f81",
    "detail/icon-clock-record.png": "355e77da-f8b8-4fbf-a854-7dc33bd66bf7",
    "detail/icon-ux-record.png": "a5742357-d91a-4851-bfa8-911b1874cef2",
    "detail/icon-back.png": "8bf18bc0-3194-4304-beaa-2b9583213e36",
    "detail/icon-edit.png": "52346093-af51-4d60-a2eb-5f1734720e01",
    "detail/icon-chevron.png": "71ecf7f8-941b-4ec4-bb76-762baf7d78bd",
    "shared/nav-home-3.png": "f05f4546-77c0-43f8-b314-6e0a1eac91d2",
    "shared/nav-goals-3.png": "573450f6-87ab-41f0-8646-c2db77573ddc",
    "shared/nav-focus-3.png": "046c8ee9-828c-4d14-8190-fb58b1c9dd0a",
    "shared/nav-stats-3.png": "90b0e466-7db6-4ef2-85bb-5637a6216c07",
    "shared/nav-profile-3.png": "ed3455eb-752a-408f-9526-dc5299a0584c",
}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ok, fail = 0, 0
    for rel, uid in ASSETS.items():
        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        url = f"{BASE}/{uid}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if len(data) < 100:
                print(f"SKIP (too small): {rel}")
                fail += 1
                continue
            dest.write_bytes(data)
            print(f"OK: {rel} ({len(data)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL: {rel} - {e}")
            fail += 1
    print(f"\nDone: {ok} ok, {fail} failed")

if __name__ == "__main__":
    main()
