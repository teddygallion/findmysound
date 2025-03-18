const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'authorization_code/views');
const publicDir = path.join(__dirname, 'authorization_code/public');


const templates = ['index.ejs', 'recommendations.ejs']; 
templates.forEach(template => {
  const templatePath = path.join(viewsDir, template);
  const outputPath = path.join(publicDir, template.replace('.ejs', '.html'));

  ejs.renderFile(templatePath, {}, (err, str) => {
    if (err) throw err;
    fs.writeFileSync(outputPath, str);
  });
});