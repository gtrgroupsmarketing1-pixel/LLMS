# Author Protocol

Input: one SESSION_BRIEF per session.

## Loop

1. Clone fresh (sandbox is ephemeral)
2. Write all files at exact paths
3. pnpm install
4. prisma migrate dev + generate (if brief lists a migration)
5. pnpm typecheck + pnpm --filter \<pkg\> test
6. Debug ladder: type error → fix smallest; test fail → if code is wrong
   fix code, if test is wrong STOP; two failed attempts → STOP and
   emit GATE = BLOCKED
7. git add -A && commit && tag && push
8. Emit GATE REPORT

## Never

- Push to non-main
- Force-push
- Amend published commits
- Add features not in brief
- Add runtime deps without flagging
