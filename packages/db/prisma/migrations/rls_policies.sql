ALTER TABLE "ConsentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoNotContact" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_tenant_isolation ON "ConsentRecord";
CREATE POLICY consent_tenant_isolation ON "ConsentRecord"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS dnc_tenant_isolation ON "DoNotContact";
CREATE POLICY dnc_tenant_isolation ON "DoNotContact"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
