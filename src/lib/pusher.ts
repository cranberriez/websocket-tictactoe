import Pusher from 'pusher-js';

// Initialize Pusher client
let pusher: Pusher;

export const getPusherClient = () => {
  if (!pusher) {
    pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
      forceTLS: true,
    });
  }
  return pusher;
};
