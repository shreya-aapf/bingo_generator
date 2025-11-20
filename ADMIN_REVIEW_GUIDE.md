# Admin Review Dashboard Guide

## 🎯 Overview

The Admin Review Dashboard allows you and your team to review winning bingo card claims without any authentication. Anyone with the URL can access it.

**URL:** `http://your-domain.com/admin-review.html`

---

## 📥 How to Export CSV from Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. **Log into Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Find and click on the `winning_claims` table

3. **Export as CSV**
   - Click the **"..."** menu button (top right of table)
   - Select **"Download as CSV"**
   - Save the file (e.g., `winning_claims.csv`)

4. **Upload to Admin Dashboard**
   - Open `admin-review.html` in your browser
   - Click "Choose CSV File"
   - Select the downloaded CSV
   - Claims will load automatically!

### Method 2: Using SQL Query (For Specific Columns)

If you want to export specific columns only:

```sql
SELECT 
    id,
    claim_ref,
    full_name,
    email,
    file_url,
    file_path,
    image_type,
    file_size_bytes,
    submitted_at,
    created_at,
    status
FROM winning_claims
ORDER BY submitted_at DESC;
```

1. Go to **SQL Editor** in Supabase
2. Paste the query above
3. Click **Run**
4. Click the **Download** button to export as CSV

---

## 🎨 Using the Admin Dashboard

### Features

1. **Upload CSV**
   - Drag and drop or click to upload your CSV file
   - Automatically parses and displays all claims

2. **View Statistics**
   - Total Claims
   - Pending Review
   - Approved
   - Rejected

3. **Filter Claims**
   - **All Claims** - Show everything
   - **Pending** - Only unreviewed claims
   - **Approved** - Only approved claims
   - **Rejected** - Only rejected claims

4. **Review Each Claim**
   - **Full Name** - Who submitted the claim
   - **Email** - Contact information
   - **Submission Date** - When it was submitted
   - **Bingo Card Image** - Click to view full size
   - **Action Buttons**:
     - ✓ **Approve** - Mark as legitimate winner
     - ✕ **Reject** - Mark as invalid claim

5. **Image Actions**
   - **Click on image** - View full size in modal
   - **Open Image** - Opens in new tab
   - **Download** - Save locally for records

6. **Export Updated CSV**
   - After reviewing, click **"📥 Export Updated CSV"**
   - Downloads CSV with new `reviewed_status` column
   - Contains your approve/reject decisions

---

## 📤 Workflow Example

### Step-by-Step Review Process

1. **Export Data from Supabase**
   ```
   → Go to Supabase Dashboard
   → Table Editor → winning_claims
   → Download as CSV
   ```

2. **Open Admin Dashboard**
   ```
   → Open admin-review.html in browser
   → Upload the CSV file
   ```

3. **Review Claims**
   ```
   → Click on bingo card images to verify
   → Check if all marked squares match the rules
   → Click "✓ Approve" or "✕ Reject"
   ```

4. **Filter for Efficiency**
   ```
   → Click "Pending" to see only unreviewed claims
   → Review one by one
   ```

5. **Export Results**
   ```
   → Click "📥 Export Updated CSV"
   → Save the file with your decisions
   ```

6. **Update Supabase (Optional)**
   - You can use the exported CSV to bulk update statuses in Supabase
   - Or manually update records based on your review

---

## 🔗 Sharing with Your Team

Since this is a client-side only application with no backend:

### Option 1: Deploy to Netlify/Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add public/admin-review.html
   git commit -m "Add admin review dashboard"
   git push
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `public` folder
   - Share the URL: `https://your-site.netlify.app/admin-review.html`

### Option 2: Use Your Existing Hosting

If your main app is already deployed:
- The admin page is already in the `public` folder
- Access at: `your-domain.com/admin-review.html`
- Share this URL with your team

### Option 3: Send HTML File Directly

- Email the `admin-review.html` file to team members
- They can open it locally in their browser
- Each person uploads their own copy of the CSV

---

## 🛡️ Security Considerations

### Current Setup (Public Access)
- ✅ No authentication required
- ✅ Easy to share with team
- ⚠️ Anyone with the URL can access
- ⚠️ Data is only visible after CSV upload
- ✅ No data is sent to any server (all client-side)

### To Make It More Secure (Optional)

If you want to add password protection:

1. **Add Simple Password Protection** (add to top of `<script>` in admin-review.html):
```javascript
const ADMIN_PASSWORD = 'your-secret-password';
const password = prompt('Enter admin password:');
if (password !== ADMIN_PASSWORD) {
    document.body.innerHTML = '<h1 style="text-align:center;margin-top:100px;">Access Denied</h1>';
    throw new Error('Invalid password');
}
```

2. **Use Netlify/Vercel Password Protection**
   - Both platforms offer built-in password protection
   - Set it up in deployment settings

---

## 📊 CSV Format Expected

The dashboard expects these columns (from your `winning_claims` table):

| Column | Description |
|--------|-------------|
| `id` | Unique ID |
| `claim_ref` | Claim reference code (e.g., CLAIM-ABC123) |
| `full_name` | Submitter's full name |
| `email` | Submitter's email |
| `file_url` | Public URL to bingo card image |
| `file_path` | Storage path |
| `image_type` | Image MIME type |
| `file_size_bytes` | File size in bytes |
| `submitted_at` | Submission timestamp |
| `created_at` | Creation timestamp |
| `status` | Current status (pending/approved/rejected) |

---

## 🎉 Tips for Efficient Review

1. **Use Full Screen**
   - Click on bingo card images to view full size
   - Check all marked squares carefully

2. **Review in Batches**
   - Filter by "Pending" to focus on new claims
   - Approve/reject in bulk sessions

3. **Export Regularly**
   - Export your reviewed CSV periodically
   - Keep records of your decisions

4. **Team Collaboration**
   - Assign different team members to review batches
   - Use the exported CSV to merge reviews

5. **Download Images**
   - Download suspicious cards for closer inspection
   - Keep copies of winning cards for records

---

## 🐛 Troubleshooting

### Images Not Loading
- **Issue**: Bingo card images show broken
- **Fix**: Check that the `file_url` column in CSV contains valid public URLs
- **Fix**: Ensure Supabase Storage bucket has public access enabled

### CSV Not Parsing
- **Issue**: Claims don't appear after upload
- **Fix**: Ensure CSV has headers in the first row
- **Fix**: Check that CSV is properly formatted (no extra blank rows)

### Export Button Not Working
- **Issue**: Downloaded CSV is empty or corrupt
- **Fix**: Ensure you've loaded claims first
- **Fix**: Try a different browser (Chrome recommended)

---

## 📞 Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify your CSV format matches the expected structure
3. Ensure Supabase Storage URLs are publicly accessible

---

**Made with 🎯 for Pathfinder Summit Bingo**

