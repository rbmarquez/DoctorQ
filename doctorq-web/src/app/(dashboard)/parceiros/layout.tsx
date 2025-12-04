import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parceiros | DoctorQ",
  description: "Gerencie o programa de parceiros DoctorQ",
};

export default function ParceirosLayout({
  children,
}: {
  children: React.Node;
}) {
  return <>{children}</>;
}
