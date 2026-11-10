import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { businesses } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { validateBusiness } from '../../../lib/validation';
export const dynamic = 'force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to access your businesses.'},401);
 try {const rows=await getDb().select().from(businesses).where(eq(businesses.ownerId,user.userId));return json({businesses:rows.map(r=>({id:r.id,revision:r.revision,updatedAt:r.updatedAt,...JSON.parse(r.data)}))});}
 catch(e){console.error('business_read_failed',e);return json({error:'Unable to load your businesses. Please try again.'},503);}
}
export async function POST(request:Request){return write(request,true);}
export async function PUT(request:Request){return write(request,false);}
async function write(request:Request,create:boolean){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in before saving.'},401);
 const origin=request.headers.get('origin');if(!origin || origin!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required.'},415);
 const raw=await request.text();if(raw.length>240000)return json({error:'Business data is too large.'},413);
 let input:any;try{input=JSON.parse(raw);}catch{return json({error:'Invalid JSON.'},400);}
 const parsed=validateBusiness(input);if(!parsed.ok)return json({error:parsed.error},400);
 const data=parsed.value,db=getDb(),now=new Date().toISOString();
 try{
 if(create){const id=crypto.randomUUID();await db.insert(businesses).values({id,ownerId:user.userId,name:data.name,data:JSON.stringify(data),revision:1,updatedAt:now});return json({business:{id,...data,revision:1,updatedAt:now}},201);}
 if(typeof input.id!=='string'||!Number.isInteger(input.revision))return json({error:'ID and revision required.'},400);
 const existing=await db.select({revision:businesses.revision}).from(businesses).where(and(eq(businesses.id,input.id),eq(businesses.ownerId,user.userId))).limit(1);
 if(!existing.length)return json({error:'Business not found.'},404);
 if(existing[0].revision!==input.revision)return json({error:'This business changed in another tab. Reload before saving to avoid overwriting newer figures.'},409);
 const revision=input.revision+1;
 const changed=await db.update(businesses).set({name:data.name,data:JSON.stringify(data),revision,updatedAt:now}).where(and(eq(businesses.id,input.id),eq(businesses.ownerId,user.userId),eq(businesses.revision,input.revision))).returning({id:businesses.id});
 if(!changed.length)return json({error:'Another save occurred. Reload and try again.'},409);
 return json({business:{id:input.id,...data,revision,updatedAt:now}});
 }catch(e){console.error('business_write_failed',e);return json({error:'Save failed. Your changes have not been saved. Please retry.'},503);}
}
