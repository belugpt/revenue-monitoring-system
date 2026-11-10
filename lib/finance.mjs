export const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
export const isNumber=v=>typeof v==='number'&&Number.isFinite(v);
export const blankMonth=()=>({revenue:null,discounts:0,grossSales:null,opex:null,adjustments:0,stockReceived:0,stockPaid:0,stockLoss:0,supplierCredits:0,closingCash:null,loans:null,otherObligations:null,transactions:null,visitors:null,buyers:null,products:Array(6).fill(null)});
export const blankYear=()=>({openingStock:null,openingCash:null,openingPayable:null,priorRevenue:null,royalty:.05,advertising:.20,costRatio:.5,months:{}});
export const newBusiness=(name,start)=>({name,start,categories:['Clothing','Footwear','Bags','Accessories','Alterations','Other'],years:{[start.slice(0,4)]:blankYear()}});
export function report(b,year,month,depth=0){
 const config=b.years[year]||blankYear(),start=+year===+b.start.slice(0,4)?+b.start.slice(5):1,prior=depth<50&&b.years[+year-1]?report(b,+year-1,12,depth+1):null;
 let stock=isNumber(config.openingStock)?config.openingStock:prior?.stock??null,payable=isNumber(config.openingPayable)?config.openingPayable:prior?.payable??null;
 const openingCash=isNumber(config.openingCash)?config.openingCash:prior?.cash??null;
 let lastRevenue=config.priorRevenue??prior?.rows.at(-1)?.revenue??null;
 const rows=[];
 for(let n=start;n<=month;n++){
 const raw=config.months[n],m={...blankMonth(),...raw},revenue=isNumber(m.revenue)?m.revenue:null;
 const ticket=revenue===null?null:revenue+(m.discounts??0),gross=revenue===null?null:(isNumber(m.grossSales)?m.grossSales:ticket),cogs=ticket===null?null:ticket*config.costRatio;
 const royalty=gross===null?null:gross*config.royalty,advertising=gross===null?null:gross*config.advertising;
 const opex=isNumber(m.opex)&&isNumber(royalty)?m.opex+royalty+advertising:null,grossProfit=isNumber(cogs)?revenue-cogs:null,profit=isNumber(grossProfit)&&isNumber(opex)?grossProfit-opex-(m.adjustments??0):null;
 const openingStock=stock;if(isNumber(stock)&&raw&&isNumber(cogs))stock=stock+(m.stockReceived??0)-cogs-(m.stockLoss??0);else stock=null;
 if(isNumber(payable)&&raw)payable=payable+(m.stockReceived??0)-(m.stockPaid??0)-(m.supplierCredits??0);else payable=null;
 const conversion=isNumber(m.visitors)&&isNumber(m.buyers)&&m.visitors>0?m.buyers/m.visitors:null;
 rows.push({...m,month:n,revenue,gross,cogs,royalty,advertising,opex,grossProfit,profit,openingStock,stock,payable,conversion,growth:isNumber(revenue)&&isNumber(lastRevenue)&&lastRevenue>0?revenue/lastRevenue-1:null,atv:isNumber(revenue)&&m.transactions>0?revenue/m.transactions:null});lastRevenue=revenue;
 }
 const sum=key=>rows.length&&rows.every(r=>isNumber(r[key]))?rows.reduce((a,r)=>a+r[key],0):null,last=rows.at(-1)||{},revenue=sum('revenue'),profit=sum('profit'),grossProfit=sum('grossProfit'),visitors=sum('visitors'),buyers=sum('buyers'),transactions=sum('transactions');
 const products=Array.from({length:6},(_,j)=>rows.length&&rows.every(r=>isNumber(r.products?.[j]))?rows.reduce((a,r)=>a+r.products[j],0):null);
 const obligations=isNumber(payable)&&isNumber(last.loans)&&isNumber(last.otherObligations)?Math.max(0,payable)+last.loans+last.otherObligations:null;
 return {rows,last,revenue,profit,opex:sum('opex'),cogs:sum('cogs'),grossProfit,royalty:sum('royalty'),advertising:sum('advertising'),grossMargin:revenue>0&&isNumber(grossProfit)?grossProfit/revenue:null,netMargin:revenue>0&&isNumber(profit)?profit/revenue:null,transactions,atv:transactions>0&&isNumber(revenue)?revenue/transactions:null,visitors,buyers,conversion:visitors>0&&isNumber(buyers)?buyers/visitors:null,products,stock,payable,cash:last.closingCash??null,cashChange:isNumber(last.closingCash)&&isNumber(openingCash)?last.closingCash-openingCash:null,obligations,stockReceived:sum('stockReceived'),stockPaid:sum('stockPaid'),coverage:rows.filter(r=>isNumber(r.profit)).length,expected:rows.length};
}
export function demoBusiness(){const b=newBusiness('Atelier & Co.','2026-06');const y=b.years[2026];Object.assign(y,{openingStock:5000000,openingCash:2000000,openingPayable:0,priorRevenue:1400000,advertising:.03});for(let j=0;j<6;j++){const revenue=[1800000,2300000,2100000,2900000,3100000,3400000][j];y.months[j+6]={...blankMonth(),revenue,opex:420000+j*25000,stockReceived:j===3?2000000:0,stockPaid:j===3?1500000:0,closingCash:2100000+j*240000,loans:500000-j*40000,otherObligations:0,transactions:90+j*12,visitors:420+j*35,buyers:84+j*11,products:[.42,.23,.12,.13,.06,.04].map(p=>revenue*p)};}return {...b,id:'demo',revision:1};}
