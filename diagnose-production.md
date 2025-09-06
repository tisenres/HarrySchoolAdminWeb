# 🔍 PRODUCTION SITE DIAGNOSTIC CHECKLIST

## STEP 1: Open the Live Site
Visit: https://harry-school-admin.vercel.app

## STEP 2: Open Browser DevTools (F12)

### A. Check Console Tab
Look for RED errors and copy them here:
```
[ ] No errors
[ ] Errors found: (paste below)
___________________________
___________________________
___________________________
```

### B. Check Network Tab
1. Refresh the page with Network tab open
2. Look for API calls (filter by "Fetch/XHR")
3. Check status codes:

**Login Page API Calls:**
- [ ] /api/auth/session - Status: ____
- [ ] /api/settings/system - Status: ____
- [ ] Other: ________________

## STEP 3: Test Login
Credentials:
- Email: admin@harryschool.uz  
- Password: Admin123!

**Login Result:**
- [ ] Login successful → redirects to dashboard
- [ ] Login failed → error message: ________________
- [ ] Login succeeded but page is blank/broken

## STEP 4: Test Data Display (if logged in)

### Teachers Page (/teachers)
**Network Tab Results:**
- GET /api/teachers - Status: ____ Time: ____ms
- Response: [ ] Data returned [ ] Empty [ ] Error

**What you see:**
- [ ] Teachers list displays (count: ____)
- [ ] Empty state message
- [ ] Loading forever
- [ ] Error message: ________________

### Students Page (/students)  
**Network Tab Results:**
- GET /api/students - Status: ____ Time: ____ms
- Response: [ ] Data returned [ ] Empty [ ] Error

**What you see:**
- [ ] Students list displays (count: ____)
- [ ] Empty state message
- [ ] Loading forever
- [ ] Error message: ________________

### Groups Page (/groups)
**Network Tab Results:**
- GET /api/groups - Status: ____ Time: ____ms
- Response: [ ] Data returned [ ] Empty [ ] Error

**What you see:**
- [ ] Groups list displays (count: ____)
- [ ] Empty state message
- [ ] Loading forever
- [ ] Error message: ________________

## STEP 5: Test Create Operations

### Try Creating a Teacher
1. Click "Add Teacher" button
2. Fill ONLY:
   - First Name: Test
   - Last Name: Production
   - Phone: +998901234567

**Result:**
- [ ] Form opens correctly
- [ ] Form has validation errors: ________________
- [ ] Submit button works
- [ ] POST /api/teachers - Status: ____ 
- [ ] Teacher appears in list immediately
- [ ] Teacher saves but doesn't appear
- [ ] Error message: ________________

## STEP 6: Check Specific API Responses

Open Network tab, find the API call, click on it, go to "Response" tab.

**/api/teachers Response:**
```json
Paste the actual response here:
___________________________
```

**/api/students Response:**
```json
Paste the actual response here:
___________________________
```

## STEP 7: Environment Variables Check

Ask yourself:
1. Did I set NEXT_PUBLIC_SUPABASE_URL in Vercel?
2. Did I set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel?
3. Did I set SUPABASE_SERVICE_ROLE_KEY in Vercel?

Go to: https://vercel.com/harryschooladm-8637s-projects/harry-school-admin/settings/environment-variables

**Variables Status:**
- [ ] All 3 are set
- [ ] Some are missing: ________________
- [ ] I don't have access to check

## STEP 8: Compare with Local

Run locally: `npm run dev`
Visit: http://localhost:3000

**Local vs Production:**
| Feature | Local Works? | Production Works? |
|---------|-------------|-------------------|
| Login | Yes/No | Yes/No |
| View Teachers | Yes/No | Yes/No |
| Create Teacher | Yes/No | Yes/No |
| View Students | Yes/No | Yes/No |
| Create Student | Yes/No | Yes/No |

## STEP 9: Database Check

In Supabase SQL Editor, run:
```sql
SELECT 
  (SELECT COUNT(*) FROM teachers WHERE deleted_at IS NULL) as teachers,
  (SELECT COUNT(*) FROM students WHERE deleted_at IS NULL) as students,
  (SELECT COUNT(*) FROM groups WHERE deleted_at IS NULL) as groups;
```

**Database has:**
- Teachers: ____
- Students: ____
- Groups: ____

**Site displays:**
- Teachers: ____
- Students: ____
- Groups: ____

## 🚨 MOST COMMON ISSUES & FIXES

### Issue 1: 401 Unauthorized on API calls
**Fix:** Environment variables not set in Vercel

### Issue 2: 500 Server Error on API calls
**Fix:** Check if using correct Supabase project URL

### Issue 3: Data saves but doesn't display
**Fix:** Cache invalidation issue (already fixed in code)

### Issue 4: Login works but pages are blank
**Fix:** Check browser console for hydration errors

### Issue 5: Everything works locally but not in production
**Fix:** Environment variables mismatch

---

## YOUR SPECIFIC ISSUE:

**Describe exactly what's broken:**
_________________________________
_________________________________
_________________________________

**Exact error messages:**
_________________________________
_________________________________

**What you expected vs what happened:**
Expected: _______________________
Actual: _________________________