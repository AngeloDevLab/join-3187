// Run after `n8n export:workflow --separate`: strips owner/project data
// (contains the owner's email) and renames <id>.json to <workflow-name>.json.
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, 'workflows');


/**
 * @param {string} name - workflow name, e.g. "Issue Collector"
 * @returns {string} file name, e.g. "issue-collector.json"
 */
function fileNameFor(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.json';
}


/**
 * Rewrites one raw export without the `shared` block under a readable name.
 * @param {string} file - raw export file name inside workflows/
 */
function cleanExport(file) {
    const path = join(DIR, file);
    const workflow = JSON.parse(readFileSync(path, 'utf8'));
    delete workflow.shared;
    const target = fileNameFor(workflow.name);
    writeFileSync(join(DIR, target), JSON.stringify(workflow, null, 2) + '\n');
    if (target !== file) rmSync(path);
    console.log(`${file} → ${target}`);
}


readdirSync(DIR).filter((file) => file.endsWith('.json')).forEach(cleanExport);
