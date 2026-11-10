import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Revenue Monitoring System',description:'One clear picture of your businesses. Revenue, profit, stock and cash in one workspace.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
