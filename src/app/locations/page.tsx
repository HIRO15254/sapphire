import { LocationListContainer } from "@/features/locations/containers/LocationListContainer";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function LocationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <LocationListContainer />;
}
