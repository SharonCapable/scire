# 🚀 SCIRE - Vercel Deployment Guide

Complete step-by-step guide for deploying SCIRE to Vercel with custom domain support.

---

## ✅ Why Vercel?

- **Free Tier**: Generous free tier for personal projects
- **Easy Deployment**: Deploy in minutes with Git integration
- **Custom Domains**: Free SSL + easy domain setup
- **Auto Scaling**: Handles traffic spikes automatically
- **Edge Network**: Global CDN for fast loading
- **Zero Config**: Works out of the box with your setup

---

## 🎯 Quick Start (3 Steps)

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → scire (or your preferred name)
- **Directory?** → ./
- **Override settings?** → No

### Step 2: Set Environment Variables

In Vercel Dashboard (https://vercel.com/dashboard):
1. Go to your project → Settings → Environment Variables
2. Add these variables:

```
FIREBASE_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-gemini-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
SESSION_SECRET=your-random-32-char-secret
NODE_ENV=production
```

**Important**: Add them for **Production**, **Preview**, and **Development** environments.

### Step 3: Deploy to Production

```bash
vercel --prod
```

Your app is now live at: `https://scire-xxxxx.vercel.app`

---

## 🌐 Custom Domain Setup

### Option A: Buy Domain Through Vercel

**Easiest option - everything automated!**

1. **Go to Vercel Dashboard**
   - Select your SCIRE project
   - Go to Settings → Domains

2. **Buy Domain**
   - Click "Buy a domain"
   - Search for your desired domain (e.g., `scire.app`, `myscire.com`)
   - Prices typically $15-20/year
   - Complete purchase

3. **Automatic Setup**
   - Vercel automatically configures DNS
   - SSL certificate auto-generated
   - Domain active in ~5 minutes!

4. **Done!** 🎉
   - Your app is now at `https://yourdomain.com`
   - Old Vercel URL still works too

---

### Option B: Use Existing Domain (Any Registrar)

**If you already own a domain or prefer another registrar:**

#### From Vercel Dashboard:

1. **Add Domain**
   - Go to Project → Settings → Domains
   - Click "Add"
   - Enter your domain (e.g., `scire.app`)

2. **Configure DNS**

Vercel will show you DNS records to add. You have two options:

**Option 1: Use Vercel Nameservers (Recommended)**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Update nameservers to Vercel's
- Wait 24-48 hours for propagation

**Option 2: Add A/CNAME Records**

At your domain registrar, add:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

3. **Verify Domain**
   - Vercel will automatically verify
   - SSL certificate auto-generated
   - Usually takes 5-30 minutes

---

## 🔐 Update Google OAuth for Custom Domain

After adding your custom domain:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Update OAuth Settings**
   - APIs & Services → Credentials
   - Click your OAuth 2.0 Client ID

3. **Add Authorized Redirect URIs**
   ```
   https://yourdomain.com/auth/google/callback
   https://www.yourdomain.com/auth/google/callback
   ```

4. **Add Authorized JavaScript Origins**
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

5. **Save Changes**

---

## 📋 Complete Deployment Checklist

### Before Deployment
- ✅ Test app locally (`npm run dev`)
- ✅ Firebase project created
- ✅ Gemini API key obtained
- ✅ Google OAuth credentials ready
- ✅ All environment variables prepared

### During Deployment
- ✅ Deploy to Vercel
- ✅ Add environment variables
- ✅ Deploy to production
- ✅ Test deployment URL

### Custom Domain Setup
- ✅ Buy domain or configure existing
- ✅ Wait for DNS propagation
- ✅ Verify SSL certificate active
- ✅ Update Google OAuth redirect URIs
- ✅ Test login with custom domain

### Post-Deployment
- ✅ Test all features on production
- ✅ Verify Google sign-in works
- ✅ Check dashboard functionality
- ✅ Test course creation (admin)
- ✅ Monitor Vercel analytics

---

## 💰 Vercel Pricing

### Hobby Plan (FREE)
- **Perfect for SCIRE!**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains (unlimited)
- SSL certificates (free)
- Edge Network (global CDN)
- **Cost**: $0/month

### Pro Plan ($20/month)
Only needed if you exceed:
- 100GB bandwidth
- Need team collaboration
- Want advanced analytics

**For most educational projects, FREE tier is sufficient!**

---

## 🎨 Recommended Domains for SCIRE

### Available Options (Check Availability)
- `scire.app` - Clean, modern
- `scire.io` - Tech-focused
- `scire.ai` - AI emphasis
- `getscire.com` - Action-oriented
- `myscire.com` - Personal touch
- `learnscire.com` - Educational focus
- `scire.education` - Professional

### Domain Pricing (Approximate)
- `.com` - $12-15/year
- `.app` - $15-20/year
- `.io` - $30-40/year
- `.ai` - $80-100/year
- `.education` - $20-25/year

---

## 🚀 Deployment Commands Reference

### Initial Deployment
```bash
vercel
```

### Production Deployment
```bash
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

### Remove Deployment
```bash
vercel remove scire
```

---

## 🔧 Vercel Configuration

Your `vercel.json` is already configured with:
- ✅ Node.js build settings
- ✅ API route handling
- ✅ Static file serving
- ✅ Production environment

No additional configuration needed!

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard
- **Analytics**: View traffic and performance
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments
- **Domains**: Manage custom domains

### Firebase Console
- **Firestore**: Monitor database usage
- **Authentication**: Track sign-ins
- **Quotas**: Check API limits

### Google Cloud Console
- **Gemini API**: Monitor API usage
- **Billing**: Track costs
- **Quotas**: Set usage limits

---

## 🐛 Troubleshooting

### Issue: Build Fails
**Check**: 
- Environment variables are set
- `npm run build` works locally
- All dependencies in `package.json`

### Issue: 404 on Routes
**Solution**: Vercel.json is configured correctly (already done!)

### Issue: Google OAuth Error
**Solution**: 
- Add Vercel URL to Google OAuth redirect URIs
- Add custom domain to redirect URIs

### Issue: Session Not Persisting
**Solution**: 
- Ensure `SESSION_SECRET` is set
- Check cookie settings in production

---

## 🎯 Quick Domain Setup Example

### Scenario: You want `scire.app`

1. **Buy on Vercel**
   ```
   Vercel Dashboard → Domains → Buy domain
   Search: scire.app
   Purchase: ~$15/year
   ```

2. **Automatic Configuration**
   - DNS configured automatically
   - SSL certificate generated
   - Domain active in 5 minutes

3. **Update Google OAuth**
   ```
   Add to redirect URIs:
   https://scire.app/auth/google/callback
   ```

4. **Done!**
   - Visit: https://scire.app
   - Sign in with Google
   - Start learning!

---

## 📱 PWA on Custom Domain

With your custom domain, users can:
- ✅ Install SCIRE as an app on mobile
- ✅ Add to home screen with your icon
- ✅ Use offline (when service worker added)
- ✅ Get app-like experience

Your favicons are already configured!

---

## 🔄 Continuous Deployment

### GitHub Integration (Recommended)

1. **Connect GitHub**
   - Vercel Dashboard → Import Project
   - Connect GitHub repository

2. **Automatic Deployments**
   - Push to `main` → Auto-deploy to production
   - Pull requests → Preview deployments
   - Branches → Preview URLs

3. **Benefits**
   - No manual deployments needed
   - Preview changes before merging
   - Rollback to any previous version

---

## ✅ Final Checklist

### Deployment
- ✅ Vercel CLI installed
- ✅ Logged into Vercel
- ✅ Project deployed
- ✅ Environment variables set
- ✅ Production deployment successful

### Custom Domain
- ✅ Domain purchased/configured
- ✅ DNS records updated
- ✅ SSL certificate active
- ✅ Google OAuth updated
- ✅ Domain working correctly

### Testing
- ✅ Homepage loads
- ✅ Google sign-in works
- ✅ Dashboard accessible
- ✅ Course creation works (admin)
- ✅ Mobile responsive
- ✅ PWA installable

---

## 🎉 You're Live!

Your SCIRE application is now:
- ✅ Deployed on Vercel
- ✅ Running on custom domain (optional)
- ✅ Secured with SSL
- ✅ Globally distributed (CDN)
- ✅ Auto-scaling
- ✅ Production-ready

**Share your learning platform with the world!** 🚀

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions

**Questions?** Check `DEPLOYMENT.md` for general deployment info.
