/**
 * QUICK FIX: Run this script to migrate your courses from "user1" to your real Clerk ID
 * 
 * Run: npx tsx server/fix-user-courses.ts YOUR_FIRESTORE_USER_ID
 * 
 * Your Firestore User ID is: ddDuIBT1DmBCvgi7cIhe
 * (This was confirmed from the /api/auth/sync response)
 */

import { db } from './firebase';

async function fixUserCourses(toUserId: string) {
    const fromUserId = "user1";

    console.log(`\n🔧 FIXING USER DATA`);
    console.log(`   From: ${fromUserId}`);
    console.log(`   To: ${toUserId}\n`);

    try {
        // 1. Fix courses
        const coursesSnapshot = await db.collection('courses').get();
        let coursesFixed = 0;

        for (const doc of coursesSnapshot.docs) {
            const course = doc.data();
            const updates: any = {};

            if (course.createdBy === fromUserId) updates.createdBy = toUserId;
            if (course.generatedForUserId === fromUserId) updates.generatedForUserId = toUserId;

            if (Object.keys(updates).length > 0) {
                await doc.ref.update(updates);
                console.log(`✓ Fixed course: ${course.title}`);
                coursesFixed++;
            }
        }

        // 2. Fix enrollments
        const enrollmentsSnapshot = await db.collection('enrollments').get();
        let enrollmentsFixed = 0;

        for (const doc of enrollmentsSnapshot.docs) {
            const enrollment = doc.data();
            if (enrollment.userId === fromUserId) {
                await doc.ref.update({ userId: toUserId });
                console.log(`✓ Fixed enrollment: ${enrollment.courseId.substring(0, 10)}...`);
                enrollmentsFixed++;
            }
        }

        //3. Fix progress
        const progressSnapshot = await db.collection('user_progress').get();
        let progressFixed = 0;

        for (const doc of progressSnapshot.docs) {
            const progress = doc.data();
            if (progress.userId === fromUserId) {
                await doc.ref.update({ userId: toUserId });
                progressFixed++;
            }
        }

        // 4. Fix notifications
        const notificationsSnapshot = await db.collection('notifications').get();
        let notificationsFixed = 0;

        for (const doc of notificationsSnapshot.docs) {
            const notification = doc.data();
            if (notification.userId === fromUserId) {
                await doc.ref.update({ userId: toUserId });
                notificationsFixed++;
            }
        }

        console.log(`\n✅ FIX COMPLETE!`);
        console.log(`   Courses: ${coursesFixed}`);
        console.log(`   Enrollments: ${enrollmentsFixed}`);
        console.log(`   Progress: ${progressFixed}`);
        console.log(`   Notifications: ${notificationsFixed}\n`);
        console.log(`🎓 Refresh your dashboard to see your courses!\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

const userId = process.argv[2];
if (!userId) {
    console.error('❌ Please provide your Firestore user ID as an argument');
    console.log('\nUsage: npx tsx server/fix-user-courses.ts YOUR_USER_ID');
    console.log('\nYour user ID is: ddDuIBT1DmBCvgi7cIhe\n');
    process.exit(1);
}

fixUserCourses(userId);
