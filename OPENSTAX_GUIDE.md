# OpenStax Integration Guide

## Overview

SCIRE now integrates with **OpenStax**, a nonprofit providing free, peer-reviewed, openly licensed textbooks. This gives you access to high-quality educational content across multiple subjects.

## Quick Start

### 1. Import OpenStax Books

Run this command to fetch and import real textbooks from OpenStax:

```bash
npm run import-openstax
```

This will:
- Fetch up to 20 OpenStax textbooks
- Convert them to SCIRE course format
- Store them in your Firestore database
- Skip any books that already exist

### 2. Clear Sample Development Data (Optional)

When you're ready to move to production with real data:

```typescript
import { clearSampleCourses } from './server/seed';

// This will delete the 3 sample courses (CS, Biology, Psychology)
await clearSampleCourses();
```

### 3. Generate Tiers for OpenStax Courses

After importing, generate learning tiers:

```bash
npm run generate-tiers
```

## Available OpenStax Subjects

The API provides textbooks in:

- **Mathematics**: Algebra, Calculus, Statistics, Precalculus
- **Science**: Biology, Chemistry, Physics, Astronomy
- **Social Sciences**: Psychology, Sociology, Economics, US History
- **Business**: Principles of Management, Accounting, Marketing
- **Humanities**: American Government, Introduction to Philosophy

## How It Works

### 1. Fetching Books

```typescript
import { fetchOpenStaxBooks } from './server/apis/openstax';

const books = await fetchOpenStaxBooks();
// Returns array of live, published textbooks
```

### 2. Converting to Courses

```typescript
import { convertOpenStaxToCourse } from './server/apis/openstax';

const courseData = convertOpenStaxToCourse(book);
// Converts OpenStax format to SCIRE course format
```

### 3. User Recommendations

When users save their interests, SCIRE will:
1. Search OpenStax books matching their topics
2. Use Gemini AI to rank relevance
3. Return personalized recommendations

## API Endpoints

### Import Specific Book

```typescript
POST /api/admin/import-openstax
{
  "bookId": 123
}
```

### Search Books

```typescript
GET /api/openstax/search?q=biology
```

### Get Recommendations

```typescript
POST /api/recommendations
{
  "topics": ["Computer Science", "Mathematics"],
  "learningGoals": "I want to learn programming"
}
```

## Data Structure

### OpenStax Book → SCIRE Course

```typescript
{
  title: "Biology 2e",
  description: "Biology 2e is designed to cover the scope...",
  sourceType: "OpenStax",
  sourceUrl: "https://openstax.org/books/biology-2e",
  content: "# Biology 2e\n\n## Chapter 1...",
  metadata: {
    coverUrl: "https://...",
    subjects: ["Science", "Biology"],
    authors: ["Mary Ann Clark", "Jung Choi"],
    bookId: 123
  }
}
```

## Production Workflow

### Development Phase
1. Use sample courses for testing
2. Test tier generation with small datasets
3. Verify AI recommendations work

### Transition to Production
1. Run `clearSampleCourses()` to remove dev data
2. Run `npm run import-openstax` to fetch real books
3. Run `npm run generate-tiers` to create learning paths
4. Users get recommendations from real textbooks!

### Maintenance
- Run import periodically to get new books
- OpenStax updates their catalog regularly
- Tier generation can be run on-demand for new courses

## Rate Limiting

The import script includes:
- 500ms delay between requests
- Limit of 20 books per run (configurable)
- Error handling for failed requests

To import more books:
```typescript
// In server/import-openstax.ts
importOpenStaxBooks(50) // Import 50 books
```

## Troubleshooting

### "No books found"
- Check internet connection
- Verify OpenStax API is accessible
- Check console for error messages

### "Admin user not found"
- Run the dev server first to seed admin user
- Or manually create admin user in Firestore

### "Course already exists"
- The script skips duplicates automatically
- Delete courses manually if you want to re-import

## Future Enhancements

- [ ] MIT OpenCourseWare integration
- [ ] Khan Academy content
- [ ] YouTube transcript extraction
- [ ] PDF upload and parsing
- [ ] Automatic content updates

## Resources

- [OpenStax API Docs](https://openstax.org/api/v2/)
- [OpenStax Book Catalog](https://openstax.org/subjects)
- [SCIRE API Integration Plan](./API_INTEGRATION_PLAN.md)
