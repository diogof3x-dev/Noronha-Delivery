import { categoriesByGroup, groupMeta, groupsOrder } from "@/lib/categories";

export function CategoriesSection() {
  return (
    <section id="categorias" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            O ecossistema
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Tudo o que a ilha oferece num único app
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Mais de 20 categorias de serviço para o turista chegar com tudo na mão e
            para o morador resolver o cotidiano sem sair da Vila.
          </p>
        </div>

        <div className="mt-14 space-y-12">
          {groupsOrder.map((groupId) => {
            const meta = groupMeta[groupId];
            const items = categoriesByGroup(groupId);
            const GroupIcon = meta.icon;

            return (
              <div key={groupId}>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <GroupIcon className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {meta.label}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-secondary/40"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium leading-tight">
                          {cat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
