import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * MIT OpenCourseWare Integration
 * Fetches real courses from MIT's free educational platform
 */

interface MITCourse {
    title: string;
    description: string;
    url: string;
    department: string;
    courseNumber: string;
    instructors: string[];
    level: string;
}

/**
 * Fetch MIT OCW course catalog
 * Using their public course listings
 */
export async function fetchMITCourses(): Promise<MITCourse[]> {
    try {
        // MIT OCW has a JSON API for their course catalog
        const response = await axios.get('https://ocw.mit.edu/course-lists/mit-course-catalog.json');

        const courses: MITCourse[] = response.data.map((course: any) => ({
            title: course.title,
            description: course.description || '',
            url: `https://ocw.mit.edu${course.url}`,
            department: course.department || 'General',
            courseNumber: course.course_number || '',
            instructors: course.instructors || [],
            level: course.level || 'Undergraduate'
        }));

        return courses;
    } catch (error) {
        console.error('Error fetching MIT courses:', error);
        // Fallback: Return curated list of popular MIT courses
        return getMITCuratedCourses();
    }
}

/**
 * Curated list of popular MIT OCW courses
 * These are real, high-quality courses that are always available
 */
export function getMITCuratedCourses(): MITCourse[] {
    return [
        {
            title: 'Introduction to Computer Science and Programming in Python',
            description: 'This subject is aimed at students with little or no programming experience. It aims to provide students with an understanding of the role computation can play in solving problems and to help students feel confident of their ability to write small programs.',
            url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
            department: 'Electrical Engineering and Computer Science',
            courseNumber: '6.0001',
            instructors: ['Dr. Ana Bell', 'Prof. Eric Grimson', 'Prof. John Guttag'],
            level: 'Undergraduate'
        },
        {
            title: 'Single Variable Calculus',
            description: 'This calculus course covers differentiation and integration of functions of one variable, and concludes with a brief discussion of infinite series.',
            url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/',
            department: 'Mathematics',
            courseNumber: '18.01SC',
            instructors: ['Prof. David Jerison'],
            level: 'Undergraduate'
        },
        {
            title: 'Introduction to Biology',
            description: 'This course provides an introduction to fundamental principles of biochemistry, molecular biology, and genetics for understanding the functions of living systems.',
            url: 'https://ocw.mit.edu/courses/7-016-introductory-biology-fall-2018/',
            department: 'Biology',
            courseNumber: '7.016',
            instructors: ['Prof. Barbara Imperiali', 'Prof. Adam Martin'],
            level: 'Undergraduate'
        },
        {
            title: 'Introduction to Algorithms',
            description: 'This course provides an introduction to mathematical modeling of computational problems. It covers the common algorithms, algorithmic paradigms, and data structures used to solve these problems.',
            url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
            department: 'Electrical Engineering and Computer Science',
            courseNumber: '6.006',
            instructors: ['Prof. Erik Demaine', 'Dr. Jason Ku', 'Prof. Justin Solomon'],
            level: 'Undergraduate'
        },
        {
            title: 'Physics I: Classical Mechanics',
            description: 'This first course in the physics curriculum introduces classical mechanics. Topics include: space and time; straight-line kinematics; motion in a plane; forces and equilibrium; experimental basis of Newton\'s laws.',
            url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/',
            department: 'Physics',
            courseNumber: '8.01SC',
            instructors: ['Dr. Peter Dourmashkin'],
            level: 'Undergraduate'
        },
        {
            title: 'Introduction to Psychology',
            description: 'This course is a survey of the scientific study of human nature, including how the mind works, and how the brain supports the mind.',
            url: 'https://ocw.mit.edu/courses/9-00sc-introduction-to-psychology-fall-2011/',
            department: 'Brain and Cognitive Sciences',
            courseNumber: '9.00SC',
            instructors: ['Prof. John Gabrieli'],
            level: 'Undergraduate'
        },
        {
            title: 'Principles of Microeconomics',
            description: 'This course provides an introduction to microeconomic theory designed to meet the needs of students in an economics concentration.',
            url: 'https://ocw.mit.edu/courses/14-01sc-principles-of-microeconomics-fall-2011/',
            department: 'Economics',
            courseNumber: '14.01SC',
            instructors: ['Prof. Jonathan Gruber'],
            level: 'Undergraduate'
        },
        {
            title: 'Introduction to Solid State Chemistry',
            description: 'This course introduces students to the fundamental principles of chemistry, with an emphasis on the structure of matter and the quantitative relationships between the properties of materials.',
            url: 'https://ocw.mit.edu/courses/3-091sc-introduction-to-solid-state-chemistry-fall-2010/',
            department: 'Materials Science and Engineering',
            courseNumber: '3.091SC',
            instructors: ['Prof. Donald Sadoway'],
            level: 'Undergraduate'
        },
        {
            title: 'Differential Equations',
            description: 'This course covers the study of differential equations, including modeling physical systems in engineering, science, and economics.',
            url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/',
            department: 'Mathematics',
            courseNumber: '18.03SC',
            instructors: ['Prof. Haynes Miller'],
            level: 'Undergraduate'
        },
        {
            title: 'Introduction to Electrical Engineering and Computer Science I',
            description: 'This course provides an integrated introduction to electrical engineering and computer science, taught using substantial laboratory experiments.',
            url: 'https://ocw.mit.edu/courses/6-01sc-introduction-to-electrical-engineering-and-computer-science-i-spring-2011/',
            department: 'Electrical Engineering and Computer Science',
            courseNumber: '6.01SC',
            instructors: ['Prof. Dennis Freeman'],
            level: 'Undergraduate'
        }
    ];
}

/**
 * Scrape course content from MIT OCW page
 */
export async function scrapeMITCourseContent(courseUrl: string): Promise<string> {
    try {
        const response = await axios.get(courseUrl);
        const $ = cheerio.load(response.data);

        let content = '';

        // Extract course description
        const description = $('.course-description').text().trim();
        if (description) {
            content += `## Course Description\n\n${description}\n\n`;
        }

        // Extract syllabus
        const syllabus = $('.syllabus').text().trim();
        if (syllabus) {
            content += `## Syllabus\n\n${syllabus}\n\n`;
        }

        // Extract learning objectives
        $('.learning-objectives li').each((i, el) => {
            if (i === 0) content += `## Learning Objectives\n\n`;
            content += `- ${$(el).text().trim()}\n`;
        });

        // Extract course materials/topics
        $('.course-section').each((i, section) => {
            const title = $(section).find('h2, h3').first().text().trim();
            const text = $(section).find('p').text().trim();

            if (title && text) {
                content += `\n## ${title}\n\n${text}\n`;
            }
        });

        return content || 'Course content will be structured into modules.';
    } catch (error) {
        console.error(`Error scraping ${courseUrl}:`, error);
        return 'Course content will be structured into modules.';
    }
}

/**
 * Convert MIT course to SCIRE format
 */
export function convertMITToCourse(mitCourse: MITCourse, content: string) {
    return {
        title: mitCourse.title,
        description: mitCourse.description,
        sourceType: 'MIT OpenCourseWare',
        sourceUrl: mitCourse.url,
        content: `# ${mitCourse.title}\n\n**Course Number**: ${mitCourse.courseNumber}\n**Department**: ${mitCourse.department}\n**Level**: ${mitCourse.level}\n**Instructors**: ${mitCourse.instructors.join(', ')}\n\n${content}`,
        metadata: {
            department: mitCourse.department,
            courseNumber: mitCourse.courseNumber,
            instructors: mitCourse.instructors,
            level: mitCourse.level,
            source: 'MIT OCW'
        }
    };
}

/**
 * Search MIT courses by topic
 */
export function searchMITCourses(query: string, courses: MITCourse[]): MITCourse[] {
    const queryLower = query.toLowerCase();

    return courses.filter(course =>
        course.title.toLowerCase().includes(queryLower) ||
        course.description.toLowerCase().includes(queryLower) ||
        course.department.toLowerCase().includes(queryLower)
    );
}

/**
 * Get recommended MIT courses based on user interests
 */
export function getRecommendedMITCourses(topics: string[]): MITCourse[] {
    const allCourses = getMITCuratedCourses();
    const recommendations: MITCourse[] = [];

    for (const topic of topics) {
        const matches = searchMITCourses(topic, allCourses);
        recommendations.push(...matches);
    }

    // Remove duplicates
    const uniqueCourses = Array.from(
        new Map(recommendations.map(course => [course.courseNumber, course])).values()
    );

    return uniqueCourses.slice(0, 10);
}
