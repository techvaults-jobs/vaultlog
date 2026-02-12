#!/bin/bash

# Pre-push validation script
# Runs linting, type checking, and build before allowing push to GitHub

set -e

echo "🔍 Running pre-push checks..."
echo ""

# Check 1: Lint
echo "📝 Running ESLint..."
npm run lint -- --max-warnings=0 || {
  echo "❌ Linting failed. Fix errors before pushing."
  exit 1
}
echo "✅ Linting passed"
echo ""

# Check 2: Type checking
echo "🔎 Running TypeScript type check..."
npx tsc --noEmit || {
  echo "❌ Type checking failed. Fix errors before pushing."
  exit 1
}
echo "✅ Type checking passed"
echo ""

# Check 3: Build
echo "🏗️  Building application..."
npm run build || {
  echo "❌ Build failed. Fix errors before pushing."
  exit 1
}
echo "✅ Build successful"
echo ""

echo "✨ All checks passed! Ready to push."
exit 0
