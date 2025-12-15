# 🚀 SCIRE Deployment Guide

Complete guide for deploying your SCIRE application to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ Firebase project created and Firestore enabled
- ✅ Google Gemini API key
- ✅ Google OAuth credentials configured
- ✅ All environment variables ready
- ✅ Application tested locally

---

## 🧪 Local Testing

### 1. **Set Up Environment Variables**

Create `.env` file in the project root:

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Session
SESSION_SECRET=generate_a_random_32_character_string_here

# Environment
NODE_ENV=development
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Run Development Server**

```bash
npm run dev
```

Visit: `http://localhost:5000`

### 4. **Test Key Features**

- ✅ Google OAuth sign-in
- ✅ Create a course (admin)
- ✅ Generate AI tiers
- ✅ Enroll in course
- ✅ Complete modules
- ✅ View dashboard

---

## 🌐 Deployment Options

### Option 1: **Vercel** (Recommended for Full-Stack)

#### Prerequisites
- Vercel account (free tier available)
- GitHub repository

#### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Create `vercel.json`**

Already created in your project root with proper configuration.

3. **Deploy**
```bash
vercel
```

4. **Set Environment Variables**

In Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add all variables from your `.env` file
- Set for Production, Preview, and Development

5. **Update Google OAuth Redirect URIs**

Add your Vercel domain:
```
https://your-app.vercel.app/auth/google/callback
```

6. **Deploy to Production**
```bash
vercel --prod
```

---

### Option 2: **Railway** (Easy Full-Stack Deployment)

#### Steps

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login**
```bash
railway login
```

3. **Initialize Project**
```bash
railway init
```

4. **Add Environment Variables**
```bash
railway variables set FIREBASE_PROJECT_ID=your-project-id
railway variables set GEMINI_API_KEY=your-key
railway variables set GOOGLE_CLIENT_ID=your-id
railway variables set GOOGLE_CLIENT_SECRET=your-secret
railway variables set SESSION_SECRET=your-secret
railway variables set NODE_ENV=production
```

5. **Deploy**
```bash
railway up
```

6. **Get Your URL**
```bash
railway domain
```

---

### Option 3: **Google Cloud Run** (Best for Firebase Integration)

#### Prerequisites
- Google Cloud account
- gcloud CLI installed

#### Steps

1. **Install gcloud CLI**
```bash
# Windows (PowerShell)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

2. **Login and Set Project**
```bash
gcloud auth login
gcloud config set project your-firebase-project-id
```

3. **Create Dockerfile**

Already created in your project root.

4. **Build and Deploy**
```bash
gcloud run deploy scire \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id,GEMINI_API_KEY=your-key,GOOGLE_CLIENT_ID=your-id,GOOGLE_CLIENT_SECRET=your-secret,SESSION_SECRET=your-secret,NODE_ENV=production
```

5. **Get Your URL**

Cloud Run will provide a URL like: `https://scire-xxxxx-uc.a.run.app`

---

### Option 4: **Render** (Free Tier Available)

#### Steps

1. **Create `render.yaml`**

Already created in your project root.

2. **Connect GitHub Repository**
- Go to [Render Dashboard](https://dashboard.render.com/)
- Click "New +" → "Blueprint"
- Connect your GitHub repository

3. **Configure Environment Variables**

In Render Dashboard, add all environment variables.

4. **Deploy**

Render will automatically deploy on every push to main branch.

---

## 🔐 Production Security Checklist

### 1. **Environment Variables**
- ✅ Never commit `.env` to Git
- ✅ Use strong `SESSION_SECRET` (32+ characters)
- ✅ Rotate secrets regularly

### 2. **Firebase Security Rules**

Update Firestore rules (see `MIGRATION_COMPLETE.md` for full rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Apply strict rules for production
    match /courses/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /userProgress/{progressId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. **Google OAuth**
- ✅ Add production domain to authorized redirect URIs
- ✅ Add production domain to authorized JavaScript origins

### 4. **API Keys**
- ✅ Restrict Gemini API key to your domain
- ✅ Set up API quotas and monitoring

---

## 📊 Monitoring & Analytics

### 1. **Firebase Console**
- Monitor Firestore usage
- Check authentication logs
- View error reports

### 2. **Google Cloud Console**
- Monitor Gemini API usage
- Set up billing alerts
- Check quota limits

### 3. **Application Monitoring**

Add to your deployment:

```bash
# Install monitoring tools
npm install @sentry/node @sentry/react
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run TypeScript check
        run: npm run check
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'firebase-admin'"
**Solution**: Ensure `firebase-admin` is in `dependencies`, not `devDependencies`

### Issue: Google OAuth redirect error
**Solution**: Add production URL to Google Console authorized redirect URIs

### Issue: Firestore permission denied
**Solution**: Update Firestore security rules for production

### Issue: Session not persisting
**Solution**: Ensure `SESSION_SECRET` is set and cookies are enabled

---

## 📈 Scaling Considerations

### Database
- Firestore automatically scales
- Monitor read/write operations
- Use composite indexes for complex queries

### API Limits
- Gemini API has rate limits
- Implement request queuing
- Add caching for repeated queries

### CDN
- Use Vercel Edge Network (automatic)
- Or configure Cloudflare for static assets

---

## 💰 Cost Estimation

### Free Tier Limits

**Firebase (Spark Plan - Free)**
- 50K reads/day
- 20K writes/day
- 1GB storage

**Gemini API**
- 60 requests/minute (free tier)
- Rate limits apply

**Vercel (Hobby - Free)**
- 100GB bandwidth/month
- Unlimited deployments

### Paid Plans

**Firebase (Blaze - Pay as you go)**
- $0.06 per 100K reads
- $0.18 per 100K writes

**Gemini API**
- Check current pricing at https://ai.google.dev/pricing

---

## ✅ Post-Deployment Checklist

- ✅ Test all features on production URL
- ✅ Verify Google OAuth works
- ✅ Check Firestore security rules
- ✅ Monitor error logs
- ✅ Set up uptime monitoring
- ✅ Configure custom domain (optional)
- ✅ Enable HTTPS (automatic on most platforms)
- ✅ Test mobile PWA installation

---

## 🎯 Quick Deploy Commands

### Vercel
```bash
vercel --prod
```

### Railway
```bash
railway up
```

### Google Cloud Run
```bash
gcloud run deploy scire --source .
```

---

## 📞 Support Resources

- **Firebase**: https://firebase.google.com/support
- **Gemini API**: https://ai.google.dev/docs
- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app

---

**Ready to deploy? Start with local testing, then choose your preferred platform!** 🚀
