import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('Add these to your .env (backend) and front/.env.local:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:contacto@medflow.local`);
console.log(`\nFront (.env.local):\nVITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
