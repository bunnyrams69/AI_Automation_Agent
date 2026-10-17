import dotenv from 'dotenv';
dotenv.config();

console.log('Env keys:', Object.keys(process.env).filter(k => 
  k.includes('SUPA') || k.includes('DB') || k.includes('POSTGRES') || k.includes('URL')
));
