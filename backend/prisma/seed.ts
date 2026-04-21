import { PrismaClient, Role, CourseLevel, ContentType, AgentFramework, PricingModel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kuberna.africa' },
    update: {},
    create: {
      email: 'admin@kuberna.africa',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      roles: [Role.ADMIN],
      emailVerified: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create instructor user
  const instructorPassword = await bcrypt.hash('instructor123', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@kuberna.africa' },
    update: {},
    create: {
      email: 'instructor@kuberna.africa',
      passwordHash: instructorPassword,
      fullName: 'Jane Instructor',
      roles: [Role.INSTRUCTOR, Role.LEARNER],
      emailVerified: true,
      profile: {
        create: {
          bio: 'Experienced DeFi developer and AI engineer',
          github: 'janeinstructor',
          twitter: 'janeinstructor',
          skills: ['Solidity', 'TypeScript', 'Python', 'AI/ML'],
        },
      },
    },
  });
  console.log('Created instructor user:', instructor.email);

  // Create demo learner
  const learnerPassword = await bcrypt.hash('learner123', 12);
  const learner = await prisma.user.upsert({
    where: { email: 'learner@kuberna.africa' },
    update: {},
    create: {
      email: 'learner@kuberna.africa',
      passwordHash: learnerPassword,
      fullName: 'Demo Learner',
      roles: [Role.LEARNER, Role.REQUESTER],
      emailVerified: true,
      profile: {
        create: {
          bio: 'Aspiring Web3 developer',
          skills: ['JavaScript', 'React'],
        },
      },
    },
  });
  console.log('Created learner user:', learner.email);

  // Create sample course
  const course = await prisma.course.upsert({
    where: { slug: 'agentic-commerce-accelerator' },
    update: {},
    create: {
      title: 'Agentic Commerce Accelerator',
      slug: 'agentic-commerce-accelerator',
      description:
        'Master the art of building autonomous AI agents for e-commerce. Learn to create intelligent agents that can handle customer inquiries, process orders, manage inventory, and provide personalized recommendations using cutting-edge AI technologies.',
      level: CourseLevel.ADVANCED,
      durationHours: 48,
      price: 25000,
      currency: 'USD',
      cryptoPrice: {
        NEAR: 7500,
        ETH: 9.5,
        USDC: 25000,
      },
      thumbnailUrl: 'https://example.com/course-thumbnails/agentic-commerce.jpg',
      previewVideoUrl: 'https://example.com/previews/agentic-commerce.mp4',
      learningObjectives: [
        'Build autonomous AI agents from scratch',
        'Integrate agents with e-commerce platforms',
        'Implement natural language understanding for customer service',
        'Deploy agents to production with monitoring',
        'Implement secure payment processing',
      ],
      prerequisites: [
        'Basic understanding of JavaScript/TypeScript',
        'Familiarity with REST APIs',
        'Understanding of basic AI/ML concepts',
      ],
      published: true,
      publishedAt: new Date(),
      instructorId: instructor.id,
      modules: {
        create: [
          {
            title: 'Introduction to Autonomous Agents',
            order: 1,
            contentType: ContentType.VIDEO,
            videoDuration: 1800,
            contentUrl: 'https://example.com/videos/intro-agents.mp4',
            estimatedMinutes: 30,
            isFree: true,
          },
          {
            title: 'Agent Architecture Fundamentals',
            order: 2,
            contentType: ContentType.DOCUMENT,
            documentText: '# Agent Architecture\n\nAgents are composed of several key components...',
            estimatedMinutes: 45,
          },
          {
            title: 'Building Your First Agent',
            order: 3,
            contentType: ContentType.LAB,
            labConfig: {
              dockerImage: 'node:18-alpine',
              starterCode: {
                'index.js': `export async function handleRequest(input) {\n  // Your agent logic here\n  return { response: "Hello, " + input.name };\n}`,
              },
              testCommand: 'npm test',
              expectedOutput: 'Hello, World',
              timeoutSeconds: 60,
            },
            estimatedMinutes: 60,
          },
          {
            title: 'Knowledge Assessment',
            order: 4,
            contentType: ContentType.QUIZ,
            quizQuestions: {
              questions: [
                {
                  id: 'q1',
                  text: 'What is the primary role of an autonomous agent?',
                  type: 'multiple_choice',
                  options: [
                    'Replace human workers entirely',
                    'Automate repetitive tasks and assist humans',
                    'Store data',
                    'Create websites',
                  ],
                  correctAnswer: 'Automate repetitive tasks and assist humans',
                  explanation:
                    'Autonomous agents are designed to automate repetitive tasks while augmenting human capabilities.',
                },
                {
                  id: 'q2',
                  text: 'Which framework is supported by Kuberna Labs?',
                  type: 'multiple_choice',
                  options: ['Django', 'ElizaOS', 'Ruby on Rails', 'Laravel'],
                  correctAnswer: 'ElizaOS',
                  explanation: 'ElizaOS is one of the supported frameworks for building agents.',
                },
              ],
            },
            estimatedMinutes: 15,
          },
        ],
      },
    },
  });
  console.log('Created course:', course.title);

  // Create a second course
  await prisma.course.upsert({
    where: { slug: 'defi-agent-development' },
    update: {},
    create: {
      title: 'DeFi Agent Development',
      slug: 'defi-agent-development',
      description:
        'Learn to build intelligent DeFi agents that can execute trades, manage liquidity, and monitor protocols across multiple chains.',
      level: CourseLevel.INTERMEDIATE,
      durationHours: 32,
      price: 15000,
      currency: 'USD',
      cryptoPrice: {
        NEAR: 4500,
        ETH: 5.5,
        USDC: 15000,
      },
      thumbnailUrl: 'https://example.com/course-thumbnails/defi-agents.jpg',
      learningObjectives: [
        'Understand DeFi protocols and mechanisms',
        'Build arbitrage and liquidity bots',
        'Implement risk management strategies',
        'Deploy cross-chain agents',
      ],
      prerequisites: [
        'Basic Solidity knowledge',
        'Understanding of DeFi concepts',
        'Experience with JavaScript/TypeScript',
      ],
      published: true,
      publishedAt: new Date(),
      instructorId: instructor.id,
      modules: {
        create: [
          {
            title: 'DeFi Fundamentals',
            order: 1,
            contentType: ContentType.VIDEO,
            videoDuration: 2400,
            contentUrl: 'https://example.com/videos/defi-fundamentals.mp4',
            estimatedMinutes: 40,
            isFree: true,
          },
          {
            title: 'Building a Trading Bot',
            order: 2,
            contentType: ContentType.LAB,
            labConfig: {
              dockerImage: 'python:3.11-slim',
              starterCode: {
                'bot.py': `class TradingBot:\n    def __init__(self):\n        self.balance = 0\n    \n    def execute_trade(self, token, amount):\n        # Trading logic here\n        pass`,
              },
              testCommand: 'python -m pytest',
              expectedOutput: 'tests passed',
              timeoutSeconds: 120,
            },
            estimatedMinutes: 90,
          },
        ],
      },
    },
  });

  // Create sample agent template
  await prisma.agent.upsert({
    where: { ownerId_name: { ownerId: instructor.id, name: 'Trading Bot' } },
    update: {},
    create: {
      ownerId: instructor.id,
      name: 'Trading Bot',
      description: 'Automated DeFi trading agent with risk management',
      framework: AgentFramework.LANGCHAIN,
      model: 'gpt-4',
      config: {
        strategy: 'momentum',
        maxPosition: 1000,
        stopLoss: 5,
      },
      tools: ['swap', 'lend', 'borrow', 'monitor'],
      pricingModel: PricingModel.SUCCESS,
      price: 0.01,
      status: 'DRAFT',
      supportedChains: ['ethereum', 'polygon', 'arbitrum'],
    },
  });

  // Create feature flags
  await prisma.featureFlag.upsert({
    where: { name: 'new_marketplace_ui' },
    update: {},
    create: {
      name: 'new_marketplace_ui',
      enabled: true,
      description: 'New marketplace UI with improved filtering',
    },
  });

  await prisma.featureFlag.upsert({
    where: { name: 'zk_tls_beta' },
    update: {},
    create: {
      name: 'zk_tls_beta',
      enabled: false,
      description: 'ZK-TLS integration for private data verification',
    },
  });

  await prisma.featureFlag.upsert({
    where: { name: 'enterprise_tier' },
    update: {},
    create: {
      name: 'enterprise_tier',
      enabled: true,
      description: 'Enterprise tier features including TEE deployment',
    },
  });

  // Create pricing tiers
  await prisma.pricing.upsert({
    where: { tier: 'SDK' },
    update: {},
    create: {
      tier: 'SDK',
      price: 397,
      currency: 'USD',
      interval: 'one_time',
      features: {
        agentSDK: true,
        videoHours: 5,
        templates: 3,
        support: 'community',
      },
      cryptoPrices: {
        NEAR: 120,
        ETH: 0.15,
        USDC: 397,
      },
    },
  });

  await prisma.pricing.upsert({
    where: { tier: 'ACCELERATOR' },
    update: {},
    create: {
      tier: 'ACCELERATOR',
      price: 25000,
      currency: 'USD',
      interval: 'one_time',
      features: {
        cohort: true,
        mentorship: 4,
        fineTuning: true,
        crossChain: true,
        peerNetwork: true,
        certificate: true,
      },
      cryptoPrices: {
        NEAR: 7500,
        ETH: 9.5,
        USDC: 25000,
      },
    },
  });

  await prisma.pricing.upsert({
    where: { tier: 'ENTERPRISE' },
    update: {},
    create: {
      tier: 'ENTERPRISE',
      price: 150000,
      currency: 'USD',
      interval: 'yearly',
      features: {
        teeDeployment: true,
        zkTLS: 3,
        dedicatedSupport: true,
        onsiteRetreat: true,
        customTokenomics: true,
        soc2: true,
        ipWhitelisting: true,
        sla: '99.95%',
      },
      cryptoPrices: {
        NEAR: 45000,
        ETH: 57,
        USDC: 150000,
      },
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
