# Session Initialization

1. Read .claude/project-context.md to understand the project
2. Read the role-specific file based on my request:
   - Implementation → senior-engineer.md
   - Review → lead-engineer.md
   - Product decisions → product-manager.md
   - Documentation → tech-writer.md
3. Read any files mentioned in project-context.md that are relevant
4. Confirm you understand the context before proceeding

Ready? Let's work on: [YOUR TASK]
```

### 6. **Pro Tips for Maximum Effectiveness**

1. **Be explicit about role switching:**
```
   "Switch to lead-engineer mode and review this code"
```

2. **Chain commands:**
```
   "As senior engineer, implement X. Then switch to lead-engineer 
   and review your own implementation. Then switch to tech-writer 
   and document it."
```

3. **Use file references:**
```
   "Following the patterns in .claude/senior-engineer.md and the 
   architecture in src/core/*, implement Y"
```

4. **Keep context files updated:**
   - After major decisions, update project-context.md
   - When patterns emerge, document them in the role files

5. **Version control your .claude/ folder:**
   - Commit it to git
   - It becomes your team's AI knowledge base

### 7. **Limitation Workaround**

Since Claude Code currently doesn't support true parallel agents, simulate it with:

- **Sequential execution** with role switching (shown above)
- **Separate sessions** for truly independent work (different terminal windows)
- **Checkpoint reviews** where you explicitly ask Claude to switch modes

### Example Full Workflow Prompt:
```
Read .claude/project-context.md for context.

Then execute this workflow:

1. [Product Manager]: Read .claude/product-manager.md. Review if 
   adding a dark mode toggle aligns with our priorities. Give go/no-go.

2. [Senior Engineer]: If approved, read .claude/senior-engineer.md 
   and implement dark mode following our patterns in src/theme/*

3. [Lead Engineer]: Read .claude/lead-engineer.md and review the 
   implementation. Check it against all criteria.

4. [Tech Writer]: Read .claude/tech-writer.md and add minimal but 
   complete documentation for the new feature.

Proceed step by step, confirming each phase before moving to the next.