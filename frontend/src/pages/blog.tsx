import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { ArrowRight, Calendar, User } from 'lucide-react';

const posts = [
  {
    id: 1,
    title: 'Introduction to Cross-Chain Intent Protocols',
    excerpt: 'Learn how intent-based architectures are revolutionizing DeFi and enabling seamless cross-chain interactions.',
    category: 'Technical',
    date: 'Jan 15, 2024',
    author: 'Dr. Alice Smith',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 2,
    title: 'TEE Security: A Deep Dive',
    excerpt: 'Understanding Trusted Execution Environments and how they enable secure agent deployment.',
    category: 'Security',
    date: 'Jan 10, 2024',
    author: 'Bob Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 3,
    title: 'The Agentic Economy: 2024 Outlook',
    excerpt: 'Predictions for the year ahead in autonomous agent infrastructure and DeFi automation.',
    category: 'Insights',
    date: 'Jan 5, 2024',
    author: 'Arnaud Kennedy',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'
  },
];

export default function BlogPage() {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-16 px-6 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest mb-6 inline-flex">
            Blog
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Insights & <span className="text-primary">Updates</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Latest thoughts on agentic systems, DeFi, and decentralized infrastructure.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          {/* Featured Post */}
          <div className="mb-16">
            <div className="bg-surface-container-low rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-video lg:aspect-auto bg-surface">
                  <img 
                    src={posts[0].thumbnail} 
                    alt={posts[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4">{posts[0].category}</span>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4">{posts[0].title}</h2>
                  <p className="text-on-surface-variant mb-6">{posts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-6">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {posts[0].date}</span>
                    <span className="flex items-center gap-1"><User size={14} /> {posts[0].author}</span>
                  </div>
                  <button className="btn btn-primary inline-flex items-center gap-2 w-fit">
                    Read Article <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          <h2 className="text-2xl font-bold mb-8">Recent Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.slice(1).map((post) => (
              <article key={post.id} className="bg-surface-container-low rounded-xl overflow-hidden hover:-translate-y-2 transition-transform">
                <div className="aspect-video bg-surface">
                  <img 
                    src={post.thumbnail} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{post.category}</span>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{post.date}</span>
                    <button className="text-primary font-medium flex items-center gap-1">
                      Read <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}