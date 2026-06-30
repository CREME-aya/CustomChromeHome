const fs = require('fs');
const vm = require('vm');

let failed = 0;

function test(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

global.window = global;
global.chrome = undefined;
global.fetch = async () => ({ ok: false, text: async () => '' });

vm.runInThisContext(fs.readFileSync('js/env-config.js', 'utf8'));

test('.env parser handles comments, quotes, export, and inline comments', () => {
    const parsed = window.EnvConfig.parseEnvText(`
        # comment
        NEXUS_OPENAI_API_KEY=sk-test # local note
        export NEXUS_GEMINI_API_KEY="AIza\\nnext"
        NEXUS_ANTHROPIC_API_KEY='sk-ant-test'
        INVALID-NAME=value
    `);

    assertEqual(parsed.NEXUS_OPENAI_API_KEY, 'sk-test', 'unquoted value');
    assertEqual(parsed.NEXUS_GEMINI_API_KEY, 'AIza\nnext', 'double quoted value');
    assertEqual(parsed.NEXUS_ANTHROPIC_API_KEY, 'sk-ant-test', 'single quoted value');
    assertEqual(parsed['INVALID-NAME'], undefined, 'invalid key');
});

if (failed > 0) process.exit(1);
