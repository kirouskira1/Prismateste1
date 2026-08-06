{
  "architecture": {
    "compilation_target": "V4",
    "sprint_zero_profile": "STANDARD",
    "execution_mode": "claude_code_hybrid"
  },
  "orchestration": {
    "max_audit_attempts": 3,
    "quality_threshold": 9.5,
    "fresh_eyes_enabled": true,
    "single_artifact_cadence": true
  },
  "thinking_mode": {
    "type": "adaptive",
    "default_effort": "high"
  },
  "agent_config": {
    "context_break_mandatory": true,
    "reasoning_trace_isolation": true,
    "access_list_enforcement": true,
    "parallel_dispatch_enabled": true
  },
  "registry": {
    "auto_discovery": true,
    "registry_path": ".prisma/agent_registry.json"
  },
  "resilience": {
    "retry": {
      "maxRetries": 3,
      "baseDelayMs": 1000,
      "maxDelayMs": 30000,
      "backoffMultiplier": 2,
      "jitterMs": 500,
      "respectRetryAfter": true
    },
    "circuitBreaker": {
      "failureThreshold": 5,
      "recoveryTimeMs": 30000,
      "monitorWindowMs": 60000
    }
  }
}
