import { Link } from 'react-router-dom';
import { domainLabels, domainMeta, getRouteMeta, getToolDisplayName, toolMetaByDomain } from './routeMeta';

type Domain = keyof typeof domainMeta;

type Props = {
  domain?: string;
  tool?: string;
};

const topToolLinks: Record<Domain, string[]> = {
  videos: ['trim-video', 'compress-video', 'convert-video'],
  audio: ['convert-audio', 'trim-audio', 'merge-audio'],
  code: ['format-json', 'decode-jwt', 'test-regex'],
  text: ['convert-subtitles'],
  images: ['resize-image', 'compress-image', 'remove-image-background'],
};

const domainIntros: Record<Domain, string> = {
  videos:
    'Use these browser-based video tools to trim clips, convert formats, resize footage, extract frames, add subtitles, and handle common editing tasks without a heavy desktop editor.',
  audio:
    'Use these audio tools to convert formats, trim segments, merge tracks, and improve speech clarity with a fast browser workflow.',
  code:
    'Use these developer utilities to format JSON, test regex, decode JWTs, compare code, and handle common programming tasks quickly.',
  text:
    'Use these text utilities to convert subtitle files and keep timings and formatting intact across formats.',
  images:
    'Use these image tools to crop, resize, compress, convert, remove backgrounds, apply filters, and prepare graphics for the web.',
};

const domainSteps: Record<Domain, string[]> = {
  videos: [
    'Choose the video tool that matches the task you want to complete.',
    'Upload or select your media and adjust any settings for output format, size, or quality.',
    'Process the file and download the result when the tool finishes.',
  ],
  audio: [
    'Pick the audio tool that matches your workflow, such as convert, trim, or merge.',
    'Upload your audio file and configure the relevant output options.',
    'Run the tool and download the processed audio file.',
  ],
  code: [
    'Open the utility you need, such as JSON formatting, regex testing, or JWT decoding.',
    'Paste your input and configure any available options.',
    'Review the result and copy the generated or transformed output.',
  ],
  text: [
    'Select the subtitle conversion tool for the format you need.',
    'Upload or paste the subtitle content and choose the target format.',
    'Convert the file and export the new subtitle output.',
  ],
  images: [
    'Choose the image tool that matches your task, such as crop, resize, or background removal.',
    'Upload your image and adjust the relevant options for output and quality.',
    'Process the image and download the final result.',
  ],
};

const domainUseCases: Record<Domain, string[]> = {
  videos: [
    'Prepare clips for YouTube, TikTok, Instagram, and other social platforms.',
    'Convert raw footage into smaller shareable files.',
    'Handle quick edits such as trimming, cropping, subtitles, and thumbnails.',
  ],
  audio: [
    'Convert audio between formats for playback and publishing.',
    'Trim clips for podcasts, lessons, and short-form content.',
    'Combine or clean speech recordings before sharing.',
  ],
  code: [
    'Format and inspect structured data during development.',
    'Validate tokens, regex patterns, and transformed strings quickly.',
    'Use lightweight utilities for debugging and day-to-day engineering work.',
  ],
  text: [
    'Convert subtitle formats without rebuilding timings from scratch.',
    'Prepare subtitle files for different players and publishing platforms.',
    'Standardize subtitle assets across editing workflows.',
  ],
  images: [
    'Prepare product images and social creatives for publication.',
    'Resize and compress assets for better page speed and uploads.',
    'Clean up images with cropping, filtering, metadata edits, and background removal.',
  ],
};

const domainFaqs: Record<Domain, Array<{ question: string; answer: string }>> = {
  videos: [
    {
      question: 'What can I do with these video tools?',
      answer:
        'You can trim, resize, convert, compress, subtitle, crop, stabilize, and enhance videos through focused browser-based utilities.',
    },
    {
      question: 'Who are these tools for?',
      answer:
        'They are useful for creators, marketers, educators, and anyone who needs quick edits without switching into a large desktop editing suite.',
    },
  ],
  audio: [
    {
      question: 'What audio tasks are covered here?',
      answer:
        'This category covers common tasks such as converting, trimming, merging, and improving spoken audio.',
    },
    {
      question: 'When should I use these instead of a DAW?',
      answer:
        'Use them when you need speed and a focused workflow for a single task rather than a full multitrack production environment.',
    },
  ],
  code: [
    {
      question: 'Which developer tasks are supported?',
      answer:
        'The category includes utilities for JSON formatting, JWT inspection, regex testing, hashing, UUID generation, diffs, and related development work.',
    },
    {
      question: 'Why use these browser tools?',
      answer:
        'They are useful when you want a fast utility page instead of opening a larger local toolchain for a small debugging or formatting task.',
    },
  ],
  text: [
    {
      question: 'What is the main use of this category?',
      answer:
        'This category focuses on subtitle conversion so you can move subtitle files between formats for editors, players, and distribution platforms.',
    },
    {
      question: 'Why is subtitle conversion important?',
      answer:
        'Different platforms and editors expect different subtitle formats, so quick conversion saves time and avoids manual rework.',
    },
  ],
  images: [
    {
      question: 'What image jobs can I handle here?',
      answer:
        'You can crop, resize, compress, convert, watermark, filter, enhance, and clean up images through dedicated online tools.',
    },
    {
      question: 'Who benefits most from these tools?',
      answer:
        'They are useful for ecommerce teams, designers, content creators, and anyone preparing images for web publishing or presentation.',
    },
  ],
};

function getRelatedTools(domain: Domain, activeTool?: string) {
  const available = Object.keys(toolMetaByDomain[domain]);
  const preferred = topToolLinks[domain].filter((tool) => tool !== activeTool);
  const fallback = available.filter((tool) => tool !== activeTool && !preferred.includes(tool));
  return [...preferred, ...fallback].slice(0, 3);
}

function ToolSeoContent({ domain, tool }: { domain: Domain; tool: string }) {
  const routeMeta = getRouteMeta(`/app/${domain}/${tool}`);
  const domainLabel = domainLabels[domain];
  const relatedTools = getRelatedTools(domain, tool);

  return (
    <section className="seo-content" aria-label="Page information">
      <div className="seo-content-hero">
        <p className="seo-eyebrow">{domainLabel} tool</p>
        <h1>{getToolDisplayName(tool)}</h1>
        <p>{routeMeta.description}</p>
      </div>

      <div className="seo-content-grid">
        <article className="seo-card">
          <h2>How to use this tool</h2>
          <ol className="seo-list seo-list-numbered">
            {domainSteps[domain].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="seo-card">
          <h2>Why people use {getToolDisplayName(tool).toLowerCase()}</h2>
          <p>
            This page targets a single task with a simpler workflow than full editing suites. It is useful for quick
            one-off jobs, content preparation, and routine file cleanup before sharing or publishing.
          </p>
        </article>

        <article className="seo-card">
          <h2>Frequently asked questions</h2>
          <div className="seo-faq">
            <h3>What does this tool do?</h3>
            <p>{routeMeta.description}</p>
            <h3>Who is it useful for?</h3>
            <p>
              It is useful for creators, marketers, students, and developers who need to complete a focused task
              quickly without switching to heavier software.
            </p>
          </div>
        </article>

        <article className="seo-card">
          <h2>Related {domainLabel.toLowerCase()} tools</h2>
          <div className="seo-link-list">
            {relatedTools.map((relatedTool) => (
              <Link key={relatedTool} to={`/app/${domain}/${relatedTool}`} className="seo-link-chip">
                {getToolDisplayName(relatedTool)}
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function DomainSeoContent({ domain }: { domain: Domain }) {
  const meta = domainMeta[domain];
  const relatedTools = getRelatedTools(domain);
  const allTools = Object.keys(toolMetaByDomain[domain]);
  const domainLabel = domainLabels[domain];

  return (
    <section className="seo-content" aria-label="Category information">
      <div className="seo-content-hero">
        <p className="seo-eyebrow">{domainLabel} category</p>
        <h1>Free Online {domainLabel} Tools</h1>
        <p>{domainIntros[domain]}</p>
        <p>{meta.description}</p>
      </div>

      <div className="seo-content-grid">
        <article className="seo-card">
          <h2>How this category works</h2>
          <ol className="seo-list seo-list-numbered">
            {domainSteps[domain].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="seo-card">
          <h2>What you can do here</h2>
          <p>
            Browse focused utilities for common {domainLabel.toLowerCase()} tasks and move directly into the tool you
            need instead of navigating a large editor or installing separate software.
          </p>
        </article>

        <article className="seo-card">
          <h2>Popular tools in this category</h2>
          <div className="seo-link-list">
            {relatedTools.map((tool) => (
              <Link key={tool} to={`/app/${domain}/${tool}`} className="seo-link-chip">
                {getToolDisplayName(tool)}
              </Link>
            ))}
          </div>
        </article>

        <article className="seo-card">
          <h2>Common use cases</h2>
          <ul className="seo-list">
            {domainUseCases[domain].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="seo-card seo-card-wide">
          <h2>Browse all {domainLabel.toLowerCase()} tools</h2>
          <div className="seo-link-list">
            {allTools.map((tool) => (
              <Link key={tool} to={`/app/${domain}/${tool}`} className="seo-link-chip">
                {getToolDisplayName(tool)}
              </Link>
            ))}
          </div>
        </article>

        <article className="seo-card seo-card-wide">
          <h2>{domainLabel} tools FAQ</h2>
          <div className="seo-faq">
            {domainFaqs[domain].map((faq) => (
              <div key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export function SeoContent({ domain, tool }: Props) {
  if (!domain || !(domain in domainMeta)) {
    return null;
  }

  const typedDomain = domain as Domain;

  if (tool && tool in toolMetaByDomain[typedDomain]) {
    return <ToolSeoContent domain={typedDomain} tool={tool} />;
  }

  return <DomainSeoContent domain={typedDomain} />;
}
