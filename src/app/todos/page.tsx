import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { KanbanBoard } from "~/app/_components/todos/KanbanBoard";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  void api.todo.getAll.prefetch();
  void api.tag.getAll.prefetch();

  return (
    <HydrateClient>
      <KanbanBoard
        user={{
          name: session.user.name ?? "",
          email: session.user.email ?? "",
          role: session.user.role,
        }}
      />
    </HydrateClient>
  );
}
