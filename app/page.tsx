import { getChatGPTUser } from './chatgpt-auth';
import App from './ui';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <App user={user?{name:user.displayName,email:user.email}:null}/>;}
