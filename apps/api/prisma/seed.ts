import { PrismaClient, UserRole, AgentType, DocumentType, SubscriptionPlan, SubscriptionStatus, PaymentProvider, DocumentStatus, ModelProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.embedding.deleteMany();
  await prisma.document.deleteMany();
  await prisma.agentKnowledgeSource.deleteMany();
  await prisma.conversationHandoffRule.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // Create SUPER_ADMIN user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@chatbot.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Created SUPER_ADMIN: ${adminUser.email}`);

  // Create sample COMPANY
  const company = await prisma.company.create({
    data: {
      name: 'TechCorp Solutions',
      slug: 'techcorp-solutions',
      description: 'A leading provider of AI-powered customer support solutions',
      industry: 'Technology',
      size: '50-200',
      timezone: 'UTC',
      defaultLanguage: 'en',
      settings: {
        theme: {
          primaryColor: '#2563eb',
          logoUrl: null,
          faviconUrl: null,
        },
        businessHours: {
          timezone: 'UTC',
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: null,
        },
        autoAssignment: true,
        maxChatsPerAgent: 5,
        csatSurveyEnabled: true,
        csatSurveyTrigger: 'conversation_end',
      },
    },
  });
  console.log(`✅ Created COMPANY: ${company.name}`);

  // Create BUSINESS_OWNER user
  const businessOwner = await prisma.user.create({
    data: {
      email: 'owner@techcorp.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.BUSINESS_OWNER,
      isActive: true,
      isVerified: true,
      companyId: company.id,
    },
  });
  console.log(`✅ Created BUSINESS_OWNER: ${businessOwner.email}`);

  // Create SUPPORT_AGENT users
  const agentUser1 = await prisma.user.create({
    data: {
      email: 'alice@techcorp.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: UserRole.SUPPORT_AGENT,
      isActive: true,
      isVerified: true,
      companyId: company.id,
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: 'bob@techcorp.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Williams',
      role: UserRole.SUPPORT_AGENT,
      isActive: true,
      isVerified: true,
      companyId: company.id,
    },
  });
  console.log(`✅ Created SUPPORT_AGENTS: ${agentUser1.email}, ${agentUser2.email}`);

  // Create sample CUSTOMERS
  const customer1 = await prisma.customer.create({
    data: {
      email: 'customer1@example.com',
      firstName: 'Emma',
      lastName: 'Brown',
      companyId: company.id,
      metadata: {
        signupChannel: 'website',
        plan: 'premium',
        accountAge: 365,
        totalOrders: 12,
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      email: 'customer2@example.com',
      firstName: 'James',
      lastName: 'Davis',
      companyId: company.id,
      metadata: {
        signupChannel: 'mobile',
        plan: 'basic',
        accountAge: 180,
        totalOrders: 3,
      },
    },
  });
  console.log(`✅ Created CUSTOMERS: ${customer1.email}, ${customer2.email}`);

  // Create sample AI AGENT (Customer Support)
  const aiAgent = await prisma.agent.create({
    data: {
      name: 'Customer Support Assistant',
      description: 'Primary AI agent for handling customer support inquiries',
      personality: 'Professional, friendly, and empathetic',
      tone: 'Warm and helpful while maintaining professionalism',
      language: 'en',
      instructions: `You are a customer support AI assistant for TechCorp Solutions. Your role is to:
1. Greet customers warmly and identify their needs
2. Provide accurate information about products and services
3. Troubleshoot common technical issues
4. Escalate complex issues to human agents when necessary
5. Always maintain a professional and empathetic tone
6. Collect relevant information before escalating
7. Follow up on unresolved issues
8. Document all interactions thoroughly`,
      type: AgentType.CUSTOMER_SUPPORT,
      modelProvider: ModelProvider.OPENAI,
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4096,
      confidenceThreshold: 0.8,
      isActive: true,
      companyId: company.id,
      settings: {
        greetings: [
          "Hello! Welcome to TechCorp Support. How can I help you today?",
          "Hi there! Thank you for reaching out to TechCorp. What can I assist you with?",
        ],
        fallbackMessage: "I'm not sure I can help with that. Let me transfer you to a human agent who can assist further.",
        escalationKeywords: ['manager', 'complaint', 'refund', 'cancel', 'lawsuit'],
        autoResolveTimeout: 300,
        businessHoursOnly: false,
      },
    },
  });
  console.log(`✅ Created AI AGENT: ${aiAgent.name}`);

  // Create KNOWLEDGE_BASE
  const knowledgeBase = await prisma.knowledgeBase.create({
    data: {
      name: 'TechCorp Product Knowledge Base',
      description: 'Comprehensive knowledge base containing product documentation, FAQs, and troubleshooting guides',
      isActive: true,
      companyId: company.id,
    },
  });
  console.log(`✅ Created KNOWLEDGE_BASE: ${knowledgeBase.name}`);

  // Link AI Agent to Knowledge Base
  await prisma.agentKnowledgeSource.create({
    data: {
      agentId: aiAgent.id,
      knowledgeBaseId: knowledgeBase.id,
    },
  });
  console.log(`✅ Linked AI Agent to Knowledge Base`);

  // Create sample FAQ document
  const faqDocument = await prisma.document.create({
    data: {
      title: 'Frequently Asked Questions',
      fileUrl: null,
      fileType: DocumentType.FAQ,
      content: `Q: How do I reset my password?
A: Go to the login page and click "Forgot Password". Enter your email address and we'll send you a password reset link.

Q: How do I upgrade my subscription plan?
A: Navigate to Settings → Subscription in your dashboard. Click "Upgrade Plan" and select your desired plan.

Q: What payment methods do you accept?
A: We accept credit/debit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual plans.

Q: How do I export my chat history?
A: Go to Settings → Data Export. Select the date range and format (CSV or JSON), then click "Export".

Q: Is there a mobile app available?
A: Yes! Our mobile app is available for both iOS and Android. Download it from the App Store or Google Play Store.

Q: How do I invite team members?
A: Go to Settings → Team Management. Click "Invite Member" and enter their email address and role.

Q: What is your SLA for response time?
A: Our standard SLA is:
- Basic: 24 hours response time
- Professional: 4 hours response time
- Enterprise: 1 hour response time with dedicated support

Q: How do I integrate with my existing tools?
A: We offer integrations with Slack, Zendesk, Salesforce, HubSpot, and more. Go to Settings → Integrations to configure.

Q: Can I customize the chat widget?
A: Yes! Go to Settings → Widget Customization to change colors, position, and branding elements.

Q: How is my data protected?
A: We use AES-256 encryption at rest and TLS 1.3 in transit. Our infrastructure is SOC 2 Type II certified and GDPR compliant.`,
      status: DocumentStatus.EMBEDDED,
      chunkCount: 3,
      metadata: {
        category: 'general',
        priority: 'high',
        author: 'admin',
        lastReviewed: new Date().toISOString(),
      },
      knowledgeBaseId: knowledgeBase.id,
    },
  });
  console.log(`✅ Created FAQ DOCUMENT: ${faqDocument.title}`);

  // Create sample product documentation
  const productDoc = await prisma.document.create({
    data: {
      title: 'Product Documentation - Getting Started',
      fileUrl: 'https://docs.example.com/getting-started.pdf',
      fileType: DocumentType.PDF,
      fileSize: 2_500_000,
      content: `Getting Started with TechCorp Support Platform

Welcome to TechCorp Solutions! This guide will help you get started with our customer support platform.

1. Account Setup
   - Create your account
   - Verify your email address
   - Set up your company profile

2. Configure Your Workspace
   - Set business hours
   - Configure auto-assignment rules
   - Customize your chat widget

3. Add Team Members
   - Invite agents
   - Set roles and permissions
   - Create agent groups

4. Set Up AI Agents
   - Choose your AI provider
   - Configure agent personality
   - Upload knowledge base documents

5. Integrate Channels
   - Website chat widget
   - WhatsApp Business API
   - Telegram bot
   - Facebook Messenger
   - Email integration

6. Go Live
   - Test your setup
   - Launch to customers
   - Monitor performance`,
      status: DocumentStatus.EMBEDDED,
      chunkCount: 6,
      metadata: {
        category: 'onboarding',
        version: '2.1',
        author: 'product-team',
      },
      knowledgeBaseId: knowledgeBase.id,
    },
  });
  console.log(`✅ Created PRODUCT DOCUMENT: ${productDoc.title}`);

  // Create troubleshooting guide
  const troubleshootingDoc = await prisma.document.create({
    data: {
      title: 'Common Troubleshooting Guide',
      fileUrl: null,
      fileType: DocumentType.TXT,
      content: `Common Issues and Solutions:

1. Chat Widget Not Loading
   - Clear browser cache and cookies
   - Disable ad blockers temporarily
   - Check if the widget code snippet is correctly installed
   - Verify firewall settings allow connections to our servers

2. AI Agent Not Responding
   - Check API key configuration in settings
   - Verify AI provider account has sufficient credits
   - Check network connectivity to AI provider endpoints
   - Review agent configuration for errors

3. Slow Response Times
   - Check your internet connection
   - Reduce the number of active conversations per agent
   - Optimize knowledge base document sizes
   - Consider upgrading to a higher performance plan

4. File Upload Failures
   - Ensure file size is under 10MB limit
   - Check supported file formats (PDF, DOCX, TXT, CSV, PNG, JPG)
   - Verify S3 bucket permissions
   - Check available storage quota`,
      status: DocumentStatus.PROCESSING,
      chunkCount: 0,
      metadata: {
        category: 'troubleshooting',
        priority: 'medium',
      },
      knowledgeBaseId: knowledgeBase.id,
    },
  });
  console.log(`✅ Created TROUBLESHOOTING DOCUMENT: ${troubleshootingDoc.title}`);

  // Create subscription plans
  const subscriptionPlans = [
    {
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,
      provider: PaymentProvider.STRIPE,
      seats: 5,
      aiTokenLimit: 10000,
      storageLimit: 1024,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      features: {
        maxAgents: 1,
        maxConversations: 100,
        analytics: false,
        customBranding: false,
        apiAccess: false,
        prioritySupport: false,
        slaResponseTime: '24h',
      },
      companyId: company.id,
    },
    {
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      provider: PaymentProvider.STRIPE,
      seats: 15,
      aiTokenLimit: 100000,
      storageLimit: 10240,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      features: {
        maxAgents: 5,
        maxConversations: 500,
        analytics: true,
        customBranding: true,
        apiAccess: true,
        prioritySupport: false,
        slaResponseTime: '4h',
      },
      companyId: company.id,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscription.create({ data: plan });
  }
  console.log(`✅ Created default SUBSCRIPTION PLANS`);

  // Create API key for the company
  await prisma.apiKey.create({
    data: {
      key: `sk_live_${uuidv4().replace(/-/g, '')}`,
      name: 'Production API Key',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      companyId: company.id,
    },
  });

  await prisma.apiKey.create({
    data: {
      key: `sk_test_${uuidv4().replace(/-/g, '')}`,
      name: 'Test API Key',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      companyId: company.id,
    },
  });
  console.log(`✅ Created API KEYS`);

  // Create notification for admin
  await prisma.notification.create({
    data: {
      type: 'SYSTEM',
      title: 'Welcome to AI Customer Support Platform',
      body: 'Your account has been created successfully. Start by configuring your company settings and creating your first AI agent.',
      data: {
        actionUrl: '/settings',
        actionLabel: 'Get Started',
      },
      userId: adminUser.id,
    },
  });
  console.log(`✅ Created initial NOTIFICATION`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Seeded data summary:');
  console.log(`   - 1 SUPER_ADMIN (admin@chatbot.com / Admin123!)`);
  console.log(`   - 1 COMPANY (TechCorp Solutions)`);
  console.log(`   - 1 BUSINESS_OWNER (owner@techcorp.com)`);
  console.log(`   - 2 SUPPORT_AGENTS`);
  console.log(`   - 2 CUSTOMERS`);
  console.log(`   - 1 AI AGENT (Customer Support Assistant)`);
  console.log(`   - 1 KNOWLEDGE_BASE`);
  console.log(`   - 3 DOCUMENTS (FAQ, Product Guide, Troubleshooting Guide)`);
  console.log(`   - 2 SUBSCRIPTION PLANS (Starter, Professional)`);
  console.log(`   - 2 API KEYS`);
  console.log(`   - 1 NOTIFICATION`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
