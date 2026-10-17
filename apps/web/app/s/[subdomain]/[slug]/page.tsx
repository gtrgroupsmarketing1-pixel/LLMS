import { BlockRenderer } from '../../../../components/website/BlockRenderer';

async function fetchPage(subdomain: string, slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/website/public/${subdomain}/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    website: { id: string; subdomain: string };
    page: {
      titleEn: string;
      blocks: Array<{ type: string; [key: string]: unknown }>;
    };
  };
}

export default async function PublicSubPage({
  params,
}: {
  params: { subdomain: string; slug: string };
}) {
  const data = await fetchPage(params.subdomain, params.slug);
  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl text-slate-500">Page not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <BlockRenderer
        blocks={data.page.blocks}
        subdomain={params.subdomain}
        slug={params.slug}
      />
    </main>
  );
}
