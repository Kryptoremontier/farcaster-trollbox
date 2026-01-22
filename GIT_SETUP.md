# Git Setup for TrollBox Deployment 🚀

## Current Situation

Your code is committed locally but needs to be pushed to **your own repository** (not the original farcasterxyz/frames-v2-demo fork).

## Option 1: Create New GitHub Repository (Recommended)

### Step 1: Create New Repo on GitHub

1. Go to https://github.com/new
2. Repository name: `trollbox` (or `farcaster-trollbox`)
3. Description: "TrollBox - Prediction Markets for Farcaster"
4. **Public** or **Private** (your choice)
5. **DO NOT** initialize with README (we already have files)
6. Click "Create repository"

### Step 2: Update Remote URL

```bash
# Remove old remote
git remote remove origin

# Add your new repository
git remote add origin https://github.com/YOUR_USERNAME/trollbox.git

# Verify
git remote -v
```

### Step 3: Push to Your Repo

```bash
# Push to main branch
git push -u origin main
```

### Step 4: Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Authorize Netlify to access your repos
5. Select your `trollbox` repository
6. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
7. Click "Deploy site"

### Step 5: Configure Custom Domain (Optional)

If you want to use `farcaster-trollbox.netlify.app`:

1. In Netlify dashboard → Domain settings
2. Click "Options" → "Edit site name"
3. Change to: `farcaster-trollbox`
4. Click "Save"

Your site will be at: `https://farcaster-trollbox.netlify.app`

## Option 2: Use Existing Netlify Site

If you already have a Netlify site set up:

### Step 1: Check Current Remote

```bash
git remote -v
```

### Step 2: Create Your Own Repo

Follow Option 1, Steps 1-3 above

### Step 3: Link to Netlify

1. In Netlify dashboard, go to Site settings
2. Build & deploy → Continuous deployment
3. Click "Link to repository"
4. Select your new GitHub repo
5. Save settings

## Option 3: Deploy Without Git (Quick Test)

If you just want to test deployment quickly:

### Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=.next
```

This will upload your built files directly (no GitHub needed).

## After Successful Push

Once you've pushed to GitHub and Netlify has deployed:

### 1. Verify Deployment

Visit these URLs:

- **App**: https://farcaster-trollbox.netlify.app
- **Manifest**: https://farcaster-trollbox.netlify.app/.well-known/farcaster.json
- **Banner**: https://farcaster-trollbox.netlify.app/troll-banner.png

### 2. Check Manifest

The manifest should show:
```json
{
  "frame": {
    "version": "next",
    "name": "TrollBox",
    "homeUrl": "https://farcaster-trollbox.netlify.app",
    "imageUrl": "https://farcaster-trollbox.netlify.app/troll-banner.png",
    ...
  }
}
```

### 3. Test in Browser

1. Open https://farcaster-trollbox.netlify.app
2. You should see TrollBox Hub (grid of markets)
3. Search should work
4. Category filters should work
5. Click a market → Detail view
6. Click back → Return to hub

### 4. Register in Warpcast

1. Open Warpcast app
2. Settings → Advanced → Developer Settings (or Settings → Developer Settings)
3. Tap "Add Mini App"
4. Enter URL: `https://farcaster-trollbox.netlify.app`
5. Wait for validation
6. App should appear in your list

### 5. Test in Warpcast

1. Open TrollBox from Warpcast
2. Purple splash screen should appear
3. Hub should load
4. Your Farcaster profile should show in header
5. Test betting on a market

## Troubleshooting

### Problem: Can't push to GitHub
**Solution**: Make sure you created your own repository and updated the remote URL

### Problem: Netlify not building
**Solution**:
- Check build command: `npm run build`
- Check publish directory: `.next`
- Check Node version (should be 18.x or higher)

### Problem: Manifest 404
**Solution**:
- Check `netlify.toml` has redirect rule
- Verify `public/.well-known/farcaster.json` exists
- Redeploy

### Problem: Images not loading
**Solution**:
- Verify files in `public/` folder
- Check capitalization (case-sensitive on server)
- Clear Netlify cache and redeploy

## Current Commit Status

✅ **Committed locally**:
- Commit: `Launch TrollBox Hub on new Netlify URL`
- 32 files changed
- 18,748 insertions

❌ **Not yet pushed**:
- Waiting for you to set up your own repository

## Next Steps

Choose your preferred option above and follow the steps!

Recommended: **Option 1** (Create new GitHub repo)

---

**Need help?** Check `DEPLOYMENT_CHECKLIST.md` for full deployment guide.
