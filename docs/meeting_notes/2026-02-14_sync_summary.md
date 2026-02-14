## Saturday Sync Summary
**Date:** February 14, 2026  
**Attendance:** Michael, Ishan, Sean, Tony, Bryana

---

**Frontend (Ishan)**
- Quiet week; main features wrapped up prior week
- Tested and approved PR #30, verified no conflicts
- Added frontend documentation to Phase II deliverable
- Will implement start/end date range picker (replacing "last X days" dropdown)
- Will use date range parameters in usages API requests per Sean's guidance

**Backend (Sean)**
- API structure refactor PR merged; response format locked in
- Found Ishan's budget POST call in api.js, will build backend endpoint to match
- Proposed two performance approaches: SQL GROUP BY summary endpoint or pre-calculated daily cache table
- Reminded team that date range filtering is available in usages GET request
- Spotted config.js limit regression (50K reverted to 100) during sync

**Database (Tony)**
- Successfully restored usages table after accidental mass deletion
- Workaround required: cloned full database in Azure (student account blocks import/export)
- Confirmed data range: November 1 – January 26
- Will verify all 30 service types are distributed across providers in usages
- Connecting with Sean post-meeting on summary endpoint approach

**Testing (Bryana)**
- No testing activity this week
- Waiting for team to finish changes before beginning test execution

**Project Lead (Michael)**
- PR #30 merged: global navbar filters, FR-08 resource metrics, GCP trend line, 5 defects closed
- 7 of 8 functional requirements demo-ready
- 143 automated tests passing (49 pytest, 94 Jest)
- Load time at 4.8s vs 3s target — deprioritized in favor of deliverable prep
- Identified date range approach misalignment with project plan
- Phase III idea noted: cross-provider cost comparison in waste alerts

---

**Defects Identified**
- Config.js regression: DEFAULT_LIMIT reverted to 100 during latest merge
- Sean and Tony both confirmed seeing the issue
- Michael to investigate and push fix

---

**Decisions**
- Date range selector will change from "last X days" to explicit start/end date picker
- Performance optimization (summary endpoint) is lower priority — after budget endpoint
- Cross-provider cost comparison deferred to Phase III
- Demo date is "January 26" to align with database date range
- All code changes due Monday EOD for Tuesday Phase II submission

---

**Action Items**
- Sean: Build POST /api/v1/budgets endpoint matching api.js call
- Michael: Fix config.js limit regression, push to main
- Tony: Verify service type distribution in usages, connect with Sean on summary endpoint
- Ishan: Implement start/end date picker, use date range params in API calls
- Bryana: Begin testing once changes stabilize
- Michael: Post User Guide skeleton to chat Monday/Tuesday
- Everyone: Phase II zip + report submission by Tuesday Feb 17
