import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import "../styles.css";

export const metadata: Metadata = {
  title: "Grow Medico - Consultation",
  description:
    "Private consultation with Grow Medico for personal branding, digital marketing, and growth.",
  openGraph: {
    title: "Grow Medico - Consultation",
    description:
      "Personal branding, digital marketing, and growth strategy for professionals.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Meta Pixel Code */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
            }(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '757838743050832');
            fbq('track', 'PageView');
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=757838743050832&ev=PageView&noscript=1"
            alt="facebook-pixel"
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}