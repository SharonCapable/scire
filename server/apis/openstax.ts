import axios from 'axios';

const OPENSTAX_API_BASE = 'https://openstax.org/api/v2';

interface OpenStaxBook {
    id: number;
    title: string;
    description: string;
    cover_url: string;
    subjects: string[];
    authors: Array<{ name: string }>;
    book_state: string;
}

interface OpenStaxPage {
    id: number;
    title: string;
    meta: {
        type: string;
        detail_url: string;
        html_url: string;
    };
}

/**
 * Fetch all available OpenStax books
 */
export async function fetchOpenStaxBooks(): Promise<OpenStaxBook[]> {
    try {
        const response = await axios.get(`${OPENSTAX_API_BASE}/pages/`, {
            params: {
                type: 'books.Book',
                fields: 'id,title,description,cover_url,subjects,authors,book_state',
                limit: 50
            }
        });

        return response.data.items.filter((book: OpenStaxBook) =>
            book.book_state === 'live' // Only get published books
        );
    } catch (error) {
        console.error('Error fetching OpenStax books:', error);
        return [];
    }
}

/**
 * Fetch detailed content for a specific book
 */
export async function fetchOpenStaxBookContent(bookId: number): Promise<any> {
    try {
        const response = await axios.get(`${OPENSTAX_API_BASE}/pages/${bookId}/`, {
            params: {
                fields: '*'
            }
        });

        return response.data;
    } catch (error) {
        console.error(`Error fetching book ${bookId}:`, error);
        return null;
    }
}

/**
 * Convert OpenStax book to SCIRE course format
 */
export function convertOpenStaxToCourse(book: any) {
    // Extract text content from the book
    const content = extractTextContent(book);

    return {
        title: book.title,
        description: book.description || `Learn ${book.title} with this comprehensive OpenStax textbook.`,
        sourceType: 'OpenStax',
        sourceUrl: book.meta?.html_url || `https://openstax.org/books/${book.id}`,
        content: content,
        metadata: {
            coverUrl: book.cover_url,
            subjects: book.subjects || [],
            authors: book.authors?.map((a: any) => a.name) || [],
            bookId: book.id
        }
    };
}

/**
 * Extract readable text content from OpenStax book data
 */
function extractTextContent(book: any): string {
    let content = `# ${book.title}\n\n`;

    if (book.description) {
        content += `${book.description}\n\n`;
    }

    if (book.authors && book.authors.length > 0) {
        content += `**Authors**: ${book.authors.map((a: any) => a.name).join(', ')}\n\n`;
    }

    if (book.subjects && book.subjects.length > 0) {
        content += `**Subjects**: ${book.subjects.join(', ')}\n\n`;
    }

    // If the book has table of contents, add it
    if (book.table_of_contents) {
        content += `## Table of Contents\n\n`;
        content += formatTableOfContents(book.table_of_contents);
    }

    // Add any available content sections
    if (book.content) {
        content += `\n\n## Content\n\n${book.content}`;
    }

    return content;
}

/**
 * Format table of contents into readable text
 */
function formatTableOfContents(toc: any[], level: number = 0): string {
    let formatted = '';
    const indent = '  '.repeat(level);

    for (const item of toc) {
        if (item.title) {
            formatted += `${indent}- ${item.title}\n`;
        }
        if (item.contents && item.contents.length > 0) {
            formatted += formatTableOfContents(item.contents, level + 1);
        }
    }

    return formatted;
}

/**
 * Search OpenStax books by subject/topic
 */
export async function searchOpenStaxBooks(query: string): Promise<OpenStaxBook[]> {
    const allBooks = await fetchOpenStaxBooks();

    const queryLower = query.toLowerCase();

    return allBooks.filter(book =>
        book.title.toLowerCase().includes(queryLower) ||
        book.description?.toLowerCase().includes(queryLower) ||
        book.subjects?.some(s => s.toLowerCase().includes(queryLower))
    );
}

/**
 * Get recommended OpenStax books based on user interests
 */
export async function getRecommendedBooks(topics: string[]): Promise<OpenStaxBook[]> {
    const allBooks = await fetchOpenStaxBooks();
    const recommendations: OpenStaxBook[] = [];

    for (const topic of topics) {
        const topicLower = topic.toLowerCase();
        const matches = allBooks.filter(book =>
            book.title.toLowerCase().includes(topicLower) ||
            book.subjects?.some(s => s.toLowerCase().includes(topicLower))
        );

        recommendations.push(...matches);
    }

    // Remove duplicates
    const uniqueBooks = Array.from(
        new Map(recommendations.map(book => [book.id, book])).values()
    );

    return uniqueBooks.slice(0, 10); // Return top 10
}
