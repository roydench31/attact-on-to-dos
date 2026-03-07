import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { UserTable } from "~/app/_components/admin/UserTable";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/todos");

  void api.admin.listUsers.prefetch({ page: 1, pageSize: 20 });

  return (
    <HydrateClient>
      <UserTable currentUserId={session.user.id} />
    </HydrateClient>
  );
}
