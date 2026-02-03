import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import { createInterface } from 'readline';

const GSD_DIR = path.join(os.homedir(), '.gemini', 'get-shit-done');
const VERSION_FILE = path.join(GSD_DIR, 'VERSION');
const CACHE_FILE = path.join(os.homedir(), '.gemini', 'cache', 'gsd-update-check.json');
const CHANGELOG_URL = 'https://raw.githubusercontent.com/glittercowboy/get-shit-done/main/CHANGELOG.md';

async function main() {
    console.log('Checking for GSD updates...');
    
    // Step 1: Get installed version
    let installedVersion;
    try {
        installedVersion = await fs.readFile(VERSION_FILE, 'utf-8');
        installedVersion = installedVersion.trim();
    } catch (error) {
        console.log('## GSD Update');
        console.log('**Installed version:** Unknown');
        console.log('Your installation doesn\'t include version tracking.');
        console.log('Running fresh install...');
        installedVersion = '0.0.0';
    }

    // Step 2: Check latest version
    let latestVersion;
    try {
        latestVersion = await new Promise((resolve, reject) => {
            exec('npm view get-shit-done-cc version', (error, stdout) => {
                if (error) {
                    return reject(error);
                }
                resolve(stdout.trim());
            });
        });
    } catch (error) {
        console.error("Couldn't check for updates (offline or npm unavailable).");
        console.error('To update manually: `npx get-shit-done-cc --global`');
        return;
    }

    console.log(`Installed: ${installedVersion}, Latest: ${latestVersion}`);
    
    // Step 3: Compare versions
    if (installedVersion === latestVersion) {
        console.log('You\'re already on the latest version.');
        return;
    }

    if (compareVersions(installedVersion, latestVersion) > 0) {
        console.log(`You\'re ahead of the latest release (development version?). Installed: ${installedVersion}, Latest: ${latestVersion}`);
        return;
    }

    // Step 4: Show changes and confirm
    console.log('Update available. Fetching changelog...');
    
    const changelog = await fetchChangelog();
    const changelogEntries = extractChangelogEntries(changelog, installedVersion, latestVersion);

    console.log('## GSD Update Available');
    console.log(`**Installed:** ${installedVersion}`);
    console.log(`**Latest:** ${latestVersion}`);
    console.log('\n### What\'s New');
    console.log('────────────────────────────────────────────────────────────');
    console.log(changelogEntries);
    console.log('────────────────────────────────────────────────────────────');
    console.log('⚠️  **Note:** The installer performs a clean install of GSD folders:');
    console.log(`- \
${path.join(os.homedir(), '.gemini', 'commands', 'gsd')}\
 will be wiped and replaced`);
    console.log(`- 
${path.join(os.homedir(), '.gemini', 'get-shit-done')}
 will be wiped and replaced`);
    console.log(`- 
${path.join(os.homedir(), '.gemini', 'agents', 'gsd-*')}
 files will be replaced`);
    console.log('\nYour custom files in other locations are preserved:');
    console.log(`- Custom commands in 
${path.join(os.homedir(), '.gemini', 'commands', 'your-stuff')}
 ✓`);
    console.log('- Custom agents not prefixed with `gsd-` ✓');
    console.log('- Custom hooks ✓');
    console.log('- Your CLAUDE.md files ✓');
    console.log('\nIf you\'ve modified any GSD files directly, back them up first.');

    const proceed = await askQuestion('Proceed with update? (y/n) ');
    if (!proceed) {
        console.log('Update cancelled.');
        return;
    }

    // Step 5: Run update
    console.log('Updating GSD...');
    try {
        await new Promise((resolve, reject) => {
            const child = exec('npx get-shit-done-cc --global');
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
            child.on('close', code => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Update process failed with code ${code}`));
                }
            });
        });
        
        await fs.unlink(CACHE_FILE).catch(() => {}); // ignore if it doesn't exist

        // Step 6: Display result
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log(`║  GSD Updated: v${installedVersion} → v${latestVersion}                           ║`);
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('⚠️  Restart Claude Code to pick up the new commands.');
        console.log('[View full changelog](https://github.com/glittercowboy/get-shit-done/blob/main/CHANGELOG.md)');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

function fetchChangelog() {
    return new Promise((resolve, reject) => {
        https.get(CHANGELOG_URL, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

function extractChangelogEntries(changelog, fromVersion, toVersion) {
    const lines = changelog.split('\n');
    let capturing = false;
    const entries = [];
    const fromVersionCompare = fromVersion === '0.0.0' ? '0.0.0' : `[${fromVersion}]`;

    for (const line of lines) {
        if (line.startsWith('## [')) {
            if (capturing) {
                // Stop if we reach a version older than or equal to installed version
                const versionInHeader = line.substring(3, line.indexOf(']'));
                if (compareVersions(versionInHeader, fromVersion) <= 0) {
                    capturing = false;
                }
            }
            if (line.includes(`[${toVersion}]`)) {
                 capturing = true;
            }
        }

        if (capturing) {
            entries.push(line);
        }
    }
    
    // Fallback if version matching fails, just show the top of the changelog
    if (entries.length === 0) {
        let lineCount = 0;
        for (const line of lines) {
            if (line.startsWith('## [')) lineCount++;
            if (lineCount > 5) break; // Limit to 5 versions
            entries.push(line);
        }
    }

    return entries.join('\n');
}

function askQuestion(query) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.toLowerCase().trim() === 'y');
    }));
}

main().catch(console.error);
