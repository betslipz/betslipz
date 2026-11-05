import LegalPage, { legalMetadata } from "@/components/LegalPage";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => legalMetadata(params, "terms");

export default function Page({ params }: Props) {
  return <LegalPage params={params} doc="terms" />;
}
