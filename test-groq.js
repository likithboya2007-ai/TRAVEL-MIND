// Test Groq API Key
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GROQ_API_KEY;

console.log('Testing Groq API...');
console.log('API Key present:', !!apiKey);
console.log('API Key starts with gsk_:', apiKey?.startsWith('gsk_'));
console.log('API Key length:', apiKey?.length);

if (!apiKey) {
  console.error('❌ ERROR: GROQ_API_KEY not found in .env.local');
  process.exit(1);
}

try {
  const groq = new Groq({ apiKey });
  
  console.log('\nSending test message to Groq...');
  
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'user', content: 'Say "Hello from TravelMind AI test!"' }
    ],
    max_tokens: 50,
  });

  const response = completion.choices[0]?.message?.content;
  
  console.log('\n✅ SUCCESS! Groq API is working!');
  console.log('Response:', response);
  console.log('\nYour Groq API key is valid and working correctly.');
  
} catch (error) {
  console.error('\n❌ ERROR: Groq API test failed');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  
  if (error.status === 401) {
    console.error('\n🔑 API Key is INVALID or EXPIRED');
    console.error('Solution: Get a new API key from https://console.groq.com/');
  } else if (error.status === 429) {
    console.error('\n⚠️ Rate limit exceeded');
    console.error('Solution: Wait a minute and try again');
  } else {
    console.error('\n📡 Network or service error');
    console.error('Full error:', error);
  }
  
  process.exit(1);
}
