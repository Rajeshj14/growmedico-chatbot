import ThankYouPage from "@/components/ThankYouPage";

export const metadata = {
  title: "Thank You - Growth Makers",
  description: "Thank you for your inquiry. Our team will be in touch shortly.",
};

type ThankYouRouteProps = {
  searchParams: Promise<{
    firstName?: string;
    email?: string;
  }>;
};

export default async function ThankYouRoute({ searchParams }: ThankYouRouteProps) {
  const params = await searchParams;

  return <ThankYouPage firstName={params.firstName} email={params.email} />;
}
