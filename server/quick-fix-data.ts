/**
 * Fix user ID mismatch - Use existing Firebase connection
 * This imports the already-initialized Firebase connection
 */
import { storage } from './storage';

async function fixAllUserData() {
    const FROM_USER_ID = "user1";
    const TO_USER_ID = "ddDuIBT1DmBCvgi7cIhe";

    console.log('\n🔧 FIXING USER DATA MISMATCH');
    console.log(`   Migrating: ${FROM_USER_ID} → ${TO_USER_ID}\n`);

    try {
        let totalFixed = 0;

        // 1. Fix all courses
        console.log('📚 Fixing courses...');
        const allCourses = await storage.getAllCourses();

        for (const course of allCourses) {
            const needsUpdate =
                course.createdBy === FROM_USER_ID ||
                course.generatedForUserId === FROM_USER_ID;

            if (needsUpdate) {
                const updates: any = {};
                if (course.createdBy === FROM_USER_ID) updates.createdBy = TO_USER_ID;
                if (course.generatedForUserId === FROM_USER_ID) updates.generatedForUserId = TO_USER_ID;

                await storage.updateCourse(course.id, updates);
                console.log(`   ✓ Fixed: ${course.title}`);
                totalFixed++;
            }
        }

        console.log(`   → Fixed ${totalFixed} courses\n`);

        // 2. Fix all enrollments
        console.log('📝 Fixing enrollments...');
        // We need to query Firebase directly for enrollments since storage doesn't have a method to get all
        const { db } = await import('./firebase');
        const enrollmentsSnapshot = await db.collection('enrollments').where('userId', '==', FROM_USER_ID).get();

        let enrollmentsFixed = 0;
        for (const doc of enrollmentsSnapshot.docs) {
            await doc.ref.update({ userId: TO_USER_ID });
            enrollmentsFixed++;
            console.log(`   ✓ Fixed enrollment: ${doc.id}`);
        }

        console.log(`   → Fixed ${enrollmentsFixed} enrollments\n`);

        // 3. Fix progress records
        console.log('📊 Fixing progress records...');
        const progressSnapshot = await db.collection('user_progress').where('userId', '==', FROM_USER_ID).get();

        let progressFixed = 0;
        for (const doc of progressSnapshot.docs) {
            await doc.ref.update({ userId: TO_USER_ID });
            progressFixed++;
        }

        console.log(`   → Fixed ${progressFixed} progress records\n`);

        // 4. Fix notifications
        console.log('🔔 Fixing notifications...');
        const notificationsSnapshot = await db.collection('notifications').where('userId', '==', FROM_USER_ID).get();

        let notificationsFixed = 0;
        for (const doc of notificationsSnapshot.docs) {
            await doc.ref.update({ userId: TO_USER_ID });
            notificationsFixed++;
        }

        console.log(`   → Fixed ${notificationsFixed} notifications\n`);

        // 5. Fix user interests
        console.log('🎯 Fixing interests...');
        const interestsSnapshot = await db.collection('user_interests').where('userId', '==', FROM_USER_ID).get();

        let interestsFixed = 0;
        for (const doc of interestsSnapshot.docs) {
            await doc.ref.update({ userId: TO_USER_ID });
            interestsFixed++;
        }

        console.log(`   → Fixed ${interestsFixed} interests\n`);

        console.log('✅ MIGRATION COMPLETE!\n');
        console.log('📊 Summary:');
        console.log(`   Courses: ${totalFixed}`);
        console.log(`   Enrollments: ${enrollmentsFixed}`);
        console.log(`   Progress: ${progressFixed}`);
        console.log(`   Notifications: ${notificationsFixed}`);
        console.log(`   Interests: ${interestsFixed}`);
        console.log('\n🎓 Refresh your dashboard at http://localhost:5000/dashboard\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR during migration:');
        console.error(error);
        process.exit(1);
    }
}

// Run the fix
fixAllUserData();
