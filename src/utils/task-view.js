import { getAvatarColorForId, getInitials } from './helpers.js';

/** Display label and badge CSS class per category key. */
export const CATEGORY_META = {
    userStory: { label: 'User Story', cls: 'user-story' },
    technicalTask: { label: 'Technical Task', cls: 'technical' },
    bug: { label: 'Bug Report', cls: 'bug' },
};


/**
 * @typedef {Object} TaskView
 * @property {string} id
 * @property {string} column
 * @property {number} order
 * @property {string} title
 * @property {string} description
 * @property {{ label: string, cls: string }} category
 * @property {string} priority
 * @property {string} dueDate
 * @property {{ key: string, title: string, done: boolean }[]} subtasks
 * @property {{ name: string, initials: string, color: string }[]} assigned
 * @property {boolean} aiGenerated - set by n8n on tickets created from emails
 * @property {TaskCreator|null} creator - null for old tasks saved without one
 * @property {Object} raw - the task exactly as stored, used to prefill the edit form
 */


/**
 * @typedef {Object} TaskCreator
 * @property {string} name
 * @property {string} email - empty for guests
 * @property {boolean} external - true for stakeholders who sent the task in by email
 * @property {string|null} contactId - the member's contact (found by email), for the profile link
 */


/**
 * @param {string} key - category key from the database
 * @returns {{ label: string, cls: string }} known meta, or the raw key as label for unknown ones
 */
function categoryMeta(key) {
    return CATEGORY_META[key] ?? { label: key ?? '', cls: 'technical' };
}


/**
 * Resolves assigned contact ids to avatar data, skipping ids of deleted contacts.
 * @param {string[]} ids
 * @param {Object<string, { name: string }>} contacts
 * @returns {TaskView['assigned']}
 */
function resolveAssigned(ids, contacts) {
    return ids.filter((id) => contacts[id]).map((id) => ({
        name: contacts[id].name,
        initials: getInitials(contacts[id].name),
        color: getAvatarColorForId(id),
    }));
}


/**
 * @param {{ name: string, email?: string, type: string }|undefined} creator - as stored on the task
 * @param {Object<string, { email?: string }>} contacts
 * @returns {TaskCreator|null}
 */
function resolveCreator(creator, contacts) {
    if (!creator) return null;
    const email = creator.email ?? '';
    const contactId = email ? Object.keys(contacts).find((id) => contacts[id].email?.toLowerCase() === email.toLowerCase()) : null;
    return { name: creator.name ?? '', email, external: creator.type === 'external', contactId: contactId ?? null };
}


/**
 * Converts a stored task into the shape the board, cards and detail modal render.
 * @param {string} id
 * @param {Object} task
 * @param {Object<string, { name: string, email?: string }>} contacts
 * @returns {TaskView}
 */
export function toTaskView(id, task, contacts) {
    return {
        id, column: task.column, order: task.order ?? 0,
        title: task.title ?? '', description: task.description ?? '',
        category: categoryMeta(task.category), priority: task.priority, dueDate: task.dueDate,
        subtasks: Object.entries(task.subtasks ?? {}).map(([key, s]) => ({ key, title: s.title, done: !!s.done })),
        assigned: resolveAssigned(task.assignedTo ?? [], contacts),
        aiGenerated: !!task.aiGenerated,
        creator: resolveCreator(task.creator, contacts),
        raw: task,
    };
}
