import os
import re
import time
import json
from pathlib import Path
from tqdm import tqdm
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Imports for scraper
import pickle

# ================= Configuration =================
BASE_DIR = Path(__file__).parent / "data" / "rbi_msme_data"
DB_DIR = Path(__file__).parent / "data" / "rbi_chroma_db_msme_fixed"

BASE_DIR.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)

CATEGORIES = {
    'credit_loans': BASE_DIR / 'credit_loans',
    'priority_sector': BASE_DIR / 'priority_sector',
    'banking_access': BASE_DIR / 'banking_access',
    'schemes': BASE_DIR / 'schemes',
    'grievance': BASE_DIR / 'grievance',
    'educational': BASE_DIR / 'educational',
}

for folder in CATEGORIES.values():
    folder.mkdir(parents=True, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
LOG_FILE = BASE_DIR / "download_log_fixed.json"
_log = []

def make_session():
    session = requests.Session()
    retry = Retry(total=5, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

def download_pdf(url: str, save_dir: Path, filename: str = None, source: str = "Official") -> bool:
    try:
        filename = filename or re.sub(r"[^a-zA-Z0-9._-]+", "_", url.split("/")[-1])[:150] + ".pdf"
        if not filename.endswith(".pdf"):
            filename += ".pdf"
        filepath = save_dir / filename
        
        if filepath.exists() and filepath.stat().st_size > 15000:
            print(f" ⏩ Already exists: {filename}")
            _log.append({"file": str(filepath), "url": url, "source": source})
            return True
            
        r = make_session().get(url, headers=HEADERS, timeout=90, allow_redirects=True)
        r.raise_for_status()
        
        if not r.content.startswith(b"%PDF"):
            print(f" ⚠️ Not valid PDF: {url}")
            return False
            
        save_dir.mkdir(parents=True, exist_ok=True)
        filepath.write_bytes(r.content)
        print(f" ✅ Downloaded: {filename} ({len(r.content)//1024} KB) [{source}]")
        _log.append({"file": str(filepath), "url": url, "source": source})
        return True
    except Exception as e:
        print(f" ❌ Failed {url}: {e}")
        return False

# ==================== MAIN SCRAPER ====================
def run_enhanced_scraper():
    print("🚀 Running ENHANCED MSME Scraper with More Reliable Links...\n")
    
    CURATED = [
        # High Priority
        {"url": "https://www.dcmsme.gov.in/Notification-S.O-no-1364-E-dated-21.03.2025-Revised-Definition.pdf",
         "name": "msme_revised_classification_2025.pdf", "cat": "educational"},
         
        {"url": "https://www.fidcindia.org/wp-content/uploads/2025/03/RBI-PSL-MASTER-DIRECTIONS-24-03-25.pdf",
         "name": "rbi_psl_master_directions_2025.pdf", "cat": "priority_sector"},
         
        # Scheme Booklets
        {"url": "https://www.dcmsme.gov.in/ebook/MSMESchemebooklet2025-26.pdf",
         "name": "msme_schemes_booklet_2025.pdf", "cat": "schemes"},
        {"url": "https://msme.gov.in/sites/default/files/Scheme-booklet-Eng.pdf",
         "name": "msme_schemes_compendium_eng.pdf", "cat": "schemes"},
        {"url": "https://msme.gov.in/sites/default/files/MSME_Schemes_English_0.pdf",
         "name": "msme_schemes_detailed_compendium.pdf", "cat": "schemes"},
         
        # Key Schemes
        {"url": "https://msme.gov.in/schemes/clcss.pdf",
         "name": "clcss_technology_upgradation.pdf", "cat": "schemes"},
        {"url": "https://msme.gov.in/schemes/New-Guidelines.pdf",
         "name": "mse_cdp_cluster_guidelines.pdf", "cat": "schemes"},
        {"url": "https://msme.gov.in/CLCS_TUS_Scheme/MSME%20Innovative%20Scheme%20Guidelines.pdf",
         "name": "msme_innovative_scheme_guidelines.pdf", "cat": "schemes"},
         
        {"url": "https://msme.gov.in/Benefits%20of%20UR.pdf",
         "name": "udyam_registration_benefits.pdf", "cat": "educational"},
         
        # CGTMSE (stable links)
        {"url": "https://www.dcmsme.gov.in/schemes/CGTMSE%20guidelines.pdf",
         "name": "cgtmse_guidelines_dcmsme.pdf", "cat": "credit_loans"},
        {"url": "https://msme.gov.in/sites/default/files/CredirGuranteeFundScheme_1.pdf",
         "name": "cgtmse_credit_guarantee_fund.pdf", "cat": "credit_loans"},
         
        # Additional Valuable PDFs
        {"url": "https://msme.gov.in/sites/default/files/MSMEANNUALREPORT2025-26ENGLISH_0.pdf",
         "name": "msme_annual_report_2025_26.pdf", "cat": "educational"},
        {"url": "https://www.dcmsme.gov.in/CLCS_TUS_Scheme/GIFT/MSE_GIFT_Brochure.pdf",
         "name": "msme_gift_green_finance.pdf", "cat": "schemes"},
        {"url": "https://msme.gov.in/sites/default/files/IC_EN.pdf",
         "name": "international_cooperation_scheme.pdf", "cat": "schemes"},
        {"url": "https://msme.gov.in/sites/default/files/KNOW-YOUR-LENDER_2025.pdf",
         "name": "know_your_lender_2025.pdf", "cat": "credit_loans"},
    ]

    for item in tqdm(CURATED, desc="Downloading curated documents"):
        cat = item["cat"]
        save_dir = CATEGORIES.get(cat, BASE_DIR / "general")
        download_pdf(item["url"], save_dir, filename=item["name"], source=item.get("source", "Official"))

    with open(LOG_FILE, "w") as f:
        json.dump(_log, f, indent=4)
    print(f"\n✅ Scraping log written to {LOG_FILE}")

if __name__ == "__main__":
    run_enhanced_scraper()
