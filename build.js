const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'authorization_code/views'); 
const publicDir = path.join(__dirname, 'authorization_code/public'); 


const templates = [
  'index.ejs',
  'pages/recommendations.ejs',
  'recommendation.ejs',
  'recommendationList.ejs'
];

templates.forEach(template => {
  const templatePath = path.join(viewsDir, template);
  const outputPath = path.join(publicDir, template.replace('.ejs', '.html'));


  if (!fs.existsSync(templatePath)) {
    console.error(`Template file not found: ${templatePath}`);
    return;
  }

  ejs.renderFile(templatePath, {}, (err, str) => {
    if (err) {
      console.error(`Error rendering ${template}:`, err);
      return;
    }
    fs.writeFileSync(outputPath, str);
    console.log(`Rendered ${template} to ${outputPath}`);
  });
});

console.log('Build completed!');