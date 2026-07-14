const dictionaryModule = import('dictionary-ne');
const FeedbackEngine = require('../src/infrastructure/feedback/FeedbackEngine');

const feedbackEngine = new FeedbackEngine();

async function run() {
  const dictMod = await dictionaryModule;
  const dicText = dictMod.default.dic.toString('utf-8');
  const lines = dicText.split('\n');
  
  console.log(`Total dictionary lines: ${lines.length}`);
  
  const words3 = [];
  
  // Start from index 1 to skip the word count on line 0
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Strip Hunspell flags (e.g. "शब्द/flags" -> "शब्द")
    const word = line.split('/')[0].trim();
    
    // Skip empty or non-Devanagari (e.g. numbers, English words)
    if (!word || !/^[\u0900-\u097F]+$/.test(word)) {
      continue;
    }
    
    const units = feedbackEngine.tokenize(word);
    if (units.length === 3) {
      words3.push(word);
    }
  }
  
  console.log(`Total 3-akshara words found: ${words3.length}`);
  console.log('Sample of 20 words:', words3.slice(0, 20));
  
  // Pick a random word
  const randomWord = words3[Math.floor(Math.random() * words3.length)];
  console.log(`Random picked word: ${randomWord}`);
  
  process.exit(0);
}

run().catch(console.error);
