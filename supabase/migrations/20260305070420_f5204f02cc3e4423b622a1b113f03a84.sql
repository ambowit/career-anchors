-- Generator binding table: super admin can bind a report generator to a specific user or organization.
-- When generating a report, priority: user-level binding > org-level binding > global active generator.
CREATE TABLE generator_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  binding_type text NOT NULL CHECK (binding_type IN ('user', 'organization')),
  target_id uuid NOT NULL,
  bound_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Each target can only be bound once per generator
CREATE UNIQUE INDEX uq_binding_target_version ON generator_bindings(binding_type, target_id, version_id);
-- Fast lookups
CREATE INDEX idx_gb_version ON generator_bindings(version_id);
CREATE INDEX idx_gb_target ON generator_bindings(target_id);
CREATE INDEX idx_gb_type ON generator_bindings(binding_type);

COMMENT ON TABLE generator_bindings IS 'Binds a report generator (report_version) to a specific user or organization. When bound, that user or all users in the org use the bound generator instead of the global active one. Priority: user binding > org binding > global active.';