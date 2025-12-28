import { db } from './firebase';

/**
 * Migration script to fix user ID mismatch
 * Moves all courses and enrollments from "user1" to the correct Clerk user ID
 */
async function migrateUserData(fromUserId: string, toUserId: string) {
    console.log(`\n🔄 Migrating data from "${fromUserId}" to "${toUserId}"...`);

    try {
        // 1. Update all courses where createdBy or generatedForUserId is "user1"
        const coursesSnapshot = await db.collection('courses').get();
        let coursesUpdated = 0;

        for (const doc of coursesSnapshot.docs) {
            const course = doc.data();
            const needsUpdate = course.createdBy === fromUserId || course.generatedForUserId === fromUserId;

            if (needsUpdate) {
                const updates: any = {};
                if (course.createdBy === fromUserId) updates.createdBy = toUserId;
                if (course.generatedForUserId === fromUserId) updates.generatedForUserId = toUserId;

                await doc.ref.update(updates);
                console.log(`  ✓ Updated course: ${course.title}`);
                coursesUpdated++;
            }
        }

        // 2. Update all enrollments where userId is "user1"
        const enrollmentsSnapshot = await db.collection('enrollments').get();
        let enrollmentsUpdated = 0;

        for (const doc of enrollmentsSnapshot.docs) {
            const enrollment = doc.data();
            if (enrollment.userId === fromUserId) {
                await doc.ref.update({ userId: toUserId });
                console.log(`  ✓ Updated enrollment for course: ${enrollment.courseId}`);
                enrollmentsUpdated++;
            }
        }

        // 3. Update all user_progress where userId is "user1"
        const progressSnapshot = await db.collection('user_progress').get();
        let progressUpdated = 0;

        for (const doc of progressSnapshot.docs) {
            const progress = doc.data();
            if (progress.userId === fromUserId) {
                await doc.ref.update({ userId: toUserId });
                progressUpdated++;
            }
        }

        // 4. Update all notifications where userId is "user1"
        const notificationsSnapshot = await db.collection('notifications').get();
        let notificationsUpdated = 0;

        for (const doc of notificationsSnapshot.docs) {
            const notification = doc.data();
            if (notification.userId === fromUserId) {
                await doc.ref.update({ userId: toUserId });
                notificationsUpdated++;
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   - Courses updated: ${coursesUpdated}`);
        console.log(`   - Enrollments updated: ${enrollmentsUpdated}`);
        console.log(`   - Progress records updated: ${progressUpdated}`);
        console.log(`   - Notifications updated: ${notificationsUpdated}`);

        return { coursesUpdated, enrollmentsUpdated, progressUpdated, notificationsUpdated };
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Export so it can be called from routes
export { migrateUserData };
