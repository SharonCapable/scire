# SCIRE - API Integration & Role Separation Plan

## 1. Real Course API Integration

### OpenStax API
- **Base URL**: `https://openstax.org/api/v2/`
- **Endpoints**:
  - `/books` - List all available textbooks
  - `/books/{id}` - Get book details
  - `/pages/{id}` - Get page content

### MIT OpenCourseWare
- **Scraping Strategy**: Use web scraping with Cheerio
- **URL Pattern**: `https://ocw.mit.edu/courses/{subject}/{course-number}/`
- **Content**: Lecture notes, assignments, exams

### Khan Academy
- **API**: Not publicly available
- **Alternative**: Scrape course catalog
- **URL**: `https://www.khanacademy.org/api/internal/graphql`

### Coursera (Public Catalog)
- **API**: Limited public access
- **Catalog URL**: `https://www.coursera.org/api/courses.v1`
- **Content**: Course metadata only

### edX
- **API**: `https://www.edx.org/api/catalog/v2/courses`
- **Content**: Course listings, descriptions

## 2. Implementation Strategy

### Phase 1: OpenStax Integration (Easiest)
```typescript
// server/apis/openstax.ts
export async function fetchOpenStaxBooks() {
  const response = await fetch('https://openstax.org/api/v2/pages/?type=books.Book&fields=*');
  const data = await response.json();
  return data.items;
}

export async function fetchBookContent(bookId: string) {
  const response = await fetch(`https://openstax.org/api/v2/pages/${bookId}/?fields=*`);
  return await response.json();
}
```

### Phase 2: MIT OCW Scraping
```typescript
// server/apis/mit-ocw.ts
import * as cheerio from 'cheerio';

export async function scrapeMITCourse(courseUrl: string) {
  const response = await fetch(courseUrl);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Extract course info
  const title = $('h1.course-title').text();
  const description = $('.course-description').text();
  const modules = $('.course-section').map((i, el) => ({
    title: $(el).find('h2').text(),
    content: $(el).find('.content').text()
  })).get();
  
  return { title, description, modules };
}
```

### Phase 3: Admin API Endpoint
```typescript
// server/routes.ts
app.post("/api/admin/import-course", async (req, res) => {
  const { source, url } = req.body;
  
  let courseData;
  switch(source) {
    case 'openstax':
      courseData = await fetchBookContent(url);
      break;
    case 'mit-ocw':
      courseData = await scrapeMITCourse(url);
      break;
    default:
      return res.status(400).json({ error: "Unsupported source" });
  }
  
  // Create course in database
  const course = await storage.createCourse({
    title: courseData.title,
    description: courseData.description,
    sourceType: source,
    sourceUrl: url,
    content: courseData.content,
    createdBy: req.user.id
  });
  
  res.json(course);
});
```

## 3. User Role Separation

### Database Schema Updates
```typescript
// shared/types.ts
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'student' | 'admin' | 'super_admin';
  // ... existing fields
}
```

### Authentication Routes
```typescript
// server/auth.ts

// Admin login (separate endpoint)
app.post("/auth/admin/login", passport.authenticate("local"), (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  res.json({ user: req.user, redirectTo: "/admin" });
});

// Student login
app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  const redirectTo = req.user?.isAdmin ? "/admin" : "/dashboard";
  res.json({ user: req.user, redirectTo });
});
```

### Middleware
```typescript
// server/middleware/auth.ts
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireStudent(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}
```

### Protected Routes
```typescript
// Apply middleware to routes
app.get("/api/admin/*", requireAdmin);
app.post("/api/admin/*", requireAdmin);
app.put("/api/admin/*", requireAdmin);
app.delete("/api/admin/*", requireAdmin);

app.get("/api/user/*", requireStudent);
app.post("/api/user/*", requireStudent);
```

## 4. Frontend Route Protection

### Admin Routes
```typescript
// client/src/App.tsx
import { useUser } from "@/hooks/use-user";

function ProtectedAdminRoute({ component: Component }) {
  const { user, isLoading } = useUser();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user?.isAdmin) return <Navigate to="/login" />;
  
  return <Component />;
}

// Usage
<Route path="/admin/*" component={() => (
  <ProtectedAdminRoute component={AdminLayout} />
)} />
```

### Student Routes
```typescript
function ProtectedRoute({ component: Component }) {
  const { user, isLoading } = useUser();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <Component />;
}
```

## 5. Login Pages

### Admin Login (`/admin/login`)
- Separate branding
- "Admin Portal" header
- Email + Password only (no Google OAuth for admins)
- Redirect to `/admin` on success

### Student Login (`/login`)
- Student-friendly branding
- Google OAuth option
- Email + Password
- Redirect to `/dashboard` on success

## 6. Implementation Order

1. ✅ **Fix Gemini Model** - DONE
2. **OpenStax API Integration** - Fetch real textbooks
3. **Admin/Student Separation** - Role-based access
4. **MIT OCW Scraping** - More course sources
5. **Course Import UI** - Admin can import from URLs
6. **Multi-Interest Classrooms** - Student feature

## Next Steps

Run this to test tier generation:
```bash
npm run generate-tiers
```

Then we'll implement OpenStax API integration!
