import { LocationDetailContainer } from "@/features/locations/containers/LocationDetailContainer";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const locationId = Number.parseInt(id, 10);

  if (Number.isNaN(locationId)) {
    redirect("/locations");
  }

  return <LocationDetailContainer locationId={locationId} />;
}
