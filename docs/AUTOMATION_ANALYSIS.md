# Automation Possibilities for WIRRE

## Can This Be Fully Automated?

**SHORT ANSWER:** Almost, but GitHub Classroom assignment creation is the bottleneck.

---

## What CAN Be Automated ✅

### 1. Ownership Transfer Request (YES ✅)

```javascript
// Company provides: https://github.com/company/repo-name
// WIRRE sends transfer request

async function requestRepoTransfer(companyRepo, assessmentId) {
  const [owner, repo] = companyRepo.replace('https://github.com/', '').split('/');
  
  // Send transfer request via GitHub API
  // Requires: GitHub App installed on company's account OR company's OAuth token
  
  const { data } = await octokit.repos.transfer({
    owner: owner,
    repo: repo,
    new_owner: 'wirrecompany',
  });
  
  // Store pending transfer
  await db.assessments.update({
    id: assessmentId,
    github_repo_pending: `${owner}/${repo}`,
    transfer_status: 'pending',
  });
  
  return {
    status: 'pending',
    message: 'Transfer request sent. Company needs to accept.',
  };
}
```

**Requirements:**
- Company must grant WIRRE's GitHub App admin access to their repo, OR
- Company provides OAuth token with repo admin scope

**When accepted:**
- Webhook notifies WIRRE
- Repo is now `wirrecompany/repo-name`

### 2. Make it a Template (YES ✅)

```javascript
// Automatically runs when transfer completes

webhooks.on('repository.transferred', async ({ payload }) => {
  const { repository } = payload;
  
  // Make it a template
  await octokit.repos.update({
    owner: 'wirrecompany',
    repo: repository.name,
    is_template: true,
  });
  
  // Update database
  await db.assessments.update({
    where: { github_repo_pending: payload.changes.owner.from + '/' + repository.name },
    data: {
      github_repo: `wirrecompany/${repository.name}`,
      transfer_status: 'completed',
      template_ready: true,
    },
  });
});
```

**100% Automated** ✅

---

## What CANNOT Be Fully Automated ❌

### 3. GitHub Classroom Assignment Creation (NO ❌)

**THE PROBLEM:**

GitHub Classroom does not have a public API for creating assignments programmatically.

**What exists:**
- ✅ Webhooks (track when assignments are accepted)
- ✅ Roster API (list students/assignments)
- ❌ NO "Create Assignment" API endpoint

**Why this is a problem:**
- You must manually create assignments in the Classroom UI
- Cannot automate: "Create assignment from template X with deadline Y"

**Current workaround options:**

#### Option A: Semi-Automated (Recommended for MVP)

```javascript
// 1. WIRRE automates everything up to template creation
// 2. Sends notification to admin:

async function notifyTemplateReady(assessmentId) {
  const assessment = await db.assessments.findById(assessmentId);
  
  // Send email/notification to WIRRE admin
  await sendAdminNotification({
    subject: 'New Template Ready - Create Classroom Assignment',
    body: `
      Template: wirrecompany/${assessment.github_repo}
      
      Create assignment:
      1. Go to: https://classroom.github.com/classrooms/[your-id]
      2. New Assignment
      3. Template: wirrecompany/${assessment.github_repo}
      4. Deadline: ${assessment.deadline}
      5. Copy invitation URL
      6. Paste here: https://wirre.dev/admin/assessments/${assessmentId}/classroom-url
    `,
  });
  
  // Mark as waiting for manual step
  await db.assessments.update({
    id: assessmentId,
    status: 'awaiting_classroom_setup',
  });
}
```

**Admin does:**
- Creates assignment in Classroom UI (2 minutes)
- Copies invitation URL
- Pastes into WIRRE admin dashboard

#### Option B: Unofficial Classroom API (Risky)

Some developers have reverse-engineered the Classroom UI to automate it:

```javascript
// WARNING: Unofficial, could break anytime
// GitHub Classroom UI makes these requests internally

async function createClassroomAssignment(templateRepo, deadline) {
  // This mimics what the UI does
  // Requires session cookies from logged-in admin
  
  const response = await fetch('https://classroom.github.com/api/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': process.env.CLASSROOM_SESSION_COOKIE, // From logged-in admin
    },
    body: JSON.stringify({
      classroom_id: process.env.CLASSROOM_ID,
      title: `Assessment ${Date.now()}`,
      starter_code_repository: templateRepo.id,
      deadline: deadline,
      max_members: 1,
      visibility: 'private',
    }),
  });
  
  return response.json();
}
```

**Problems:**
- ❌ Unofficial, undocumented
- ❌ Could break anytime GitHub updates Classroom
- ❌ Requires storing admin session cookies (security risk)
- ❌ Not recommended for production

#### Option C: Request GitHub Add the API (Long-term)

GitHub Classroom is open source: https://github.com/education/classroom

You could:
1. File a feature request for assignment creation API
2. Contribute a PR to add it
3. Wait for GitHub to implement it

**Timeline:** Months to years

---

## Recommended Automation Flow (Realistic)

### Fully Automated Parts:

```
1. Company provides repo URL
   ↓
2. WIRRE sends transfer request (API) ✅ AUTOMATED
   ↓
3. Company accepts transfer
   ↓
4. Webhook → WIRRE receives transfer ✅ AUTOMATED
   ↓
5. WIRRE makes it template (API) ✅ AUTOMATED
   ↓
6. WIRRE sends notification to admin ✅ AUTOMATED
```

### Manual Step (2 minutes):

```
7. Admin creates Classroom assignment (UI) ⚠️ MANUAL
   ↓
8. Admin copies invitation URL ⚠️ MANUAL
   ↓
9. Admin pastes URL into WIRRE admin panel ⚠️ MANUAL
```

### Fully Automated Again:

```
10. WIRRE stores classroom URL ✅ AUTOMATED
    ↓
11. WIRRE publishes assessment ✅ AUTOMATED
    ↓
12. Candidates register & see URL ✅ AUTOMATED
    ↓
13. Candidates accept assignment ✅ AUTOMATED
    ↓
14. Private repos created ✅ AUTOMATED
```

---

## Implementation with Current Limitations

### Backend API Endpoint

```javascript
// POST /api/assessments/:id/setup-github

app.post('/api/assessments/:id/setup-github', async (req, res) => {
  const { id } = req.params;
  const { company_repo_url } = req.body;
  
  // 1. Send transfer request
  const transfer = await requestRepoTransfer(company_repo_url, id);
  
  // 2. Update assessment status
  await db.assessments.update({
    id: id,
    status: 'pending_transfer',
    github_repo_url: company_repo_url,
  });
  
  res.json({
    status: 'pending',
    message: 'Transfer request sent. Waiting for company to accept.',
    next_steps: [
      'Company will receive an email to accept transfer',
      'Once accepted, WIRRE will automatically set up the template',
      'Admin will receive notification to create Classroom assignment',
    ],
  });
});

// Webhook handler
app.post('/webhooks/github', async (req, res) => {
  const { action, repository } = req.body;
  
  if (action === 'transferred' && repository.owner.login === 'wirrecompany') {
    // Auto-make template
    await octokit.repos.update({
      owner: 'wirrecompany',
      repo: repository.name,
      is_template: true,
    });
    
    // Find assessment
    const assessment = await db.assessments.findOne({
      github_repo_url: { like: `%${repository.name}` },
      status: 'pending_transfer',
    });
    
    if (assessment) {
      // Update status
      await db.assessments.update({
        id: assessment.id,
        status: 'awaiting_classroom_setup',
        github_repo: `wirrecompany/${repository.name}`,
      });
      
      // Notify admin
      await notifyAdmin({
        assessment_id: assessment.id,
        repo: repository.name,
        action: 'create_classroom_assignment',
      });
    }
  }
  
  res.json({ received: true });
});

// Admin completes setup
app.post('/api/admin/assessments/:id/classroom-url', async (req, res) => {
  const { classroom_url } = req.body;
  
  await db.assessments.update({
    id: req.params.id,
    github_classroom_url: classroom_url,
    status: 'ready',
  });
  
  res.json({ success: true });
});
```

---

## Summary

| Step | Automated? | Notes |
|------|-----------|-------|
| Company provides URL | N/A | Manual input |
| Send transfer request | ✅ YES | GitHub API |
| Company accepts | N/A | Manual by company |
| Make template | ✅ YES | GitHub API + Webhook |
| Create Classroom assignment | ❌ NO | Must use UI (2 min) |
| Store classroom URL | ⚠️ Semi | Admin copies from UI |
| Show to candidates | ✅ YES | Fully automated |
| Accept assignments | ✅ YES | Classroom handles it |

**Result:** ~95% automated, with one 2-minute manual step per assessment.

---

## Alternative: Skip GitHub Classroom Entirely

If you MUST have 100% automation, you could:

**Build your own assignment distribution:**

```javascript
// Instead of Classroom, WIRRE creates repos directly

async function createCandidateRepo(candidateUsername, templateRepo, assessmentId) {
  // 1. Create repo from template
  const { data } = await octokit.repos.createUsingTemplate({
    template_owner: 'wirrecompany',
    template_repo: templateRepo,
    name: `assessment-${assessmentId}-${candidateUsername}`,
    private: true,
    owner: 'wirrecompany',
  });
  
  // 2. Add candidate as collaborator
  await octokit.repos.addCollaborator({
    owner: 'wirrecompany',
    repo: data.name,
    username: candidateUsername,
    permission: 'push',
  });
  
  return data;
}
```

**Trade-offs:**
- ✅ 100% automated
- ✅ Full control
- ❌ No deadline enforcement (build yourself)
- ❌ No Classroom UI benefits
- ❌ More code to maintain
- ❌ Have to handle edge cases

**Recommendation:** Stick with Classroom + 2-minute manual step. The benefits outweigh the minor manual work.
