import type { Metadata } from 'next'; import './globals.css';
export const metadata: Metadata={title:"La Quiniela NFL",description:'Pick’em privado de la NFL'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
