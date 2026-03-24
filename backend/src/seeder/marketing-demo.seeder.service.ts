import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus, ProjectStatus, ProjectPriority, TaskType, TaskPriority, StatusCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';
import {
  DEFAULT_WORKFLOW,
  DEFAULT_STATUS_TRANSITIONS,
} from '../constants/defaultWorkflow';

const MARKETING_STATUSES = [
  { name: 'Prospect', color: '#6366f1', category: 'TODO' as const, position: 1, isDefault: true },
  { name: 'MQL', color: '#f59e0b', category: 'IN_PROGRESS' as const, position: 2, isDefault: false },
  { name: 'SQL', color: '#8b5cf6', category: 'IN_PROGRESS' as const, position: 3, isDefault: false },
  { name: 'Nurture', color: '#3b82f6', category: 'IN_PROGRESS' as const, position: 4, isDefault: false },
  { name: 'Won', color: '#10b981', category: 'DONE' as const, position: 5, isDefault: false },
  { name: 'Lost', color: '#ef4444', category: 'DONE' as const, position: 6, isDefault: false },
];

const MARKETING_STATUS_TRANSITIONS = [
  { from: 'Prospect', to: 'MQL' },
  { from: 'MQL', to: 'SQL' },
  { from: 'MQL', to: 'Nurture' },
  { from: 'SQL', to: 'Won' },
  { from: 'SQL', to: 'Lost' },
  { from: 'SQL', to: 'Nurture' },
  { from: 'Nurture', to: 'MQL' },
];

@Injectable()
export class MarketingDemoSeederService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    console.log('🌱 Starting marketing demo seeding...');

    // 1. Create demo user
    const user = await this.seedDemoUser();
    console.log('✅ Demo user seeded');

    // 2. Create organization
    const organization = await this.seedOrganization(user);
    console.log('✅ Organization seeded');

    // 3. Create workspace
    const workspace = await this.seedWorkspace(organization, user);
    console.log('✅ Workspace seeded');

    // 4. Create projects with statuses, tasks, and sprints
    await this.seedProjects(workspace, organization, user);
    console.log('✅ Projects, tasks, and sprints seeded');

    console.log('🎉 Marketing demo seeding completed successfully!');
  }

  private async seedDemoUser() {
    const email = 'demo@convertivio.io';

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`   ✓ Demo user already exists: ${email}`);
      return existing;
    }

    const hashedPassword = await bcrypt.hash('Demo1234!', 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          username: 'alexrivera',
          firstName: 'Alex',
          lastName: 'Rivera',
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          password: hashedPassword,
          emailVerified: true,
          bio: 'Growth marketer driving pipeline and revenue at Convertivio',
          timezone: 'America/New_York',
          language: 'en',
          preferences: {
            theme: 'light',
            notifications: { email: true, push: true, desktop: true },
            dashboard: { showCompletedTasks: false, defaultView: 'list' },
          },
        },
      });
      console.log(`   ✓ Created demo user: ${user.email}`);
      return user;
    } catch (_error) {
      console.log(`   ⚠ Could not create demo user, trying to find existing...`);
      const found = await this.prisma.user.findUnique({ where: { email } });
      if (!found) throw _error;
      return found;
    }
  }

  private async seedOrganization(user: any) {
    const slug = 'convertivio-marketing';

    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      console.log(`   ✓ Organization already exists: ${existing.name}`);
      // Ensure owner membership exists
      await this.ensureOrgMember(existing.id, user.id, Role.OWNER);
      return existing;
    }

    try {
      const organization = await this.prisma.organization.create({
        data: {
          name: 'Convertivio Marketing',
          slug,
          description: 'B2B SaaS growth and demand generation hub',
          website: 'https://convertivio.io',
          ownerId: user.id,
          createdBy: user.id,
          updatedBy: user.id,
          settings: {
            allowPublicSignup: false,
            defaultUserRole: 'MEMBER',
            requireEmailVerification: true,
            enableTimeTracking: false,
            enableAutomation: true,
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            workingHours: { start: '09:00', end: '18:00' },
            timezone: 'America/New_York',
          },
          workflows: {
            create: {
              name: DEFAULT_WORKFLOW.name,
              description: DEFAULT_WORKFLOW.description,
              isDefault: true,
              createdBy: user.id,
              updatedBy: user.id,
              statuses: {
                create: MARKETING_STATUSES.map((s) => ({
                  name: s.name,
                  color: s.color,
                  category: s.category,
                  position: s.position,
                  isDefault: s.isDefault,
                  createdBy: user.id,
                  updatedBy: user.id,
                })),
              },
            },
          },
        },
        include: {
          workflows: {
            where: { isDefault: true },
            include: { statuses: { orderBy: { position: 'asc' } } },
          },
        },
      });

      // Create status transitions
      const workflow = organization.workflows[0];
      if (workflow?.statuses?.length) {
        await this.createStatusTransitions(workflow.id, workflow.statuses as any[], user.id);
      }

      await this.ensureOrgMember(organization.id, user.id, Role.OWNER);

      console.log(`   ✓ Created organization: ${organization.name}`);
      return organization;
    } catch (_error) {
      console.error(`   ❌ Error creating organization: ${_error.message}`);
      throw _error;
    }
  }

  private async ensureOrgMember(organizationId: string, userId: string, role: Role) {
    const existing = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!existing) {
      await this.prisma.organizationMember.create({ data: { userId, organizationId, role } });
    }
  }

  private async createStatusTransitions(workflowId: string, statuses: any[], userId: string) {
    const statusMap = new Map(statuses.map((s) => [s.name, s.id]));
    const transitions = MARKETING_STATUS_TRANSITIONS.filter(
      (t) => statusMap.has(t.from) && statusMap.has(t.to),
    ).map((t) => ({
      name: `${t.from} → ${t.to}`,
      workflowId,
      fromStatusId: statusMap.get(t.from),
      toStatusId: statusMap.get(t.to),
      createdBy: userId,
      updatedBy: userId,
    }));

    if (transitions.length > 0) {
      await this.prisma.statusTransition.createMany({ data: transitions, skipDuplicates: true });
    }
  }

  private async seedWorkspace(organization: any, user: any) {
    const slug = 'growth-team';

    const existing = await this.prisma.workspace.findFirst({
      where: { slug, organizationId: organization.id },
    });
    if (existing) {
      console.log(`   ✓ Workspace already exists: ${existing.name}`);
      await this.ensureWorkspaceMember(existing.id, user.id, Role.OWNER);
      return existing;
    }

    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          name: 'Growth Team',
          slug,
          description: 'Pipeline generation, nurture, and deal acceleration workspace',
          color: '#10b981',
          organizationId: organization.id,
          createdBy: user.id,
          updatedBy: user.id,
          settings: {
            allowExternalGuests: false,
            defaultProjectVisibility: 'private',
            enableTimeTracking: false,
            enableGitIntegration: false,
            workflowType: 'kanban',
            sprintDuration: 7,
          },
        },
      });

      await this.ensureWorkspaceMember(workspace.id, user.id, Role.OWNER);

      console.log(`   ✓ Created workspace: ${workspace.name}`);
      return workspace;
    } catch (_error) {
      console.error(`   ❌ Error creating workspace: ${_error.message}`);
      throw _error;
    }
  }

  private async ensureWorkspaceMember(workspaceId: string, userId: string, role: Role) {
    const existing = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!existing) {
      await this.prisma.workspaceMember.create({ data: { userId, workspaceId, role } });
    }
  }

  private async seedProjects(workspace: any, organization: any, user: any) {
    // Get the default workflow for the organization
    const defaultWorkflow = await this.prisma.workflow.findFirst({
      where: { organizationId: organization.id, isDefault: true },
      include: { statuses: { orderBy: { position: 'asc' } } },
    });

    if (!defaultWorkflow) {
      throw new Error('No default workflow found for marketing demo organization');
    }

    const projectsData = [
      {
        name: 'Q1 Lead Generation',
        description: 'Cold outreach and inbound capture to fill top-of-funnel with qualified SaaS leads.',
        color: '#6366f1',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        startDate: new Date('2026-01-06'),
        endDate: new Date('2026-03-28'),
        leads: this.getLeadsForProject('q1-lead-generation'),
        sprints: ['Week 1 Outreach', 'Week 2 Follow-up', 'Week 3 Close'],
      },
      {
        name: 'Product Launch April',
        description: 'GTM campaign for April product launch targeting mid-market SaaS companies.',
        color: '#f59e0b',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        startDate: new Date('2026-03-16'),
        endDate: new Date('2026-04-30'),
        leads: this.getLeadsForProject('product-launch-april'),
        sprints: ['Week 1 Outreach', 'Week 2 Follow-up', 'Week 3 Close'],
      },
      {
        name: 'Nurture Reactivation',
        description: 'Re-engage cold and churned leads with personalised sequences and case studies.',
        color: '#10b981',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-04-30'),
        leads: this.getLeadsForProject('nurture-reactivation'),
        sprints: ['Week 1 Outreach', 'Week 2 Follow-up', 'Week 3 Close'],
      },
    ];

    for (const projectData of projectsData) {
      const { leads, sprints: sprintNames, ...projectFields } = projectData;
      const projectSlug = slugify(projectFields.name, { lower: true, strict: true });

      // Skip if project already exists
      const existingProject = await this.prisma.project.findFirst({
        where: { workspaceId: workspace.id, slug: projectSlug },
      });
      if (existingProject) {
        console.log(`   ✓ Project already exists: ${projectFields.name}`);
        continue;
      }

      try {
        // Create project with a default sprint
        const project = await this.prisma.project.create({
          data: {
            ...projectFields,
            workspaceId: workspace.id,
            workflowId: defaultWorkflow.id,
            slug: projectSlug,
            createdBy: user.id,
            updatedBy: user.id,
            sprints: {
              create: {
                name: 'Week 1 Outreach',
                goal: 'Initial outreach to all prospects in this campaign',
                status: 'ACTIVE',
                isDefault: true,
                createdBy: user.id,
                updatedBy: user.id,
              },
            },
          },
        });

        // Add user as project owner
        await this.prisma.projectMember.create({
          data: { userId: user.id, projectId: project.id, role: Role.OWNER },
        });

        // Create the remaining two sprints
        const remainingSprintNames = sprintNames.slice(1);
        for (const sprintName of remainingSprintNames) {
          await this.prisma.sprint.create({
            data: {
              name: sprintName,
              goal: sprintName === 'Week 2 Follow-up'
                ? 'Follow up with engaged prospects and move SQLs forward'
                : 'Close deals and move pipeline to Won or Nurture',
              status: 'PLANNING',
              isDefault: false,
              projectId: project.id,
              createdBy: user.id,
              updatedBy: user.id,
            },
          });
        }

        // Get the default sprint for task assignment
        const defaultSprint = await this.prisma.sprint.findFirst({
          where: { projectId: project.id, isDefault: true },
        });

        // Seed tasks (leads) for the project
        await this.seedLeadsForProject(project, defaultSprint, defaultWorkflow.statuses as any[], user, leads);

        console.log(`   ✓ Created project: ${project.name}`);
      } catch (_error) {
        console.error(`   ⚠ Error creating project ${projectFields.name}: ${_error.message}`);
      }
    }
  }

  private async seedLeadsForProject(
    project: any,
    defaultSprint: any,
    statuses: any[],
    user: any,
    leads: any[],
  ) {
    const statusMap = new Map(statuses.map((s) => [s.name, s]));
    let taskNumber = 1;

    for (const lead of leads) {
      const { statusName, ...taskFields } = lead;
      const status = statusMap.get(statusName) || statuses[0];

      try {
        await this.prisma.task.create({
          data: {
            ...taskFields,
            projectId: project.id,
            sprintId: defaultSprint?.id,
            taskNumber,
            slug: slugify(`${project.slug}-${taskNumber}`, { lower: true, strict: true }),
            statusId: status.id,
            createdBy: user.id,
            updatedBy: user.id,
            completedAt: status.category === StatusCategory.DONE ? new Date() : null,
            reporters: { connect: [{ id: user.id }] },
            assignees: { connect: [{ id: user.id }] },
          },
        });
        taskNumber++;
      } catch (_error) {
        console.error(`   ⚠ Error creating lead task ${taskFields.title}: ${_error.message}`);
      }
    }

    console.log(`   ✓ Created ${taskNumber - 1} leads for ${project.name}`);
  }

  private getLeadsForProject(projectSlug: string): any[] {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    if (projectSlug === 'q1-lead-generation') {
      return [
        {
          title: 'Jordan Hayes — CloudPulse',
          description: 'VP Marketing at CloudPulse. Downloaded our ROI calculator. High intent signal.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 0,
          startDate: new Date(now.getTime() - 14 * oneDay),
          dueDate: new Date(now.getTime() - 7 * oneDay),
          statusName: 'Won',
        },
        {
          title: 'Priya Nair — Scalify',
          description: 'Head of Growth at Scalify. Engaged with cold email sequence, requested demo.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 30,
          startDate: new Date(now.getTime() - 10 * oneDay),
          dueDate: new Date(now.getTime() + 3 * oneDay),
          statusName: 'SQL',
        },
        {
          title: 'Marcus Chen — Loopify',
          description: 'Director of Demand Gen at Loopify. Visited pricing page 3 times this week.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 2,
          originalEstimate: 45,
          remainingEstimate: 45,
          startDate: new Date(now.getTime() - 5 * oneDay),
          dueDate: new Date(now.getTime() + 7 * oneDay),
          statusName: 'MQL',
        },
        {
          title: 'Sofia Andrade — Revtrack',
          description: 'CMO at Revtrack. Responded to LinkedIn outreach. Booked discovery call.',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          storyPoints: 2,
          originalEstimate: 45,
          remainingEstimate: 20,
          startDate: new Date(now.getTime() - 8 * oneDay),
          dueDate: new Date(now.getTime() + 4 * oneDay),
          statusName: 'SQL',
        },
        {
          title: 'Daniel Park — Funnelr',
          description: 'Growth Lead at Funnelr. Opened cold email but no reply yet.',
          type: TaskType.TASK,
          priority: TaskPriority.LOW,
          storyPoints: 1,
          originalEstimate: 30,
          remainingEstimate: 30,
          startDate: new Date(now.getTime() - 3 * oneDay),
          dueDate: new Date(now.getTime() + 10 * oneDay),
          statusName: 'Prospect',
        },
        {
          title: 'Amara Osei — Pipelinehub',
          description: 'VP Revenue at Pipelinehub. Cold outreach — no engagement yet.',
          type: TaskType.TASK,
          priority: TaskPriority.LOW,
          storyPoints: 1,
          originalEstimate: 30,
          remainingEstimate: 30,
          startDate: new Date(now.getTime()),
          dueDate: new Date(now.getTime() + 14 * oneDay),
          statusName: 'Prospect',
        },
        {
          title: 'Ryan Kowalski — Dataform',
          description: 'Head of Marketing at Dataform. Demo completed, proposal sent. Awaiting sign-off.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 5,
          originalEstimate: 120,
          remainingEstimate: 0,
          startDate: new Date(now.getTime() - 20 * oneDay),
          dueDate: new Date(now.getTime() - 5 * oneDay),
          statusName: 'Won',
        },
        {
          title: 'Nadia Petrov — Clickstream',
          description: 'Marketing Ops Manager at Clickstream. Requested case study, in nurture sequence.',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          storyPoints: 2,
          originalEstimate: 45,
          remainingEstimate: 45,
          startDate: new Date(now.getTime() - 6 * oneDay),
          dueDate: new Date(now.getTime() + 12 * oneDay),
          statusName: 'Nurture',
        },
        {
          title: 'Ben Okafor — Growthstack',
          description: 'CEO at Growthstack (50-person startup). Inbound inquiry from website form.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 30,
          startDate: new Date(now.getTime() - 2 * oneDay),
          dueDate: new Date(now.getTime() + 5 * oneDay),
          statusName: 'MQL',
        },
        {
          title: 'Laura Simmons — Metricly',
          description: 'Head of Acquisition at Metricly. Budget confirmed, contract in legal review.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 5,
          originalEstimate: 90,
          remainingEstimate: 0,
          startDate: new Date(now.getTime() - 25 * oneDay),
          dueDate: new Date(now.getTime() - 10 * oneDay),
          statusName: 'Won',
        },
      ];
    }

    if (projectSlug === 'product-launch-april') {
      return [
        {
          title: 'Tom Fitzgerald — Launchbase',
          description: 'VP Product Marketing at Launchbase. Interested in early access for April launch.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 20,
          startDate: new Date(now.getTime() - 7 * oneDay),
          dueDate: new Date(now.getTime() + 7 * oneDay),
          statusName: 'SQL',
        },
        {
          title: 'Mei Lin — Orbitsales',
          description: 'Head of Growth at Orbitsales. Attended webinar, booked follow-up call.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 30,
          startDate: new Date(now.getTime() - 5 * oneDay),
          dueDate: new Date(now.getTime() + 9 * oneDay),
          statusName: 'MQL',
        },
        {
          title: 'Carlos Rivera — Saasmetric',
          description: 'CMO at Saasmetric. Qualified via outbound. Deal size $24k ARR.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 5,
          originalEstimate: 120,
          remainingEstimate: 0,
          startDate: new Date(now.getTime() - 18 * oneDay),
          dueDate: new Date(now.getTime() - 4 * oneDay),
          statusName: 'Won',
        },
        {
          title: 'Aisha Mohammed — Converty',
          description: 'Director of Marketing at Converty. Cold outreach — opened email, clicked link.',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          storyPoints: 2,
          originalEstimate: 45,
          remainingEstimate: 45,
          startDate: new Date(now.getTime() - 3 * oneDay),
          dueDate: new Date(now.getTime() + 11 * oneDay),
          statusName: 'Prospect',
        },
        {
          title: 'Greg Hoffman — Pipeflow',
          description: 'Growth Advisor at Pipeflow. Referred by existing customer. High priority.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 10,
          startDate: new Date(now.getTime() - 9 * oneDay),
          dueDate: new Date(now.getTime() + 2 * oneDay),
          statusName: 'SQL',
        },
        {
          title: 'Yuki Tanaka — Boostly',
          description: 'Marketing Director at Boostly. Re-engaged after 3 months dark.',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          storyPoints: 2,
          originalEstimate: 45,
          remainingEstimate: 45,
          startDate: new Date(now.getTime() - 1 * oneDay),
          dueDate: new Date(now.getTime() + 13 * oneDay),
          statusName: 'Nurture',
        },
        {
          title: 'Isabel Costa — Segmentio',
          description: 'VP Marketing at Segmentio. Passed to Lost — no budget this quarter.',
          type: TaskType.TASK,
          priority: TaskPriority.LOW,
          storyPoints: 1,
          originalEstimate: 30,
          remainingEstimate: 0,
          startDate: new Date(now.getTime() - 15 * oneDay),
          dueDate: new Date(now.getTime() - 8 * oneDay),
          statusName: 'Lost',
        },
        {
          title: 'Nathan Brooks — Flowscore',
          description: 'Head of Revenue Ops at Flowscore. Inbound from G2 listing.',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          storyPoints: 2,
          originalEstimate: 45,
          remainingEstimate: 30,
          startDate: new Date(now.getTime() - 4 * oneDay),
          dueDate: new Date(now.getTime() + 8 * oneDay),
          statusName: 'MQL',
        },
        {
          title: 'Fatima Al-Rashid — Triggerspot',
          description: 'Chief Marketing Officer at Triggerspot. Discovery call scheduled.',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          storyPoints: 3,
          originalEstimate: 60,
          remainingEstimate: 40,
          startDate: new Date(now.getTime() - 6 * oneDay),
          dueDate: new Date(now.getTime() + 6 * oneDay),
          statusName: 'MQL',
        },
      ];
    }

    // nurture-reactivation
    return [
      {
        title: 'Jake Morrison — Retentiv',
        description: 'VP Marketing at Retentiv. Went dark 90 days ago after demo. Re-engaging with case study.',
        type: TaskType.TASK,
        priority: TaskPriority.HIGH,
        storyPoints: 3,
        originalEstimate: 60,
        remainingEstimate: 30,
        startDate: new Date(now.getTime() - 6 * oneDay),
        dueDate: new Date(now.getTime() + 8 * oneDay),
        statusName: 'Nurture',
      },
      {
        title: 'Simone Duval — Churnzap',
        description: 'Head of Growth at Churnzap. Churned customer 6 months ago. New budget cycle.',
        type: TaskType.TASK,
        priority: TaskPriority.HIGH,
        storyPoints: 3,
        originalEstimate: 60,
        remainingEstimate: 20,
        startDate: new Date(now.getTime() - 8 * oneDay),
        dueDate: new Date(now.getTime() + 4 * oneDay),
        statusName: 'MQL',
      },
      {
        title: 'Kwame Asante — Leadlayer',
        description: 'CMO at Leadlayer. Lost deal 4 months ago on price. Competitor may be struggling.',
        type: TaskType.TASK,
        priority: TaskPriority.MEDIUM,
        storyPoints: 2,
        originalEstimate: 45,
        remainingEstimate: 45,
        startDate: new Date(now.getTime() - 2 * oneDay),
        dueDate: new Date(now.getTime() + 12 * oneDay),
        statusName: 'Prospect',
      },
      {
        title: 'Hana Watanabe — Clickpath',
        description: 'Director of Demand Gen at Clickpath. Re-engaged after LinkedIn touchpoint.',
        type: TaskType.TASK,
        priority: TaskPriority.HIGH,
        storyPoints: 3,
        originalEstimate: 60,
        remainingEstimate: 15,
        startDate: new Date(now.getTime() - 10 * oneDay),
        dueDate: new Date(now.getTime() + 3 * oneDay),
        statusName: 'SQL',
      },
      {
        title: 'Oliver Grant — Fitsales',
        description: 'Growth Lead at Fitsales. Trial expired without converting. Nurture sequence started.',
        type: TaskType.TASK,
        priority: TaskPriority.MEDIUM,
        storyPoints: 2,
        originalEstimate: 45,
        remainingEstimate: 45,
        startDate: new Date(now.getTime() - 4 * oneDay),
        dueDate: new Date(now.getTime() + 10 * oneDay),
        statusName: 'Nurture',
      },
      {
        title: 'Zeynep Kaya — Bouncerate',
        description: 'VP of Marketing at Bouncerate. Reactivated via email — booked a call.',
        type: TaskType.TASK,
        priority: TaskPriority.HIGH,
        storyPoints: 5,
        originalEstimate: 90,
        remainingEstimate: 0,
        startDate: new Date(now.getTime() - 20 * oneDay),
        dueDate: new Date(now.getTime() - 6 * oneDay),
        statusName: 'Won',
      },
      {
        title: 'Elijah Turner — Prospectly',
        description: 'Head of Marketing at Prospectly. Unsubscribed from nurture. Passing to Lost.',
        type: TaskType.TASK,
        priority: TaskPriority.LOW,
        storyPoints: 1,
        originalEstimate: 30,
        remainingEstimate: 0,
        startDate: new Date(now.getTime() - 16 * oneDay),
        dueDate: new Date(now.getTime() - 9 * oneDay),
        statusName: 'Lost',
      },
      {
        title: 'Naomi Clarke — Engagebot',
        description: 'Chief Marketing Officer at Engagebot. Reconnected via referral. Hot lead.',
        type: TaskType.TASK,
        priority: TaskPriority.HIGH,
        storyPoints: 3,
        originalEstimate: 60,
        remainingEstimate: 25,
        startDate: new Date(now.getTime() - 5 * oneDay),
        dueDate: new Date(now.getTime() + 7 * oneDay),
        statusName: 'SQL',
      },
    ];
  }
}
