const { spawnSync } = require('child_process');

const tests = [
    {
        name: 'feed-core',
        args: ['-e', `
            global.window = globalThis;
            require('./js/feed-core.js');
            require('./tests/feed-core.test.js');
            const result = window.runFeedCoreTests();
            if (!result.passed) process.exit(1);
            console.log('PASS feed-core (' + result.total + ' tests)');
        `]
    },
    {
        name: 'ical-parser',
        args: ['-e', `
            global.window = globalThis;
            global.document = {
                addEventListener() {},
                getElementById() { return null; },
                createElement() { return { className: '', textContent: '', appendChild() {} }; }
            };
            require('./js/ical-parser.js');
            require('./tests/ical-parser.test.js');
            const result = window.runIcalParserTests();
            if (!result.passed) process.exit(1);
            console.log('PASS ical-parser (' + result.total + ' tests)');
        `]
    },
    { name: 'ai-modules', args: ['tests/ai-modules.test.js'] },
    { name: 'base-widget', args: ['tests/base-widget.test.js'] },
    { name: 'env-config', args: ['tests/env-config.test.js'] },
    { name: 'feed-modules', args: ['tests/feed-modules.test.js'] },
    { name: 'layout-modules', args: ['tests/layout-modules.test.js'] },
    { name: 'static-contracts', args: ['tests/static-contracts.test.js'] },
    { name: 'stocks-core', args: ['tests/stocks-core.test.js'] },
    { name: 'unified-agenda', args: ['tests/unified-agenda.test.js'] },
    { name: 'weather-core', args: ['tests/weather-core.test.js'] },
    { name: 'weather-modules', args: ['tests/weather-modules.test.js'] }
];

let failed = 0;

for (const test of tests) {
    const result = spawnSync(process.execPath, test.args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
    });

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    if (result.status !== 0) {
        failed += 1;
        console.error(`FAIL ${test.name}`);
    }
}

if (failed > 0) {
    console.error(`${failed} test file(s) failed`);
    process.exit(1);
}

console.log(`PASS all ${tests.length} test files`);
