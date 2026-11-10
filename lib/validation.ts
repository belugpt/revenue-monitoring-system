export const fields=['revenue','discounts','grossSales','opex','adjustments','stockReceived','stockPaid','stockLoss','closingCash','loans','otherObligations','transactions','visitors','buyers','supplierCredits'];
const numeric=(v:any)=>v===null||v===undefined||(typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e15);
export function validateBusiness(input:any):any{
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>100)return {ok:false,error:'Enter a business name of 1–100 characters.'};
 if(!/^\d{4}-\d{2}$/.test(input.start||'')||+input.start.slice(5)<1||+input.start.slice(5)>12)return {ok:false,error:'Enter a valid opening month.'};
 if(!Array.isArray(input.categories)||input.categories.length!==6||input.categories.some((x:any)=>typeof x!=='string'||!x.trim()||x.length>70))return {ok:false,error:'Provide six product-category names.'};
 if(!input.years||typeof input.years!=='object'||Array.isArray(input.years)||Object.keys(input.years).length>100)return {ok:false,error:'Invalid year data.'};
 const years:any={};for(const [year,raw]of Object.entries(input.years)){
 const y:any=raw;if(!/^\d{4}$/.test(year)||+year<2000||+year>2199||!y||typeof y!=='object')return {ok:false,error:'Years must be between 2000 and 2199.'};
 const config:any={};for(const k of ['openingStock','openingCash','openingPayable','priorRevenue','royalty','advertising','costRatio']){if(!numeric(y[k]))return {ok:false,error:'Invalid '+k};config[k]=y[k]??null;}
 if(config.costRatio===null||config.costRatio<=0||config.costRatio>1||config.royalty===null||config.royalty<0||config.royalty>1||config.advertising===null||config.advertising<0||config.advertising>1)return {ok:false,error:'Check pricing and franchise percentages.'};
 config.months={};if(!y.months||typeof y.months!=='object'||Array.isArray(y.months))return {ok:false,error:'Invalid monthly records.'};
 for(const [month,mraw]of Object.entries(y.months)){const m:any=mraw;if(!/^([1-9]|1[0-2])$/.test(month)||!m||typeof m!=='object')return {ok:false,error:'Invalid month.'};const record:any={};
 for(const k of fields){if(!numeric(m[k]))return {ok:false,error:'Invalid '+k};if(k!=='adjustments'&&m[k]!=null&&m[k]<0)return {ok:false,error:k+' cannot be negative.'};record[k]=m[k]??null;}
 if(m.buyers!=null&&m.visitors!=null&&m.buyers>m.visitors)return {ok:false,error:'Purchasing visitors cannot exceed total visitors.'};
 if(!Array.isArray(m.products)||m.products.length!==6||m.products.some((v:any)=>!numeric(v)||(v!=null&&v<0)))return {ok:false,error:'Check the six product sales figures.'};record.products=m.products.map((x:any)=>x??null);config.months[month]=record;}
 years[year]=config;
 }
 return {ok:true,value:{name:input.name.trim(),start:input.start,categories:input.categories.map((x:string)=>x.trim()),years}};
}
