# Pre-Push Validation Workflow

This project includes an automated pre-push validation workflow to catch bugs before they reach production.

## What Gets Checked

Before any push to GitHub, the following checks run automatically:

1. **ESLint** - Code quality and style issues
2. **TypeScript** - Type safety and compilation errors
3. **Next.js Build** - Full application build validation

## Setup

The Git hooks are automatically installed when you run:

```bash
npm install
```

This runs the `postinstall` script which sets up the pre-push hook.

## Manual Setup (if needed)

If hooks aren't installed, run:

```bash
bash scripts/setup-hooks.sh
```

## Running Checks Manually

To run all validation checks without pushing:

```bash
npm run validate
```

## How It Works

When you attempt to push to GitHub:

```bash
git push origin main
```

The pre-push hook automatically runs `scripts/pre-push-check.sh`, which:

1. Runs ESLint with zero warnings allowed
2. Runs TypeScript type checking
3. Builds the entire application

If any check fails, the push is blocked and you'll see detailed error messages.

## Bypassing Checks (Not Recommended)

If you absolutely need to bypass checks:

```bash
git push --no-verify
```

⚠️ Use this only in emergencies - it defeats the purpose of the workflow.

## Troubleshooting

### Hook not running?

Ensure the hook file is executable:

```bash
chmod +x .git/hooks/pre-push
```

### Permission denied error?

Make the setup script executable:

```bash
chmod +x scripts/setup-hooks.sh
bash scripts/setup-hooks.sh
```

### Linting errors?

Fix linting issues:

```bash
npm run lint -- --fix
```

### Type errors?

Check TypeScript errors:

```bash
npx tsc --noEmit
```

### Build errors?

Test the build locally:

```bash
npm run build
```
