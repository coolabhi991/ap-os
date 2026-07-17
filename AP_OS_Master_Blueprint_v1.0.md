# AP OS — Master Blueprint v1.0

**AP Construction Operating System**
Status: Approved Architecture — Permanent Reference
Prepared for: AP Construction (Government Civil Contractor)

This document is the single, authoritative description of AP OS as it exists today. It is not a proposal — it documents the architecture that has already been built and approved. Every future implementation prompt, feature request, and development session must be consistent with this blueprint. Where a future request conflicts with this document, the conflict must be resolved explicitly (updating this blueprint) before code is written — never silently.

---

## 1. Vision

### Purpose

AP OS exists to run one specific business: a Government Civil Contractor's day-to-day construction operations, money, and paperwork, in one place, without needing a general-purpose accounting package, a separate spreadsheet system, and a separate project-tracking tool stitched together by hand.

AP OS is not built to be sold as a horizontal ERP to arbitrary construction companies. It is built to be *this* company's operating system — its vocabulary (Work Order, BOQ, Recapitulation, Running Bill, Form No. 58, Measurement Book, GST/PAN, TDS) is Indian government-contracting vocabulary, not generic ERP vocabulary, and it must stay that way.

### Business Goals

- Give the owner a single place to answer, at any moment: *What is happening on every site? How much money do I have? How much am I owed? How much do I owe? What needs my attention today?*
- Eliminate duplicate data entry. A fact is entered once — a Vendor Bill amount, a BOQ quantity, a bank transaction — and every screen that needs it reads it from that one place, never re-typed.
- Make the Running Bill (RA Bill / Form No. 58) production-grade: BOQ-accurate, auditable, and fast to prepare, because this is the document that turns work into government payment.
- Make banking the connective tissue of the whole system: every rupee that moves is traceable back to the bank transaction that moved it, and forward to the business record it paid for.
- Keep the system simple enough that the owner — not an accountant, not an IT department — can operate it directly.

### Core Philosophy

AP OS is built business-first, software-second. Every screen exists because a real, observed step in AP Construction's actual workflow needs it — not because a generic ERP template says a construction company "should" have it. When a real workflow and a generic best-practice disagree, the real workflow wins, and the software is shaped to fit it.

---

## 2. Design Principles

These principles govern every design and implementation decision in AP OS. They are listed in priority order — when two principles conflict, the higher one wins.

1. **Owner-first.** The primary user is the business owner, not a data-entry clerk or an accountant. Every screen must answer a question the owner actually asks. If a feature only serves an accountant's or auditor's convenience and not the owner's daily decision-making, it is secondary.

2. **Banking is the Heart.** The Bank Statement is the single source of financial truth. Every rupee that enters or leaves the business is a bank transaction (or a cash-book equivalent) before it is anything else. Every business record that represents money movement — a Vendor Payment, a Running Bill Receipt, a Site Expense, a Liability Repayment — is either created directly from allocating a bank transaction, or is independently traceable back to the bank transaction that settled it. Nothing is allowed to silently duplicate a bank-recorded amount.

3. **Projects are the Center.** Every piece of construction activity — a Site, a Sub Work, a BOQ item, a Vendor Bill, a Site Expense, a Running Bill — belongs to a Project. The Project is the unit the owner thinks in ("How is Jal Jeevan Mission doing?"), and the software must let every financial and physical fact be viewed rolled up to the Project level.

4. **Simple over complex.** Given a choice between a simple screen that covers 90% of real cases and a complex one that theoretically covers 100%, AP OS chooses simple. Complexity is added only when a real, observed business scenario demands it — never speculatively.

5. **Real business before ERP features.** AP OS does not implement a feature because "an ERP has this." It implements a feature because AP Construction's actual operations require it. Generic ERP concepts (multi-currency, multi-warehouse, approval-chain workflow engines, etc.) are out of scope unless a real need is demonstrated.

6. **Automation where it saves time, never where it hides the truth.** Auto-calculation (BOQ quantities, Running Bill amounts, cost roll-ups) is used aggressively wherever the arithmetic is mechanical and error-prone by hand. Automation is never used to *guess* at something a human must actually decide (e.g., which contractor a lump-sum TDS payment belongs to) — those stay manual, explicit, and auditable.

7. **Complete financial visibility.** At any point, the owner must be able to see: what has been billed, what has been received, what is outstanding, what has been spent, what is owed to vendors, what is owed to lenders, and what the real cash position is — without manually reconciling multiple screens.

8. **Audit trail everywhere.** Every financial record must be able to answer "where did this money come from / go to" and "who created this, and when." No financial fact exists in the system with no traceable origin.

---

## 3. Navigation Structure

AP OS uses a single, flat, always-visible sidebar. There is no nested mega-menu — every module is one click away. The sidebar order below reflects the actual order of use in AP Construction's workflow: it begins with situational awareness (Dashboard, AI), moves through the operating entities (Projects, Clients, Vendors, Employees, Labour), then the money-and-paperwork modules that flow from daily site work (Vendor Bills → Vendor Payments → Site Expenses → Daily Progress Reports → Running Bills), then the company-wide financial control modules (Banking → Partnership → Finance), and finishes with cross-cutting utility (Reports, Settings).

| # | Module | Purpose |
|---|---|---|
| 1 | **Dashboard** | The owner's desk. A single screen answering "what needs my attention today" and "how is the business doing overall" — see Section 5. |
| 2 | **AP AI** | A natural-language question-and-answer assistant over AP OS's own data ("How much Security Deposit is pending on Malunje?", "Show TDS project-wise"). It never invents numbers — every answer is generated by querying the real underlying records, the same ones the rest of the app reads. |
| 3 | **Projects** | The center of the system. One Project per Work Order / Government contract. Holds Sites, Sub Works, BOQ, Documents, and rolls up every downstream cost and billing figure — see Section 6. |
| 4 | **Clients** | The government departments / clients AP Construction contracts with. Each Client can own multiple Projects. |
| 5 | **Vendors** | Every supplier and subcontractor AP Construction pays. Vendor master data, bank accounts, and (via Vendor Bills/Payments) the full payables ledger per vendor. |
| 6 | **Employees** | Lightweight internal staff registry — not a payroll/HR module. Exists so bank-allocated Salary/Site Advance/Personal Advance payments can be tagged to a real person for reporting, without building a full HR system. |
| 7 | **Labour** | The site/project daily-wage workforce — distinct from Employees. Attendance-driven wage calculation, advances, and payments to labourers and labour contractors. |
| 8 | **Vendor Bills** | The payable-side billing record: what a vendor has billed AP Construction for materials or services, tied to a Site/Project (and optionally a Sub Work, Purchase Order, or Material Receipt). This is where **Site Cost is recognized** — the moment a Vendor Bill is created, not when it is eventually paid. |
| 9 | **Vendor Payments** | The settlement side of a Vendor Bill: money actually paid out to a vendor, reducing the Bill's outstanding balance. Deliberately separate from Vendor Bills because "we owe this" and "we paid this" are different facts with different timing. |
| 10 | **Site Expenses** | Direct, non-vendor-bill site costs — cash-book-style expenses recorded against a Project/Site (materials, labour wage payouts logged as expense, machinery/fuel costs, general site running costs). |
| 11 | **Daily Progress Reports** | The site diary — what happened on site today: labour present, work executed, visitors, weather, material received. The physical-progress counterpart to the financial records. |
| 12 | **Running Bills** | The government-billing module. One Running Bill = one Government Form No. 58 (RA Bill). This is the document that converts certified work into a government payment claim — see Section 7. |
| 13 | **Banking** | The financial control center — bank statement import, transaction allocation, and every banking report. This is the heart of the system's money-tracking — see Section 8. |
| 14 | **Partnership** | Owner and Partner capital: investments into the business, settlements paid out, profit-sharing, and the allocation ledger tying partner money to real bank movement. |
| 15 | **Finance** | Company-wide borrowings: Liabilities (loans, Cash Credit, Overdraft, Credit Cards), their repayment history, interest history, and finance-specific reports/dashboard — see Section 9. |
| 16 | **Reports** | A single hub linking out to every domain's own reports (Project, Vendor, Financial/Banking, Labour, Expense, Government) — see Section 10. |
| 17 | **Settings** | Company-wide configuration masters. Currently: Categories (the Transaction-Type-scoped classification master used across Banking's Transaction Allocation) — see Section 11. |

---

## 4. Complete Business Workflow

This is the real, end-to-end lifecycle of a piece of government construction work in AP Construction, from the moment work is awarded to the moment the project is closed out financially. Every module in AP OS exists to serve one or more stages of this chain.

```
Receive Work Order
      ↓
Start Project
      ↓
Daily Site Execution
      ↓
Vendor Bills  ──────────┐
      ↓                 │
Site Expenses  ─────────┤ (Site Cost is recognized here — at
      ↓                 │  creation, not at payment)
Running Bill            │
      ↓                 │
Government Submission   │
      ↓                 │
Government Payment      │
      ↓                 │
Project Completion  ←───┘
```

**1. Receive Work Order.** A government client awards a contract. This becomes a Project in AP OS: Client, contract value (Agreement Value), Work Order details, and BOQ (Bill of Quantities) are entered once, here, and never re-typed anywhere downstream.

**2. Start Project.** The Project is broken into Sites (physical locations of work) and Sub Works (the BOQ-level breakdown of what's being built at each site). Budget heads (Material, Labour, Machinery, Fuel, Vendor Bills, Site Expenses, Other) are set per Sub Work, giving a Budget vs. Actual baseline from day one.

**3. Daily Site Execution.** Work happens on site. Daily Progress Reports capture what occurred each day — labour present, work executed, materials received, visitors, weather. Measurement Books record the physical quantities of work actually completed against BOQ items, and go through an approval flow before they can be billed.

**4. Vendor Bills & Site Expenses (parallel, ongoing).** As work consumes materials and services, two kinds of cost land on the Project:
- A **Vendor Bill** is raised when a vendor invoices AP Construction (with or without a Purchase Order/Material Receipt behind it) — this is the moment Site Cost is recognized, regardless of when it's eventually paid.
- A **Site Expense** is a direct cost recorded against the Site (machinery, fuel, minor material, general running costs) without going through a vendor billing cycle.

Both feed the Project's real-time Budget vs. Actual and Cost-by-Sub-Work figures continuously, not just at billing time.

**5. Running Bill.** Once a Measurement Book is approved, its quantities can be billed. A Running Bill (Form No. 58) is generated: BOQ-accurate, auto-calculating Previous Quantity, Current Quantity, and Now-to-Pay amounts per item, netting out statutory deductions (Security Deposit, GST, Income Tax/TDS, Labour Cess, Royalty, Insurance) to arrive at Net Payable.

**6. Government Submission.** The Running Bill goes through a submission checklist and is submitted to the government department (the Client) for certification/passing.

**7. Government Payment.** The government pays — money lands in a company bank account. That bank statement line is allocated as a Running Bill Receipt, reducing the bill's outstanding amount and, in aggregate, the Project's outstanding receivable.

**8. Project Completion.** Once all Running Bills for a Project reach Fully Paid and physical progress reaches 100%, the Project is closed out — its full financial history (billed, received, spent, outstanding) remains permanently visible for record-keeping and audit.

---

## 5. Dashboard Philosophy

The Dashboard is the **Business Control Center** — the owner's desk. It is not a generic analytics page; every panel on it answers a question the owner asks first thing in the morning.

- **Today's Priorities.** What actually needs the owner's attention right now — overdue Running Bill submissions, vendor bills nearing due date, low bank balances, pending allocations. This panel is action-oriented, not descriptive.
- **Project Overview.** A rolled-up view across every active Project: physical progress, financial progress (billed vs. received vs. spent), and which projects are behind or at risk.
- **Banking Summary.** Real, current bank position across every account — Imported Bank Balance, and (where relevant) Operational Balance including pending internal transfers not yet confirmed by the destination statement.
- **Government Receivables.** What is currently owed to AP Construction by government clients — outstanding Running Bill amounts, aged by how long they've been outstanding.
- **Vendor Payables.** What AP Construction currently owes its vendors — outstanding Vendor Bill amounts, which are overdue.
- **Project Drill-Down.** From any summary figure on the Dashboard, the owner can drill straight into the specific Project, Site, or Bill behind it — the Dashboard is a starting point for investigation, never a dead end.

The guiding rule: if a number appears on the Dashboard, clicking it must take the owner somewhere real, never to a static report the owner can't act on.

---

## 6. Project Philosophy

The Project is the organizing unit of AP OS. Every other module either belongs to a Project directly, or exists to serve a Project's needs (a Vendor exists to be paid by Projects; a Bank Transaction exists to be allocated to Projects' costs and receipts).

A Project holds, in one place:

- **Work Order** — the government contract itself: Client, Agreement/Contract Value, dates, and reference numbers.
- **BOQ (Bill of Quantities)** — the itemized scope of work with quantities and rates, entered once and reused by every downstream Measurement Book and Running Bill line item — never re-typed.
- **Sites** — the physical location(s) where the Project's work happens. A Project can span multiple Sites; each Site carries its own cost roll-up, budget, and Site Workspace (Recapitulation, Financial summary, Documents).
- **Documents** — contracts, drawings, government letters, technical/administrative approvals — polymorphically attached to whichever entity they belong to (Project, Site, Vendor, Client, Purchase Order, Vendor Bill, etc.), never duplicated per attachment point.
- **Financial Progress** — real-time, computed (never separately stored) roll-up of Agreement Value, Gross Billing, Deductions, Net Bills Raised, Client Payments Received, and Outstanding — always traceable down to the individual Running Bill or cost record behind each figure.
- **Physical Progress** — the average of each Sub Work's manually-tracked physical completion percentage, giving an honest "how much is actually built" figure independent of how much has been billed.
- **Timeline** — the chronological history of what happened on the Project: bills raised, payments received, major cost events.
- **Completion** — a Project's lifecycle naturally ends when its billing is fully paid and its physical progress reaches completion; its full record remains permanently queryable.

---

## 7. Running Bill Philosophy

The Running Bill is the single most important document AP OS produces — it is the direct system representation of one Government **Form No. 58** (one RA Bill). Its accuracy is non-negotiable, because it is the document that turns completed work into a government payment claim.

- **Form No. 58.** Every Running Bill *is* a Form 58 — not "based on" one. The screen's structure, fields, and printed output mirror the government form exactly, so the owner never has to manually re-transcribe AP OS's numbers onto a separate government document.
- **BOQ Integration.** Every Running Bill line item is drawn directly from the Project's BOQ (via the approved Measurement Book) — quantities and rates are never re-typed, only confirmed.
- **Previous Quantity / Current Quantity / Now-to-Pay.** For every BOQ item, the bill tracks the cumulative quantity billed to date (Previous), the quantity being billed in this bill (Current = this bill's Measurement Book contribution), and the resulting Now-to-Pay amount — the running, to-date nature of government billing is a first-class concept, not an afterthought.
- **Auto Calculations.** Item amounts, cumulative totals, and Net Payable (Gross Certified minus statutory deductions — Security Deposit, GST, Income Tax/TDS, Labour Cess, Royalty, Insurance, Fines, Other) are always calculated by the system from the underlying BOQ/Measurement Book data — never manually entered and never allowed to drift from what the line items actually sum to.
- **Submission Checklist.** Before a bill is marked submitted, a checklist confirms the paperwork and figures are ready for government submission — catching errors before they reach the client, not after.
- **Payment Slip.** A clean, printable record of what was actually paid against the bill, for the owner's and the government's records.
- **Payment Tracking.** Every rupee received against a Running Bill is tracked individually (via Banking's Running Bill Receipt allocation), so a bill's status (Draft → Submitted → Passed → Partially Paid → Fully Paid) always reflects real, bank-confirmed money — never a manual status flag disconnected from actual receipts.
- **Timeline.** The full history of a bill — when it was created, submitted, passed, and each payment received against it — stays visible for the life of the record.

---

## 8. Banking Philosophy

Banking is the heart of AP OS (Design Principle #2). Every other module's financial figures ultimately trace back to a bank transaction. Banking's job is to make that traceability automatic, not something the owner has to manually reconstruct.

- **Statement Import.** Bank statements are imported directly (Excel/CSV) rather than manually re-typed line by line. An imported statement row is permanently read-only — the system's single source of truth for "what actually happened to the money" is never edited after the fact, only ever allocated. Duplicate-import protection (by file hash and by row-level matching) prevents the same statement from being loaded twice.
- **Allocation.** Every bank transaction must be allocated to a business purpose — "where did this money go / come from." Allocation is the single mechanism through which a bank transaction becomes a Vendor Payment, a Running Bill Receipt, a Site Expense, a Liability Repayment, a Partner Investment/Settlement, or one of the classified tag-only categories (Bank Charges, TDS Payment, GST, Internal Transfer, OD/CC Interest, and others) — never a second, parallel data-entry path that could drift from the bank statement.
- **Money Manager Matching.** Where an allocation creates or matches against an existing business record (a Vendor Bill, a Running Bill, a Liability), the system verifies that record's ownership and status before trusting it — money is never applied to the wrong bill or a bill that doesn't belong to the same tenant.
- **Business Partner Allocation.** Money moving to or from Partners/Owners (capital investment, profit settlement) is allocated the same way as any other business-purpose allocation — through the same Transaction Allocation mechanism, keeping partner money fully auditable alongside every other rupee.
- **Internal Transfer.** Money moving between AP Construction's own bank accounts is tagged as an Internal Transfer to a specific destination account — never treated as an expense or income. Where the destination account's statement hasn't been imported yet, no fake transaction is invented; instead the amount shows as a **Pending Transfer** on the destination account (Pending Incoming / Pending Outgoing, netted into an Operational Balance alongside the real Imported Balance) until the real statement arrives and confirms it — at which point the pending figure automatically resolves into the real, imported balance.
- **Bank Charges (and TDS Payment, GST, and similar classified-but-unbilled amounts).** Bank-generated fees and lump-sum statutory payments are allocated using the bank's own original statement narration — never re-typed into a separate classification scheme. Where useful, they can optionally be tagged with a Category (see Section 11) scoped to that same allocation type, without ever requiring it.
- **Audit Trail.** Every business record created by allocating a bank transaction permanently carries its source — the account, the statement date, the original narration, and the transaction it came from — and every bank transaction can show every business record it produced. The chain is always walkable in both directions.

---

## 9. Finance Philosophy

Finance is AP OS's company-wide financial-position module — distinct from Banking (which is transaction-level) and Projects (which are cost-level). Finance answers "what is the company's overall financial standing," not "what happened on this site."

- **Receivables.** What is owed *to* AP Construction — primarily government Running Bill outstanding amounts, rolled up across all Projects.
- **Payables.** What is owed *by* AP Construction — Vendor Bill outstanding balances, rolled up across all Vendors.
- **Ledger.** The Liability Master — every borrowing the company carries (Home/Vehicle/Gold/Bank Loans, Cash Credit, Overdraft, Credit Cards, Friend/Relative/Private/Personal loans), each with its own sanctioned amount, outstanding balance, and lifecycle status.
- **Cash Flow.** The real, bank-derived movement of money in and out of the company over time — never a projection, always a reflection of what the bank statements actually show.
- **Liabilities.** Full lifecycle tracking per liability: disbursement, repayment history, and outstanding balance — status (Active / On Hold / Closed) is owner-controlled for revolving facilities (Cash Credit, Overdraft, Credit Cards), since those legitimately touch zero balance mid-cycle without being "paid off," while term loans (fixed-principal loans) still auto-close on full repayment as a convenience default.
- **Interest.** Interest paid across every liability, rolled up by liability type, so the true cost of borrowing is always visible — separate from principal repayment, which reduces outstanding balance; interest never does.
- **Financial Summary.** The single-page roll-up of the company's overall position — total liabilities, total outstanding, monthly EMI/interest burden, and credit-facility utilization — giving the owner a lender's-eye view of the business's own financial health.

---

## 10. Reports Philosophy

All reports live under one menu — a single Reports hub the owner can always find, rather than reports being scattered and undiscoverable across individual modules. The hub links out to each domain's own report pages, because a report is most useful when it lives next to the data and filters it's built from, but it must always be *reachable* from one central place.

- **Project Reports.** Reached via a Project's own Control Center / Reports tab — financial and physical progress, cost breakdowns, budget vs. actual.
- **Finance Reports.** Liability-side reporting — Loan Ledger, Interest Paid, EMI Schedule/Calendar, Credit Card and Cash-Credit Utilization, Bank-wise Repayment, Funding Source, Liability Timeline.
- **Government Reports.** Measurement Book Register/Abstract Register, and the Running Bill (RA Bill / Final Bill) Register — the reports a government audit would actually ask for.
- **Vendor Reports.** Billed, paid, outstanding, and overdue amounts per vendor, plus each Vendor's own full payment Ledger.
- **Banking Reports.** Bank Book, Cash Book, Bank Reconciliation, Cash Flow, Receivables, Payables, Outstanding Summary, Bank Charges, TDS Payments, and the Internal Transfer Register — everything Banking's allocation data can be rolled up into.

Every report in AP OS is computed on demand from the same underlying records the rest of the app uses — never a separately maintained, second copy of a number that could drift from the source of truth.

---

## 11. Settings Philosophy

Settings holds company-wide configuration — the masters that shape how other modules behave, rather than transactional business data itself.

- **Categories.** The general classification master. Each Category belongs to exactly one Transaction Type (the fixed set of Banking allocation purposes — Site Expense, Bank Charges, GST, TDS Payment, and others that benefit from optional sub-classification). Categories can be added, edited, and activated/deactivated — never hard-deleted once in use, to preserve the history of every record that referenced them. Categories loaded anywhere in the app (e.g., Transaction Allocation) are always fetched live and filtered to the relevant Transaction Type — never a hardcoded list.
- **Company, Users, Banks, Backup, Notifications, Integrations, Preferences.** Recognized as the natural remaining scope of a Settings area for a system like AP OS — company profile and tax details, user accounts and access, the bank account master, data backup, notification preferences, and any future external integrations. These are documented here as the intended shape of Settings going forward; each is implemented when a real operational need makes it the next priority, following this same blueprint rather than being designed ad hoc when the moment comes.

---

## 12. UI/UX Standards

- **Modern macOS.** AP OS is designed macOS-first — clean typography, generous whitespace, subtle shadows and rounded surfaces, and interactions that feel native to a Mac desktop experience rather than a dense, Windows-era enterprise data grid.
- **Clean.** Every screen shows what's needed for the task at hand and nothing more. Dense data tables are used where the task genuinely is "scan a list," never as a default layout choice.
- **Minimal.** No decorative UI. Every element on screen earns its place by serving the owner's task.
- **Fast.** Screens load quickly and respond immediately to input. Data is fetched live (never faked with stale caches) but without making the owner wait on unnecessary round-trips.
- **Owner-focused.** Every screen is designed for the person running the business, not for a specialist user persona. Language, terminology, and default views match how the owner already thinks about the business (construction and government-billing vocabulary, not generic ERP jargon).
- **No unnecessary screens.** A screen is only built when a real workflow needs it. Placeholder pages, "coming soon" screens, and speculative empty modules are not part of the product.
- **Consistent layouts.** Every module follows the same structural conventions — the same page-header pattern, the same list/filter/table shape, the same Add/Edit/View pattern, the same status-badge conventions — so that learning one module teaches the owner how every other module works.

---

## 13. Development Standards

- **Production quality.** Code shipped into AP OS is held to a production bar, not a prototype bar — proper error handling at the boundaries that matter, correct multi-tenant data isolation, and no code paths that are known to be broken left in place.
- **Modular.** The system is organized in clear layers (routes → controllers → services → data layer on the backend; pages → components → services on the frontend), and each domain module is self-contained within that layered structure.
- **Reusable components.** Shared UI patterns (loading states, empty states, error banners, status badges, page layout) and shared backend patterns (DTO mapping, multi-tenant scoping, numbering conventions) are implemented once and reused everywhere they apply — never quietly reimplemented per-screen.
- **No duplicate logic.** A business rule or calculation is implemented in exactly one place. Every other screen or report that needs that fact reads it from that one place — it is never recalculated a second, independent way that could disagree with the first.
- **Business-first.** Architecture decisions are made in service of the real business workflow described in Section 4, not in service of following a generic software-architecture pattern for its own sake.

---

## 14. Database Principles

- **Single source of truth.** Every fact is stored exactly once, in the model that owns it. Figures that can be derived from other stored data (running balances, outstanding amounts, cost roll-ups) are computed on demand rather than duplicated into a second stored column that could drift out of sync.
- **Audit everywhere.** Every record that represents a business event carries who created it and when. Every business record that originates from a bank allocation carries a permanent, walkable link back to the source bank transaction.
- **Soft delete.** Financial and historical records are never hard-deleted once they represent real business activity that occurred — they are deactivated/soft-deleted, preserving history for audit while removing them from active use. Master data with no transactional history behind it may be hard-deleted; the moment it has been used, it converts to soft-delete-only.
- **Relationships.** Every tenant-scoped record is explicitly owned by a Company (the tenant root), and every cross-entity relationship (Project ↔ Site, Vendor Bill ↔ Vendor, Bank Transaction ↔ Allocation ↔ business record) is a real, enforced relationship — never an implicit link inferred by naming convention or manual matching.
- **Scalable.** Every tenant-scoped table is indexed on its tenant key and on the fields it is commonly filtered or sorted by, so the system continues to perform correctly as a company's transaction history grows over years of real use.

---

## 15. Testing Standards

- **Use real business data.** AP OS is verified against AP Construction's own real, live data wherever possible — real bank statements, real vendors, real projects — not synthetic placeholder data that might hide a real-world edge case.
- **No dummy workflows.** A feature is not considered complete because it works against a contrived, simplified test scenario. It is complete when it has been exercised against the actual shape of AP Construction's real operations.
- **Every module must be tested with real AP Construction scenarios.** Before any feature is considered done, it is verified end-to-end through the same interface the owner will actually use, using scenarios drawn from how AP Construction genuinely operates — a real Running Bill, a real vendor payment, a real bank statement import — with any temporary test data fully cleaned up afterward so production records are never left altered or polluted by verification.

---

*End of AP OS Master Blueprint v1.0. This document is the permanent architectural reference for AP OS. Future implementation work follows this blueprint; changes to the approved architecture require this document to be explicitly revised, not silently diverged from.*
