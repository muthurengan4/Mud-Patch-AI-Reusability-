# Mud Patch Garment Reusability AI Engine - PRD

## Original Problem Statement
Build the Mud Patch Garment Reusability AI Engine based on the provided PDF specification. A system for evaluating garment reusability using AI vision analysis with Claude Sonnet 4.5.

## User Choices
- **AI Vision Model**: Claude Sonnet 4.5
- **Image Upload**: Both file upload and camera capture
- **Scoring Formula**: RVS formula (Q×0.30 + W×0.25 + C×0.15 + A×0.15 + B×0.10 + M×0.05)
- **Market Demand**: Static scoring with admin dashboard control
- **Brands**: Both predefined brands and manual brand input
- **Design**: Follow Mud Patch brand colors from mud-patch.com (earthy green #386641, light green #a7c957)

## User Personas
1. **Regular User**: Uploads garment images to get reusability scores and return credits
2. **Super Admin**: Manages scoring formula weights, brand categories, and market demand scores

## Core Requirements
### Must Have (P0)
- [x] Garment image upload (file + camera)
- [x] AI analysis using Claude Sonnet 4.5 (fabric type, damage, stains, brand detection)
- [x] RVS calculation with weighted formula
- [x] Return credit calculation
- [x] Suggested action based on score (Resale/Refurbish/Recycle/Downcycle/Waste)
- [x] Admin dashboard for formula weights
- [x] Brand management with categories
- [x] Product category management with market demand scores
- [x] Analysis history
- [x] QR code generation post-analysis
- [x] Shareable certificate page (/share/:analysisId)

### Should Have (P1)
- [ ] User authentication
- [ ] Image storage with analysis linking
- [ ] Export reports (PDF)
- [ ] Bulk analysis

### Nice to Have (P2)
- [ ] Mobile app version
- [ ] Integration with resale platforms for live market demand data
- [ ] Batch processing via API
- [ ] Analytics dashboard with trends

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + qrcode.react
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI Integration**: Claude Sonnet 4.5 via emergentintegrations library

## What's Been Implemented (March 27, 2026)

### Backend
- `/api/analyze` - AI garment analysis endpoint
- `/api/history` - Analysis history CRUD
- `/api/admin/settings` - Formula weights management
- `/api/admin/brands` - Brand CRUD with categories (eco_friendly, medium_quality, mass_produced)
- `/api/admin/categories` - Product category CRUD with market demand scores
- `/api/admin/seed` - Seed default brands and categories

### Frontend
- Home page with image upload/camera capture
- RVS circular gauge visualization
- Score breakdown component
- AI analysis details display
- **QR Code generation** with Mud Patch logo embedded
- **Shareable certificate page** at /share/:analysisId
- Copy link, download QR, view page buttons
- History page with analysis records
- Admin dashboard with 3 tabs:
  - Formula Weights (adjustable sliders)
  - Brands management
  - Categories management

### Data Seeded
- 10 default brands (Mud Patch, Patagonia, Zara, H&M, etc.)
- 14 product categories with market demand scores

## Prioritized Backlog
1. User authentication system
2. Image storage integration
3. PDF report generation
4. Bulk analysis feature
5. Analytics/trends dashboard

## Next Tasks
1. Implement user authentication (JWT or social login)
2. Add image storage to preserve garment photos with analysis
3. Create exportable PDF reports for businesses
