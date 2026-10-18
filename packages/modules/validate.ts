import { MODULE_CATALOG, getModuleDef } from './catalog';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Checks if a module can be enabled. All dependencies must already be enabled.
 */
export function canEnableModule(
  moduleKey: string,
  activeModuleKeys: string[],
): ValidationResult {
  const def = getModuleDef(moduleKey);
  if (!def) return { valid: false, reason: 'module_not_found' };

  for (const dep of def.dependencies) {
    if (!activeModuleKeys.includes(dep)) {
      return { valid: false, reason: `missing_dependency:${dep}` };
    }
  }

  return { valid: true };
}

/**
 * Checks if a module can be disabled. No other active module can depend on it.
 * Core modules can never be disabled.
 */
export function canDisableModule(
  moduleKey: string,
  activeModuleKeys: string[],
): ValidationResult {
  const def = getModuleDef(moduleKey);
  if (!def) return { valid: false, reason: 'module_not_found' };

  if (def.isCore) {
    return { valid: false, reason: 'cannot_disable_core_module' };
  }

  for (const otherKey of activeModuleKeys) {
    const otherDef = getModuleDef(otherKey);
    if (otherDef && otherDef.dependencies.includes(moduleKey)) {
      return { valid: false, reason: `dependency_conflict:${otherKey}` };
    }
  }

  return { valid: true };
}

void MODULE_CATALOG;
