# Banimal 2026: Global Release Master (Amazon & Takealot)

Comprehensive documentation for the production deployment of the **Banimal** creature-wear product line (27 items).

## 📊 Release Overview
*   **Total Items**: 27 (Babygrows & Bibs)
*   **Target Channels**: Amazon EU (Euros), Takealot ZAR (ZAR), Fruitful Portal (Kiosk)
*   **Master SKU Map**: [master_map.py](master_map.py) (Source of Truth)

## 📁 Repository Structure & Workflow
We use a **"Branch-per-Item"** release strategy in the `fruitfulinterface` repository to ensure granular metadata review and CI/CD stability.

*   **Repository**: `https://github.com/Fruitful-Global-Planet/fruitfulinterface.git`
*   **Workflow**:
    1.  Individual SQL seed files generated in `item_releases/`.
    2.  Unique branch created for each SKU (`release/banimal-bg-01`, etc.).
    3.  Individual Pull Requests (PRs) opened for metadata injection into Supabase.

## 🖼️ Asset Compliance
All product visuals are locked and verified for e-commerce compliance.
*   **Dimensions**: 2000x2000px (Amazon Zoom Compliant)
*   **Format**: High-fidelity JPG
*   **Local Directory**: `amazon-images/`
*   **DB Mapping**: Mapped to `public.bashedi_kidswear` in Supabase project `poyxundlvczciihdrkkk`.

## 📦 Logistics & Packaging
*   **Model**: FBA "Singles to Bulk" (Bale/Carton Palletization).
*   **Weights**:
    *   Short-Sleeve: ~50g per unit
    *   Long-Sleeve (No-leg): ~40g per unit
    *   Long-Sleeve (Footed): ~25g per unit
*   **Shipping**: Integrated with BobGo for SA distribution (Account unfreeze pending).

## 🛠️ Key Scripts
*   `gen_item_sql.py`: Generates the individual SQL releases.
*   `verify_img_release.py`: Audits image resolutions against e-commerce standards.
*   `gen_turnkey.py`: Produces the distribution-ready HTML summaries for partners.

## 🏁 Current Status: 🟢 Metadata Ready
All 27 item PRs are currently **Open** on GitHub for final review.
Fresh GS1 Barcodes are pending final allocation to the 59 size-SKUs.

---
*Created by Accio Work Assistant - September 17, 2026*
