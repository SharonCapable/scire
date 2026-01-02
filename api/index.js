var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/firebase.ts
var firebase_exports = {};
__export(firebase_exports, {
  app: () => app,
  db: () => db
});
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
var app, db;
var init_firebase = __esm({
  "server/firebase.ts"() {
    "use strict";
    if (!getApps().length) {
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          console.log("Initializing Firebase with service account...");
          let serviceAccount;
          try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          } catch (parseError) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT using simple JSON.parse");
            try {
              const sanitized = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, "\n");
              serviceAccount = JSON.parse(sanitized);
              console.log("Successfully parsed FIREBASE_SERVICE_ACCOUNT after sanitizing newlines");
            } catch (retryError) {
              console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT after sanitization:", retryError);
              console.error("FIREBASE_SERVICE_ACCOUNT first 50 chars:", process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 50));
              throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Ensure you pasted the full content of the service account JSON file into the Vercel environment variable.");
            }
          }
          if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT is missing required fields (project_id, private_key, or client_email)");
          }
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
          });
          console.log("Firebase initialized successfully");
        } else {
          console.log("No FIREBASE_SERVICE_ACCOUNT found, using Application Default Credentials...");
          if (!process.env.FIREBASE_PROJECT_ID) {
            throw new Error("FIREBASE_PROJECT_ID environment variable is required");
          }
          app = initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        }
        db = getFirestore(app);
        db.settings({
          ignoreUndefinedProperties: true
        });
      } catch (error) {
        console.error("Firebase initialization error:", error);
        throw error;
      }
    } else {
      app = getApps()[0];
      db = getFirestore(app);
    }
  }
});

// server/app.ts
import express from "express";
import session from "express-session";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_firebase();
import { Timestamp, FieldValue } from "firebase-admin/firestore";
var FirestoreStorage = class {
  // User methods
  async getUser(id) {
    const doc = await db.collection("users").doc(id).get();
    return doc.exists ? doc.data() : void 0;
  }
  async getUserById(id) {
    return this.getUser(id);
  }
  async getUserByUsername(username) {
    const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async getUserByEmail(email) {
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async getUserByGoogleId(googleId) {
    const snapshot = await db.collection("users").where("googleId", "==", googleId).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async getUserByClerkId(clerkId) {
    const snapshot = await db.collection("users").where("clerkId", "==", clerkId).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async createUser(user) {
    const docRef = db.collection("users").doc();
    const newUser = {
      ...user,
      id: docRef.id,
      provider: user.provider || "local",
      isAdmin: user.isAdmin || false,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newUser);
    return newUser;
  }
  async updateUser(id, data) {
    const docRef = db.collection("users").doc(id);
    await docRef.update(data);
    const doc = await docRef.get();
    return doc.data();
  }
  async deleteUser(id) {
    await db.collection("users").doc(id).delete();
  }
  // Course methods
  async getCourse(id) {
    const doc = await db.collection("courses").doc(id).get();
    return doc.exists ? doc.data() : void 0;
  }
  async getCourseWithDetails(id) {
    const course = await this.getCourse(id);
    if (!course) return void 0;
    const tiers = await this.getTiersByCourse(id);
    const tiersWithModules = await Promise.all(tiers.map(async (tier) => {
      const modules = await this.getModulesByTier(tier.id);
      return { ...tier, modules };
    }));
    return { ...course, tiers: tiersWithModules };
  }
  async getAllCourses() {
    const [coursesSnap, tiersSnap, modulesSnap] = await Promise.all([
      db.collection("courses").get(),
      db.collection("tiers").get(),
      db.collection("modules").get()
    ]);
    const tiers = tiersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const modules = modulesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return coursesSnap.docs.map((doc) => {
      const course = { id: doc.id, ...doc.data() };
      const courseTiers = tiers.filter((t) => t.courseId === course.id);
      const tierIds = new Set(courseTiers.map((t) => t.id));
      const courseModules = modules.filter((m) => tierIds.has(m.tierId));
      return {
        ...course,
        tierCount: courseTiers.length,
        moduleCount: courseModules.length
      };
    });
  }
  async createCourse(course) {
    const docRef = db.collection("courses").doc();
    const newCourse = { ...course, id: docRef.id, createdAt: FieldValue.serverTimestamp() };
    await docRef.set(newCourse);
    return newCourse;
  }
  async updateCourse(id, data) {
    const docRef = db.collection("courses").doc(id);
    await docRef.update(data);
    const doc = await docRef.get();
    return doc.data();
  }
  async deleteCourse(id) {
    await db.collection("courses").doc(id).delete();
  }
  // Tier methods
  async createTier(tier) {
    const docRef = db.collection("tiers").doc();
    const newTier = {
      ...tier,
      id: docRef.id,
      level: tier.level,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newTier);
    return newTier;
  }
  async getTiersByCourse(courseId) {
    const snapshot = await db.collection("tiers").where("courseId", "==", courseId).get();
    const tiers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return tiers.sort((a, b) => a.order - b.order);
  }
  async updateTier(id, data) {
    const docRef = db.collection("tiers").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return void 0;
    await docRef.update(data);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  }
  // Module methods
  async createModule(module) {
    const docRef = db.collection("modules").doc();
    const newModule = {
      ...module,
      id: docRef.id,
      estimatedMinutes: module.estimatedMinutes || 15,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newModule);
    return newModule;
  }
  async getModule(id) {
    const doc = await db.collection("modules").doc(id).get();
    return doc.exists ? doc.data() : void 0;
  }
  async getModulesByTier(tierId) {
    const snapshot = await db.collection("modules").where("tierId", "==", tierId).get();
    const modules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return modules.sort((a, b) => a.order - b.order);
  }
  // Flashcard methods
  async createFlashcard(flashcard) {
    const docRef = db.collection("flashcards").doc();
    const newFlashcard = { ...flashcard, id: docRef.id, createdAt: FieldValue.serverTimestamp() };
    await docRef.set(newFlashcard);
    return newFlashcard;
  }
  async getFlashcardsByModule(moduleId) {
    const snapshot = await db.collection("flashcards").where("moduleId", "==", moduleId).get();
    const flashcards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return flashcards.sort((a, b) => a.order - b.order);
  }
  // Assessment methods
  async createAssessment(assessment) {
    const docRef = db.collection("assessments").doc();
    const newAssessment = {
      id: docRef.id,
      ...assessment,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newAssessment);
    return newAssessment;
  }
  async getAssessmentsByModule(moduleId) {
    const snapshot = await db.collection("assessments").where("moduleId", "==", moduleId).get();
    const assessments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return assessments.sort((a, b) => a.order - b.order);
  }
  async createAssessmentSubmission(submission) {
    const docRef = db.collection("assessment_submissions").doc();
    const newSubmission = {
      id: docRef.id,
      ...submission,
      completedAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newSubmission);
    return newSubmission;
  }
  async getAssessmentSubmissions(userId, assessmentId) {
    const snapshot = await db.collection("assessment_submissions").where("userId", "==", userId).where("assessmentId", "==", assessmentId).get();
    const submissions = snapshot.docs.map((doc) => doc.data());
    return submissions.sort((a, b) => {
      const aTime = a.completedAt?.toMillis?.() || 0;
      const bTime = b.completedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }
  // User Interest methods
  async getUserInterest(userId) {
    const snapshot = await db.collection("user_interests").where("userId", "==", userId).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async createOrUpdateUserInterest(interest) {
    const snapshot = await db.collection("user_interests").where("userId", "==", interest.userId).limit(1).get();
    if (!snapshot.empty) {
      const docRef2 = snapshot.docs[0].ref;
      await docRef2.update({ ...interest, updatedAt: FieldValue.serverTimestamp() });
      const updated = await docRef2.get();
      return updated.data();
    }
    const docRef = db.collection("user_interests").doc();
    const newInterest = {
      ...interest,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newInterest);
    return newInterest;
  }
  // Progress methods
  async getUserProgress(userId, moduleId) {
    const snapshot = await db.collection("user_progress").where("userId", "==", userId).where("moduleId", "==", moduleId).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async updateUserProgress(progress) {
    const snapshot = await db.collection("user_progress").where("userId", "==", progress.userId).where("moduleId", "==", progress.moduleId).limit(1).get();
    if (!snapshot.empty) {
      const docRef2 = snapshot.docs[0].ref;
      await docRef2.update({ ...progress, updatedAt: FieldValue.serverTimestamp() });
      const updated = await docRef2.get();
      return updated.data();
    }
    const docRef = db.collection("user_progress").doc();
    const newProgress = {
      ...progress,
      id: docRef.id,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      completed: progress.completed || false,
      progressPercent: progress.progressPercent || 0,
      timeSpentMinutes: progress.timeSpentMinutes || 0,
      completedAt: progress.completedAt ? Timestamp.fromDate(progress.completedAt) : void 0
    };
    await docRef.set(newProgress);
    return newProgress;
  }
  async getCourseProgress(userId, courseId) {
    const tiers = await this.getTiersByCourse(courseId);
    if (tiers.length === 0) return 0;
    let totalModules = 0;
    let completedModules = 0;
    for (const tier of tiers) {
      const modules = await this.getModulesByTier(tier.id);
      totalModules += modules.length;
      for (const module of modules) {
        const progress = await this.getUserProgress(userId, module.id);
        if (progress?.completed) {
          completedModules++;
        }
      }
    }
    if (totalModules === 0) return 0;
    return Math.round(completedModules / totalModules * 100);
  }
  async getCourseProgressDetails(userId, courseId) {
    const tiers = await this.getTiersByCourse(courseId);
    const progressList = [];
    for (const tier of tiers) {
      const modules = await this.getModulesByTier(tier.id);
      for (const module of modules) {
        const progress = await this.getUserProgress(userId, module.id);
        if (progress) {
          progressList.push(progress);
        }
      }
    }
    return progressList;
  }
  // Flashcard Progress
  async getFlashcardProgress(userId, flashcardId) {
    const snapshot = await db.collection("flashcard_progress").where("userId", "==", userId).where("flashcardId", "==", flashcardId).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  async updateFlashcardProgress(progress) {
    const snapshot = await db.collection("flashcard_progress").where("userId", "==", progress.userId).where("flashcardId", "==", progress.flashcardId).limit(1).get();
    if (!snapshot.empty) {
      const docRef2 = snapshot.docs[0].ref;
      await docRef2.update({ ...progress, lastReviewed: FieldValue.serverTimestamp() });
      const updated = await docRef2.get();
      return updated.data();
    }
    const docRef = db.collection("flashcard_progress").doc();
    const newProgress = {
      ...progress,
      id: docRef.id,
      lastReviewed: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      easeFactor: progress.easeFactor || 2.5,
      correct: progress.correct || 0,
      incorrect: progress.incorrect || 0,
      nextReview: progress.nextReview ? Timestamp.fromDate(progress.nextReview) : void 0
    };
    await docRef.set(newProgress);
    return newProgress;
  }
  // Understanding Checks
  async createUnderstandingCheck(check) {
    const docRef = db.collection("understanding_checks").doc();
    const newCheck = {
      ...check,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newCheck);
    return newCheck;
  }
  async getUnderstandingChecks(userId, moduleId) {
    const snapshot = await db.collection("understanding_checks").where("userId", "==", userId).where("moduleId", "==", moduleId).get();
    const checks = snapshot.docs.map((doc) => doc.data());
    return checks.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }
  // Enrollments
  async enrollUserInCourse(enrollment) {
    const docRef = db.collection("enrollments").doc();
    const newEnrollment = {
      ...enrollment,
      id: docRef.id,
      enrolledAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newEnrollment);
    return newEnrollment;
  }
  async getUserEnrollments(userId) {
    const snapshot = await db.collection("enrollments").where("userId", "==", userId).get();
    const enrollments = snapshot.docs.map((doc) => doc.data());
    return enrollments.sort((a, b) => {
      const aTime = a.enrolledAt?.toMillis?.() || 0;
      const bTime = b.enrolledAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }
  async getEnrollment(userId, courseId) {
    const snapshot = await db.collection("enrollments").where("userId", "==", userId).where("courseId", "==", courseId).limit(1).get();
    if (snapshot.empty) return void 0;
    return snapshot.docs[0].data();
  }
  // Stats
  async getUserStats(userId) {
    const enrollments = await this.getUserEnrollments(userId);
    const progressSnapshot = await db.collection("user_progress").where("userId", "==", userId).get();
    const progress = progressSnapshot.docs.map((doc) => doc.data());
    const totalMinutes = progress.reduce((acc, curr) => acc + (curr.timeSpentMinutes || 0), 0);
    const completedModules = progress.filter((p) => p.completed).length;
    const checksSnapshot = await db.collection("understanding_checks").where("userId", "==", userId).get();
    const checks = checksSnapshot.docs.map((doc) => doc.data());
    const averageScore = checks.length > 0 ? Math.round(checks.reduce((acc, curr) => acc + curr.score, 0) / checks.length) : 0;
    return {
      totalCourses: enrollments.length,
      totalMinutes,
      completedModules,
      averageScore
    };
  }
  async getAdminStats() {
    const [coursesSnapshot, usersSnapshot, enrollmentsSnapshot] = await Promise.all([
      db.collection("courses").get(),
      db.collection("users").get(),
      db.collection("enrollments").get()
    ]);
    return {
      totalCourses: coursesSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size
    };
  }
  // Notification methods
  async createNotification(notification) {
    const docRef = db.collection("notifications").doc();
    const newNotification = {
      ...notification,
      id: docRef.id,
      read: notification.read || false,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newNotification);
    return newNotification;
  }
  async getUserNotifications(userId) {
    const snapshot = await db.collection("notifications").where("userId", "==", userId).get();
    const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    }).slice(0, 50);
  }
  async markNotificationRead(id) {
    await db.collection("notifications").doc(id).update({ read: true });
  }
  async markAllNotificationsRead(userId) {
    const snapshot = await db.collection("notifications").where("userId", "==", userId).where("read", "==", false).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }
  // Get all user interests for multiple interests support
  async getAllUserInterests(userId) {
    const snapshot = await db.collection("user_interests").where("userId", "==", userId).get();
    const interests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return interests.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }
  // User Settings methods
  async getUserSettings(userId) {
    const docRef = db.collection("userSettings").doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) return void 0;
    return { id: doc.id, ...doc.data() };
  }
  async updateUserSettings(userId, settings) {
    const docRef = db.collection("userSettings").doc(userId);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update({
        ...settings,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      await docRef.set({
        userId,
        ...settings,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  }
};
var storage = new FirestoreStorage();

// server/sample-courses.ts
var sampleCourses = [
  {
    title: "Introduction to Computer Science",
    description: "Learn the fundamentals of computer science including algorithms, data structures, and programming concepts. Perfect for beginners starting their tech journey.",
    sourceType: "OpenStax",
    sourceUrl: "https://openstax.org/details/books/introduction-computer-science",
    content: `# Introduction to Computer Science

## What is Computer Science?

Computer Science is the study of computers and computational systems. Unlike electrical and computer engineers, computer scientists deal mostly with software and software systems; this includes their theory, design, development, and application.

## Core Concepts

### 1. Algorithms
An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. Think of it as a recipe for your computer.

**Example**: Finding the largest number in a list
1. Start with the first number as the current maximum
2. Compare each subsequent number with the current maximum
3. If a number is larger, make it the new maximum
4. Continue until all numbers are checked

### 2. Data Structures
Data structures are ways of organizing and storing data so that it can be accessed and modified efficiently.

**Common Data Structures**:
- **Arrays**: Ordered collections of elements
- **Linked Lists**: Chains of nodes containing data and pointers
- **Stacks**: Last-In-First-Out (LIFO) structures
- **Queues**: First-In-First-Out (FIFO) structures
- **Trees**: Hierarchical structures with parent-child relationships
- **Graphs**: Networks of connected nodes

### 3. Programming Fundamentals

**Variables**: Containers for storing data values
\`\`\`
let age = 25;
let name = "Alice";
\`\`\`

**Conditionals**: Making decisions in code
\`\`\`
if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}
\`\`\`

**Loops**: Repeating actions
\`\`\`
for (let i = 0; i < 5; i++) {
  console.log(i);
}
\`\`\`

## Computational Thinking

Computational thinking involves:
1. **Decomposition**: Breaking down complex problems into smaller parts
2. **Pattern Recognition**: Finding similarities and patterns
3. **Abstraction**: Focusing on important information, ignoring irrelevant details
4. **Algorithm Design**: Creating step-by-step solutions

## Real-World Applications

- **Web Development**: Creating websites and web applications
- **Mobile Apps**: Building iOS and Android applications
- **Artificial Intelligence**: Machine learning, natural language processing
- **Cybersecurity**: Protecting systems and data
- **Game Development**: Creating interactive entertainment
- **Data Science**: Analyzing and interpreting complex data

## Getting Started

To begin your journey in computer science:
1. Choose a programming language (Python is great for beginners)
2. Practice coding daily with small projects
3. Learn problem-solving through coding challenges
4. Build projects that interest you
5. Join coding communities and collaborate

Remember: Every expert was once a beginner. The key is consistent practice and curiosity!`
  },
  {
    title: "Biology: The Science of Life",
    description: "Explore the fascinating world of living organisms, from cells to ecosystems. Understand how life works at every level.",
    sourceType: "OpenStax",
    sourceUrl: "https://openstax.org/details/books/biology-2e",
    content: `# Biology: The Science of Life

## Introduction to Biology

Biology is the scientific study of life. It encompasses everything from the smallest bacteria to the largest whales, from individual cells to entire ecosystems.

## The Characteristics of Life

All living organisms share these characteristics:

1. **Organization**: Living things are highly organized structures
2. **Metabolism**: Chemical processes that maintain life
3. **Homeostasis**: Maintaining stable internal conditions
4. **Growth**: Increase in size and complexity
5. **Reproduction**: Creating new organisms
6. **Response to Stimuli**: Reacting to environmental changes
7. **Evolution**: Populations change over time

## The Cell: Basic Unit of Life

### Cell Theory
1. All living things are made of cells
2. Cells are the basic unit of life
3. All cells come from pre-existing cells

### Types of Cells

**Prokaryotic Cells** (Bacteria and Archaea):
- No nucleus
- Simple structure
- Smaller size (1-10 \u03BCm)
- DNA in nucleoid region

**Eukaryotic Cells** (Animals, Plants, Fungi, Protists):
- Have a nucleus
- Complex organelles
- Larger size (10-100 \u03BCm)
- DNA in chromosomes within nucleus

### Key Organelles

- **Nucleus**: Control center containing DNA
- **Mitochondria**: Powerhouse of the cell (energy production)
- **Ribosomes**: Protein synthesis
- **Endoplasmic Reticulum**: Protein and lipid processing
- **Golgi Apparatus**: Packaging and shipping center
- **Chloroplasts** (plants only): Photosynthesis

## DNA and Genetics

### The Structure of DNA
DNA (Deoxyribonucleic Acid) is a double helix made of:
- **Nucleotides**: Building blocks containing:
  - Sugar (deoxyribose)
  - Phosphate group
  - Nitrogenous base (A, T, G, C)

### Base Pairing Rules
- Adenine (A) pairs with Thymine (T)
- Guanine (G) pairs with Cytosine (C)

### From DNA to Proteins
1. **Transcription**: DNA \u2192 RNA
2. **Translation**: RNA \u2192 Protein

## Evolution and Natural Selection

### Darwin's Theory
Evolution occurs through natural selection:
1. **Variation**: Individuals differ in traits
2. **Inheritance**: Traits are passed to offspring
3. **Selection**: Some traits increase survival
4. **Time**: Populations change over generations

### Evidence for Evolution
- Fossil record
- Comparative anatomy
- Molecular biology (DNA similarities)
- Biogeography
- Direct observation

## Ecology: Organisms and Their Environment

### Levels of Organization
1. **Individual**: Single organism
2. **Population**: Same species in an area
3. **Community**: All species in an area
4. **Ecosystem**: Community + physical environment
5. **Biosphere**: All ecosystems on Earth

### Energy Flow
- **Producers**: Plants (photosynthesis)
- **Consumers**: Animals (eat other organisms)
- **Decomposers**: Break down dead matter

### Nutrient Cycles
- Carbon cycle
- Nitrogen cycle
- Water cycle
- Phosphorus cycle

## Human Body Systems

### Major Systems
1. **Nervous System**: Communication and control
2. **Circulatory System**: Transport of materials
3. **Respiratory System**: Gas exchange
4. **Digestive System**: Breaking down food
5. **Immune System**: Defense against disease
6. **Skeletal System**: Support and protection
7. **Muscular System**: Movement
8. **Endocrine System**: Hormone regulation

## Applications of Biology

- **Medicine**: Understanding disease and developing treatments
- **Agriculture**: Improving crop yields and sustainability
- **Biotechnology**: Genetic engineering, vaccines
- **Conservation**: Protecting endangered species
- **Forensics**: DNA analysis for crime solving
- **Environmental Science**: Addressing climate change

## Study Tips

1. Draw diagrams to visualize concepts
2. Use mnemonics for memorization
3. Connect concepts to real-life examples
4. Practice with flashcards
5. Teach concepts to others

Biology is everywhere around us. Understanding it helps us appreciate the complexity and beauty of life!`
  },
  {
    title: "Introduction to Psychology",
    description: "Discover how the human mind works. Learn about behavior, cognition, emotions, and mental processes.",
    sourceType: "OpenStax",
    sourceUrl: "https://openstax.org/details/books/psychology-2e",
    content: `# Introduction to Psychology

## What is Psychology?

Psychology is the scientific study of the mind and behavior. It seeks to understand individuals and groups by establishing general principles and researching specific cases.

## Major Perspectives in Psychology

### 1. Biological Perspective
- Focuses on physical and biological bases of behavior
- Studies brain structure, neurotransmitters, genetics
- Example: How does serotonin affect mood?

### 2. Cognitive Perspective
- Examines mental processes like thinking, memory, problem-solving
- Studies how we perceive, learn, and remember
- Example: How do we make decisions?

### 3. Behavioral Perspective
- Focuses on observable behaviors
- Studies how environment shapes behavior through learning
- Example: Classical and operant conditioning

### 4. Humanistic Perspective
- Emphasizes personal growth and self-actualization
- Focuses on free will and human potential
- Example: Maslow's hierarchy of needs

### 5. Psychodynamic Perspective
- Examines unconscious drives and early experiences
- Based on Freud's theories
- Example: How do childhood experiences shape personality?

### 6. Sociocultural Perspective
- Studies how social and cultural factors influence behavior
- Examines group dynamics and cultural norms
- Example: How does culture affect perception?

## The Brain and Behavior

### Brain Structure

**Major Brain Regions**:
- **Cerebral Cortex**: Higher-order thinking, consciousness
- **Limbic System**: Emotions, memory (includes amygdala, hippocampus)
- **Cerebellum**: Coordination and balance
- **Brainstem**: Basic life functions (breathing, heart rate)

### Neurotransmitters

Chemical messengers that affect mood and behavior:
- **Dopamine**: Pleasure, reward, motivation
- **Serotonin**: Mood, sleep, appetite
- **GABA**: Calming, reduces anxiety
- **Glutamate**: Learning, memory
- **Norepinephrine**: Alertness, arousal

## Learning and Memory

### Types of Learning

**Classical Conditioning** (Pavlov):
- Learning through association
- Example: Dog salivates at bell sound

**Operant Conditioning** (Skinner):
- Learning through consequences
- Reinforcement increases behavior
- Punishment decreases behavior

**Observational Learning** (Bandura):
- Learning by watching others
- Example: Children imitating adults

### Memory Systems

**Sensory Memory**: Brief storage (< 1 second)
**Short-Term Memory**: Limited capacity (7\xB12 items), ~20 seconds
**Long-Term Memory**: Unlimited capacity, permanent storage

**Types of Long-Term Memory**:
- **Explicit** (conscious):
  - Episodic: Personal experiences
  - Semantic: Facts and knowledge
- **Implicit** (unconscious):
  - Procedural: Skills and habits
  - Priming: Unconscious associations

## Development Across the Lifespan

### Piaget's Stages of Cognitive Development

1. **Sensorimotor** (0-2 years): Learning through senses and actions
2. **Preoperational** (2-7 years): Symbolic thinking, egocentrism
3. **Concrete Operational** (7-11 years): Logical thinking about concrete objects
4. **Formal Operational** (12+ years): Abstract reasoning

### Erikson's Psychosocial Stages

Each stage involves a crisis to resolve:
1. Trust vs. Mistrust (infancy)
2. Autonomy vs. Shame (toddlerhood)
3. Initiative vs. Guilt (preschool)
4. Industry vs. Inferiority (school age)
5. Identity vs. Role Confusion (adolescence)
6. Intimacy vs. Isolation (young adulthood)
7. Generativity vs. Stagnation (middle adulthood)
8. Integrity vs. Despair (late adulthood)

## Personality

### The Big Five Personality Traits (OCEAN)

1. **Openness**: Creativity, curiosity
2. **Conscientiousness**: Organization, responsibility
3. **Extraversion**: Sociability, energy
4. **Agreeableness**: Kindness, cooperation
5. **Neuroticism**: Emotional stability

## Psychological Disorders

### Common Disorders

**Anxiety Disorders**:
- Generalized Anxiety Disorder (GAD)
- Panic Disorder
- Phobias
- Social Anxiety Disorder

**Mood Disorders**:
- Major Depressive Disorder
- Bipolar Disorder

**Schizophrenia Spectrum**:
- Hallucinations
- Delusions
- Disorganized thinking

**Obsessive-Compulsive Disorder (OCD)**:
- Intrusive thoughts
- Compulsive behaviors

### Treatment Approaches

**Psychotherapy**:
- Cognitive-Behavioral Therapy (CBT)
- Psychodynamic therapy
- Humanistic therapy
- Group therapy

**Biomedical**:
- Medications (antidepressants, antipsychotics, anxiolytics)
- Electroconvulsive therapy (ECT)
- Transcranial magnetic stimulation (TMS)

## Social Psychology

### Social Influence

**Conformity**: Changing behavior to match group norms
- Asch's line study

**Obedience**: Following orders from authority
- Milgram's shock experiment

**Group Dynamics**:
- Social facilitation: Better performance with audience
- Social loafing: Less effort in groups
- Groupthink: Desire for harmony leads to poor decisions

### Attitudes and Persuasion

**Cognitive Dissonance**: Discomfort from conflicting beliefs
**Persuasion Techniques**:
- Central route: Logical arguments
- Peripheral route: Superficial cues

## Applications of Psychology

- **Clinical Psychology**: Mental health treatment
- **Counseling**: Personal and career guidance
- **Industrial-Organizational**: Workplace behavior
- **Educational**: Learning and teaching
- **Sports Psychology**: Athletic performance
- **Forensic**: Legal system applications
- **Health Psychology**: Promoting wellness

## Research Methods

**Experimental Method**: Manipulate variables to determine cause-effect
**Correlational Method**: Examine relationships between variables
**Case Studies**: In-depth analysis of individuals
**Surveys**: Collect data from large groups
**Naturalistic Observation**: Observe behavior in natural settings

## Ethical Considerations

- Informed consent
- Confidentiality
- Debriefing
- Protection from harm
- Deception only when necessary

Understanding psychology helps us better understand ourselves and others, improve relationships, and enhance mental well-being!`
  }
];

// server/seed.ts
var seeded = false;
async function seedDatabase(useSampleCourses = true) {
  if (seeded) return;
  try {
    let admin = await storage.getUserByUsername("admin");
    if (!admin) {
      console.log("Seeding database with admin user...");
      admin = await storage.createUser({
        username: "admin",
        password: "admin123",
        // Change this in production!
        email: "admin@scire.app",
        isAdmin: true,
        provider: "local"
      });
      console.log("Admin user created successfully");
    }
    if (useSampleCourses) {
      const existingCourses = await storage.getAllCourses();
      if (existingCourses.length === 0) {
        console.log("Seeding database with sample courses...");
        for (const courseData of sampleCourses) {
          await storage.createCourse({
            ...courseData,
            createdBy: admin.id
          });
        }
        console.log(`${sampleCourses.length} sample courses created successfully`);
      }
    }
    seeded = true;
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// server/auth.ts
import { createClerkClient, verifyToken } from "@clerk/backend";
var clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
async function requireAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    if (!sessionToken) {
      return res.status(401).json({ error: "No authorization token provided" });
    }
    const verifiedToken = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    if (!verifiedToken) {
      return res.status(401).json({ error: "Invalid session" });
    }
    req.auth = {
      userId: verifiedToken.sub,
      sessionId: verifiedToken.sid || ""
    };
    let user = await storage.getUserByClerkId(verifiedToken.sub);
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);
      user = await storage.createUser({
        username: clerkUser.emailAddresses[0]?.emailAddress || `user_${verifiedToken.sub}`,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || void 0,
        picture: clerkUser.imageUrl,
        clerkId: verifiedToken.sub,
        provider: "clerk",
        isAdmin: false,
        onboardingCompleted: false
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
async function optionalAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    if (!sessionToken) {
      return next();
    }
    const verifiedToken = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    if (verifiedToken) {
      req.auth = {
        userId: verifiedToken.sub,
        sessionId: verifiedToken.sid || ""
      };
      let user = await storage.getUserByClerkId(verifiedToken.sub);
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);
        user = await storage.createUser({
          username: clerkUser.emailAddresses[0]?.emailAddress || `user_${verifiedToken.sub}`,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || void 0,
          picture: clerkUser.imageUrl,
          clerkId: verifiedToken.sub,
          provider: "clerk",
          isAdmin: false,
          onboardingCompleted: false
        });
      }
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}
function setupAuth(app3) {
  app3.get("/api/auth/user", optionalAuth, async (req, res) => {
    if (req.user) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
  app3.post("/api/auth/sync", async (req, res) => {
    try {
      const sessionToken = req.headers.authorization?.replace("Bearer ", "");
      if (!sessionToken) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      const verifiedToken = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      if (!verifiedToken) {
        return res.status(401).json({ error: "Invalid session" });
      }
      const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);
      let user = await storage.getUserByClerkId(verifiedToken.sub);
      if (!user) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          user = await storage.getUserByEmail(email);
        }
        if (!user) {
          user = await storage.createUser({
            username: clerkUser.emailAddresses[0]?.emailAddress || `user_${verifiedToken.sub}`,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || void 0,
            picture: clerkUser.imageUrl,
            clerkId: verifiedToken.sub,
            provider: "clerk",
            isAdmin: false,
            onboardingCompleted: false
          });
        } else {
          user = await storage.updateUser(user.id, {
            clerkId: verifiedToken.sub,
            provider: "clerk",
            picture: clerkUser.imageUrl,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || user.name
          });
        }
      } else {
        user = await storage.updateUser(user.id, {
          picture: clerkUser.imageUrl,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || user.name,
          email: clerkUser.emailAddresses[0]?.emailAddress || user.email
        });
      }
      res.json({ user });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });
  app3.post("/api/auth/role", requireAuth, async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.user.id;
      if (!role || !["student", "educator"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'student' or 'educator'" });
      }
      const updatedUser = await storage.updateUser(userId, {
        role,
        isAdmin: role === "educator",
        onboardingCompleted: true
      });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Role update error:", error);
      res.status(500).json({ error: error.message || "Failed to set role" });
    }
  });
  app3.post("/api/webhooks/clerk", async (req, res) => {
    const { type, data } = req.body;
    try {
      switch (type) {
        case "user.deleted":
          const userToDelete = await storage.getUserByClerkId(data.id);
          if (userToDelete) {
            await storage.deleteUser(userToDelete.id);
          }
          break;
        case "user.updated":
          const userToUpdate = await storage.getUserByClerkId(data.id);
          if (userToUpdate) {
            await storage.updateUser(userToUpdate.id, {
              email: data.email_addresses?.[0]?.email_address,
              name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || void 0,
              picture: data.image_url
            });
          }
          break;
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}

// server/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
var genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
function checkGemini() {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set");
  }
}
async function generateCourseTiers(courseContent, courseTitle) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Analyze the following educational content and create a structured learning path with 3 tiers (Start, Intermediate, Advanced).

Course Title: ${courseTitle}

Content:
${courseContent.slice(0, 4e3)}

For each tier, create 5-8 modules. Each module should:
- Have a clear, engaging title
- include a detailed summary of what will be covered
- Build progressively on previous modules

Return the response in JSON format with this structure:
{
  "tiers": [
    {
      "level": "start" | "intermediate" | "advanced",
      "title": "string",
      "description": "string",
      "modules": [
        {
          "title": "string",
          "summary": "string",
          "estimatedMinutes": number
        }
      ]
    }
  ]
}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.tiers;
}
async function generateFlashcards(moduleContent, moduleTitle, count = 5) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Create ${count} flashcards for the following educational module.

Module: ${moduleTitle}
Content: ${moduleContent.slice(0, 6e3)}

Each flashcard should test understanding of key concepts. Return in JSON format:
{
  "flashcards": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.flashcards;
}
async function validateUnderstanding(moduleContent, userExplanation) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Evaluate this student's understanding of the module content.

Module Content:
${moduleContent.slice(0, 2e3)}

Student Explanation:
${userExplanation}

Provide:
1. Score (0-100) based on accuracy and completeness
2. Constructive feedback on their understanding
3. 2-3 specific areas for improvement

Return in JSON format:
{
  "score": number,
  "feedback": "string",
  "areasForImprovement": ["string"]
}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}
async function curateCoursesForInterests(topics, learningGoals, availableCourses) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Recommend the most relevant courses for a learner with these interests:

Topics: ${topics.join(", ")}
Learning Goals: ${learningGoals}

Available Courses:
${availableCourses.map((c, i) => `${i + 1}. ${c.title}: ${c.description}`).join("\n")}

Return recommended course IDs in order of relevance with brief reasoning:
{
  "recommendations": [
    {
      "courseId": "string",
      "reason": "string",
      "suggestedTier": "start" | "intermediate" | "advanced"
    }
  ]
}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.recommendations || [];
}
async function generateQuiz(moduleContent, moduleTitle) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Create a multiple-choice quiz with 5 questions for this module.

Module: ${moduleTitle}
Content: ${moduleContent.slice(0, 6e3)}

Return in JSON format:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": number (0-3),
      "explanation": "string"
    }
  ]
}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.questions;
}
async function generateUnderstandingPrompt(moduleContent, moduleTitle) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Create a prompt for an open-ended understanding check for this module.

Module: ${moduleTitle}
Content: ${moduleContent.slice(0, 4e3)}

The prompt should ask the student to explain the core concepts in their own words.
Also provide a rubric or key points they should cover.

Return in JSON format:
{
  "prompt": "string",
  "rubric": "string"
}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}
async function generateCourseStructure(topic, learningGoal) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Create a comprehensive course structure for the topic: "${topic}".
  User's Learning Goal: "${learningGoal}"

  The course should be structured into 3 distinct tiers:
  1. Start (Beginner)
  2. Intermediate
  3. Advanced

  For EACH tier, provide:
  - A clear title and description for the tier.
  - EXACTLY 5 Modules. Each module must have:
    - A specific title.
    - A brief summary of what will be covered.
    - Estimated time to complete (in minutes).

  Also provide a catchy Title and Description for the overall course.

  Return strictly in this JSON format:
  {
    "title": "string",
    "description": "string",
    "tiers": [
      {
        "level": "start" | "intermediate" | "advanced",
        "title": "string",
        "description": "string",
        "modules": [
          {
            "title": "string",
            "summary": "string",
            "estimatedMinutes": number
          }
        ]
      }
    ]
  }`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}
async function generateModuleContent(moduleTitle, moduleSummary, courseTitle) {
  checkGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `Write comprehensive educational content for this module.

  Course: ${courseTitle}
  Module: ${moduleTitle}
  Summary: ${moduleSummary}

  Requirements:
  - At least 800 words of HIGH QUALITY educational content.
  - Clear headings (Markdown h2/h3) and structure.
  - Real-world examples, case studies, and analogies.
  - Detailed explanations of concepts.
  - Engaging and easy to understand.
  - Also provide a specific, highly detailed visual description to use as an image generation prompt. It should capture the essence of the topic (e.g. "photorealistic close-up of a double helix DNA strand, cinematic lighting" or "modern developer workspace with code on multiple monitors, warm lighting").

  Return strictly in this JSON format:
  {
    "content": "markdown string",
    "imageKeyword": "string"
  }`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  });
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```markdown\n/g, "").replace(/```json\n/g, "").replace(/```/g, "");
  const data = JSON.parse(cleanedText);
  if (data.content) {
    data.content = data.content.replace(/^```markdown\s*/, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  return data;
}

// server/routes.ts
async function registerRoutes(app3) {
  await seedDatabase();
  app3.get("/api/courses", async (req, res) => {
    try {
      const allCourses = await storage.getAllCourses();
      const publicCourses = allCourses.filter(
        (course) => !course.isPersonalized
      );
      res.json(publicCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });
  app3.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseWithDetails(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });
  app3.post("/api/courses", async (req, res) => {
    try {
      const admin = await storage.getUserByUsername("admin");
      if (!admin) {
        return res.status(500).json({ error: "Admin user not found" });
      }
      const data = {
        ...req.body,
        createdBy: admin.id
      };
      const course = await storage.createCourse(data);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to create course" });
    }
  });
  app3.put("/api/courses/:id", async (req, res) => {
    try {
      const data = req.body;
      const course = await storage.updateCourse(req.params.id, data);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });
  app3.delete("/api/courses/:id", async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });
  app3.post("/api/courses/:id/generate-tiers", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const tiersData = await generateCourseTiers(course.content, course.title);
      const tierLevelOrder = { start: 0, intermediate: 1, advanced: 2 };
      for (const tierData of tiersData) {
        const tier = await storage.createTier({
          courseId: course.id,
          level: tierData.level,
          title: tierData.title,
          description: tierData.description || "",
          order: tierLevelOrder[tierData.level] || 0
        });
        for (let i = 0; i < tierData.modules.length; i++) {
          const moduleData = tierData.modules[i];
          const module = await storage.createModule({
            tierId: tier.id,
            title: moduleData.title,
            content: moduleData.content,
            order: i,
            estimatedMinutes: moduleData.estimatedMinutes || 15
          });
          const flashcardsData = await generateFlashcards(module.content, module.title, 5);
          for (let j = 0; j < flashcardsData.length; j++) {
            await storage.createFlashcard({
              moduleId: module.id,
              question: flashcardsData[j].question,
              answer: flashcardsData[j].answer,
              order: j
            });
          }
        }
      }
      res.json({ success: true, message: "Tiers generated successfully" });
    } catch (error) {
      console.error("Generate tiers error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate tiers" });
    }
  });
  app3.post("/api/fetch-content", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      res.json({
        title: "Fetched Content",
        content: "This is placeholder content. In production, implement web scraping for OpenStax, YouTube transcripts, etc."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });
  app3.get("/api/modules/:id", async (req, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });
  app3.get("/api/tiers/:tierId/modules", async (req, res) => {
    try {
      const modules = await storage.getModulesByTier(req.params.tierId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });
  app3.get("/api/flashcards/:moduleId", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsByModule(req.params.moduleId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });
  app3.post("/api/modules/:moduleId/generate-flashcards", async (req, res) => {
    try {
      const moduleId = req.params.moduleId;
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const existingFlashcards = await storage.getFlashcardsByModule(moduleId);
      if (existingFlashcards.length > 0) {
        return res.json(existingFlashcards);
      }
      const prompt = `Based on the following educational content, generate 5-8 flashcards. Each flashcard should test understanding of key concepts.

Content:
${module.content.substring(0, 3e3)}

Return ONLY a valid JSON array of flashcards in this exact format, with no additional text:
[
  {"question": "What is...", "answer": "..."},
  {"question": "How does...", "answer": "..."}
]`;
      const { GoogleGenerativeAI: GoogleGenerativeAI2 } = await import("@google/generative-ai");
      const genAI2 = new GoogleGenerativeAI2(process.env.GEMINI_API_KEY || "");
      const model = genAI2.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Failed to parse flashcards JSON:", responseText);
        return res.status(500).json({ error: "Failed to generate flashcards" });
      }
      const flashcardsData = JSON.parse(jsonMatch[0]);
      const savedFlashcards = [];
      for (let i = 0; i < flashcardsData.length; i++) {
        const fc = flashcardsData[i];
        const savedFlashcard = await storage.createFlashcard({
          moduleId,
          question: fc.question,
          answer: fc.answer,
          order: i + 1
        });
        savedFlashcards.push(savedFlashcard);
      }
      res.json(savedFlashcards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ error: "Failed to generate flashcards" });
    }
  });
  app3.get("/api/interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const interest = await storage.getUserInterest(userId);
      res.json(interest || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });
  app3.post("/api/interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const data = {
        ...req.body,
        userId
      };
      const interest = await storage.createOrUpdateUserInterest(data);
      res.json(interest);
    } catch (error) {
      res.status(500).json({ error: "Failed to save interests" });
    }
  });
  app3.get("/api/interests/all", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const interests = await storage.getAllUserInterests(userId);
      res.json(interests || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });
  app3.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        settings = {
          id: "",
          userId,
          notifyNewCourses: true,
          notifyFlashcardReminders: true,
          notifyAssessmentReminders: true,
          flashcardReminderFrequency: "daily",
          assessmentReminderFrequency: "daily",
          preferredReminderTime: "09:00",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app3.put("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  app3.post("/api/recommendations", async (req, res) => {
    try {
      const { topics, learningGoals, skillLevel } = req.body;
      if (!topics || topics.length === 0) {
        return res.status(400).json({ error: "Topics are required" });
      }
      const courses = await storage.getAllCourses();
      if (courses.length === 0) {
        return res.json({
          recommendations: [],
          message: "No courses available yet. Try adding some interests and we'll generate personalized courses for you!"
        });
      }
      const primaryTopic = topics[0];
      const hasRelevantCourse = courses.some((c) => c.title.toLowerCase().includes(primaryTopic.toLowerCase()));
      if (!hasRelevantCourse) {
        console.log(`Generating new course for topic: ${primaryTopic}`);
        try {
          const structure = await generateCourseStructure(primaryTopic, learningGoals || "General knowledge");
          const newCourse = await storage.createCourse({
            title: structure.title,
            description: structure.description,
            sourceType: "ai_generated",
            content: "AI Generated Course",
            createdBy: "system"
          });
          const tierLevelOrder = { start: 0, intermediate: 1, advanced: 2 };
          for (const tierData of structure.tiers) {
            const tier = await storage.createTier({
              courseId: newCourse.id,
              level: tierData.level,
              title: tierData.title,
              description: tierData.description,
              order: tierLevelOrder[tierData.level] || 0
            });
            for (let i = 0; i < tierData.modules.length; i++) {
              const modData = tierData.modules[i];
              let content = "Content is being generated. Please check back later.";
              let imageUrl = void 0;
              if (tierData.level === "start") {
                try {
                  const moduleContentData = await generateModuleContent(modData.title, modData.summary, structure.title);
                  content = moduleContentData.content;
                  const imageKeyword = moduleContentData.imageKeyword || modData.title;
                  imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;
                } catch (e) {
                  console.error("Failed to generate content:", e);
                  content = `Welcome to potential content for ${modData.title}. Generation failed, please try regenerating later.`;
                }
              }
              const module = await storage.createModule({
                tierId: tier.id,
                title: modData.title,
                content,
                imageUrl,
                order: i,
                estimatedMinutes: modData.estimatedMinutes
              });
              if (tierData.level === "start") {
                const quiz = await generateQuiz(content, modData.title);
                await storage.createAssessment({
                  moduleId: module.id,
                  type: "quiz",
                  title: "Quiz",
                  questions: quiz,
                  order: 0
                });
                const check = await generateUnderstandingPrompt(content, modData.title);
                await storage.createAssessment({
                  moduleId: module.id,
                  type: "understanding",
                  title: "Check",
                  prompt: check.prompt,
                  rubric: check.rubric,
                  order: 1
                });
              }
            }
          }
          return res.json({
            recommendations: [{
              courseId: newCourse.id,
              course: newCourse,
              reason: "Custom generated course for your interest",
              suggestedTier: "start"
            }]
          });
        } catch (error) {
          console.error("Failed to generate course:", error);
        }
      }
      try {
        const recommendations = await curateCoursesForInterests(
          topics,
          learningGoals || "General learning",
          courses
        );
        if (!recommendations || recommendations.length === 0) {
          return res.json({
            recommendations: [],
            suggestGeneration: true,
            message: `We couldn't find existing courses matching "${topics.join(", ")}". Would you like us to generate a personalized learning path for you?`
          });
        }
        res.json({
          recommendations,
          message: `Found ${recommendations.length} courses curated for your interests and skill level`
        });
      } catch (aiError) {
        console.error("AI recommendation failed:", aiError);
        const fallbackRecs = courses.map((course) => {
          let score = 0;
          const searchText = `${course.title} ${course.description}`.toLowerCase();
          for (const topic of topics) {
            if (searchText.includes(topic.toLowerCase())) {
              score += 10;
            }
          }
          return score > 0 ? {
            courseId: course.id,
            course: {
              id: course.id,
              title: course.title,
              description: course.description,
              sourceType: course.sourceType
            },
            reason: `Matches your interest in ${topics.join(", ")}`,
            suggestedTier: skillLevel === "beginner" ? "start" : skillLevel === "advanced" ? "advanced" : "intermediate"
          } : null;
        }).filter((r) => r !== null).slice(0, 10);
        res.json({
          recommendations: fallbackRecs,
          message: "Recommendations based on keyword matching (AI temporarily unavailable)"
        });
      }
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });
  app3.post("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { courseId } = req.body;
      const existing = await storage.getEnrollment(userId, courseId);
      if (existing) {
        return res.json(existing);
      }
      const enrollment = await storage.enrollUserInCourse({ userId, courseId });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });
  app3.get("/api/enrollments/:courseId", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const enrollment = await storage.getEnrollment(userId, req.params.courseId);
      res.json(enrollment || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  });
  app3.get("/api/progress/:courseId", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const progressPercent = await storage.getCourseProgress(userId, req.params.courseId);
      res.json(progressPercent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });
  app3.get("/api/progress/:courseId/details", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const details = await storage.getCourseProgressDetails(userId, req.params.courseId);
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress details" });
    }
  });
  app3.get("/api/progress/module/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getUserProgress(userId, req.params.moduleId);
      res.json(progress || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module progress" });
    }
  });
  app3.post("/api/progress/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const data = {
        ...req.body,
        userId,
        moduleId: req.params.moduleId
      };
      const progress = await storage.updateUserProgress(data);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });
  app3.post("/api/flashcard-progress", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { flashcardId, correct } = req.body;
      const existing = await storage.getFlashcardProgress(userId, flashcardId);
      const flashcardProgress = await storage.updateFlashcardProgress({
        userId,
        flashcardId,
        correct: existing ? correct ? existing.correct + 1 : existing.correct : correct ? 1 : 0,
        incorrect: existing ? !correct ? existing.incorrect + 1 : existing.incorrect : !correct ? 1 : 0,
        lastReviewed: /* @__PURE__ */ new Date()
      });
      res.json(flashcardProgress);
    } catch (error) {
      res.status(500).json({ error: "Failed to record flashcard progress" });
    }
  });
  app3.get("/api/modules/:moduleId/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAssessmentsByModule(req.params.moduleId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });
  app3.post("/api/modules/:moduleId/generate-flashcards", requireAuth, async (req, res) => {
    try {
      const moduleId = req.params.moduleId;
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const flashcardsData = await generateFlashcards(module.content, module.title);
      const createdFlashcards = await Promise.all(
        flashcardsData.map((f, index) => storage.createFlashcard({
          moduleId,
          question: f.question,
          answer: f.answer,
          order: index
        }))
      );
      res.json(createdFlashcards);
    } catch (error) {
      console.error("Flashcard generation error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate flashcards" });
    }
  });
  app3.post("/api/modules/:moduleId/validate", requireAuth, async (req, res) => {
    try {
      const { explanation } = req.body;
      const moduleId = req.params.moduleId;
      const userId = req.user.id;
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const validation = await validateUnderstanding(module.content, explanation);
      const check = await storage.createUnderstandingCheck({
        userId,
        moduleId,
        userExplanation: explanation,
        aiFeedback: validation.feedback,
        score: validation.score,
        areasForImprovement: validation.areasForImprovement
      });
      res.json({
        score: check.score,
        feedback: check.aiFeedback,
        areasForImprovement: check.areasForImprovement
      });
    } catch (error) {
      console.error("Understanding check error:", error);
      res.status(500).json({ error: error?.message || "Failed to validate understanding" });
    }
  });
  app3.post("/api/understanding-check", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { moduleId, userExplanation } = req.body;
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const validation = await validateUnderstanding(module.content, userExplanation);
      const check = await storage.createUnderstandingCheck({
        userId,
        moduleId,
        userExplanation,
        aiFeedback: validation.feedback,
        score: validation.score,
        areasForImprovement: validation.areasForImprovement
      });
      res.json(check);
    } catch (error) {
      console.error("Understanding check error:", error);
      res.status(500).json({ error: error?.message || "Failed to validate understanding" });
    }
  });
  app3.get("/api/user/enrolled-courses", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const enrollments = await storage.getUserEnrollments(userId);
      const coursesWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourseWithDetails(enrollment.courseId);
          if (!course) {
            return null;
          }
          const progress = await storage.getCourseProgress(userId, enrollment.courseId);
          const tiers = course.tiers?.map((tier) => ({
            id: tier.id,
            level: tier.level,
            title: tier.title,
            generationStatus: tier.generationStatus || (tier.modules?.length > 0 ? "completed" : "locked"),
            modulesCount: tier.modules?.length || 0
          })) || [];
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            progress,
            timeSpent: 0,
            // Can calculate from progress entries
            isPersonalized: course.isPersonalized || false,
            generationStatus: course.generationStatus || "completed",
            generatedForUserId: course.generatedForUserId,
            tiers,
            enrolledAt: enrollment.enrolledAt
          };
        })
      );
      const result = coursesWithDetails.filter(Boolean);
      res.json(result);
    } catch (error) {
      console.error("[enrolled-courses] ERROR:", error);
      console.error("[enrolled-courses] Stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
  });
  app3.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });
  app3.get("/api/admin/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });
  app3.get("/api/admin/stats", optionalAuth, async (req, res) => {
    try {
      if (req.user && req.user.role !== "educator") {
        return res.status(403).json({ error: "Access denied. Educators only." });
      }
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  app3.get("/api/user/personalized-courses", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const allCourses = await storage.getAllCourses();
      const personalizedCourses = allCourses.filter(
        (course) => course.isPersonalized && course.generatedForUserId === userId
      );
      res.json(personalizedCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personalized courses" });
    }
  });
  app3.post("/api/courses/generate-from-interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { topics, learningGoals } = req.body;
      if (!topics || topics.length === 0) {
        return res.status(400).json({ error: "Topics are required" });
      }
      const primaryTopic = topics[0];
      const structure = await generateCourseStructure(primaryTopic, learningGoals || "General knowledge");
      const course = await storage.createCourse({
        title: structure.title,
        description: structure.description,
        sourceType: "ai_generated",
        content: "AI Generated Course",
        createdBy: userId,
        isPersonalized: true,
        generatedForUserId: userId,
        generationStatus: "generating"
      });
      const tierLevelOrder = { start: 0, intermediate: 1, advanced: 2 };
      for (const tierData of structure.tiers) {
        const isStartTier = tierData.level === "start";
        const tier = await storage.createTier({
          courseId: course.id,
          level: tierData.level,
          title: tierData.title,
          description: tierData.description,
          order: tierLevelOrder[tierData.level] || 0,
          generationStatus: isStartTier ? "completed" : "locked"
        });
        if (isStartTier) {
          for (let i = 0; i < tierData.modules.length; i++) {
            const modData = tierData.modules[i];
            try {
              const moduleContentData = await generateModuleContent(modData.title, modData.summary, structure.title);
              const imageKeyword = moduleContentData.imageKeyword || modData.title;
              const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;
              const module = await storage.createModule({
                tierId: tier.id,
                title: modData.title,
                content: moduleContentData.content,
                imageUrl,
                order: i,
                estimatedMinutes: modData.estimatedMinutes
              });
              const quiz = await generateQuiz(moduleContentData.content, modData.title);
              await storage.createAssessment({
                moduleId: module.id,
                type: "quiz",
                title: "Quiz",
                questions: quiz,
                order: 0
              });
              const check = await generateUnderstandingPrompt(moduleContentData.content, modData.title);
              await storage.createAssessment({
                moduleId: module.id,
                type: "understanding",
                title: "Check",
                prompt: check.prompt,
                rubric: check.rubric,
                order: 1
              });
            } catch (error) {
              console.error(`Failed to generate module ${modData.title}:`, error);
            }
          }
        }
      }
      await storage.updateCourse(course.id, { generationStatus: "completed" });
      await storage.enrollUserInCourse({ userId, courseId: course.id });
      await storage.createNotification({
        userId,
        type: "course_created",
        title: "Course Created!",
        message: `Your personalized course "${structure.title}" is ready! Tier 1 is available to start learning.`,
        data: { courseId: course.id }
      });
      res.json({
        success: true,
        course: { ...course, generationStatus: "completed" },
        message: "Course generated successfully! Tier 1 is ready to learn."
      });
    } catch (error) {
      console.error("Generate from interests error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate course" });
    }
  });
  app3.post("/api/courses/:id/generate-tier/:tierLevel", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id, tierLevel } = req.params;
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.generatedForUserId && course.generatedForUserId !== userId) {
        return res.status(403).json({ error: "You don't have access to this course" });
      }
      const tiers = await storage.getTiersByCourse(id);
      const targetTier = tiers.find((t) => t.level === tierLevel);
      if (!targetTier) {
        return res.status(404).json({ error: "Tier not found" });
      }
      const tierOrder = ["start", "intermediate", "advanced"];
      const currentTierIndex = tierOrder.indexOf(tierLevel);
      if (currentTierIndex > 0) {
        const previousTierLevel = tierOrder[currentTierIndex - 1];
        const previousTier = tiers.find((t) => t.level === previousTierLevel);
        if (!previousTier || previousTier.generationStatus !== "completed") {
          return res.status(400).json({
            error: "You must complete the previous tier before generating this one"
          });
        }
      }
      await storage.updateTier(targetTier.id, { generationStatus: "generating" });
      const structure = await generateCourseStructure(course.title, course.description);
      const tierData = structure.tiers.find((t) => t.level === tierLevel);
      if (!tierData) {
        await storage.updateTier(targetTier.id, { generationStatus: "locked" });
        return res.status(500).json({ error: "Failed to get tier structure" });
      }
      for (let i = 0; i < tierData.modules.length; i++) {
        const modData = tierData.modules[i];
        let content = "";
        let imageUrl;
        try {
          const moduleContentData = await generateModuleContent(modData.title, modData.summary, course.title);
          content = moduleContentData.content;
          const imageKeyword = moduleContentData.imageKeyword || modData.title;
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=400&nologo=true`;
        } catch (e) {
          console.error("Content generation failed:", e);
          content = "Failed to generate content. Please try again.";
        }
        const module = await storage.createModule({
          tierId: targetTier.id,
          title: modData.title,
          content,
          imageUrl,
          order: i,
          estimatedMinutes: modData.estimatedMinutes
        });
        const quiz = await generateQuiz(content, modData.title);
        await storage.createAssessment({
          moduleId: module.id,
          type: "quiz",
          title: "Quiz",
          questions: quiz,
          order: 0
        });
        const check = await generateUnderstandingPrompt(content, modData.title);
        await storage.createAssessment({
          moduleId: module.id,
          type: "understanding",
          title: "Check",
          prompt: check.prompt,
          rubric: check.rubric,
          order: 1
        });
      }
      await storage.updateTier(targetTier.id, { generationStatus: "completed" });
      await storage.createNotification({
        userId,
        type: "tier_unlocked",
        title: "New Tier Unlocked!",
        message: `${tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1)} tier is now available in "${course.title}"!`,
        data: { courseId: course.id, tierId: targetTier.id }
      });
      res.json({
        success: true,
        message: `${tierLevel} tier generated successfully!`
      });
    } catch (error) {
      console.error("Generate tier error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate tier" });
    }
  });
  app3.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app3.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      const unreadCount = notifications.filter((n) => !n.read).length;
      res.json({ unreadCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });
  app3.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });
  app3.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });
  app3.get("/api/debug/user-data", optionalAuth, async (req, res) => {
    try {
      const userId = req.user?.id || "user1";
      const clerkUserId = req.user?.clerkId;
      const enrollments = await storage.getUserEnrollments(userId);
      const allCourses = await storage.getAllCourses();
      const personalizedCourses = allCourses.filter((c) => c.isPersonalized);
      res.json({
        currentUser: {
          id: userId,
          clerkId: clerkUserId,
          fullUser: req.user
        },
        enrollments: enrollments.map((e) => ({
          id: e.id,
          courseId: e.courseId,
          userId: e.userId
        })),
        personalizedCourses: personalizedCourses.map((c) => ({
          id: c.id,
          title: c.title,
          generatedForUserId: c.generatedForUserId,
          createdBy: c.createdBy
        })),
        summary: {
          totalEnrollments: enrollments.length,
          totalPersonalizedCourses: personalizedCourses.length,
          userIdMatch: personalizedCourses.some((c) => c.generatedForUserId === userId)
        }
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app3.post("/api/fix-user-data", optionalAuth, async (req, res) => {
    try {
      const toUserId = req.user?.id;
      const fromUserId = req.body.fromUserId || "user1";
      if (!toUserId) {
        return res.status(401).json({ error: "Must be authenticated" });
      }
      console.log(`[FIX] Starting migration: ${fromUserId} \u2192 ${toUserId}`);
      const { db: db2 } = await Promise.resolve().then(() => (init_firebase(), firebase_exports));
      let stats = {
        courses: 0,
        enrollments: 0,
        progress: 0,
        notifications: 0,
        interests: 0
      };
      const coursesSnapshot = await db2.collection("courses").get();
      for (const doc of coursesSnapshot.docs) {
        const course = doc.data();
        const updates = {};
        if (course.createdBy === fromUserId) updates.createdBy = toUserId;
        if (course.generatedForUserId === fromUserId) updates.generatedForUserId = toUserId;
        if (Object.keys(updates).length > 0) {
          await doc.ref.update(updates);
          console.log(`[FIX] Updated course: ${course.title}`);
          stats.courses++;
        }
      }
      const enrollmentsSnapshot = await db2.collection("enrollments").where("userId", "==", fromUserId).get();
      for (const doc of enrollmentsSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.enrollments++;
      }
      const progressSnapshot = await db2.collection("user_progress").where("userId", "==", fromUserId).get();
      for (const doc of progressSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.progress++;
      }
      const notificationsSnapshot = await db2.collection("notifications").where("userId", "==", fromUserId).get();
      for (const doc of notificationsSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.notifications++;
      }
      const interestsSnapshot = await db2.collection("user_interests").where("userId", "==", fromUserId).get();
      for (const doc of interestsSnapshot.docs) {
        await doc.ref.update({ userId: toUserId });
        stats.interests++;
      }
      console.log(`[FIX] Migration complete:`, stats);
      res.json({
        success: true,
        message: "Data migration completed",
        stats
      });
    } catch (error) {
      console.error("[FIX] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app3);
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app2 = express();
app2.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app2.use(express.urlencoded({ extended: false, limit: "50mb" }));
app2.use(
  session({
    secret: process.env.SESSION_SECRET || "scire-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1e3 * 60 * 60 * 24 * 7
      // 7 days
    }
  })
);
setupAuth(app2);
app2.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});

// server/vercel.ts
import express2 from "express";
import path from "path";
import fs from "fs";
console.log("Registering routes...");
await registerRoutes(app2);
console.log("Routes registered.");
var distPath = path.join(process.cwd(), "dist", "public");
if (fs.existsSync(distPath)) {
  app2.use(express2.static(distPath));
}
var vercel_default = app2;
export {
  vercel_default as default
};
