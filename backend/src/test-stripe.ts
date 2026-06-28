import Stripe = require('stripe');
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno del backend (un nivel arriba de src/)
dotenv.config({ path: path.join(__dirname, '../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16' as any, // specify api version
});

async function main() {
  console.log('Using Stripe Key:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
  try {
    const list = await stripe.checkout.sessions.list({ limit: 1 });
    console.log('Successfully connected to Stripe. Checkout sessions count:', list.data.length);
    if (list.data.length > 0) {
      console.log('Latest Session details:');
      console.dir(list.data[0], { depth: 1 });
    }
  } catch (err: any) {
    console.error('Error connecting to Stripe:', err.message);
  }
}

main();
