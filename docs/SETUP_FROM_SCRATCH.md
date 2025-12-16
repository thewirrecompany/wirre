# WIRRE Setup Guide - Start from Scratch

You have: Empty GitHub organization `wirrecompany`

Let's set up everything step by step.

---

## Part 1: GitHub Classroom Setup (15 minutes)

### Step 1: Access GitHub Classroom

1. Go to: **https://classroom.github.com/**
2. Click **Sign in**
3. Sign in with the GitHub account that owns `wirrecompany` org

### Step 2: Create Your Classroom

1. Click **New classroom**
2. Select organization: **wirrecompany**
3. Classroom name: `WIRRE Assessment Platform`
4. Add co-administrators: (skip for now, can add later)
5. Click **Create classroom**

✅ **Done!** You now have a classroom at:
```
https://classroom.github.com/classrooms/[your-classroom-id]
```

Bookmark this URL - you'll use it for every assessment.

---

## Part 2: Test the Flow (30 minutes)

Let's do a complete test run to make sure everything works.

### Step 3: Create a Test Repository

1. On your **personal GitHub account** (not wirrecompany):
   - Create a new repo: `test-hiring-challenge`
   - Make it **public**
   - Add a README.md with some instructions:
     ```markdown
     # Backend Challenge
     
     ## Problem
     Fix the bug in the authentication system.
     
     ## Requirements
     - Fix the login endpoint
     - Add tests
     - Document your changes
     ```
   - Add some code files (doesn't matter what, just to simulate a real challenge)

### Step 4: Transfer Repo to wirrecompany

1. Go to your test repo settings
2. Scroll to **Danger Zone**
3. Click **Transfer ownership**
4. New owner: `wirrecompany`
5. Type the repo name to confirm
6. Click **I understand, transfer this repository**

✅ Repo is now: `wirrecompany/test-hiring-challenge`

### Step 5: Make it a Template

1. Go to `wirrecompany/test-hiring-challenge` settings
2. Under **General** → check ✓ **Template repository**
3. Save

### Step 6: Create Classroom Assignment

1. Go back to your classroom: `classroom.github.com/classrooms/[id]`
2. Click **New assignment**
3. Fill in:
   - **Assignment title**: `Test Backend Challenge`
   - **Assignment deadline**: Tomorrow (just for testing)
   - **Repository visibility**: Private
   - **Grant students admin access**: Unchecked (leave default)
   - **Template repository**: Select `wirrecompany/test-hiring-challenge`
4. Click **Create assignment**

✅ **You'll get an invitation URL like:**
```
https://classroom.github.com/a/AbC123XyZ
```

**COPY THIS URL!** This is what candidates will use.

### Step 7: Test as a Candidate

1. Open the invitation URL in **incognito/private browser**
2. Sign in with a **different GitHub account** (your personal one, or create a test account)
3. Click **Accept this assignment**
4. Wait ~30 seconds

✅ **GitHub Classroom will create:**
```
wirrecompany/test-hiring-challenge-yourname
```

This repo is:
- ✅ Private
- ✅ Only visible to you + wirrecompany org
- ✅ Pre-filled with the template code

### Step 8: Verify You Can See Candidate Repos

1. Go to: `https://github.com/orgs/wirrecompany/repositories`
2. You should see:
   - `test-hiring-challenge` (template)
   - `test-hiring-challenge-yourname` (candidate's private repo)

3. Click on the candidate repo
4. You can see all their code, commits, etc!

✅ **IT WORKS!**

---

## Part 3: Production Setup

Now you know it works. Here's what to do for real assessments.

### For Each Company Assessment:

#### A. Company Creates & Transfers Repo

**Instructions to send to company:**
```
1. Create a GitHub repository with your hiring challenge
2. Add a clear README with:
   - Problem description
   - Requirements
   - What candidates should fix/build
   - How long they have
3. Go to repo Settings → Transfer ownership
4. New owner: wirrecompany
5. Confirm the transfer
```

#### B. You Receive & Setup (5 minutes)

1. Accept the transfer (you'll get an email)
2. Go to the repo: `wirrecompany/[company-repo-name]`
3. Settings → Check ✓ **Template repository**
4. Go to your classroom: `classroom.github.com/classrooms/[id]`
5. Click **New assignment**
6. Fill in:
   - Title: `[Company Name] - [Role Name]`
   - Deadline: [Assessment deadline]
   - Template: Select the company's repo
   - Private repositories
7. Click **Create assignment**
8. **Copy the invitation URL**

#### C. Store in Your Database

When company creates assessment in WIRRE platform:

```javascript
await db.assessments.create({
  id: assessmentId,
  company_id: companyId,
  role: "Senior Backend Engineer",
  github_repo: "wirrecompany/acme-backend-challenge",
  github_classroom_url: "https://classroom.github.com/a/AbC123XyZ",
  deadline: "2025-12-25T23:59:59Z",
  positions: 3,
  max_salary: 150000,
});
```

#### D. Candidate Registration

When candidate clicks "Register for Assessment":

**Frontend shows:**
```jsx
<div>
  <h2>Accept Your Assignment</h2>
  <p>Click the link below to get your private repository:</p>
  <a href={assessment.github_classroom_url} target="_blank">
    Accept GitHub Classroom Assignment
  </a>
  
  <p>Instructions:</p>
  <ol>
    <li>Click the link above</li>
    <li>Sign in with GitHub: {candidate.github_username}</li>
    <li>Accept the assignment</li>
    <li>Clone your private repo</li>
    <li>Start coding!</li>
  </ol>
</div>
```

**Backend tracks:**
```javascript
await db.candidate_assessments.create({
  candidate_id: candidateId,
  assessment_id: assessmentId,
  github_username: candidate.github_username,
  status: 'pending_acceptance', // Changes to 'active' after they accept
});
```

#### E. Evaluation (Later)

When deadline hits or candidate finishes:

```javascript
// Find their repo (predictable name from Classroom)
const repoName = `${assessment.github_repo.split('/')[1]}-${candidate.github_username}`;

// Read their latest commit
const { data: commits } = await octokit.repos.listCommits({
  owner: 'wirrecompany',
  repo: repoName,
  per_page: 1,
});

// Download their code and evaluate
const code = await downloadRepoCode(commits[0].sha);
const score = await evaluateCode(code);
```

---

## Quick Reference

### What You Need

✅ **GitHub Organization**: `wirrecompany` (you have this)
✅ **GitHub Classroom**: Set up at classroom.github.com
✅ **Template Repos**: Transferred from companies

### URLs to Bookmark

- Your Classroom: `https://classroom.github.com/classrooms/[your-id]`
- Your Org Repos: `https://github.com/orgs/wirrecompany/repositories`

### For Each Assessment

1. Company transfers repo → wirrecompany
2. Make it a template
3. Create Classroom assignment
4. Copy invitation URL
5. Store URL in database
6. Show URL to registered candidates
7. Candidates accept → private repos created automatically
8. Evaluate their code when ready

---

## Costs

**$0** - Everything is free:
- GitHub Organization: Free
- GitHub Classroom: Free
- Private repos: Unlimited free
- Template repos: Free

---

## Troubleshooting

**Q: Candidate can't accept assignment**
- A: Make sure they're logged into GitHub with the username they registered

**Q: I can't see candidate's repo**
- A: You should automatically see all repos in wirrecompany org
- Check: github.com/orgs/wirrecompany/repositories

**Q: Want to add more instructors**
- A: Classroom settings → Add co-administrators

**Q: Need to extend deadline**
- A: Assignment settings → Edit deadline

**Q: Company wants repo back**
- A: Transfer ownership back to them after assessment ends

---

## Next Steps

1. ✅ Set up GitHub Classroom (Part 1)
2. ✅ Do test run (Part 2)
3. Build the WIRRE frontend features:
   - Store classroom URLs when company creates assessment
   - Show classroom URL when candidate registers
   - Track which candidates accepted assignments
4. Build evaluation system (later)
5. Automate with GitHub API (later)

**You're ready to go!** 🚀
