# AI Integration Strategy for WIRRE

This document outlines the architecture and approach for integrating AI-powered grading into the WIRRE platform, specifically focusing on cost-effective, highly technical evaluation of Systems Engineering assessments.

## The Core Principle: Grade the `Diff`, Not the Repo
To keep token costs manageable and ensure the AI focuses only on the candidate's actual engineering decisions, we exclusively analyze the `git diff` between the starting template and the candidate's final submission.

---

## 1. Free / Practice Rounds
**Goal:** Instant gratification, low cost, highly technical micro-feedback.

*   **Trigger:** Assessment deadline ends.
*   **Infrastructure:** CI/CD runs automated unit/integration tests and performance benchmarks (latency, throughput).
*   **AI Input:** The `git diff` + JSON results of the automated tests.
*   **AI Output:** A structured JSON containing:
    *   `score`: Integer (0-100)
    *   `feedback_snippet`: A strict 2-3 sentence technical markdown string.
*   **Example Feedback:** *"In `src/api/handler.ts:45`, you used a synchronous `fs.readFileSync` inside the main request loop, which blocks the event thread under load. Replaced with `fs.promises.readFile` to improve P99 latency."*

---

## 2. Paid / Hiring Rounds
**Goal:** Filter noise at scale (Phase 1), then provide deep, actionable, multi-faceted intelligence on the top percentage of candidates for the hiring company (Phase 2).

### Phase 1: The Mass Filter (Cheap & Fast)
*   Execute the exact same process as the **Free / Practice Round** for all candidates (e.g., all 1,000 applicants).
*   Generate a ranked leaderboard based on the AI + Test Suite scores out of 100.
*   Filter down to the Top `2 * N` candidates (where N is the number of open positions).

### Phase 2: The Deep Dive (Premium & Comprehensive)
For the Top `2 * N` candidates, we perform a deep, multi-pass analysis. **We still only use the `git diff`**, but we analyze it heavily using parallel LLM prompts, dedicating an entire completion to a specific expert persona.

1.  **Pass 1: Security Auditor**
    *   *Prompt Persona:* Senior Security Engineer.
    *   *Focus:* OWASP vulnerabilities, hardcoded secrets, SQL injections, sanitization missing in the diff.
2.  **Pass 2: Performance Engineer**
    *   *Prompt Persona:* Staff Database/Systems Engineer.
    *   *Focus:* N+1 queries, synchronous blocking, O(n^2) algorithms, memory leaks.
3.  **Pass 3: Clean Code & Architect**
    *   *Prompt Persona:* Strict Code Reviewer.
    *   *Focus:* DRY violations, variable naming, massive unreadable functions, error handling, typing.

### Phase 3: The Synthesis & Handoff
*   **The Synthesizer Prompt:** Feed the JSON results from all 3 expert passes (Security, Performance, Architecture) + the automated test metrics into a final synthesis prompt.
*   **Output:** A highly targeted, professional 1-page PDF/Markdown report for the Hiring Manager.
*   **Company UX:** The company views the leaderboard. For the Top 40, they click a "View Deep Analysis Report" button to read extreme technical details on their best prospects before committing to interviews.

---

## Advantages of this Approach
1.  **Drastically Reduced Token Costs:** Analyzing a 500-line diff 4 times is exponentially cheaper than parsing a 10,000-line repository once.
2.  **Zero Context-Window Loss:** LLMs won't hallucinate or skip files. They are forced to evaluate only the lines the candidate actually changed.
3.  **Premium Value to Companies:** Generates highly technical, irrefutable feedback (e.g., exact line numbers of N+1 queries) rather than generic AI fluff. Easy upsell for paid assessments.


# NEED TO CHANGE : MAKE SURE THAT THE PRIVATE REPOSITORIES ARE MADE EVEN IF THE TEMPLATE REPOSITORY IS PRIVATE 

# ADD EMAIL NOTIFICATIONS ABOUT ROUND STARTS, ROUND REGISTRATIONS

# ADD GOOGLE OAUTH AND INTEGRATE IT WITH THE ENTIRE CODEBASE + SUPABASE

# CREATE A NEW ROUND THAT BASICALLY IS A CODE PEER REVIEW ROUND AFTER THE 3 HORUS IS OVER. IF YOU FINSIH EARLY HTEN YOU HAVE TO WAIT TILL THOSE 3 HOURS GET OVER AS TO PREVENT GAMING THE SYSTEM WHERE 2 POEPLE CAN SUBMIT IT VERY FAST ADN TOGETHER SO IN THE RANDOM THEY BOTH ARE THE ONLY ONES.
