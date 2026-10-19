-- CreateEnum
CREATE TYPE "OperatingMode" AS ENUM ('ERP_CONNECTED', 'STANDALONE', 'UPGRADING');

-- CreateEnum
CREATE TYPE "UserKind" AS ENUM ('AGENCY', 'CLIENT');

-- CreateEnum
CREATE TYPE "AgencyRole" AS ENUM ('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS');

-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('OWNER', 'MANAGER', 'BILLING');

-- CreateEnum
CREATE TYPE "DataSourceType" AS ENUM ('ERP', 'CSV', 'MANUAL', 'WEBSITE_FORM', 'WHATSAPP_OPTIN');

-- CreateEnum
CREATE TYPE "DataSourceStatus" AS ENUM ('CONNECTED', 'SYNCING', 'STALE', 'FAILED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ConsentChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('MARKETING', 'TRANSACTIONAL', 'AUTHENTICATION', 'SERVICE');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('OPT_IN', 'OPT_OUT', 'PENDING', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CSVImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "SegmentMode" AS ENUM ('BOTH', 'ERP_ONLY', 'STANDALONE_ONLY');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'REPLIED', 'FAILED', 'UNDELIVERED', 'OPT_OUT');

-- CreateEnum
CREATE TYPE "ErasureStatus" AS ENUM ('REQUESTED', 'IN_REVIEW', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'KILLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "AutomationMode" AS ENUM ('ERP_ONLY', 'STANDALONE_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('ENTERED', 'MESSAGED', 'EXITED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "PortalTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PortalTicketKind" AS ENUM ('SUPPORT', 'BUG', 'BILLING', 'ESCALATION');

-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('MONTHLY_PDF', 'WEEKLY_SUMMARY', 'QBR_DECK');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "ReportChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'PORTAL');

-- CreateEnum
CREATE TYPE "ContentChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'INSTAGRAM', 'FACEBOOK', 'GOOGLE_BUSINESS', 'PRINT', 'IN_STORE');

-- CreateEnum
CREATE TYPE "ContentCardStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'APPROVED', 'SCHEDULED', 'LIVE', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('INITIATED', 'MATCHING', 'AWAITING_REVIEW', 'BACKFILLING', 'COMPLETED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('MATCHED_PHONE', 'MATCHED_EMAIL', 'MATCHED_MANUAL', 'UNMATCHED', 'AMBIGUOUS');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JourneyRunStatus" AS ENUM ('ENTERED', 'RUNNING', 'MESSAGED', 'COMPLETED', 'EXITED', 'FAILED');

-- CreateEnum
CREATE TYPE "JourneyNodeType" AS ENUM ('TRIGGER', 'WAIT', 'CONDITION', 'SEND', 'SPLIT', 'END');

-- CreateEnum
CREATE TYPE "ContentNotificationKind" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_REMINDER', 'REJECTION_NOTICE', 'APPROVAL_CONFIRMED');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('LOGO', 'COLOR_PALETTE', 'FONT', 'IMAGE', 'VIDEO', 'TEMPLATE', 'SIGNAGE', 'VEHICLE_WRAP', 'UNIFORM', 'PACKAGING', 'FLYER', 'LOYALTY_CARD', 'PRICE_LIST', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetUsageRights" AS ENUM ('PERPETUAL', 'TIME_LIMITED', 'LOCATION_LIMITED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BrandKitStatus" AS ENUM ('DRAFT', 'CLIENT_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewPlatform" AS ENUM ('GOOGLE_BUSINESS', 'FACEBOOK', 'TRIPADVISOR', 'YELP', 'TRUSTPILOT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReviewTopic" AS ENUM ('SERVICE_QUALITY', 'TIMELINESS', 'PRICE', 'STAFF', 'CLEANLINESS', 'LOCATION', 'PACKAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewResponseStatus" AS ENUM ('PENDING', 'DRAFTED', 'APPROVED', 'POSTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DirectoryCountry" AS ENUM ('AE', 'SA', 'KW', 'QA', 'BH', 'OM');

-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('META', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'OTHER');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdCreativeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttributionSource" AS ENUM ('PROMO_CODE', 'UTM', 'CALL_TRACKING', 'ERP_ORDER_MATCH', 'MANUAL');

-- CreateEnum
CREATE TYPE "AttributionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "ProspectCategory" AS ENUM ('HOTEL', 'GYM', 'SALON', 'AIRBNB', 'RESTAURANT', 'OFFICE', 'HOSPITAL', 'SCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('NEW', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'CALL', 'LINKEDIN', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "OutreachDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'RENEWED');

-- CreateEnum
CREATE TYPE "BillingPackageTier" AS ENUM ('LAUNCH', 'GROWTH', 'DOMINATE', 'ADD_ON');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SENT', 'PAID', 'OVERDUE', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'TELR', 'PAYTABS', 'HYPERPAY', 'MANUAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskLinkType" AS ENUM ('CAMPAIGN', 'CONTENT_CARD', 'CLIENT', 'PROSPECT', 'CONTRACT', 'AD_CAMPAIGN', 'GENERIC');

-- CreateEnum
CREATE TYPE "SopCategory" AS ENUM ('ONBOARDING', 'CAMPAIGN_LAUNCH', 'CONTENT_REVIEW', 'COMPLIANCE', 'BILLING', 'MIGRATION', 'REVIEW_MANAGEMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "QbrStatus" AS ENUM ('DRAFT', 'READY', 'SHARED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportScheduleKind" AS ENUM ('WEEKLY_SUMMARY', 'MONTHLY_REPORT', 'QUARTERLY_QBR');

-- CreateEnum
CREATE TYPE "ReportScheduleChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'PORTAL');

-- CreateEnum
CREATE TYPE "PitchOutcome" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "ConversionEventType" AS ENUM ('PITCH_SENT', 'DEMO_BOOKED', 'PRICE_QUOTED', 'CONTRACT_DISCUSSED', 'CONVERTED', 'DECLINED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "WebsitePageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "WebsiteLeadConsent" AS ENUM ('PENDING', 'OPT_IN', 'OPT_OUT');

-- CreateEnum
CREATE TYPE "PushSubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PushNotificationKind" AS ENUM ('APPROVAL_READY', 'APPROVAL_DECIDED', 'REVIEW_ESCALATION', 'REPORT_READY', 'INVOICE_SENT', 'INVOICE_PAID', 'MIGRATION_READY', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "PushNotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "OfflineActionStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SignupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROVISIONED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "OnboardingTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ResellerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DataRegion" AS ENUM ('UAE', 'KSA');

-- CreateEnum
CREATE TYPE "DataExportStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MarketplaceCategory" AS ENUM ('CAMPAIGN', 'JOURNEY', 'WEBSITE_PAGE', 'CONTENT_CARD', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "MarketplaceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('UPLOADED', 'MAPPING', 'IMPORTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR', 'SKIPPED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "mode" "OperatingMode" NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "churnRisk" BOOLEAN NOT NULL DEFAULT false,
    "upgradeReady" BOOLEAN NOT NULL DEFAULT false,
    "greenTickStatus" TEXT NOT NULL DEFAULT 'NOT_APPLIED',
    "resellerId" TEXT,
    "region" "DataRegion" NOT NULL DEFAULT 'UAE',
    "privacyPolicyAcceptedAt" TIMESTAMP(3),
    "dpaAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "kind" "UserKind" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "agencyRole" "AgencyRole",
    "clientRole" "ClientRole",
    "tenantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "zone" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantHealthScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "components" JSONB NOT NULL,

    CONSTRAINT "TenantHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgradeReadiness" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "criteria" JSONB NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "pitchedAt" TIMESTAMP(3),
    "pitchedBy" TEXT,
    "convertedAt" TIMESTAMP(3),
    "notConvertedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpgradeReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "DataSourceType" NOT NULL,
    "status" "DataSourceStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" "ConsentChannel" NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL DEFAULT 'MARKETING',
    "status" "ConsentStatus" NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoNotContact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoNotContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentRef" TEXT,
    "hash" TEXT,
    "prevHash" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndCustomer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "zone" TEXT,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "consentVerified" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "externalId" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CSVImport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rowsTotal" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "rowsFlagged" INTEGER NOT NULL DEFAULT 0,
    "rowsFailed" INTEGER NOT NULL DEFAULT 0,
    "status" "CSVImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorReport" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CSVImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "mode" "SegmentMode" NOT NULL DEFAULT 'BOTH',
    "definition" JSONB NOT NULL,
    "isPrebuilt" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "lastRefreshed" TIMESTAMP(3),
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentMembership" (
    "segmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentMembership_pkey" PRIMARY KEY ("segmentId","customerId")
);

-- CreateTable
CREATE TABLE "SegmentSizeSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER NOT NULL,

    CONSTRAINT "SegmentSizeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "language" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "metaId" TEXT,
    "groupId" TEXT,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "arTemplateId" TEXT,
    "enTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "templateId" TEXT NOT NULL,
    "templateGroupId" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "promoCodeId" TEXT,
    "utmId" TEXT,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "optOutCount" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT,
    "customerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "templateId" TEXT,
    "body" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "metaMessageId" TEXT,
    "cost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "costCategory" "TemplateCategory" DEFAULT 'MARKETING',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "consentRef" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT,
    "code" TEXT NOT NULL,
    "discount" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtmParameter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "content" TEXT,
    "fullUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UtmParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppCostRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "WhatsAppCostRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceWindow" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErasureRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" "ErasureStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "auditRef" TEXT,

    CONSTRAINT "ErasureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "basis" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DpaTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentMd" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DpaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsSenderId" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "regulator" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "SmsSenderId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentOptOutEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" "ConsentChannel" NOT NULL,
    "source" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propagatedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentOptOutEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "mode" "AutomationMode" NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "definition" JSONB NOT NULL,
    "templateId" TEXT,
    "segmentId" TEXT,
    "frequencyCapHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'ENTERED',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "exitReason" TEXT,
    "messageId" TEXT,
    "meta" JSONB,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequencyLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "lastSendAt" TIMESTAMP(3) NOT NULL,
    "count24h" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FrequencyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationKillSwitch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "killedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "killedBy" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "AutomationKillSwitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "createdBy" TEXT NOT NULL,
    "kind" "PortalTicketKind" NOT NULL DEFAULT 'SUPPORT',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "PortalTicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalInternalComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorKind" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalInternalComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "upgradePromptDismissedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMessageInbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fromPhone" TEXT,
    "toPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "repliedById" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMessageInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "ReportKind" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "pdfPath" TEXT,
    "generatedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDelivery" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" "ReportChannel" NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "ReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT,
    "copyAr" TEXT,
    "copyEn" TEXT,
    "channel" "ContentChannel" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "status" "ContentCardStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCardVersion" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeNote" TEXT,

    CONSTRAINT "ContentCardVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCardComment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorKind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentCardComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentApprovalLink" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "decision" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentApprovalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GccTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "country" TEXT,
    "channel" "ContentChannel" NOT NULL,
    "briefEn" TEXT NOT NULL,
    "briefAr" TEXT NOT NULL,
    "suggestedCopyEn" TEXT NOT NULL,
    "suggestedCopyAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GccTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromMode" TEXT NOT NULL,
    "toMode" TEXT NOT NULL,
    "status" "MigrationStatus" NOT NULL DEFAULT 'INITIATED',
    "actorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "preSnapshot" JSONB,
    "matchSummary" JSONB,
    "backfillStats" JSONB,
    "error" TEXT,

    CONSTRAINT "MigrationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationMatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lmmsCustomerId" TEXT NOT NULL,
    "erpExternalId" TEXT,
    "status" "MatchStatus" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "status" "JourneyStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "frequencyCapHours" INTEGER NOT NULL DEFAULT 24,
    "definition" JSONB NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyVersion" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeNote" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "JourneyRunStatus" NOT NULL DEFAULT 'ENTERED',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "exitReason" TEXT,
    "currentNodeId" TEXT,
    "meta" JSONB,

    CONSTRAINT "JourneyRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" "JourneyNodeType" NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "meta" JSONB,

    CONSTRAINT "JourneyStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyKillSwitch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "killedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "killedBy" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "JourneyKillSwitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "kind" "ContentNotificationKind" NOT NULL,
    "sentTo" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "meta" JSONB,

    CONSTRAINT "ContentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tagline" TEXT,
    "taglineAr" TEXT,
    "tone" TEXT,
    "toneAr" TEXT,
    "logoVariants" JSONB,
    "colors" JSONB,
    "fonts" JSONB,
    "status" "BrandKitStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandKitId" TEXT,
    "category" "AssetCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileMime" TEXT,
    "fileSizeBytes" INTEGER,
    "fileWidth" INTEGER,
    "fileHeight" INTEGER,
    "tags" JSONB,
    "usageRights" "AssetUsageRights" NOT NULL DEFAULT 'UNKNOWN',
    "usageRightsNotes" TEXT,
    "usageExpiresAt" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "milestones" JSONB NOT NULL,
    "currentStage" TEXT NOT NULL DEFAULT 'KICKOFF',
    "signedOffAt" TIMESTAMP(3),
    "signedOffBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT,
    "platform" "ReviewPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "authorName" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "language" TEXT,
    "sentiment" "ReviewSentiment" NOT NULL DEFAULT 'UNKNOWN',
    "topics" JSONB,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "respondedAt" TIMESTAMP(3),
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewResponse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewResponseStatus" NOT NULL DEFAULT 'PENDING',
    "draftedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "postedExtern" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryListing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "country" "DirectoryCountry" NOT NULL,
    "platformName" TEXT NOT NULL,
    "platformUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GbpInsight" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "searchViews" INTEGER NOT NULL DEFAULT 0,
    "mapViews" INTEGER NOT NULL DEFAULT 0,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "directionReqs" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GbpInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "accountName" TEXT,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "credentials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "objective" TEXT,
    "dailyBudgetCap" DECIMAL(12,2),
    "totalBudget" DECIMAL(12,2),
    "geoPreset" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "promoCodeId" TEXT,
    "utmId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targeting" JSONB,
    "dailyBudget" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCreative" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "copyAr" TEXT,
    "copyEn" TEXT,
    "status" "AdCreativeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSpendSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DECIMAL(12,2) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSpendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source" "AttributionSource" NOT NULL,
    "confidence" "AttributionConfidence" NOT NULL DEFAULT 'ESTIMATED',
    "campaignId" TEXT,
    "adCampaignId" TEXT,
    "promoCodeId" TEXT,
    "utmId" TEXT,
    "messageId" TEXT,
    "customerId" TEXT,
    "orderId" TEXT,
    "revenue" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchKey" TEXT,
    "matchMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessNameAr" TEXT,
    "category" "ProspectCategory" NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "zone" TEXT,
    "country" TEXT NOT NULL,
    "status" "ProspectStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "assignedTo" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "direction" "OutreachDirection" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "outcome" TEXT,
    "templateKey" TEXT,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totalValue" DECIMAL(12,2) NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT,
    "name" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "originatingCampaignId" TEXT,
    "originatingAdCampaignId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPackage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tier" "BillingPackageTier" NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "baseFee" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "includedMessages" INTEGER NOT NULL DEFAULT 0,
    "includedAdSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "includedCampaigns" INTEGER NOT NULL DEFAULT 0,
    "includedLocations" INTEGER NOT NULL DEFAULT 1,
    "overageMessageFee" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "overageAdSpendPct" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,4) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "country" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "pdfData" TEXT,
    "pdfMime" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "externalId" TEXT,
    "paymentUrl" TEXT,
    "failureReason" TEXT,
    "capturedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "label" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "linkType" "TaskLinkType" NOT NULL DEFAULT 'GENERIC',
    "linkId" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "taskId" TEXT,
    "userId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "authorId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mentions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SopEntry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "category" "SopCategory" NOT NULL,
    "steps" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SopEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SopCompletion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "sopKey" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "completedBy" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "SopCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QbrDeck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "QbrStatus" NOT NULL DEFAULT 'DRAFT',
    "metrics" JSONB NOT NULL,
    "highlights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "comparisonData" JSONB,
    "shareToken" TEXT,
    "sharedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QbrDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cohortDate" TIMESTAMP(3) NOT NULL,
    "cohortLabel" TEXT NOT NULL,
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "lapsedCount" INTEGER NOT NULL DEFAULT 0,
    "dormantCount" INTEGER NOT NULL DEFAULT 0,
    "averageOrders" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "averageRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retention30" INTEGER NOT NULL DEFAULT 0,
    "retention60" INTEGER NOT NULL DEFAULT 0,
    "retention90" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "ReportScheduleKind" NOT NULL,
    "channel" "ReportScheduleChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "hourUtc" INTEGER NOT NULL DEFAULT 9,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationPitch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "readinessId" TEXT,
    "score" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "pitchPack" JSONB NOT NULL,
    "outcome" "PitchOutcome" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationPitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pitchId" TEXT,
    "type" "ConversionEventType" NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "meta" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Website" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "status" "WebsiteStatus" NOT NULL DEFAULT 'DRAFT',
    "theme" JSONB,
    "brandKitId" TEXT,
    "seoDefaults" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT,
    "blocks" JSONB NOT NULL,
    "seo" JSONB,
    "status" "WebsitePageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteLead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "pageId" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "zone" TEXT,
    "message" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "promoCode" TEXT,
    "consentStatus" "WebsiteLeadConsent" NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteVisit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "status" "PushSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "kind" "PushNotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "PushNotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "OfflineActionStatus" NOT NULL DEFAULT 'PENDING',
    "syncedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactName" TEXT,
    "businessName" TEXT NOT NULL,
    "businessNameAr" TEXT,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "SignupStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" TEXT,
    "referralSource" TEXT,
    "rejectionReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfServeConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isSelfServe" BOOLEAN NOT NULL DEFAULT true,
    "maxCampaigns" INTEGER NOT NULL DEFAULT 2,
    "maxMessagesMonthly" INTEGER NOT NULL DEFAULT 500,
    "maxLocations" INTEGER NOT NULL DEFAULT 1,
    "allowCustomDomain" BOOLEAN NOT NULL DEFAULT false,
    "billingProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfServeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "OnboardingTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reseller" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "ResellerStatus" NOT NULL DEFAULT 'PENDING',
    "commissionPct" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "apiKey" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reseller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelConfig" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "supportEmail" TEXT,
    "customEmailFrom" TEXT,
    "emailFooter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionConfig" (
    "id" TEXT NOT NULL,
    "region" "DataRegion" NOT NULL,
    "dbUrl" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "backupPolicy" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "DataExportStatus" NOT NULL DEFAULT 'REQUESTED',
    "format" TEXT NOT NULL DEFAULT 'JSON',
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MarketplaceCategory" NOT NULL,
    "status" "MarketplaceStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "authorId" TEXT NOT NULL,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateInstall" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "installedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateInstall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorImportJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "status" "ImportJobStatus" NOT NULL DEFAULT 'UPLOADED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "mappings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorImportRow" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "dependencies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DpaAcceptance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dpaTemplateId" TEXT NOT NULL,
    "acceptedBy" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "signatureData" TEXT,

    CONSTRAINT "DpaAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicy" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicyAcceptance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "privacyPolicyId" TEXT NOT NULL,
    "acceptedBy" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "PrivacyPolicyAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "dataCategories" JSONB NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tenant_country_status_idx" ON "Tenant"("country", "status");

-- CreateIndex
CREATE INDEX "Tenant_resellerId_idx" ON "Tenant"("resellerId");

-- CreateIndex
CREATE INDEX "Tenant_region_idx" ON "Tenant"("region");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_tenantId_kind_idx" ON "User"("tenantId", "kind");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "OtpCode_phone_createdAt_idx" ON "OtpCode"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "Location_tenantId_idx" ON "Location"("tenantId");

-- CreateIndex
CREATE INDEX "TenantHealthScore_tenantId_date_idx" ON "TenantHealthScore"("tenantId", "date");

-- CreateIndex
CREATE INDEX "UpgradeReadiness_tenantId_date_idx" ON "UpgradeReadiness"("tenantId", "date");

-- CreateIndex
CREATE INDEX "UpgradeReadiness_tenantId_score_idx" ON "UpgradeReadiness"("tenantId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeReadiness_tenantId_date_key" ON "UpgradeReadiness"("tenantId", "date");

-- CreateIndex
CREATE INDEX "DataSource_tenantId_type_idx" ON "DataSource"("tenantId", "type");

-- CreateIndex
CREATE INDEX "ConsentRecord_tenantId_customerId_channel_purpose_idx" ON "ConsentRecord"("tenantId", "customerId", "channel", "purpose");

-- CreateIndex
CREATE INDEX "ConsentRecord_tenantId_status_idx" ON "ConsentRecord"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DoNotContact_tenantId_customerId_key" ON "DoNotContact"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_hash_key" ON "AuditLog"("hash");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_timestamp_idx" ON "AuditLog"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_actor_timestamp_idx" ON "AuditLog"("tenantId", "actor", "timestamp");

-- CreateIndex
CREATE INDEX "EndCustomer_tenantId_email_idx" ON "EndCustomer"("tenantId", "email");

-- CreateIndex
CREATE INDEX "EndCustomer_tenantId_needsReview_idx" ON "EndCustomer"("tenantId", "needsReview");

-- CreateIndex
CREATE INDEX "EndCustomer_tenantId_createdAt_idx" ON "EndCustomer"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EndCustomer_tenantId_phone_key" ON "EndCustomer"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "Order_tenantId_customerId_idx" ON "Order"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Order_tenantId_orderDate_idx" ON "Order"("tenantId", "orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_externalId_key" ON "Order"("tenantId", "externalId");

-- CreateIndex
CREATE INDEX "CSVImport_tenantId_status_idx" ON "CSVImport"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Segment_tenantId_mode_idx" ON "Segment"("tenantId", "mode");

-- CreateIndex
CREATE INDEX "Segment_tenantId_isPrebuilt_idx" ON "Segment"("tenantId", "isPrebuilt");

-- CreateIndex
CREATE UNIQUE INDEX "Segment_tenantId_name_key" ON "Segment"("tenantId", "name");

-- CreateIndex
CREATE INDEX "SegmentMembership_tenantId_segmentId_idx" ON "SegmentMembership"("tenantId", "segmentId");

-- CreateIndex
CREATE INDEX "SegmentMembership_tenantId_customerId_idx" ON "SegmentMembership"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "SegmentSizeSnapshot_tenantId_segmentId_date_idx" ON "SegmentSizeSnapshot"("tenantId", "segmentId", "date");

-- CreateIndex
CREATE INDEX "Template_tenantId_status_idx" ON "Template"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Template_tenantId_groupId_idx" ON "Template"("tenantId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_tenantId_name_language_version_key" ON "Template"("tenantId", "name", "language", "version");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateGroup_tenantId_name_key" ON "TemplateGroup"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_status_idx" ON "Campaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_segmentId_idx" ON "Campaign"("tenantId", "segmentId");

-- CreateIndex
CREATE INDEX "Message_tenantId_campaignId_status_idx" ON "Message"("tenantId", "campaignId", "status");

-- CreateIndex
CREATE INDEX "Message_tenantId_customerId_status_idx" ON "Message"("tenantId", "customerId", "status");

-- CreateIndex
CREATE INDEX "Message_tenantId_sentAt_idx" ON "Message"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "Message_tenantId_status_sentAt_idx" ON "Message"("tenantId", "status", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_tenantId_code_key" ON "PromoCode"("tenantId", "code");

-- CreateIndex
CREATE INDEX "UtmParameter_tenantId_campaignId_idx" ON "UtmParameter"("tenantId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppCostRate_country_category_key" ON "WhatsAppCostRate"("country", "category");

-- CreateIndex
CREATE INDEX "ServiceWindow_tenantId_expiresAt_idx" ON "ServiceWindow"("tenantId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceWindow_tenantId_customerId_key" ON "ServiceWindow"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "ErasureRequest_tenantId_status_idx" ON "ErasureRequest"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionPolicy_country_dataType_key" ON "RetentionPolicy"("country", "dataType");

-- CreateIndex
CREATE INDEX "DpaTemplate_tenantId_idx" ON "DpaTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DpaTemplate_tenantId_version_key" ON "DpaTemplate"("tenantId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SmsSenderId_tenantId_country_senderId_key" ON "SmsSenderId"("tenantId", "country", "senderId");

-- CreateIndex
CREATE INDEX "ConsentOptOutEvent_tenantId_customerId_channel_idx" ON "ConsentOptOutEvent"("tenantId", "customerId", "channel");

-- CreateIndex
CREATE INDEX "Automation_tenantId_status_idx" ON "Automation"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Automation_tenantId_slug_key" ON "Automation"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "AutomationRun_tenantId_automationId_customerId_idx" ON "AutomationRun"("tenantId", "automationId", "customerId");

-- CreateIndex
CREATE INDEX "AutomationRun_tenantId_enteredAt_idx" ON "AutomationRun"("tenantId", "enteredAt");

-- CreateIndex
CREATE INDEX "FrequencyLedger_tenantId_lastSendAt_idx" ON "FrequencyLedger"("tenantId", "lastSendAt");

-- CreateIndex
CREATE UNIQUE INDEX "FrequencyLedger_tenantId_customerId_key" ON "FrequencyLedger"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationKillSwitch_tenantId_automationId_key" ON "AutomationKillSwitch"("tenantId", "automationId");

-- CreateIndex
CREATE INDEX "PortalTicket_tenantId_status_idx" ON "PortalTicket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PortalTicket_tenantId_createdAt_idx" ON "PortalTicket"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PortalInternalComment_tenantId_entityType_entityId_idx" ON "PortalInternalComment"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalPreference_userId_key" ON "PortalPreference"("userId");

-- CreateIndex
CREATE INDEX "ClientMessageInbox_tenantId_status_idx" ON "ClientMessageInbox"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ClientMessageInbox_tenantId_customerId_idx" ON "ClientMessageInbox"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "ReportRecord_tenantId_status_idx" ON "ReportRecord"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ReportRecord_tenantId_kind_periodEnd_idx" ON "ReportRecord"("tenantId", "kind", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "ReportRecord_tenantId_kind_periodStart_key" ON "ReportRecord"("tenantId", "kind", "periodStart");

-- CreateIndex
CREATE INDEX "ReportDelivery_tenantId_channel_idx" ON "ReportDelivery"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "ReportDelivery_reportId_idx" ON "ReportDelivery"("reportId");

-- CreateIndex
CREATE INDEX "ContentCard_tenantId_status_idx" ON "ContentCard"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ContentCard_tenantId_scheduledAt_idx" ON "ContentCard"("tenantId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentCard_tenantId_channel_idx" ON "ContentCard"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "ContentCardVersion_tenantId_idx" ON "ContentCardVersion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentCardVersion_cardId_version_key" ON "ContentCardVersion"("cardId", "version");

-- CreateIndex
CREATE INDEX "ContentCardComment_cardId_createdAt_idx" ON "ContentCardComment"("cardId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentCardComment_tenantId_idx" ON "ContentCardComment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentApprovalLink_tokenHash_key" ON "ContentApprovalLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ContentApprovalLink_tenantId_cardId_idx" ON "ContentApprovalLink"("tenantId", "cardId");

-- CreateIndex
CREATE INDEX "ContentApprovalLink_expiresAt_idx" ON "ContentApprovalLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GccTemplate_slug_key" ON "GccTemplate"("slug");

-- CreateIndex
CREATE INDEX "MigrationJob_tenantId_status_idx" ON "MigrationJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MigrationJob_tenantId_startedAt_idx" ON "MigrationJob"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "MigrationMatch_jobId_status_idx" ON "MigrationMatch"("jobId", "status");

-- CreateIndex
CREATE INDEX "MigrationMatch_tenantId_idx" ON "MigrationMatch"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationMatch_jobId_lmmsCustomerId_key" ON "MigrationMatch"("jobId", "lmmsCustomerId");

-- CreateIndex
CREATE INDEX "MigrationEvent_jobId_createdAt_idx" ON "MigrationEvent"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "MigrationEvent_tenantId_idx" ON "MigrationEvent"("tenantId");

-- CreateIndex
CREATE INDEX "Journey_tenantId_status_idx" ON "Journey"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Journey_tenantId_name_key" ON "Journey"("tenantId", "name");

-- CreateIndex
CREATE INDEX "JourneyVersion_tenantId_idx" ON "JourneyVersion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyVersion_journeyId_version_key" ON "JourneyVersion"("journeyId", "version");

-- CreateIndex
CREATE INDEX "JourneyRun_tenantId_journeyId_customerId_idx" ON "JourneyRun"("tenantId", "journeyId", "customerId");

-- CreateIndex
CREATE INDEX "JourneyRun_tenantId_enteredAt_idx" ON "JourneyRun"("tenantId", "enteredAt");

-- CreateIndex
CREATE INDEX "JourneyRun_tenantId_status_idx" ON "JourneyRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "JourneyStep_runId_enteredAt_idx" ON "JourneyStep"("runId", "enteredAt");

-- CreateIndex
CREATE INDEX "JourneyStep_tenantId_idx" ON "JourneyStep"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyKillSwitch_tenantId_journeyId_key" ON "JourneyKillSwitch"("tenantId", "journeyId");

-- CreateIndex
CREATE INDEX "ContentNotification_tenantId_cardId_idx" ON "ContentNotification"("tenantId", "cardId");

-- CreateIndex
CREATE INDEX "ContentNotification_tenantId_kind_sentAt_idx" ON "ContentNotification"("tenantId", "kind", "sentAt");

-- CreateIndex
CREATE INDEX "BrandKit_tenantId_status_idx" ON "BrandKit"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_tenantId_key" ON "BrandKit"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_category_idx" ON "Asset"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Asset_tenantId_usageExpiresAt_idx" ON "Asset"("tenantId", "usageExpiresAt");

-- CreateIndex
CREATE INDEX "BrandProject_tenantId_idx" ON "BrandProject"("tenantId");

-- CreateIndex
CREATE INDEX "Review_tenantId_sentiment_idx" ON "Review"("tenantId", "sentiment");

-- CreateIndex
CREATE INDEX "Review_tenantId_responded_idx" ON "Review"("tenantId", "responded");

-- CreateIndex
CREATE INDEX "Review_tenantId_reviewedAt_idx" ON "Review"("tenantId", "reviewedAt");

-- CreateIndex
CREATE INDEX "Review_tenantId_escalated_idx" ON "Review"("tenantId", "escalated");

-- CreateIndex
CREATE UNIQUE INDEX "Review_tenantId_platform_externalId_key" ON "Review"("tenantId", "platform", "externalId");

-- CreateIndex
CREATE INDEX "ReviewResponse_tenantId_reviewId_idx" ON "ReviewResponse"("tenantId", "reviewId");

-- CreateIndex
CREATE INDEX "ReviewResponse_tenantId_status_idx" ON "ReviewResponse"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DirectoryListing_tenantId_country_idx" ON "DirectoryListing"("tenantId", "country");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryListing_tenantId_country_platformName_key" ON "DirectoryListing"("tenantId", "country", "platformName");

-- CreateIndex
CREATE INDEX "GbpInsight_tenantId_date_idx" ON "GbpInsight"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GbpInsight_tenantId_locationId_date_key" ON "GbpInsight"("tenantId", "locationId", "date");

-- CreateIndex
CREATE INDEX "AdAccount_tenantId_platform_idx" ON "AdAccount"("tenantId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "AdAccount_tenantId_platform_externalId_key" ON "AdAccount"("tenantId", "platform", "externalId");

-- CreateIndex
CREATE INDEX "AdCampaign_tenantId_status_idx" ON "AdCampaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AdCampaign_tenantId_adAccountId_idx" ON "AdCampaign"("tenantId", "adAccountId");

-- CreateIndex
CREATE INDEX "AdSet_tenantId_adCampaignId_idx" ON "AdSet"("tenantId", "adCampaignId");

-- CreateIndex
CREATE INDEX "AdCreative_tenantId_adCampaignId_status_idx" ON "AdCreative"("tenantId", "adCampaignId", "status");

-- CreateIndex
CREATE INDEX "AdSpendSnapshot_tenantId_date_idx" ON "AdSpendSnapshot"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AdSpendSnapshot_tenantId_adCampaignId_date_key" ON "AdSpendSnapshot"("tenantId", "adCampaignId", "date");

-- CreateIndex
CREATE INDEX "Attribution_tenantId_source_idx" ON "Attribution"("tenantId", "source");

-- CreateIndex
CREATE INDEX "Attribution_tenantId_confidence_idx" ON "Attribution"("tenantId", "confidence");

-- CreateIndex
CREATE INDEX "Attribution_tenantId_attributedAt_idx" ON "Attribution"("tenantId", "attributedAt");

-- CreateIndex
CREATE INDEX "Attribution_tenantId_campaignId_idx" ON "Attribution"("tenantId", "campaignId");

-- CreateIndex
CREATE INDEX "Attribution_tenantId_adCampaignId_idx" ON "Attribution"("tenantId", "adCampaignId");

-- CreateIndex
CREATE INDEX "Prospect_tenantId_status_idx" ON "Prospect"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Prospect_tenantId_category_idx" ON "Prospect"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Prospect_tenantId_nextFollowUpAt_idx" ON "Prospect"("tenantId", "nextFollowUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_tenantId_contactEmail_key" ON "Prospect"("tenantId", "contactEmail");

-- CreateIndex
CREATE INDEX "OutreachEvent_tenantId_prospectId_occurredAt_idx" ON "OutreachEvent"("tenantId", "prospectId", "occurredAt");

-- CreateIndex
CREATE INDEX "OutreachEvent_tenantId_direction_idx" ON "OutreachEvent"("tenantId", "direction");

-- CreateIndex
CREATE INDEX "Proposal_tenantId_status_idx" ON "Proposal"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_prospectId_version_key" ON "Proposal"("prospectId", "version");

-- CreateIndex
CREATE INDEX "Contract_tenantId_status_idx" ON "Contract"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Contract_tenantId_renewalDate_idx" ON "Contract"("tenantId", "renewalDate");

-- CreateIndex
CREATE INDEX "Contract_tenantId_originatingCampaignId_idx" ON "Contract"("tenantId", "originatingCampaignId");

-- CreateIndex
CREATE INDEX "BillingPackage_tenantId_tier_idx" ON "BillingPackage"("tenantId", "tier");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_dueDate_idx" ON "Invoice"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_paidAt_idx" ON "Invoice"("tenantId", "paidAt");

-- CreateIndex
CREATE INDEX "InvoiceLine_tenantId_invoiceId_idx" ON "InvoiceLine"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_status_idx" ON "Payment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Payment_tenantId_invoiceId_idx" ON "Payment"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_occurredAt_idx" ON "PaymentEvent"("paymentId", "occurredAt");

-- CreateIndex
CREATE INDEX "VatRate_country_effectiveFrom_idx" ON "VatRate"("country", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Task_assignedTo_status_idx" ON "Task"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "Task_linkType_linkId_idx" ON "Task"("linkType", "linkId");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_startedAt_idx" ON "TimeEntry"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "TimeEntry_tenantId_startedAt_idx" ON "TimeEntry"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "InternalComment_entityType_entityId_createdAt_idx" ON "InternalComment"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalComment_tenantId_createdAt_idx" ON "InternalComment"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SopEntry_key_key" ON "SopEntry"("key");

-- CreateIndex
CREATE INDEX "SopCompletion_sopKey_completedAt_idx" ON "SopCompletion"("sopKey", "completedAt");

-- CreateIndex
CREATE INDEX "SopCompletion_tenantId_completedAt_idx" ON "SopCompletion"("tenantId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QbrDeck_shareToken_key" ON "QbrDeck"("shareToken");

-- CreateIndex
CREATE INDEX "QbrDeck_tenantId_status_idx" ON "QbrDeck"("tenantId", "status");

-- CreateIndex
CREATE INDEX "QbrDeck_tenantId_generatedAt_idx" ON "QbrDeck"("tenantId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QbrDeck_tenantId_periodStart_key" ON "QbrDeck"("tenantId", "periodStart");

-- CreateIndex
CREATE INDEX "CohortSnapshot_tenantId_cohortDate_idx" ON "CohortSnapshot"("tenantId", "cohortDate");

-- CreateIndex
CREATE UNIQUE INDEX "CohortSnapshot_tenantId_cohortDate_key" ON "CohortSnapshot"("tenantId", "cohortDate");

-- CreateIndex
CREATE INDEX "ReportSchedule_tenantId_enabled_idx" ON "ReportSchedule"("tenantId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSchedule_tenantId_kind_channel_recipient_key" ON "ReportSchedule"("tenantId", "kind", "channel", "recipient");

-- CreateIndex
CREATE INDEX "MigrationPitch_tenantId_outcome_idx" ON "MigrationPitch"("tenantId", "outcome");

-- CreateIndex
CREATE INDEX "MigrationPitch_tenantId_sentAt_idx" ON "MigrationPitch"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "ConversionEvent_tenantId_type_occurredAt_idx" ON "ConversionEvent"("tenantId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "ConversionEvent_tenantId_pitchId_idx" ON "ConversionEvent"("tenantId", "pitchId");

-- CreateIndex
CREATE UNIQUE INDEX "Website_tenantId_key" ON "Website"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Website_subdomain_key" ON "Website"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Website_customDomain_key" ON "Website"("customDomain");

-- CreateIndex
CREATE INDEX "Website_tenantId_status_idx" ON "Website"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WebsitePage_tenantId_status_idx" ON "WebsitePage"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePage_websiteId_slug_key" ON "WebsitePage"("websiteId", "slug");

-- CreateIndex
CREATE INDEX "WebsiteLead_tenantId_consentStatus_idx" ON "WebsiteLead"("tenantId", "consentStatus");

-- CreateIndex
CREATE INDEX "WebsiteLead_tenantId_createdAt_idx" ON "WebsiteLead"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteLead_websiteId_createdAt_idx" ON "WebsiteLead"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteVisit_tenantId_createdAt_idx" ON "WebsiteVisit"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteVisit_websiteId_createdAt_idx" ON "WebsiteVisit"("websiteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_status_idx" ON "PushSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "PushSubscription_tenantId_idx" ON "PushSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "PushNotification_userId_status_idx" ON "PushNotification"("userId", "status");

-- CreateIndex
CREATE INDEX "PushNotification_userId_readAt_idx" ON "PushNotification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "PushNotification_tenantId_createdAt_idx" ON "PushNotification"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineAction_clientId_key" ON "OfflineAction"("clientId");

-- CreateIndex
CREATE INDEX "OfflineAction_userId_status_idx" ON "OfflineAction"("userId", "status");

-- CreateIndex
CREATE INDEX "OfflineAction_tenantId_createdAt_idx" ON "OfflineAction"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SignupRequest_email_key" ON "SignupRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SignupRequest_tenantId_key" ON "SignupRequest"("tenantId");

-- CreateIndex
CREATE INDEX "SignupRequest_status_idx" ON "SignupRequest"("status");

-- CreateIndex
CREATE INDEX "SignupRequest_createdAt_idx" ON "SignupRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SelfServeConfig_tenantId_key" ON "SelfServeConfig"("tenantId");

-- CreateIndex
CREATE INDEX "OnboardingTask_tenantId_status_idx" ON "OnboardingTask"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingTask_tenantId_key_key" ON "OnboardingTask"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_domain_key" ON "Reseller"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_apiKey_key" ON "Reseller"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelConfig_resellerId_key" ON "WhiteLabelConfig"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionConfig_region_key" ON "RegionConfig"("region");

-- CreateIndex
CREATE INDEX "DataExportRequest_tenantId_status_idx" ON "DataExportRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceTemplate_category_status_idx" ON "MarketplaceTemplate"("category", "status");

-- CreateIndex
CREATE INDEX "MarketplaceTemplate_installCount_idx" ON "MarketplaceTemplate"("installCount");

-- CreateIndex
CREATE INDEX "TemplateInstall_tenantId_idx" ON "TemplateInstall"("tenantId");

-- CreateIndex
CREATE INDEX "TemplateInstall_templateId_idx" ON "TemplateInstall"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateInstall_tenantId_templateId_key" ON "TemplateInstall"("tenantId", "templateId");

-- CreateIndex
CREATE INDEX "CompetitorImportJob_tenantId_status_idx" ON "CompetitorImportJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CompetitorImportJob_tenantId_createdAt_idx" ON "CompetitorImportJob"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CompetitorImportRow_jobId_status_idx" ON "CompetitorImportRow"("jobId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleDefinition_key_key" ON "ModuleDefinition"("key");

-- CreateIndex
CREATE INDEX "TenantModule_tenantId_enabled_idx" ON "TenantModule"("tenantId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModule_tenantId_moduleKey_key" ON "TenantModule"("tenantId", "moduleKey");

-- CreateIndex
CREATE INDEX "DpaAcceptance_tenantId_acceptedAt_idx" ON "DpaAcceptance"("tenantId", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicy_version_key" ON "PrivacyPolicy"("version");

-- CreateIndex
CREATE INDEX "PrivacyPolicyAcceptance_tenantId_acceptedAt_idx" ON "PrivacyPolicyAcceptance"("tenantId", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicyAcceptance_tenantId_privacyPolicyId_key" ON "PrivacyPolicyAcceptance"("tenantId", "privacyPolicyId");

-- CreateIndex
CREATE INDEX "ProcessingActivity_tenantId_idx" ON "ProcessingActivity"("tenantId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDelivery" ADD CONSTRAINT "ReportDelivery_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReportRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCardVersion" ADD CONSTRAINT "ContentCardVersion_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ContentCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCardComment" ADD CONSTRAINT "ContentCardComment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ContentCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentApprovalLink" ADD CONSTRAINT "ContentApprovalLink_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ContentCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationMatch" ADD CONSTRAINT "MigrationMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "MigrationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyVersion" ADD CONSTRAINT "JourneyVersion_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyRun" ADD CONSTRAINT "JourneyRun_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStep" ADD CONSTRAINT "JourneyStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "JourneyRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyKillSwitch" ADD CONSTRAINT "JourneyKillSwitch_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_adCampaignId_fkey" FOREIGN KEY ("adCampaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_adCampaignId_fkey" FOREIGN KEY ("adCampaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "MigrationPitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteVisit" ADD CONSTRAINT "WebsiteVisit_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateInstall" ADD CONSTRAINT "TemplateInstall_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorImportRow" ADD CONSTRAINT "CompetitorImportRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CompetitorImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

