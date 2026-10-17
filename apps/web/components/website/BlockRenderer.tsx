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

type R = Record<string, unknown>;

export function BlockRenderer({ blocks, subdomain, slug }: BlockRendererProps) {
  return (
    <div className="space-y-16 py-12">
      {blocks.map((block, i) => (
        <Block key={i} block={block} subdomain={subdomain} slug={slug} />
      ))}
    </div>
  );
}

function s(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function Block({ block, subdomain, slug }: { block: Block; subdomain: string; slug: string }) {
  const b = block as R;

  switch (block.type) {
    case 'hero': {
      const headline = s(b.headline);
      const sub = s(b.subheadline);
      const ctaLabel = s(b.ctaLabel);
      const ctaHref = s(b.ctaHref);
      return (
        <section className="text-center px-4 py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">{headline}</h1>
          {sub && <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">{sub}</p>}
          {ctaLabel && ctaHref && (
            <a
              href={ctaHref}
              className="inline-block bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800"
            >
              {ctaLabel}
            </a>
          )}
        </section>
      );
    }

    case 'features': {
      const title = s(b.title);
      const items = Array.isArray(b.items) ? (b.items as Array<R>) : [];
      return (
        <section className="px-4 max-w-5xl mx-auto">
          {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((item, i) => (
              <div key={i} className="text-center">
                {s(item.icon) && <div className="text-4xl mb-4">{s(item.icon)}</div>}
                <h3 className="text-xl font-semibold mb-2">{s(item.title)}</h3>
                {s(item.description) && (
                  <p className="text-slate-600">{s(item.description)}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'text': {
      const content = s(b.content);
      const align = b.align === 'center' ? 'text-center' : b.align === 'end' ? 'text-right' : '';
      return (
        <section className="px-4 max-w-3xl mx-auto">
          <div className={`text-lg text-slate-700 ${align}`}>{content}</div>
        </section>
      );
    }

    case 'image': {
      const url = s(b.url);
      const alt = s(b.alt);
      const caption = s(b.caption);
      return (
        <section className="px-4 max-w-5xl mx-auto">
          <img src={url} alt={alt} className="w-full rounded-lg" />
          {caption && (
            <p className="text-sm text-slate-500 text-center mt-2">{caption}</p>
          )}
        </section>
      );
    }

    case 'cta': {
      const headline = s(b.headline);
      const sub = s(b.subheadline);
      const label = s(b.buttonLabel);
      const href = s(b.buttonHref);
      return (
        <section className="bg-slate-900 text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{headline}</h2>
            {sub && <p className="text-lg text-slate-300 mb-8">{sub}</p>}
            <a
              href={href}
              className="inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-medium hover:bg-slate-100"
            >
              {label}
            </a>
          </div>
        </section>
      );
    }

    case 'form': {
      const title = s(b.title);
      const description = s(b.description);
      const submitLabel = s(b.submitLabel) || 'Submit';
      const successMessage = s(b.successMessage) || 'Thank you!';
      const fields = Array.isArray(b.fields) ? (b.fields as string[]) : [];
      return (
        <section className="px-4 max-w-lg mx-auto" id="book">
          {title && <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>}
          {description && (
            <p className="text-slate-600 text-center mb-8">{description}</p>
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
              alert(successMessage);
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
              {submitLabel}
            </button>
          </form>
        </section>
      );
    }

    case 'testimonials': {
      const title = s(b.title);
      const items = Array.isArray(b.items) ? (b.items as Array<R>) : [];
      return (
        <section className="px-4 max-w-5xl mx-auto">
          {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item, i) => {
              const rating = num(item.rating);
              return (
                <div key={i} className="bg-slate-50 p-6 rounded-lg">
                  {rating && (
                    <div className="text-amber-500 mb-2">
                      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                    </div>
                  )}
                  <p className="text-slate-700 italic mb-4">&ldquo;{s(item.quote)}&rdquo;</p>
                  <p className="text-sm text-slate-500">— {s(item.author)}</p>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case 'pricing': {
      const title = s(b.title);
      const items = Array.isArray(b.items) ? (b.items as Array<R>) : [];
      return (
        <section className="px-4 max-w-5xl mx-auto">
          {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item, i) => {
              const featured = item.featured === true;
              const features = Array.isArray(item.features)
                ? (item.features as string[])
                : [];
              return (
                <div
                  key={i}
                  className={`p-6 rounded-lg border-2 ${
                    featured ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{s(item.name)}</h3>
                  <div className="text-3xl font-bold mb-1">
                    {s(item.price)}
                    {s(item.unit) && (
                      <span className="text-base font-normal text-slate-500 ml-1">
                        {s(item.unit)}
                      </span>
                    )}
                  </div>
                  {features.length > 0 && (
                    <ul className="mt-4 space-y-1">
                      {features.map((f, j) => (
                        <li key={j} className="text-slate-600 text-sm">
                          ✓ {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case 'faq': {
      const title = s(b.title);
      const items = Array.isArray(b.items) ? (b.items as Array<R>) : [];
      return (
        <section className="px-4 max-w-3xl mx-auto">
          {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
          <div className="space-y-4">
            {items.map((item, i) => (
              <details key={i} className="bg-slate-50 p-4 rounded-lg">
                <summary className="font-medium cursor-pointer">{s(item.question)}</summary>
                <p className="mt-2 text-slate-600">{s(item.answer)}</p>
              </details>
            ))}
          </div>
        </section>
      );
    }

    case 'gallery': {
      const images = Array.isArray(b.images) ? (b.images as Array<R>) : [];
      return (
        <section className="px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <img
                key={i}
                src={s(img.url)}
                alt={s(img.alt)}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </section>
      );
    }

    case 'contact': {
      const title = s(b.title);
      const phone = s(b.phone);
      const email = s(b.email);
      const address = s(b.address);
      return (
        <section className="px-4 max-w-3xl mx-auto text-center">
          {title && <h2 className="text-3xl font-bold mb-8">{title}</h2>}
          <div className="space-y-2 text-slate-700">
            {phone && <p>📞 {phone}</p>}
            {email && <p>✉️ {email}</p>}
            {address && <p>📍 {address}</p>}
          </div>
        </section>
      );
    }

    case 'footer': {
      const copyright = s(b.copyright);
      const links = Array.isArray(b.links) ? (b.links as Array<R>) : [];
      const socials = Array.isArray(b.socials) ? (b.socials as Array<R>) : [];
      return (
        <footer className="border-t border-slate-200 py-8 px-4 text-center">
          {links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={s(link.href)}
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  {s(link.label)}
                </a>
              ))}
            </div>
          )}
          {socials.length > 0 && (
            <div className="flex justify-center gap-4 mb-4">
              {socials.map((soc, i) => (
                <a
                  key={i}
                  href={s(soc.href)}
                  className="text-slate-500 hover:text-slate-900"
                >
                  {s(soc.network)}
                </a>
              ))}
            </div>
          )}
          {copyright && <p className="text-xs text-slate-400">{copyright}</p>}
        </footer>
      );
    }

    default:
      return null;
  }
}
