# TrollBox - Production Deployment Checklist ✅

## Pre-Deployment Verification

### 1. Manifest Configuration ✅
- [x] `public/.well-known/farcaster.json` updated
  - [x] version: "next"
  - [x] name: "TrollBox"
  - [x] homeUrl: "https://farcaster-trollbox.netlify.app"
  - [x] imageUrl: "https://farcaster-trollbox.netlify.app/troll-banner.png"
  - [x] splashBackgroundColor: "#9E75FF"

### 2. Branding ✅
- [x] App title: "TrollBox - Prediction Markets"
- [x] Metadata description updated
- [x] Purple color scheme (#9E75FF)
- [x] Frame metadata in page.tsx updated

### 3. SDK Initialization ✅
- [x] `sdk.actions.ready()` called in TrollBoxHub
- [x] `sdk.actions.ready()` called in DegenBox
- [x] Both wrapped in useEffect hooks
- [x] Context detection working

### 4. Required Assets

**Current Status:**
- [x] `public/icon.png` - Exists
- [x] `public/splash.png` - Exists
- [ ] `public/troll-banner.png` - **NEEDS CREATION**

**Banner Requirements:**
- Recommended size: 1200x630px (Open Graph standard)
- Format: PNG or JPEG
- Content: TrollBox branding with purple gradient
- Text: "TrollBox - Prediction Markets" or similar

**Quick Fix:**
If you don't have a banner image ready, you can:
1. Use a placeholder or duplicate splash.png
2. Create one later and update via Netlify dashboard

## Deployment Steps

### Step 1: Final Local Test
```bash
# Clean build
npm run build

# Test locally
npm run dev
# Visit http://localhost:3000
# Verify Hub loads, markets display, SDK initializes
```

### Step 2: Git Commit & Push
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Launch TrollBox Hub on Netlify production URL"

# Push to main branch (triggers Netlify auto-deploy)
git push origin main
```

### Step 3: Monitor Netlify Build
1. Go to https://app.netlify.com
2. Navigate to your site
3. Watch "Production deploys" section
4. Build should start automatically within 30 seconds
5. Wait for "Published" status (~2-3 minutes)

### Step 4: Verify Deployment
Once deployed, test these URLs:

```
Base URL:
https://farcaster-trollbox.netlify.app

Manifest:
https://farcaster-trollbox.netlify.app/.well-known/farcaster.json

Assets:
https://farcaster-trollbox.netlify.app/icon.png
https://farcaster-trollbox.netlify.app/splash.png
https://farcaster-trollbox.netlify.app/troll-banner.png
```

### Step 5: Register in Warpcast

1. **Open Warpcast Developer Settings**
   - iOS: Settings → Advanced → Developer Settings
   - Android: Settings → Developer Settings

2. **Add New Mini App**
   - Tap "Add Mini App"
   - Enter URL: `https://farcaster-trollbox.netlify.app`
   - Wait for validation (checks for farcaster.json)

3. **Verify Registration**
   - App name should show as "TrollBox"
   - Purple splash screen should appear
   - Icon should display correctly

4. **Test Launch**
   - From Warpcast, open TrollBox
   - Verify Hub loads (grid of markets)
   - Click a market, verify detail view
   - Test back navigation
   - Place a bet, verify it works

## Post-Deployment Checklist

### Functional Tests
- [ ] Hub page loads
- [ ] 12 markets display in grid
- [ ] Search works
- [ ] Category filters work
- [ ] Click market → navigates to detail
- [ ] Back button → returns to hub
- [ ] Betting works (mock engine)
- [ ] Farcaster context detected (shows user profile)
- [ ] Purple branding visible throughout

### Performance Tests
- [ ] Page load < 3 seconds
- [ ] No console errors
- [ ] Images load correctly
- [ ] Responsive on mobile (Warpcast)

### Farcaster Integration
- [ ] Splash screen dismisses automatically
- [ ] User profile shows in header (if in Farcaster)
- [ ] Safe area insets applied
- [ ] No "Loading SDK..." stuck state

## Troubleshooting

### Issue: Manifest not found (404)
**Solution:**
- Check `netlify.toml` has redirect rule for `.well-known/farcaster.json`
- Verify file exists in `public/.well-known/farcaster.json`
- Redeploy: `git commit --allow-empty -m "Trigger redeploy" && git push`

### Issue: Splash screen doesn't dismiss
**Solution:**
- Verify `sdk.actions.ready()` is called
- Check browser console for SDK errors
- Ensure `version: "next"` in manifest

### Issue: Images not loading
**Solution:**
- Check file paths are correct (case-sensitive)
- Verify images exist in `public/` folder
- Clear Netlify cache and redeploy

### Issue: App shows "Browser" instead of "Farcaster"
**Solution:**
- This is normal when testing in regular browser
- Test in Warpcast app to see Farcaster context
- Use Warpcast Developer Settings to test

## Environment Variables (Optional)

If you want to set production environment variables:

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_URL=https://farcaster-trollbox.netlify.app
   ```
3. Redeploy to apply changes

## Banner Image Creation (If Needed)

### Quick Options:

**Option 1: Use Canva**
1. Create 1200x630px design
2. Purple gradient background (#9E75FF → #7E55DF)
3. Add text: "TrollBox 🎲"
4. Subtitle: "Prediction Markets for Farcaster"
5. Download as PNG
6. Save to `public/troll-banner.png`

**Option 2: Use Figma**
1. Same dimensions and colors
2. Export as PNG
3. Optimize with TinyPNG.com
4. Add to repo

**Option 3: Temporary Workaround**
```bash
# Duplicate splash.png as banner
cp public/splash.png public/troll-banner.png

# Commit and push
git add public/troll-banner.png
git commit -m "Add temporary banner image"
git push origin main
```

## Success Criteria

Your deployment is successful when:

✅ **Technical**
- Build passes without errors
- All URLs return 200 status
- Manifest validates correctly
- No console errors

✅ **Functional**
- Hub displays 12 markets
- Navigation works (Hub ↔ Detail)
- Betting engine processes bets
- SDK initializes properly

✅ **Warpcast**
- App registers successfully
- Shows in Warpcast app list
- Launches with purple splash
- User context detected

## Next Steps After Launch

1. **Share with Community**
   - Post cast with app link
   - Demo the features
   - Gather feedback

2. **Monitor Usage**
   - Check Netlify analytics
   - Watch for errors in logs
   - Track user engagement

3. **Iterate**
   - Add more markets
   - Improve UI based on feedback
   - Plan smart contract integration

## Support

If you encounter issues:
1. Check this checklist
2. Review `TROLLBOX_FEATURES.md`
3. Consult `README.md`
4. Check Netlify deploy logs

---

**Ready to Deploy?**

Run these commands:
```bash
git add .
git commit -m "Launch TrollBox Hub on Netlify production URL"
git push origin main
```

Then monitor Netlify for successful deployment! 🚀
