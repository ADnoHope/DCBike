// Migration script to replace all old notification methods with new system
// This will be run once to update all HTML files

// Mapping of old methods to new methods
const replacements = [
    // Replace alert() with showError()
    { pattern: /alert\((.*?)\);/g, replacement: 'showError($1);' },
    
    // Replace showAlert with appropriate notification type
    { pattern: /showAlert\('error',\s*(.*?)\);/g, replacement: 'showError($1);' },
    { pattern: /showAlert\('success',\s*(.*?)\);/g, replacement: 'showSuccess($1);' },
    { pattern: /showAlert\('warning',\s*(.*?)\);/g, replacement: 'showWarning($1);' },
    { pattern: /showAlert\('info',\s*(.*?)\);/g, replacement: 'showInfo($1);' },
];

console.log('Notification migration patterns ready');
console.log('Use find and replace in your editor with these patterns');
replacements.forEach((r, i) => {
    console.log(`\n${i + 1}. Find: ${r.pattern}`);
    console.log(`   Replace: ${r.replacement}`);
});
