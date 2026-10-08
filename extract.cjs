const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = html.split('<script>');
const lastScript = scripts[scripts.length - 1].split('</script>')[0];
fs.writeFileSync('test_script.js', lastScript);
console.log('Script extracted.');
