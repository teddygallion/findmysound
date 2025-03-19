import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import ejs from "ejs";
import{} from "dotenv/config";
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const viewsDir = path.join(__dirname, 'authorization_code/views');
const publicDir = path.join(__dirname, 'authorization_code/public');
const templates = [
  'index.ejs',
  'pages/recommendations.ejs',
  'recommendation.ejs',
  'recommendationList.ejs'
];

async function fetchRecommendations() {
  // Fetch recommendations from your API
  try {
    const response = await fetch(`${process.env.BASE_URL}/recommendations`); 
    const data = await response.json();
    return data.recList;  // Assuming `recList` is the list of recommended artists
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

async function renderTemplates() {
  const recommendations = await fetchRecommendations();  // Get the dynamic data
  
  // Check if recommendations are being fetched correctly
  console.log(recommendations);
  
  templates.forEach(template => {
    const templatePath = path.join(viewsDir, template);
    const outputPath = path.join(publicDir, template.replace('.ejs', '.html'));

    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      return;
    }

    ejs.renderFile(templatePath, { recList: recommendations }, (err, str) => {  // Pass dynamic data (recommendations)
      if (err) {
        console.error(`Error rendering ${template}:`, err);
        return;
      }
      fs.writeFileSync(outputPath, str);
      console.log(`Rendered ${template} to ${outputPath}`);
    });
  });
}
console.log('Build completed!');
