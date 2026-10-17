'use client';

import React from 'react';

interface Block {
  type: string;
  [key: string]: unknown;
}

interface BlockRendererProps {
  blocks: Block[];
  subdomain: string;
  slug: string;
}

export function BlockRenderer({ blocks, subdomain, slug }: BlockRendererProps) {
  return (
    <div className="space-y-16 py-12">
      {blocks.map((block, i) => (
        <Block key={i} block={block} subdomain={subdomain} slug={slug} />
      ))}
    </div>
  );
}

function Block({ block, subdomain, slug }: { block: Block; subdomain: string; slug: string }) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="text-center px-4 py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            {String(block.headline)}
          </h1>
          {block.subheadline && (
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              {String(block.subheadline)}
            </p>
          )}
          {block.ctaLabel && block.ctaHref && (
            <a
              href={String(block.ctaHref)}
              className="inline-block bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800"
            >
              {String(block.ctaLabel)}
            </a>
          )}
        </section>
      );

    case 'features':
      return (
        <section className="px-4 max-w-5xl mx-auto">
          {block.title && (
            <h2 className="text-3xl font-bold text-center mb-12">{String(block.title)}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(block.items as Array<{ title: string; description?: string; icon?: string }>).map(
              (item, i) => (
                <div key={i} className="text-center">
                  {item.icon && <div className="text-4xl mb-4">{item.icon}</div>}
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-slate-600">{item.description}</p>
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      );

    case 'text':
      return (
        <section className="px-4 max-w-3xl mx-auto">
          <div
            className={`text-lg text-slate-700 ${
              block.align === 'center' ? 'text-center' : ''
            }`}
          >
            {String(block.content)}
          </div>
        </section>
      );

    case 'image':
      return (
        <section className="px-4 max-w-5xl mx-auto">
          <img
            src={String(block.url)}
            alt={String(block.alt)}
            className="w-full rounded-lg"
          />
          {block.caption && (
            <p className="text-sm text-slate-500 text-center mt-2">
              {String(block.caption)}
            </p>
          )}
        </section>
      );

    case 'cta':
      return (
        <section className="bg-slate-900 text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{String(block.headline)}</h2>
            {block.subheadline && (
              <p className="text-lg text-slate-300 mb-8">{String(block.subheadline)}</p>
            )}
            <a
              href={String(block.buttonHref)}
              className="inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-medium hover:bg-slate-100"
            >
              {String(block.buttonLabel)}
            </a>
          </div>
        </section>
      );

    case 'form': {
      const fields = block.fields as string[];
      return (
        <section className="px-4 max-w-lg mx-auto" id="book">
          {block.title && (
            <h2 className="text-3xl font-bold text-center mb-4">{String(block.title)}</h2>
          )}
          {block.description && (
            <p className="text-slate-600 text-center mb-8">{String(block.description)}</p>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const body: Record<string, string> = {};
              fields.forEach((f) => {
                const v = fd.get(f);
                if (v) body[f] = String(v);
              });
              const urlParams = new URLSearchParams(window.location.search);
              body.utmSource = urlParams.get('utm_source') ?? '';
              body.utmMedium = urlParams.get('utm_medium') ?? '';
              body.utmCampaign = urlParams.get('utm_campaign') ?? '';

              await fetch(`/api/website/public/${subdomain}/${slug}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });

              (e.target as HTMLFormElement).reset();
              alert(String(block.successMessage ?? 'Thank you!'));
            }}
            className="space-y-4"
          >
            {fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                  {field}
                </label>
                {field === 'message' ? (
                  <textarea
                    name={field}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                ) : (
                  <input
                    name={field}
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800"
            >
              {String(block.submitLabel ?? 'Submit')}
            </button>
          </form>
        </section>
      );
    }

    case 'testimonials':
      return (
        <section className="px-4 max-w-5xl mx-auto">
          {block.title && (
            <h2 className="text-3xl font-bold text-center mb-12">{String(block.title)}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(block.items as Array<{ quote: string; author: string; rating?: number }>).map(
              (item, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-lg">
                  {item.rating && (
                    <div className="text-amber-500 mb-2">
                      {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                    </div>
                  )}
                  <p className="text-slate-700 italic mb-4">&ldquo;{item.quote}&rdquo;</p>
                  <p className="text-sm text-slate-500">— {item.author}</p>
                </div>
              ),
            )}
          </div>
        </section>
      );

    case 'pricing':
      return (
        <section className="px-4 max-w-5xl mx-auto">
          {block.title && (
            <h2 className="text-3xl font-bold text-center mb-12">{String(block.title)}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(block.items as Array<{ name: string; price: string; unit?: string; features?: string[]; featured?: boolean }>).map(
              (item, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-lg border-2 ${
                    item.featured
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <div className="text-3xl font-bold mb-1">
                    {item.price}
                    {item.unit && (
                      <span className="text-base font-normal text-slate-500 ml-1">
                        {item.unit}
                      </span>
                    )}
                  </div>
                  {item.features && (
                    <ul className="mt-4 space-y-1">
                      {item.features.map((f, j) => (
                        <li key={j} className="text-slate-600 text-sm">
                          ✓ {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="px-4 max-w-3xl mx-auto">
          {block.title && (
            <h2 className="text-3xl font-bold text-center mb-12">{String(block.title)}</h2>
          )}
          <div className="space-y-4">
            {(block.items as Array<{ question: string; answer: string }>).map((item, i) => (
              <details key={i} className="bg-slate-50 p-4 rounded-lg">
                <summary className="font-medium cursor-pointer">{item.question}</summary>
                <p className="mt-2 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section className="px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(block.images as Array<{ url: string; alt: string }>).map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </section>
      );

    case 'contact':
      return (
        <section className="px-4 max-w-3xl mx-auto text-center">
          {block.title && <h2 className="text-3xl font-bold mb-8">{String(block.title)}</h2>}
          <div className="space-y-2 text-slate-700">
            {block.phone && <p>📞 {String(block.phone)}</p>}
            {block.email && <p>✉️ {String(block.email)}</p>}
            {block.address && <p>📍 {String(block.address)}</p>}
          </div>
        </section>
      );

    case 'footer':
      return (
        <footer className="border-t border-slate-200 py-8 px-4 text-center">
          {block.links && (
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {(block.links as Array<{ label: string; href: string }>).map((link, i) => (
                <a key={i} href={link.href} className="text-sm text-slate-500 hover:text-slate-900">
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {block.socials && (
            <div className="flex justify-center gap-4 mb-4">
              {(block.socials as Array<{ network: string; href: string }>).map((s, i) => (
                <a key={i} href={s.href} className="text-slate-500 hover:text-slate-900">
                  {s.network}
                </a>
              ))}
            </div>
          )}
          {block.copyright && (
            <p className="text-xs text-slate-400">{String(block.copyright)}</p>
          )}
        </footer>
      );

    default:
      return null;
  }
}
