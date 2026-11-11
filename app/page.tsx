import { getChatGPTUser } from './chatgpt-auth';
import App from './ui';
import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <App authProvider={env.STANDALONE_AUTH === 'google' ? 'Google' : 'ChatGPT'} user={user?{name:user.displayName,email:user.email}:null}/>;}
