import { BlockRenderer } from '../../../components/website/BlockRenderer';

async function fetchHome(subdomain: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/website/public/${subdomain}`,
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

export default async function PublicHomePage({
  params,
}: {
  params: { subdomain: string };
}) {
  const data = await fetchHome(params.subdomain);
  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl text-slate-500">Site not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <BlockRenderer
        blocks={data.page.blocks}
        subdomain={params.subdomain}
        slug="home"
      />
    </main>
  );
}
