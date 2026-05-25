import ThankYouPage from "@/components/ThankYouPage";
import Script from "next/script";

export const metadata = {
  title: "Thank You - Growth Makers",
  description:
    "Thank you for your inquiry. Our team will be in touch shortly.",
};

type ThankYouRouteProps = {
  searchParams: Promise<{
    firstName?: string;
    email?: string;
  }>;
};

export default async function ThankYouRoute({
  searchParams,
}: ThankYouRouteProps) {
  const params = await searchParams;

  return (
    <>
      {/* Facebook Pixel Event */}
      <Script id="fb-submit-application" strategy="afterInteractive">
        {`
          fbq('track', 'SubmitApplication');
        `}
      </Script>

      <ThankYouPage
        firstName={params.firstName}
        email={params.email}
      />
    </>
  );
}