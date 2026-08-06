/**
 * Session Verifier (Prisma V5.0)
 * 5-item checklist inline routine to be run before SESSION_END.
 */

import * as fs from 'fs';
import * as path from 'path';

export class SessionVerifier {
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  public verify(): boolean {
    console.log("=== Running Session End Verification ===");
    let allPassed = true;

    // 1. File Check (Ground Truth)
    const stateFile = path.join(this.workspaceRoot, '.prisma', 'state.json');
    if (!fs.existsSync(stateFile)) {
      console.warn("[CHECK FAIL] state.json is missing.");
      allPassed = false;
    } else {
      console.log("✅ File Check Passed: state.json exists.");
    }

    // 2. Sprint Status (Has task.md been updated?)
    const taskTracker = path.join(this.workspaceRoot, 'task.md');
    // Simplified logic: Check if task tracker exists. In a real scenario, we'd parse it to ensure progress.
    if (fs.existsSync(taskTracker)) {
      console.log("✅ Sprint Status Passed: task.md available.");
    } else {
      console.warn("[CHECK FAIL] task.md is missing.");
      allPassed = false;
    }

    // 3. Learnings File (Did we learn anything?)
    const learningsFile = path.join(this.workspaceRoot, '.prisma', 'learnings.json');
    if (fs.existsSync(learningsFile)) {
      console.log("✅ Learnings Passed: learnings.json exists.");
    } else {
      console.warn("[CHECK FAIL] learnings.json is missing.");
      // Soft fail for learnings
    }

    // 4. Shift Log (Did the orchestrator write the handover log?)
    const shiftLog = path.join(this.workspaceRoot, '.prisma', 'SHIFT_LOG.md');
    if (fs.existsSync(shiftLog)) {
      const stats = fs.statSync(shiftLog);
      // Check if it was modified recently
      if (Date.now() - stats.mtimeMs < 1000 * 60 * 60 * 24) {
         console.log("✅ Shift Log Passed: Updated recently.");
      } else {
         console.warn("[CHECK FAIL] Shift Log exists but was not updated in this session.");
         allPassed = false;
      }
    } else {
      console.warn("[CHECK FAIL] SHIFT_LOG.md is missing.");
      allPassed = false;
    }

    // 5. Temporary Cleanup
    const scratchDir = path.join(this.workspaceRoot, 'scratch');
    if (fs.existsSync(scratchDir)) {
      const files = fs.readdirSync(scratchDir);
      if (files.length > 0) {
        console.warn(`[CHECK FAIL] Temporary Cleanup Failed: scratch/ contains ${files.length} files. Please clean up.`);
        allPassed = false;
      } else {
        console.log("✅ Temp Cleanup Passed: scratch/ is empty.");
      }
    } else {
      console.log("✅ Temp Cleanup Passed: No scratch/ dir found.");
    }

    console.log(`=== Verification Complete. Status: ${allPassed ? "PASSED" : "FAILED"} ===`);
    return allPassed;
  }
}

// If invoked directly
if (require.main === module) {
  const verifier = new SessionVerifier();
  if (!verifier.verify()) {
    process.exit(1);
  }
}
